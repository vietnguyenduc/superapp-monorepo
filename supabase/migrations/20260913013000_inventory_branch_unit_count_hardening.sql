-- Inventory pilot hardening: canonical units, branch-scoped writers and stock counts.

ALTER TABLE public.goods_receipts
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE RESTRICT;
ALTER TABLE public.inventory_count_sessions
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_goods_receipts_company_branch ON public.goods_receipts(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_count_sessions_company_branch_date
  ON public.inventory_count_sessions(company_id, branch_id, count_date DESC);

ALTER TABLE public.products ADD CONSTRAINT products_active_code_required
  CHECK (status<>'active' OR NULLIF(trim(business_code),'') IS NOT NULL) NOT VALID;
ALTER TABLE public.products ADD CONSTRAINT products_active_input_unit_required
  CHECK (status<>'active' OR NULLIF(trim(input_unit),'') IS NOT NULL) NOT VALID;

UPDATE public.goods_receipts gr SET branch_id=u.branch_id
FROM public.users u WHERE u.id=gr.received_by AND gr.branch_id IS NULL AND u.branch_id IS NOT NULL;
UPDATE public.inventory_count_sessions s SET branch_id=u.branch_id
FROM public.users u WHERE u.id=s.created_by AND s.branch_id IS NULL AND u.branch_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.inventory_enforce_record_scope_and_unit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_company uuid; v_branch uuid; v_role text; v_product record;
BEGIN
  SELECT company_id,branch_id,role::text INTO v_company,v_branch,v_role FROM public.users WHERE id=auth.uid();
  SELECT company_id,input_unit INTO v_product FROM public.products WHERE id=NEW.product_id;
  IF NOT FOUND OR v_product.company_id IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'Sản phẩm không thuộc công ty của giao dịch'; END IF;
  IF v_role<>'admin_master' AND NEW.company_id IS DISTINCT FROM v_company THEN RAISE EXCEPTION 'Không thể ghi dữ liệu cho công ty khác'; END IF;
  IF NEW.branch_id IS NULL THEN NEW.branch_id:=v_branch; END IF;
  IF NEW.branch_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.branches b WHERE b.id=NEW.branch_id AND b.company_id=NEW.company_id) THEN RAISE EXCEPTION 'Chi nhánh không thuộc công ty của giao dịch'; END IF;
  IF v_branch IS NOT NULL AND NEW.branch_id IS DISTINCT FROM v_branch AND v_role NOT IN ('admin_master','admin_company') THEN RAISE EXCEPTION 'Không thể ghi dữ liệu cho chi nhánh khác'; END IF;
  IF NULLIF(trim(NEW.unit),'') IS NULL THEN NEW.unit:=v_product.input_unit; END IF;
  IF NEW.unit IS DISTINCT FROM v_product.input_unit THEN RAISE EXCEPTION 'Đơn vị giao dịch phải là đơn vị chuẩn của sản phẩm (%)',v_product.input_unit; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS inventory_records_scope_unit_guard ON public.inventory_records;
CREATE TRIGGER inventory_records_scope_unit_guard BEFORE INSERT OR UPDATE OF product_id,company_id,branch_id,unit
ON public.inventory_records FOR EACH ROW EXECUTE FUNCTION public.inventory_enforce_record_scope_and_unit();

CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  destination_branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric(14,3) NOT NULL CHECK(quantity>0),
  unit text NOT NULL,
  transfer_date date NOT NULL DEFAULT current_date,
  notes text,
  status text NOT NULL DEFAULT 'completed' CHECK(status IN ('completed')),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(source_branch_id<>destination_branch_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_company_date ON public.inventory_transfers(company_id,transfer_date DESC);
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory transfers tenant read" ON public.inventory_transfers FOR SELECT USING (
  public.check_user_role(auth.uid(),'admin_master') OR company_id=public.get_user_company_id(auth.uid())
);

