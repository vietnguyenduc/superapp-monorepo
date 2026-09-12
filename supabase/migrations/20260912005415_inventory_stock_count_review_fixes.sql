DROP POLICY IF EXISTS "inventory count sessions company write" ON public.inventory_count_sessions;
DROP POLICY IF EXISTS "inventory count lines company access" ON public.inventory_count_lines;
CREATE POLICY "inventory count lines company access" ON public.inventory_count_lines FOR SELECT USING (EXISTS (SELECT 1 FROM public.inventory_count_sessions s WHERE s.id=session_id AND (s.company_id=public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'))));

CREATE OR REPLACE FUNCTION public.inventory_create_count_session(p_count_date date, p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_company uuid := public.get_user_company_id(auth.uid()); v_session uuid; v_mixed_units text;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Vui lòng chọn công ty trước khi kiểm kê'; END IF;
  SELECT string_agg(DISTINCT COALESCE(p.business_code,p.name,p.id::text) || ': ' || COALESCE(r.unit, 'trống') || ' ≠ ' || p.input_unit, ', ')
  INTO v_mixed_units
  FROM public.inventory_records r JOIN public.products p ON p.id=r.product_id
  WHERE r.company_id=v_company AND COALESCE(r.status,'active')='active' AND r.date<=p_count_date
    AND r.unit IS DISTINCT FROM p.input_unit;
  IF v_mixed_units IS NOT NULL THEN
    RAISE EXCEPTION 'Chưa thể chốt tồn sổ vì có giao dịch sai đơn vị chuẩn: %', v_mixed_units;
  END IF;
  INSERT INTO public.inventory_count_sessions(company_id,count_date,notes)
  VALUES(v_company,p_count_date,NULLIF(trim(p_notes),'')) RETURNING id INTO v_session;
  INSERT INTO public.inventory_count_lines(session_id,product_id,book_quantity,unit)
  SELECT v_session,p.id,COALESCE(sum(COALESCE(r.input_quantity,0)-COALESCE(r.output_quantity,0)),0),p.input_unit
  FROM public.products p LEFT JOIN public.inventory_records r
    ON r.product_id=p.id AND r.company_id=v_company AND COALESCE(r.status,'active')='active' AND r.date<=p_count_date
  WHERE p.company_id=v_company AND p.status='active'
  GROUP BY p.id,p.input_unit;
  RETURN v_session;
END; $$;

CREATE OR REPLACE FUNCTION public.inventory_save_count_lines(p_session_id uuid,p_lines jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_session public.inventory_count_sessions%ROWTYPE; v_line jsonb; v_updated integer:=0;
BEGIN
  SELECT * INTO v_session FROM public.inventory_count_sessions WHERE id=p_session_id FOR UPDATE;
  IF NOT FOUND OR v_session.company_id IS DISTINCT FROM public.get_user_company_id(auth.uid()) THEN RAISE EXCEPTION 'Không tìm thấy phiên kiểm kê'; END IF;
  IF v_session.status<>'draft' THEN RAISE EXCEPTION 'Phiên đã gửi duyệt nên không thể sửa số kiểm kê'; END IF;
  FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
    UPDATE public.inventory_count_lines SET counted_quantity=NULLIF(v_line->>'counted_quantity','')::numeric,explanation=NULLIF(trim(v_line->>'explanation'),''),updated_at=now()
    WHERE id=(v_line->>'id')::uuid AND session_id=p_session_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Dòng kiểm kê không thuộc phiên'; END IF;
    v_updated:=v_updated+1;
  END LOOP;
  RETURN jsonb_build_object('updated',v_updated);
END; $$;

CREATE OR REPLACE FUNCTION public.inventory_submit_count_session(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_session public.inventory_count_sessions%ROWTYPE; v_missing integer; v_unexplained integer;
BEGIN
  SELECT * INTO v_session FROM public.inventory_count_sessions WHERE id=p_session_id FOR UPDATE;
  IF NOT FOUND OR v_session.company_id<>public.get_user_company_id(auth.uid()) THEN RAISE EXCEPTION 'Không tìm thấy phiên kiểm kê'; END IF;
  IF v_session.status<>'draft' THEN RAISE EXCEPTION 'Chỉ có thể gửi phiên đang nháp'; END IF;
  SELECT count(*) INTO v_missing FROM public.inventory_count_lines WHERE session_id=p_session_id AND counted_quantity IS NULL;
  SELECT count(*) INTO v_unexplained FROM public.inventory_count_lines WHERE session_id=p_session_id AND counted_quantity<>book_quantity AND COALESCE(trim(explanation),'')='';
  IF v_missing>0 THEN RAISE EXCEPTION 'Còn % sản phẩm chưa nhập tồn thực tế',v_missing; END IF;
  IF v_unexplained>0 THEN RAISE EXCEPTION 'Còn % chênh lệch chưa được giải trình',v_unexplained; END IF;
  UPDATE public.inventory_count_sessions SET status='submitted',submitted_by=auth.uid(),submitted_at=now(),updated_at=now() WHERE id=p_session_id;
  RETURN jsonb_build_object('submitted',true,'session_id',p_session_id);
END; $$;

CREATE OR REPLACE FUNCTION public.inventory_review_count_session(p_session_id uuid,p_action text,p_review_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_session public.inventory_count_sessions%ROWTYPE; v_line record; v_record uuid; v_adjusted integer:=0;
BEGIN
  IF NOT (public.check_user_role(auth.uid(),'admin_master') OR public.check_user_role(auth.uid(),'admin_company')) THEN RAISE EXCEPTION 'Bạn không có quyền duyệt kiểm kê'; END IF;
  IF p_action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Hành động duyệt không hợp lệ'; END IF;
  SELECT * INTO v_session FROM public.inventory_count_sessions WHERE id=p_session_id FOR UPDATE;
  IF NOT FOUND OR v_session.company_id IS DISTINCT FROM public.get_user_company_id(auth.uid()) OR v_session.status<>'submitted' THEN RAISE EXCEPTION 'Phiên kiểm kê không ở trạng thái chờ duyệt'; END IF;
  IF p_action='reject' THEN
    UPDATE public.inventory_count_sessions SET status='rejected',review_notes=NULLIF(trim(p_review_notes),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() WHERE id=p_session_id;
    RETURN jsonb_build_object('approved',false,'rejected',true,'adjusted',0);
  END IF;
  FOR v_line IN SELECT l.*,p.business_code,p.name FROM public.inventory_count_lines l JOIN public.products p ON p.id=l.product_id WHERE l.session_id=p_session_id AND l.variance<>0 LOOP
    INSERT INTO public.inventory_command_keys(company_id,command_type,external_id) VALUES(v_session.company_id,'stock_count_adjustment',v_line.id::text) ON CONFLICT DO NOTHING;
    IF FOUND THEN
      INSERT INTO public.inventory_records(date,product_id,product_code,product_name,input_quantity,output_quantity,unit,source_type,reference_id,notes,created_by,company_id)
      VALUES(v_session.count_date,v_line.product_id,COALESCE(v_line.business_code,''),v_line.name,GREATEST(v_line.variance,0),GREATEST(-v_line.variance,0),v_line.unit,'stock_count_adjustment',p_session_id::text,'Điều chỉnh kiểm kê: '||v_line.explanation,auth.uid(),v_session.company_id)
      RETURNING id INTO v_record;
      UPDATE public.inventory_count_lines SET adjustment_record_id=v_record,updated_at=now() WHERE id=v_line.id;
      v_adjusted:=v_adjusted+1;
    END IF;
  END LOOP;
  UPDATE public.inventory_count_sessions SET status='approved',review_notes=NULLIF(trim(p_review_notes),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() WHERE id=p_session_id;
  RETURN jsonb_build_object('approved',true,'rejected',false,'adjusted',v_adjusted);
END; $$;


REVOKE ALL ON FUNCTION public.inventory_create_count_session(date,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_save_count_lines(uuid,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_submit_count_session(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_review_count_session(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_create_count_session(date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_save_count_lines(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_submit_count_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_review_count_session(uuid,text,text) TO authenticated;
