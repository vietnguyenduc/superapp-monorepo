-- Procurement workflows that are safe for the inventory ledger.
-- Purchase orders never change stock. Supplier returns require approval and
-- create their outbound ledger rows only when the return is completed.

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE RESTRICT;

ALTER TABLE public.supplier_returns
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS return_date date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- The original procurement schema used integer quantities. Inventory supports
-- canonical decimal units, so PO quantities must preserve the same precision.
-- `total_price` is generated from quantity and is recreated after the type change.
ALTER TABLE public.po_items DROP COLUMN IF EXISTS total_price;
ALTER TABLE public.po_items
  ALTER COLUMN quantity TYPE numeric(14,3),
  ALTER COLUMN received_quantity TYPE numeric(14,3);
ALTER TABLE public.po_items
  ADD COLUMN total_price numeric(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;

CREATE TABLE IF NOT EXISTS public.supplier_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.supplier_returns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  gr_item_id uuid REFERENCES public.goods_receipt_items(id) ON DELETE SET NULL,
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_branch_created
  ON public.purchase_orders(company_id, branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_company_branch_created
  ON public.supplier_returns(company_id, branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_return_items_return
  ON public.supplier_return_items(return_id);

ALTER TABLE public.supplier_return_items ENABLE ROW LEVEL SECURITY;

-- Procurement documents follow the same branch boundary as the inventory
-- ledger. Company admins may work across branches; other users stay in theirs.
DROP POLICY IF EXISTS "Users can view their company purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can insert their company purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can update their company purchase_orders" ON public.purchase_orders;
CREATE POLICY "purchase orders tenant branch read" ON public.purchase_orders FOR SELECT USING (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND
   (public.check_user_role(auth.uid(), 'admin_company') OR branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))
);
CREATE POLICY "purchase orders tenant branch insert" ON public.purchase_orders FOR INSERT WITH CHECK (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "purchase orders tenant branch update" ON public.purchase_orders FOR UPDATE USING (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND
   (public.check_user_role(auth.uid(), 'admin_company') OR branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))
) WITH CHECK (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND
   (public.check_user_role(auth.uid(), 'admin_company') OR branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))
);

DROP POLICY IF EXISTS "Users can view their company supplier_returns" ON public.supplier_returns;
DROP POLICY IF EXISTS "Users can insert their company supplier_returns" ON public.supplier_returns;
DROP POLICY IF EXISTS "Users can update their company supplier_returns" ON public.supplier_returns;
CREATE POLICY "supplier returns tenant branch read" ON public.supplier_returns FOR SELECT USING (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND
   (public.check_user_role(auth.uid(), 'admin_company') OR branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))
);
CREATE POLICY "supplier returns tenant branch insert" ON public.supplier_returns FOR INSERT WITH CHECK (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "supplier returns tenant branch update" ON public.supplier_returns FOR UPDATE USING (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND
   (public.check_user_role(auth.uid(), 'admin_company') OR branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))
) WITH CHECK (
  public.check_user_role(auth.uid(), 'admin_master') OR
  (company_id = public.get_user_company_id(auth.uid()) AND
   (public.check_user_role(auth.uid(), 'admin_company') OR branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))
);

DROP POLICY IF EXISTS "Users can view po_items" ON public.po_items;
DROP POLICY IF EXISTS "Users can insert po_items" ON public.po_items;
DROP POLICY IF EXISTS "Users can update po_items" ON public.po_items;
DROP POLICY IF EXISTS "Users can delete po_items" ON public.po_items;
CREATE POLICY "po items tenant branch access" ON public.po_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.purchase_orders p WHERE p.id = po_id AND
    (public.check_user_role(auth.uid(), 'admin_master') OR
     (p.company_id = public.get_user_company_id(auth.uid()) AND
      (public.check_user_role(auth.uid(), 'admin_company') OR p.branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.purchase_orders p WHERE p.id = po_id AND
    (public.check_user_role(auth.uid(), 'admin_master') OR
     (p.company_id = public.get_user_company_id(auth.uid()) AND p.branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid()))))
);

DROP POLICY IF EXISTS "supplier return items tenant read" ON public.supplier_return_items;
CREATE POLICY "supplier return items tenant read" ON public.supplier_return_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.supplier_returns r
      WHERE r.id = return_id
        AND (public.check_user_role(auth.uid(), 'admin_master')
          OR (r.company_id = public.get_user_company_id(auth.uid()) AND
              (public.check_user_role(auth.uid(), 'admin_company') OR r.branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid()))))
    )
  );

