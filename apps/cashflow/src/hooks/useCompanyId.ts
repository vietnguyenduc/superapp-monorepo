import { useAuthContext } from "@superapp/iam";
import { useCompany } from "@superapp/iam";

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
  const canSwitch = user?.role === "admin_master" || user?.role === "admin";
  if (canSwitch) {
    const savedId = typeof window !== "undefined" ? window.localStorage.getItem("selectedCompanyId") || undefined : undefined;
    return selectedCompany?.id || savedId || user?.company_id;
  }
  return user?.company_id;
};
