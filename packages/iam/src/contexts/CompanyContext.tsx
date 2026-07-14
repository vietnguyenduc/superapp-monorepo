import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getSupabaseClient } from "@superapp/shared-utils";
import type { Company } from "@repo/types";
import { useAuthContext } from "./AuthProvider";

export interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  loading: boolean;
  error: string | null;
  clearSelectedCompany: () => void;
  refetchCompanies: () => Promise<void>;
  createCompany: (company: Omit<Company, "id" | "created_at" | "updated_at">) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  updateCompany: (companyId: string, updates: Partial<Company>) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session, isTrial, user } = useAuthContext();

  /**
   * Attempt to resolve the user's assigned company from their profile.
   * This is used as a fallback when the companies table query fails (e.g., due to RLS).
   */
  const resolveCompanyFromUser = (): Company | null => {
    if (!user?.company_id) return null;
    // user.company is populated by useAuth hook during profile fetch
    const companyFromProfile = (user as any).company as Company | undefined;
    if (companyFromProfile) {
      return companyFromProfile;
    }
    // If we have company_id but no resolved company object,
    // create a minimal placeholder so the badge can still render
    return {
      id: user.company_id,
      name: (user as any).company_name || "",
      code: "",
      is_active: true,
      logo_url: null,
      created_at: "",
      updated_at: "",
    } as Company;
  };

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    // Skip if not authenticated and not in trial mode
    if (!session && !isTrial) {
      setLoading(false);
      return;
    }

    try {
      if (isTrial) {
        setCompanies([{
          id: "trial-company",
          name: "Công ty Dùng Thử",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Company]);
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      let companyList: Company[] = [];

      // Strategy 1: Direct query (works for admin_master — allowed by RLS)
      const { data, error: fetchError } = await supabase
        .from("companies")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (!fetchError && data && data.length > 0) {
        companyList = data;
      }

      // Strategy 2: Fallback to RPC for roles where RLS blocks direct query
      if (companyList.length === 0) {
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc("admin_get_companies");

          if (!rpcError && rpcData && rpcData.length > 0) {
            companyList = rpcData as Company[];
          }
        } catch (rpcErr) {
          console.warn("RPC admin_get_companies fallback failed:", rpcErr);
        }
      }

      // Strategy 3: Extract from user profile as last resort
      if (companyList.length === 0) {
        const userCompany = resolveCompanyFromUser();
        if (userCompany) {
          companyList = [userCompany];
        }
      }

      if (companyList.length === 0 && fetchError) {
        console.error("Error fetching companies:", fetchError);
        setError(fetchError.message);
      }

      setCompanies(companyList);
    } catch (err) {
      console.error("Error calling Supabase:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Load companies when auth state changes
  useEffect(() => {
    if (session || isTrial) {
      fetchCompanies();
    } else {
      setCompanies([]);
      setSelectedCompanyState(null);
      setLoading(false);
    }
  }, [session, isTrial]);

  // Load selected company from localStorage when companies are loaded
  useEffect(() => {
    const savedCompanyId = localStorage.getItem("selectedCompanyId");
    if (savedCompanyId && companies.length > 0) {
      const company = companies.find((c) => c.id === savedCompanyId);
      if (company) {
        setSelectedCompanyState(company);
      }
    }
  }, [companies]);

  const setSelectedCompany = (company: Company | null) => {
    setSelectedCompanyState(company);
    if (company) {
      localStorage.setItem("selectedCompanyId", company.id);
    } else {
      localStorage.removeItem("selectedCompanyId");
    }
  };

  const clearSelectedCompany = () => {
    setSelectedCompanyState(null);
    localStorage.removeItem("selectedCompanyId");
  };

  const createCompany = async (company: Omit<Company, "id" | "created_at" | "updated_at">) => {
    if (isTrial) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("companies")
      .insert(company)
      .select()
      .single();

    if (error) {
      console.error("Error creating company:", error);
      throw error;
    }

    await fetchCompanies();
  };

  const deleteCompany = async (companyId: string) => {
    if (isTrial) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("companies")
      .update({ is_active: false })
      .eq("id", companyId);

    if (error) {
      console.error("Error deleting company:", error);
      throw error;
    }

    if (selectedCompany?.id === companyId) {
      setSelectedCompanyState(null);
      localStorage.removeItem("selectedCompanyId");
    }

    await fetchCompanies();
  };

  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    if (isTrial) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", companyId);

    if (error) {
      console.error("Error updating company:", error);
      throw error;
    }

    // Update selected company if it's the one being edited
    if (selectedCompany?.id === companyId) {
      setSelectedCompanyState({ ...selectedCompany, ...updates as Company });
    }

    await fetchCompanies();
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        setSelectedCompany,
        loading,
        error,
        clearSelectedCompany,
        refetchCompanies: fetchCompanies,
        createCompany,
        deleteCompany,
        updateCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};

export { CompanyContext };
