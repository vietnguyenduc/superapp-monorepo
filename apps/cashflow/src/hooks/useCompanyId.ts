import { useAuthContext } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";

/**
 * Resolves the active company ID for the current user.
 *
 * - For `admin_master`, returns the explicitly selected company (may be undefined
 *   when no company is selected yet — callers should handle that).
 * - For all other roles, returns the user's own `company_id`.
 *
 * Centralizing this avoids the repeated inline pattern:
 *   user?.role === "admin_master" ? selectedCompany?.id : user?.company_id
 */
export const useCompanyId = (): string | undefined => {
  const { user } = useAuthContext();
  const { selectedCompany } = useCompany();
  if (user?.role === "admin_master") return selectedCompany?.id;
  return user?.company_id;
};