DROP POLICY IF EXISTS "supplier return items tenant write" ON public.supplier_return_items;
CREATE POLICY "supplier return items tenant write" ON public.supplier_return_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.supplier_returns r
      WHERE r.id = return_id
        AND (public.check_user_role(auth.uid(), 'admin_master')
          OR (r.company_id = public.get_user_company_id(auth.uid()) AND
              (public.check_user_role(auth.uid(), 'admin_company') OR r.branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid()))))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.supplier_returns r
      WHERE r.id = return_id
        AND (public.check_user_role(auth.uid(), 'admin_master')
          OR (r.company_id = public.get_user_company_id(auth.uid()) AND r.branch_id IS NOT DISTINCT FROM (SELECT branch_id FROM public.users WHERE id = auth.uid())))
    )
  );

CREATE OR REPLACE FUNCTION public.inventory_create_purchase_order(
  p_supplier_id uuid,
  p_expected_date date,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_po_number text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_branch uuid;
  v_role text;
  v_po uuid;
  v_item jsonb;
  v_product record;
  v_qty numeric;
  v_price numeric;
  v_total numeric := 0;
  v_number text;
BEGIN
  SELECT branch_id, role::text INTO v_branch, v_role FROM public.users WHERE id = auth.uid();
  IF v_company IS NULL OR v_role IS NULL THEN RAISE EXCEPTION 'Không xác định công ty hoặc người dùng'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'PO cần ít nhất một dòng hàng'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id AND company_id = v_company AND status = 'active') THEN
    RAISE EXCEPTION 'Nhà cung cấp không hợp lệ';
  END IF;
  v_number := COALESCE(NULLIF(trim(p_po_number), ''), 'PO-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6)));
  INSERT INTO public.purchase_orders(company_id, branch_id, supplier_id, po_number, status, expected_date, notes, created_by)
  VALUES(v_company, v_branch, p_supplier_id, v_number, 'draft', p_expected_date, NULLIF(trim(p_notes), ''), auth.uid())
  RETURNING id INTO v_po;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_qty := NULLIF(v_item->>'quantity', '')::numeric;
    v_price := COALESCE(NULLIF(v_item->>'unitPrice', '')::numeric, 0);
    IF v_qty IS NULL OR v_qty <= 0 OR NULLIF(v_item->>'productId', '') IS NULL THEN
      RAISE EXCEPTION 'Dòng PO cần sản phẩm và số lượng lớn hơn 0';
    END IF;
    SELECT id, company_id, input_unit INTO v_product FROM public.products
      WHERE id = (v_item->>'productId')::uuid AND company_id = v_company AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Sản phẩm trong PO không hợp lệ'; END IF;
    INSERT INTO public.po_items(po_id, product_id, quantity, unit_price, received_quantity)
    VALUES(v_po, v_product.id, v_qty, v_price, 0);
    v_total := v_total + v_qty * v_price;
  END LOOP;
  UPDATE public.purchase_orders SET total_amount = v_total WHERE id = v_po;
  RETURN v_po;
END;
$$;

CREATE OR REPLACE FUNCTION public.inventory_create_supplier_return(
  p_supplier_id uuid,
  p_return_date date,
  p_reason text,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_return_number text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_company uuid := public.get_user_company_id(auth.uid());
  v_branch uuid;
  v_return uuid;
  v_item jsonb;
  v_product record;
  v_qty numeric;
  v_price numeric;
  v_total numeric := 0;
  v_number text;
BEGIN
  SELECT branch_id INTO v_branch FROM public.users WHERE id = auth.uid();
  IF v_company IS NULL THEN RAISE EXCEPTION 'Không xác định công ty'; END IF;
  IF NULLIF(trim(p_reason), '') IS NULL THEN RAISE EXCEPTION 'Cần nêu lý do trả hàng'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Phiếu trả cần ít nhất một dòng hàng'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id AND company_id = v_company AND status = 'active') THEN
    RAISE EXCEPTION 'Nhà cung cấp không hợp lệ';
  END IF;
  v_number := COALESCE(NULLIF(trim(p_return_number), ''), 'RT-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6)));
  INSERT INTO public.supplier_returns(company_id, branch_id, supplier_id, return_number, return_date, status, reason, notes, total_amount, created_by)
  VALUES(v_company, v_branch, p_supplier_id, v_number, COALESCE(p_return_date, current_date), 'pending', trim(p_reason), NULLIF(trim(p_notes), ''), 0, auth.uid())
  RETURNING id INTO v_return;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_qty := NULLIF(v_item->>'quantity', '')::numeric;
    v_price := COALESCE(NULLIF(v_item->>'unitPrice', '')::numeric, 0);
    IF v_qty IS NULL OR v_qty <= 0 OR NULLIF(v_item->>'productId', '') IS NULL THEN RAISE EXCEPTION 'Dòng trả hàng cần sản phẩm và số lượng lớn hơn 0'; END IF;
    SELECT id, input_unit INTO v_product FROM public.products
      WHERE id = (v_item->>'productId')::uuid AND company_id = v_company AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Sản phẩm trả không hợp lệ'; END IF;
    INSERT INTO public.supplier_return_items(return_id, product_id, quantity, unit, unit_price, notes)
    VALUES(v_return, v_product.id, v_qty, v_product.input_unit, v_price, NULLIF(trim(v_item->>'notes'), ''));
    v_total := v_total + v_qty * v_price;
  END LOOP;
  UPDATE public.supplier_returns SET total_amount = v_total WHERE id = v_return;
  RETURN v_return;
END;
$$;

CREATE OR REPLACE FUNCTION public.inventory_review_supplier_return(p_return_id uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_return public.supplier_returns%ROWTYPE;
BEGIN
  IF p_action NOT IN ('approve', 'cancel') THEN RAISE EXCEPTION 'Hành động không hợp lệ'; END IF;
  IF NOT (public.check_user_role(auth.uid(), 'admin_master') OR public.check_user_role(auth.uid(), 'admin_company')) THEN
    RAISE EXCEPTION 'Chỉ quản trị công ty được duyệt trả hàng';
  END IF;
  SELECT * INTO v_return FROM public.supplier_returns WHERE id = p_return_id FOR UPDATE;
  IF NOT FOUND OR (NOT public.check_user_role(auth.uid(), 'admin_master') AND v_return.company_id IS DISTINCT FROM public.get_user_company_id(auth.uid())) THEN RAISE EXCEPTION 'Không tìm thấy phiếu trả hàng'; END IF;
  IF v_return.status <> 'pending' THEN RAISE EXCEPTION 'Phiếu trả hàng không ở trạng thái chờ duyệt'; END IF;
  UPDATE public.supplier_returns SET status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'cancelled' END,
    approved_by = CASE WHEN p_action = 'approve' THEN auth.uid() ELSE NULL END,
    approved_at = CASE WHEN p_action = 'approve' THEN now() ELSE NULL END
  WHERE id = p_return_id;
  RETURN jsonb_build_object('status', CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'cancelled' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.inventory_complete_supplier_return(p_return_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_return public.supplier_returns%ROWTYPE; v_item record; v_product record; v_stock numeric; v_created integer := 0;
BEGIN
  SELECT * INTO v_return FROM public.supplier_returns WHERE id = p_return_id FOR UPDATE;
  IF NOT FOUND OR (NOT public.check_user_role(auth.uid(), 'admin_master') AND v_return.company_id IS DISTINCT FROM public.get_user_company_id(auth.uid())) THEN RAISE EXCEPTION 'Không tìm thấy phiếu trả hàng'; END IF;
  IF v_return.status = 'completed' THEN RETURN jsonb_build_object('completed', true, 'created', 0, 'idempotent', true); END IF;
  IF v_return.status <> 'approved' THEN RAISE EXCEPTION 'Phiếu trả hàng cần được duyệt trước khi hoàn tất'; END IF;
  FOR v_item IN SELECT i.*, p.business_code, p.name, p.input_unit FROM public.supplier_return_items i JOIN public.products p ON p.id = i.product_id WHERE i.return_id = p_return_id LOOP
    IF v_item.unit IS DISTINCT FROM v_item.input_unit THEN RAISE EXCEPTION 'Đơn vị trả hàng không đúng đơn vị chuẩn của sản phẩm'; END IF;
    PERFORM pg_advisory_xact_lock(hashtext(v_return.company_id::text || ':' || COALESCE(v_return.branch_id::text, 'company') || ':' || v_item.product_id::text));
    SELECT COALESCE(sum(input_quantity - output_quantity), 0) INTO v_stock FROM public.inventory_records
      WHERE company_id = v_return.company_id AND branch_id IS NOT DISTINCT FROM v_return.branch_id AND product_id = v_item.product_id AND COALESCE(status, 'active') = 'active';
    IF v_stock < v_item.quantity THEN RAISE EXCEPTION 'Không đủ tồn để trả %: còn %, yêu cầu %', COALESCE(v_item.business_code, v_item.name), v_stock, v_item.quantity; END IF;
    INSERT INTO public.inventory_records(date, product_id, product_code, product_name, input_quantity, output_quantity, unit, unit_price, total_amount, source_type, reference_id, notes, created_by, company_id, branch_id)
    VALUES(v_return.return_date, v_item.product_id, COALESCE(v_item.business_code, ''), v_item.name, 0, v_item.quantity, v_item.input_unit, v_item.unit_price, v_item.quantity * v_item.unit_price, 'supplier_return', p_return_id::text, 'Trả NCC: ' || v_return.return_number || ' · ' || v_return.reason, auth.uid(), v_return.company_id, v_return.branch_id);
    v_created := v_created + 1;
  END LOOP;
  UPDATE public.supplier_returns SET status = 'completed', completed_by = auth.uid(), completed_at = now() WHERE id = p_return_id;
  RETURN jsonb_build_object('completed', true, 'created', v_created, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION public.inventory_create_purchase_order(uuid,date,text,jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_create_supplier_return(uuid,date,text,text,jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_review_supplier_return(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inventory_complete_supplier_return(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_create_purchase_order(uuid,date,text,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_create_supplier_return(uuid,date,text,text,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_review_supplier_return(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_complete_supplier_return(uuid) TO authenticated;
