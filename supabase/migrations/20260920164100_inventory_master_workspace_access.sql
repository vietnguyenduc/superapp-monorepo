-- admin_master manages the selected company from the shared company switcher.
-- It must be able to initialize and select that company's warehouse workspace.
CREATE OR REPLACE FUNCTION public.inventory_configure_workspace(p_branch_id uuid DEFAULT NULL,p_create_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_company uuid:=public.get_user_company_id(auth.uid()); v_role text; v_branch uuid; v_name text; v_active_count integer;
BEGIN
  SELECT role::text INTO v_role FROM public.users WHERE id=auth.uid();
  IF v_company IS NULL OR v_role NOT IN ('admin_company','admin_master') THEN RAISE EXCEPTION 'Chỉ quản trị công ty hoặc quản trị hệ thống được cấu hình kho'; END IF;
  IF p_create_name IS NOT NULL THEN
    SELECT count(*) INTO v_active_count FROM public.branches WHERE company_id=v_company AND COALESCE(status,'active')='active' AND COALESCE(is_active,true);
    IF v_active_count>0 THEN RAISE EXCEPTION 'Công ty đã có kho; hãy quản lý kho trong Admin Portal'; END IF;
    v_name:=NULLIF(trim(p_create_name),'');
    IF v_name IS NULL THEN RAISE EXCEPTION 'Tên kho không được để trống'; END IF;
    INSERT INTO public.branches(name,code,company_id,status,is_active,created_by,updated_by)
    VALUES(v_name,'KHO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),v_company,'active',true,auth.uid(),auth.uid()) RETURNING id INTO v_branch;
    UPDATE public.users SET branch_id=v_branch,updated_at=now() WHERE company_id=v_company AND branch_id IS NULL;
    UPDATE public.inventory_records SET branch_id=v_branch WHERE company_id=v_company AND branch_id IS NULL;
    UPDATE public.sales_records SET branch_id=v_branch WHERE company_id=v_company AND branch_id IS NULL;
    UPDATE public.goods_receipts SET branch_id=v_branch WHERE company_id=v_company AND branch_id IS NULL;
    UPDATE public.special_outbound_records SET branch_id=v_branch WHERE company_id=v_company AND branch_id IS NULL;
    UPDATE public.inventory_count_sessions SET branch_id=v_branch WHERE company_id=v_company AND branch_id IS NULL;
    UPDATE public.inventory_variance_reports SET branch_id=v_branch WHERE company_id=v_company AND branch_id IS NULL;
  ELSE
    SELECT id INTO v_branch FROM public.branches WHERE id=p_branch_id AND company_id=v_company AND COALESCE(status,'active')='active' AND COALESCE(is_active,true);
    IF NOT FOUND THEN RAISE EXCEPTION 'Kho không thuộc công ty hoặc đã ngừng hoạt động'; END IF;
  END IF;
  UPDATE public.users SET branch_id=v_branch,updated_at=now() WHERE id=auth.uid();
  RETURN v_branch;
END; $$;
REVOKE ALL ON FUNCTION public.inventory_configure_workspace(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_configure_workspace(uuid,text) TO authenticated;
