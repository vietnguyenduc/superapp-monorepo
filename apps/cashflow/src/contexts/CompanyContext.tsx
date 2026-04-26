import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "../services/supabase";
import type { Company } from "../types/database.types";

interface CompanyContextType {
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

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated before fetching
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("companies")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (fetchError) {
      console.error("Error fetching companies:", fetchError);
      setError(fetchError.message);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  // Load companies when auth state changes
  useEffect(() => {
    // Initial fetch
    fetchCompanies();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchCompanies();
      } else if (event === 'SIGNED_OUT') {
        setCompanies([]);
        setSelectedCompanyState(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      setSelectedCompanyState({ ...selectedCompany, ...updates });
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
