-- Fix functions that broke due to search_path='' by adding the public. prefix to tables.

CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role::text = role_name
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN (SELECT company_id FROM public.users WHERE id = user_id);
END;
$function$;
