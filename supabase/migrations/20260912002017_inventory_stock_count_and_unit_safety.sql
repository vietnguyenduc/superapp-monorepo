-- Inventory pilot phase B: stock-count workflow and canonical-unit safety.

CREATE TABLE public.inventory_count_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  count_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected')),
  notes text,
  review_notes text,
  created_by uuid DEFAULT auth.uid(),
  submitted_by uuid,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory_count_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.inventory_count_sessions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  book_quantity numeric(14,3) NOT NULL,
  counted_quantity numeric(14,3),
  unit text NOT NULL,
  explanation text,
  variance numeric(14,3) GENERATED ALWAYS AS (counted_quantity - book_quantity) STORED,
  adjustment_record_id uuid REFERENCES public.inventory_records(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, product_id),
  CHECK (counted_quantity IS NULL OR counted_quantity >= 0)
);

CREATE INDEX idx_inventory_count_sessions_company_date ON public.inventory_count_sessions(company_id, count_date DESC);
CREATE INDEX idx_inventory_count_lines_session ON public.inventory_count_lines(session_id);
ALTER TABLE public.inventory_count_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory count sessions company read" ON public.inventory_count_sessions
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'));
CREATE POLICY "inventory count sessions company write" ON public.inventory_count_sessions
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'));
CREATE POLICY "inventory count lines company access" ON public.inventory_count_lines
  FOR ALL USING (EXISTS (SELECT 1 FROM public.inventory_count_sessions s WHERE s.id=session_id AND (s.company_id=public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_count_sessions s WHERE s.id=session_id AND (s.company_id=public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'))));

CREATE OR REPLACE FUNCTION public.inventory_create_count_session(p_count_date date, p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_company uuid := public.get_user_company_id(auth.uid()); v_session uuid; v_mixed_units text;
BEGIN
  IF v_company IS NULL THEN RAISE EXCEPTION 'Vui lòng chọn công ty trước khi kiểm kê'; END IF;
  SELECT string_agg(DISTINCT p.business_code || ': ' || COALESCE(r.unit, 'trống') || ' ≠ ' || p.input_unit, ', ')
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

CREATE OR REPLACE FUNCTION public.inventory_submit_count_session(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
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
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_session public.inventory_count_sessions%ROWTYPE; v_line record; v_record uuid; v_adjusted integer:=0;
BEGIN
  IF NOT (public.check_user_role(auth.uid(),'admin_master') OR public.check_user_role(auth.uid(),'admin_company')) THEN RAISE EXCEPTION 'Bạn không có quyền duyệt kiểm kê'; END IF;
  IF p_action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Hành động duyệt không hợp lệ'; END IF;
  SELECT * INTO v_session FROM public.inventory_count_sessions WHERE id=p_session_id FOR UPDATE;
  IF NOT FOUND OR v_session.status<>'submitted' THEN RAISE EXCEPTION 'Phiên kiểm kê không ở trạng thái chờ duyệt'; END IF;
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

CREATE OR REPLACE FUNCTION public.inventory_lock_count_line_after_submit()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.inventory_count_sessions WHERE id=OLD.session_id AND status<>'draft') THEN RAISE EXCEPTION 'Phiên đã gửi duyệt nên không thể sửa số kiểm kê'; END IF;
  NEW.updated_at:=now(); RETURN NEW;
END; $$;
CREATE TRIGGER inventory_count_line_immutable BEFORE UPDATE OF counted_quantity,explanation ON public.inventory_count_lines FOR EACH ROW EXECUTE FUNCTION public.inventory_lock_count_line_after_submit();

CREATE OR REPLACE FUNCTION public.inventory_lock_product_units()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF (NEW.input_unit IS DISTINCT FROM OLD.input_unit OR NEW.output_unit IS DISTINCT FROM OLD.output_unit)
     AND EXISTS(SELECT 1 FROM public.inventory_records WHERE product_id=OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Không thể đổi đơn vị của sản phẩm đã có giao dịch kho';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER inventory_products_unit_lock BEFORE UPDATE OF input_unit,output_unit ON public.products FOR EACH ROW EXECUTE FUNCTION public.inventory_lock_product_units();

ALTER TABLE public.product_conversions ADD CONSTRAINT product_conversions_positive_rate CHECK(conversion_rate>0);
ALTER TABLE public.product_conversions ADD CONSTRAINT product_conversions_distinct_units CHECK(from_unit<>to_unit);

CREATE OR REPLACE FUNCTION public.inventory_validate_product_conversions()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_conversion jsonb;
BEGIN
  IF COALESCE(NEW.raw_to_processed_ratio,1)<=0 OR COALESCE(NEW.processed_to_finished_ratio,1)<=0 THEN RAISE EXCEPTION 'Tỷ lệ quy đổi phải lớn hơn 0'; END IF;
  IF NEW.conversions IS NOT NULL THEN
    FOR v_conversion IN SELECT value FROM jsonb_array_elements(NEW.conversions) LOOP
      IF COALESCE((v_conversion->>'conversionRate')::numeric,0)<=0 THEN RAISE EXCEPTION 'Tỷ lệ quy đổi phải lớn hơn 0'; END IF;
      IF COALESCE(v_conversion->>'fromUnit','')=COALESCE(v_conversion->>'toUnit','') THEN RAISE EXCEPTION 'Đơn vị nguồn và đích quy đổi không được trùng nhau'; END IF;
    END LOOP;
    IF EXISTS (
      WITH RECURSIVE edges(from_unit,to_unit,rate) AS (
        SELECT value->>'fromUnit',value->>'toUnit',(value->>'conversionRate')::numeric FROM jsonb_array_elements(NEW.conversions)
        UNION ALL
        SELECT value->>'toUnit',value->>'fromUnit',1/(value->>'conversionRate')::numeric FROM jsonb_array_elements(NEW.conversions)
      ), units(unit) AS (SELECT from_unit FROM edges UNION SELECT to_unit FROM edges),
      walk(start_unit,current_unit,factor,visited,depth) AS (
        SELECT unit,unit,1::numeric,ARRAY[unit]::text[],0 FROM units
        UNION ALL
        SELECT w.start_unit,e.to_unit,w.factor*e.rate,w.visited||e.to_unit,w.depth+1
        FROM walk w JOIN edges e ON e.from_unit=w.current_unit
        WHERE w.depth<=jsonb_array_length(NEW.conversions)
          AND NOT (w.current_unit=w.start_unit AND w.depth>0)
          AND (e.to_unit=w.start_unit OR NOT e.to_unit=ANY(w.visited))
      )
      SELECT 1 FROM walk WHERE depth>0 AND current_unit=start_unit AND abs(factor-1)>0.001 LIMIT 1
    ) THEN RAISE EXCEPTION 'Các đường quy đổi tạo thành vòng không nhất quán'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER inventory_products_conversion_validation BEFORE INSERT OR UPDATE OF conversions,raw_to_processed_ratio,processed_to_finished_ratio ON public.products FOR EACH ROW EXECUTE FUNCTION public.inventory_validate_product_conversions();

REVOKE ALL ON FUNCTION public.inventory_create_count_session(date,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_submit_count_session(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_review_count_session(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_create_count_session(date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_submit_count_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_review_count_session(uuid,text,text) TO authenticated;
