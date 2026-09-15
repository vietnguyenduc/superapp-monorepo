-- Manual forms send a canonical product id after the user selects an item.
-- Spreadsheet imports continue to use the configured code/name matching rule.
CREATE OR REPLACE FUNCTION public.inventory_import_batch(p_company_id uuid,p_batch_id uuid,p_direction text,p_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE
  v_row jsonb; v_product record; v_supplier_id text; v_qty numeric; v_stock numeric;
  v_created integer:=0; v_branch uuid; v_role text; v_match_field text; v_product_count integer;
BEGIN
  SELECT branch_id,role::text INTO v_branch,v_role FROM public.users WHERE id=auth.uid() AND (company_id=p_company_id OR role::text='admin_master');
  IF NOT FOUND THEN RAISE EXCEPTION 'Không thể ghi dữ liệu cho công ty khác'; END IF;
  IF v_role='admin_master' THEN v_branch:=NULL; END IF;
  IF p_direction NOT IN ('input','output') OR jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)=0 THEN RAISE EXCEPTION 'Lô dữ liệu không hợp lệ'; END IF;
  SELECT COALESCE(import_export_config->>'inventoryMatchField','business_code') INTO v_match_field FROM public.inventory_settings WHERE company_id=p_company_id;
  v_match_field:=COALESCE(v_match_field,'business_code');
  INSERT INTO public.inventory_command_keys(company_id,command_type,external_id) VALUES(p_company_id,'inventory_'||p_direction,p_batch_id::text) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('created',0,'skipped',jsonb_array_length(p_rows),'batch_id',p_batch_id); END IF;
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_qty:=CASE WHEN p_direction='input' THEN (v_row->>'inputQuantity')::numeric ELSE (v_row->>'outputQuantity')::numeric END;
    IF v_qty<=0 OR COALESCE(v_row->>'date','')='' OR (COALESCE(v_row->>'productId','')='' AND COALESCE(v_row->>'productCode','')='') THEN RAISE EXCEPTION 'Ngày, sản phẩm và số lượng lớn hơn 0 là bắt buộc'; END IF;
    SELECT count(*) INTO v_product_count FROM public.products
      WHERE company_id=p_company_id AND status='active' AND (
        (NULLIF(v_row->>'productId','') IS NOT NULL AND id::text=v_row->>'productId') OR
        (NULLIF(v_row->>'productId','') IS NULL AND CASE WHEN v_match_field='name' THEN lower(trim(name))=lower(trim(v_row->>'productCode')) ELSE business_code=v_row->>'productCode' END)
      );
    IF v_product_count<>1 THEN RAISE EXCEPTION '% sản phẩm đang hoạt động: %',CASE WHEN v_product_count=0 THEN 'Không tìm thấy' ELSE 'Có nhiều hơn một' END,COALESCE(NULLIF(v_row->>'productCode',''),v_row->>'productId'); END IF;
    SELECT id,business_code,name,input_unit INTO v_product FROM public.products
      WHERE company_id=p_company_id AND status='active' AND (
        (NULLIF(v_row->>'productId','') IS NOT NULL AND id::text=v_row->>'productId') OR
        (NULLIF(v_row->>'productId','') IS NULL AND CASE WHEN v_match_field='name' THEN lower(trim(name))=lower(trim(v_row->>'productCode')) ELSE business_code=v_row->>'productCode' END)
      );
    v_supplier_id:=NULL;
    IF p_direction='input' AND NULLIF(v_row->>'supplierId','') IS NOT NULL THEN
      SELECT id INTO v_supplier_id FROM public.customers
        WHERE id=v_row->>'supplierId' AND company_id=p_company_id AND partner_type IN ('supplier','both') AND COALESCE(is_active,true);
      IF NOT FOUND THEN RAISE EXCEPTION 'Nhà cung cấp không thuộc công ty hoặc đã ngừng hoạt động: %',COALESCE(v_row->>'supplierName',v_row->>'supplierId'); END IF;
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext(p_company_id::text||':'||COALESCE(v_branch::text,'company')||':'||v_product.id::text));
    IF p_direction='output' THEN
      SELECT COALESCE(sum(input_quantity-output_quantity),0) INTO v_stock FROM public.inventory_records
      WHERE company_id=p_company_id AND product_id=v_product.id AND branch_id IS NOT DISTINCT FROM v_branch AND COALESCE(status,'active')='active';
      IF v_stock<v_qty THEN RAISE EXCEPTION 'Không đủ tồn kho cho %: còn %, yêu cầu %',v_product.business_code,v_stock,v_qty; END IF;
    END IF;
    INSERT INTO public.inventory_records(date,product_id,product_code,product_name,input_quantity,output_quantity,unit,unit_price,total_amount,supplier_id,source_type,reference_id,notes,created_by,company_id,branch_id)
    VALUES((v_row->>'date')::date,v_product.id,v_product.business_code,v_product.name,CASE WHEN p_direction='input' THEN v_qty ELSE 0 END,CASE WHEN p_direction='output' THEN v_qty ELSE 0 END,v_product.input_unit,COALESCE(NULLIF(v_row->>'unitPrice','')::numeric,0),v_qty*COALESCE(NULLIF(v_row->>'unitPrice','')::numeric,0),v_supplier_id,'bulk_import',p_batch_id::text,NULLIF(concat_ws(' · ',NULLIF(v_row->>'reason',''),NULLIF(v_row->>'notes','')),''),auth.uid(),p_company_id,v_branch);
    v_created:=v_created+1;
  END LOOP;
  RETURN jsonb_build_object('created',v_created,'skipped',0,'batch_id',p_batch_id,'branch_id',v_branch);
END; $$;

REVOKE ALL ON FUNCTION public.inventory_import_batch(uuid,uuid,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_import_batch(uuid,uuid,text,jsonb) TO authenticated;