CREATE OR REPLACE FUNCTION public.inventory_transfer_stock(p_source_branch_id uuid,p_destination_branch_id uuid,p_product_id uuid,p_quantity numeric,p_transfer_date date DEFAULT current_date,p_notes text DEFAULT NULL,p_transfer_id uuid DEFAULT gen_random_uuid())
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_company uuid:=public.get_user_company_id(auth.uid()); v_role text; v_product record; v_stock numeric; v_transfer uuid;
BEGIN
  SELECT role::text INTO v_role FROM public.users WHERE id=auth.uid();
  IF v_role<>'admin_company' THEN RAISE EXCEPTION 'Chỉ quản trị công ty được điều chuyển kho'; END IF;
  IF p_source_branch_id=p_destination_branch_id OR p_quantity<=0 THEN RAISE EXCEPTION 'Chi nhánh và số lượng điều chuyển không hợp lệ'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.branches WHERE id=p_source_branch_id AND company_id=v_company)
     OR NOT EXISTS(SELECT 1 FROM public.branches WHERE id=p_destination_branch_id AND company_id=v_company) THEN RAISE EXCEPTION 'Chi nhánh không thuộc công ty hiện tại'; END IF;
  SELECT business_code,name,input_unit INTO v_product FROM public.products WHERE id=p_product_id AND company_id=v_company AND status='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Sản phẩm không hợp lệ'; END IF;
  INSERT INTO public.inventory_command_keys(company_id,command_type,external_id) VALUES(v_company,'inventory_transfer',p_transfer_id::text) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    IF EXISTS(SELECT 1 FROM public.inventory_transfers WHERE id=p_transfer_id AND company_id=v_company) THEN RETURN p_transfer_id; END IF;
    RAISE EXCEPTION 'Mã điều chuyển đã được sử dụng';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_company::text||':'||p_source_branch_id::text||':'||p_product_id::text));
  SELECT COALESCE(sum(input_quantity-output_quantity),0) INTO v_stock FROM public.inventory_records WHERE company_id=v_company AND branch_id=p_source_branch_id AND product_id=p_product_id AND COALESCE(status,'active')='active';
  IF v_stock<p_quantity THEN RAISE EXCEPTION 'Không đủ tồn tại kho nguồn: còn %, yêu cầu %',v_stock,p_quantity; END IF;
  INSERT INTO public.inventory_transfers(id,company_id,source_branch_id,destination_branch_id,product_id,quantity,unit,transfer_date,notes)
  VALUES(p_transfer_id,v_company,p_source_branch_id,p_destination_branch_id,p_product_id,p_quantity,v_product.input_unit,p_transfer_date,NULLIF(trim(p_notes),'')) RETURNING id INTO v_transfer;
  INSERT INTO public.inventory_records(date,product_id,product_code,product_name,input_quantity,output_quantity,unit,source_type,reference_id,notes,created_by,company_id,branch_id)
  VALUES
    (p_transfer_date,p_product_id,COALESCE(v_product.business_code,''),v_product.name,0,p_quantity,v_product.input_unit,'transfer_out',v_transfer::text,'Điều chuyển kho: '||COALESCE(p_notes,''),auth.uid(),v_company,p_source_branch_id),
    (p_transfer_date,p_product_id,COALESCE(v_product.business_code,''),v_product.name,p_quantity,0,v_product.input_unit,'transfer_in',v_transfer::text,'Điều chuyển kho: '||COALESCE(p_notes,''),auth.uid(),v_company,p_destination_branch_id);
  RETURN v_transfer;
END; $$;

DROP POLICY IF EXISTS "inventory count sessions company read" ON public.inventory_count_sessions;
CREATE POLICY "inventory count sessions tenant branch read" ON public.inventory_count_sessions FOR SELECT USING (
  public.check_user_role(auth.uid(),'admin_master') OR
  (company_id=public.get_user_company_id(auth.uid()) AND
   (public.check_user_role(auth.uid(),'admin_company') OR branch_id=(SELECT branch_id FROM public.users WHERE id=auth.uid())))
);
DROP POLICY IF EXISTS "inventory count lines company access" ON public.inventory_count_lines;
CREATE POLICY "inventory count lines tenant branch read" ON public.inventory_count_lines FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.inventory_count_sessions s WHERE s.id=session_id AND
    (public.check_user_role(auth.uid(),'admin_master') OR
     (s.company_id=public.get_user_company_id(auth.uid()) AND
      (public.check_user_role(auth.uid(),'admin_company') OR s.branch_id=(SELECT branch_id FROM public.users WHERE id=auth.uid())))))
);

