-- Inventory single-warehouse pilot safety boundary.
-- Completes a goods receipt, writes stock rows, and updates its PO atomically.
-- The function is SECURITY INVOKER so existing RLS remains authoritative.

ALTER TABLE public.inventory_records
  ADD COLUMN IF NOT EXISTS product_code text,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS output_quantity numeric(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raw_material_stock numeric(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raw_material_unit text,
  ADD COLUMN IF NOT EXISTS processed_stock numeric(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_unit text,
  ADD COLUMN IF NOT EXISTS finished_product_stock numeric(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finished_product_unit text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_inventory_records_source_reference
  ON public.inventory_records(company_id, source_type, reference_id);

CREATE TABLE IF NOT EXISTS public.inventory_command_keys (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  command_type text NOT NULL,
  external_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  PRIMARY KEY (company_id, command_type, external_id)
);
ALTER TABLE public.inventory_command_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory command keys company access" ON public.inventory_command_keys
  FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) OR public.check_user_role(auth.uid(), 'admin_master'));

CREATE OR REPLACE FUNCTION public.inventory_sync_sales_record(p_sales_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_sale record;
BEGIN
  SELECT s.*, p.business_code, p.name AS product_name
  INTO v_sale FROM public.sales_records s
  JOIN public.products p ON p.id = s.product_id
  WHERE s.id = p_sales_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy bản ghi bán hàng hoặc bạn không có quyền truy cập'; END IF;

  INSERT INTO public.inventory_command_keys(company_id, command_type, external_id)
  VALUES (v_sale.company_id, 'sales_sync', p_sales_id::text)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('created', false, 'skipped', true); END IF;

  INSERT INTO public.inventory_records(
    date, product_id, product_code, product_name, input_quantity, output_quantity,
    unit, source_type, reference_id, notes, created_by, company_id, branch_id
  ) VALUES (
    v_sale.date, v_sale.product_id, COALESCE(v_sale.business_code, ''), COALESCE(v_sale.product_name, ''),
    0, COALESCE(v_sale.sales_quantity, 0) + COALESCE(v_sale.promotion_quantity, 0),
    v_sale.unit, 'sales_sync', p_sales_id::text, 'Đồng bộ từ bán hàng', auth.uid(),
    v_sale.company_id, v_sale.branch_id
  );
  RETURN jsonb_build_object('created', true, 'skipped', false);
END;
$$;
REVOKE ALL ON FUNCTION public.inventory_sync_sales_record(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_sync_sales_record(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.inventory_import_batch(
  p_company_id uuid, p_batch_id uuid, p_direction text, p_rows jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_row jsonb; v_product record; v_qty numeric; v_stock numeric; v_created integer := 0;
BEGIN
  IF p_direction NOT IN ('input', 'output') THEN RAISE EXCEPTION 'Loại nhập kho không hợp lệ'; END IF;
  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN RAISE EXCEPTION 'Lô dữ liệu trống'; END IF;

  INSERT INTO public.inventory_command_keys(company_id, command_type, external_id)
  VALUES (p_company_id, 'inventory_' || p_direction, p_batch_id::text)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('created', 0, 'skipped', jsonb_array_length(p_rows), 'batch_id', p_batch_id); END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_qty := CASE WHEN p_direction = 'input' THEN (v_row->>'inputQuantity')::numeric ELSE (v_row->>'outputQuantity')::numeric END;
    IF v_qty <= 0 OR COALESCE(v_row->>'date', '') = '' OR COALESCE(v_row->>'productCode', '') = '' THEN
      RAISE EXCEPTION 'Ngày, mã hàng và số lượng lớn hơn 0 là bắt buộc';
    END IF;
    SELECT id, business_code, name, input_unit INTO v_product FROM public.products
    WHERE company_id = p_company_id AND business_code = v_row->>'productCode' AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy sản phẩm đang hoạt động: %', v_row->>'productCode'; END IF;

    PERFORM pg_advisory_xact_lock(hashtext(p_company_id::text || ':' || v_product.id::text));
    IF p_direction = 'output' THEN
      SELECT COALESCE(sum(input_quantity), 0) - COALESCE(sum(output_quantity), 0) INTO v_stock
      FROM public.inventory_records WHERE company_id = p_company_id AND product_id = v_product.id AND COALESCE(status, 'active') = 'active';
      IF v_stock < v_qty THEN RAISE EXCEPTION 'Không đủ tồn kho cho %: còn %, yêu cầu %', v_product.business_code, v_stock, v_qty; END IF;
    END IF;

    INSERT INTO public.inventory_records(
      date, product_id, product_code, product_name, input_quantity, output_quantity, unit,
      unit_price, total_amount, source_type, reference_id, notes, created_by, company_id
    ) VALUES (
      (v_row->>'date')::date, v_product.id, v_product.business_code, v_product.name,
      CASE WHEN p_direction='input' THEN v_qty ELSE 0 END,
      CASE WHEN p_direction='output' THEN v_qty ELSE 0 END,
      COALESCE(v_product.input_unit, 'đơn vị'), COALESCE(NULLIF(v_row->>'unitPrice', '')::numeric, 0),
      v_qty * COALESCE(NULLIF(v_row->>'unitPrice', '')::numeric, 0), 'bulk_import', p_batch_id::text,
      NULLIF(concat_ws(' · ', NULLIF(v_row->>'reason', ''), NULLIF(v_row->>'notes', '')), ''), auth.uid(), p_company_id
    );
    v_created := v_created + 1;
  END LOOP;
  RETURN jsonb_build_object('created', v_created, 'skipped', 0, 'batch_id', p_batch_id);
END;
$$;
REVOKE ALL ON FUNCTION public.inventory_import_batch(uuid, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_import_batch(uuid, uuid, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.inventory_complete_goods_receipt(p_gr_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_gr public.goods_receipts%ROWTYPE;
  v_item record;
  v_po_status text;
  v_created integer := 0;
BEGIN
  SELECT * INTO v_gr
  FROM public.goods_receipts
  WHERE id = p_gr_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu nhập hoặc bạn không có quyền truy cập';
  END IF;
  IF v_gr.status = 'completed' THEN
    RETURN jsonb_build_object('completed', true, 'already_completed', true, 'created', 0, 'gr_number', v_gr.gr_number);
  END IF;
  IF v_gr.status <> 'pending' THEN
    RAISE EXCEPTION 'Chỉ có thể hoàn tất phiếu đang chờ xử lý';
  END IF;

  FOR v_item IN
    SELECT gri.*, p.business_code, p.name AS product_name, p.input_unit
    FROM public.goods_receipt_items gri
    JOIN public.products p ON p.id = gri.product_id
    WHERE gri.gr_id = p_gr_id AND gri.received_qty > 0
  LOOP
    INSERT INTO public.inventory_records (
      date, product_id, product_code, product_name, input_quantity,
      output_quantity, unit, unit_price, total_amount, supplier_id,
      source_type, reference_id, notes, created_by, company_id
    ) VALUES (
      v_gr.receipt_date::date, v_item.product_id, COALESCE(v_item.business_code, ''),
      COALESCE(v_item.product_name, ''), v_item.received_qty, 0, COALESCE(v_item.input_unit, 'đơn vị'),
      v_item.unit_price, v_item.received_qty * v_item.unit_price, v_gr.supplier_id,
      'goods_receipt', v_gr.id::text, 'Nhập hàng - ' || v_gr.gr_number,
      auth.uid(), v_gr.company_id
    );
    v_created := v_created + 1;

    IF v_item.po_item_id IS NOT NULL THEN
      UPDATE public.po_items
      SET received_quantity = COALESCE(received_quantity, 0) + v_item.received_qty
      WHERE id = v_item.po_item_id
        AND EXISTS (
          SELECT 1 FROM public.purchase_orders po
          WHERE po.id = po_items.po_id AND po.company_id = v_gr.company_id
        );
      IF NOT FOUND THEN RAISE EXCEPTION 'Không thể cập nhật dòng đơn mua %', v_item.po_item_id; END IF;
    END IF;
  END LOOP;

  IF v_gr.po_id IS NOT NULL THEN
    SELECT CASE
      WHEN bool_and(COALESCE(received_quantity, 0) >= quantity) THEN 'received'
      WHEN bool_or(COALESCE(received_quantity, 0) > 0) THEN 'partial_received'
      ELSE 'sent'
    END INTO v_po_status
    FROM public.po_items WHERE po_id = v_gr.po_id;

    UPDATE public.purchase_orders
    SET status = COALESCE(v_po_status, 'sent'), updated_at = now()
    WHERE id = v_gr.po_id AND company_id = v_gr.company_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không thể cập nhật đơn mua liên kết'; END IF;
  END IF;

  UPDATE public.goods_receipts
  SET status = 'completed', updated_at = now()
  WHERE id = p_gr_id AND company_id = v_gr.company_id;

  RETURN jsonb_build_object('completed', true, 'already_completed', false, 'created', v_created, 'gr_number', v_gr.gr_number);
END;
$$;

REVOKE ALL ON FUNCTION public.inventory_complete_goods_receipt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_complete_goods_receipt(uuid) TO authenticated;