CREATE OR REPLACE FUNCTION public.inventory_import_batch(p_company_id uuid,p_batch_id uuid,p_direction text,p_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_row jsonb; v_product record; v_qty numeric; v_stock numeric; v_created integer:=0; v_branch uuid; v_role text;
BEGIN
  SELECT branch_id,role::text INTO v_branch,v_role FROM public.users WHERE id=auth.uid() AND (company_id=p_company_id OR role::text='admin_master');
  IF NOT FOUND THEN RAISE EXCEPTION 'Không thể ghi dữ liệu cho công ty khác'; END IF;
  IF v_role='admin_master' THEN v_branch:=NULL; END IF;
  IF p_direction NOT IN ('input','output') OR jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)=0 THEN RAISE EXCEPTION 'Lô dữ liệu không hợp lệ'; END IF;
  INSERT INTO public.inventory_command_keys(company_id,command_type,external_id) VALUES(p_company_id,'inventory_'||p_direction,p_batch_id::text) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('created',0,'skipped',jsonb_array_length(p_rows),'batch_id',p_batch_id); END IF;
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_qty:=CASE WHEN p_direction='input' THEN (v_row->>'inputQuantity')::numeric ELSE (v_row->>'outputQuantity')::numeric END;
    IF v_qty<=0 OR COALESCE(v_row->>'date','')='' OR COALESCE(v_row->>'productCode','')='' THEN RAISE EXCEPTION 'Ngày, mã hàng và số lượng lớn hơn 0 là bắt buộc'; END IF;
    SELECT id,business_code,name,input_unit INTO v_product FROM public.products WHERE company_id=p_company_id AND business_code=v_row->>'productCode' AND status='active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy sản phẩm đang hoạt động: %',v_row->>'productCode'; END IF;
    PERFORM pg_advisory_xact_lock(hashtext(p_company_id::text||':'||COALESCE(v_branch::text,'company')||':'||v_product.id::text));
    IF p_direction='output' THEN
      SELECT COALESCE(sum(input_quantity-output_quantity),0) INTO v_stock FROM public.inventory_records
      WHERE company_id=p_company_id AND product_id=v_product.id AND branch_id IS NOT DISTINCT FROM v_branch AND COALESCE(status,'active')='active';
      IF v_stock<v_qty THEN RAISE EXCEPTION 'Không đủ tồn kho cho %: còn %, yêu cầu %',v_product.business_code,v_stock,v_qty; END IF;
    END IF;
    INSERT INTO public.inventory_records(date,product_id,product_code,product_name,input_quantity,output_quantity,unit,unit_price,total_amount,source_type,reference_id,notes,created_by,company_id,branch_id)
    VALUES((v_row->>'date')::date,v_product.id,v_product.business_code,v_product.name,CASE WHEN p_direction='input' THEN v_qty ELSE 0 END,CASE WHEN p_direction='output' THEN v_qty ELSE 0 END,v_product.input_unit,COALESCE(NULLIF(v_row->>'unitPrice','')::numeric,0),v_qty*COALESCE(NULLIF(v_row->>'unitPrice','')::numeric,0),'bulk_import',p_batch_id::text,NULLIF(concat_ws(' · ',NULLIF(v_row->>'reason',''),NULLIF(v_row->>'notes','')),''),auth.uid(),p_company_id,v_branch);
    v_created:=v_created+1;
  END LOOP;
  RETURN jsonb_build_object('created',v_created,'skipped',0,'batch_id',p_batch_id,'branch_id',v_branch);
END; $$;

CREATE OR REPLACE FUNCTION public.inventory_create_count_session(p_count_date date,p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_company uuid:=public.get_user_company_id(auth.uid()); v_branch uuid; v_session uuid; v_mixed_units text;
BEGIN
  SELECT branch_id INTO v_branch FROM public.users WHERE id=auth.uid();
  IF v_company IS NULL THEN RAISE EXCEPTION 'Vui lòng chọn công ty trước khi kiểm kê'; END IF;
  SELECT string_agg(DISTINCT COALESCE(p.business_code,p.name,p.id::text)||': '||COALESCE(r.unit,'trống')||' ≠ '||p.input_unit,', ') INTO v_mixed_units
  FROM public.inventory_records r JOIN public.products p ON p.id=r.product_id
  WHERE r.company_id=v_company AND r.branch_id IS NOT DISTINCT FROM v_branch AND COALESCE(r.status,'active')='active' AND r.date<=p_count_date AND r.unit IS DISTINCT FROM p.input_unit;
  IF v_mixed_units IS NOT NULL THEN RAISE EXCEPTION 'Chưa thể chốt tồn sổ vì có giao dịch sai đơn vị chuẩn: %',v_mixed_units; END IF;
  INSERT INTO public.inventory_count_sessions(company_id,branch_id,count_date,notes) VALUES(v_company,v_branch,p_count_date,NULLIF(trim(p_notes),'')) RETURNING id INTO v_session;
  INSERT INTO public.inventory_count_lines(session_id,product_id,book_quantity,unit)
  SELECT v_session,p.id,COALESCE(sum(COALESCE(r.input_quantity,0)-COALESCE(r.output_quantity,0)),0),p.input_unit
  FROM public.products p LEFT JOIN public.inventory_records r ON r.product_id=p.id AND r.company_id=v_company AND r.branch_id IS NOT DISTINCT FROM v_branch AND COALESCE(r.status,'active')='active' AND r.date<=p_count_date
  WHERE p.company_id=v_company AND p.status='active' GROUP BY p.id,p.input_unit;
  RETURN v_session;
END; $$;

CREATE OR REPLACE FUNCTION public.inventory_review_count_session(p_session_id uuid,p_action text,p_review_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_session public.inventory_count_sessions%ROWTYPE; v_line record; v_record uuid; v_adjusted integer:=0;
BEGIN
  IF NOT (public.check_user_role(auth.uid(),'admin_master') OR public.check_user_role(auth.uid(),'admin_company')) THEN RAISE EXCEPTION 'Bạn không có quyền duyệt kiểm kê'; END IF;
  IF p_action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Hành động duyệt không hợp lệ'; END IF;
  SELECT * INTO v_session FROM public.inventory_count_sessions WHERE id=p_session_id FOR UPDATE;
  IF NOT FOUND OR (NOT public.check_user_role(auth.uid(),'admin_master') AND v_session.company_id IS DISTINCT FROM public.get_user_company_id(auth.uid())) OR v_session.status<>'submitted' THEN RAISE EXCEPTION 'Phiên kiểm kê không ở trạng thái chờ duyệt'; END IF;
  IF p_action='reject' THEN UPDATE public.inventory_count_sessions SET status='rejected',review_notes=NULLIF(trim(p_review_notes),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() WHERE id=p_session_id; RETURN jsonb_build_object('approved',false,'rejected',true,'adjusted',0); END IF;
  FOR v_line IN SELECT l.*,p.business_code,p.name FROM public.inventory_count_lines l JOIN public.products p ON p.id=l.product_id WHERE l.session_id=p_session_id AND l.variance<>0 LOOP
    INSERT INTO public.inventory_command_keys(company_id,command_type,external_id) VALUES(v_session.company_id,'stock_count_adjustment',v_line.id::text) ON CONFLICT DO NOTHING;
    IF FOUND THEN
      INSERT INTO public.inventory_records(date,product_id,product_code,product_name,input_quantity,output_quantity,unit,source_type,reference_id,notes,created_by,company_id,branch_id)
      VALUES(v_session.count_date,v_line.product_id,COALESCE(v_line.business_code,''),v_line.name,GREATEST(v_line.variance,0),GREATEST(-v_line.variance,0),v_line.unit,'stock_count_adjustment',p_session_id::text,'Điều chỉnh kiểm kê: '||v_line.explanation,auth.uid(),v_session.company_id,v_session.branch_id) RETURNING id INTO v_record;
      UPDATE public.inventory_count_lines SET adjustment_record_id=v_record,updated_at=now() WHERE id=v_line.id; v_adjusted:=v_adjusted+1;
    END IF;
  END LOOP;
  UPDATE public.inventory_count_sessions SET status='approved',review_notes=NULLIF(trim(p_review_notes),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() WHERE id=p_session_id;
  RETURN jsonb_build_object('approved',true,'rejected',false,'adjusted',v_adjusted);
END; $$;

REVOKE ALL ON FUNCTION public.inventory_enforce_record_scope_and_unit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_import_batch(uuid,uuid,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_create_count_session(date,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_review_count_session(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_import_batch(uuid,uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_create_count_session(date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_review_count_session(uuid,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.inventory_transfer_stock(uuid,uuid,uuid,numeric,date,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_transfer_stock(uuid,uuid,uuid,numeric,date,text,uuid) TO authenticated;
