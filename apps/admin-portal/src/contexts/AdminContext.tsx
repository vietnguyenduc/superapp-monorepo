import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase , apiClient} from "../lib/supabase";
import { useAuthContext } from '@superapp/iam';

type Company = {
  id: string;
  name: string;
  code: string;
};

type AdminContextType = {
  companies: Company[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  loading: boolean;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuthContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchCompanies();
    }
  }, [session]);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await apiClient.rpc('admin_get_companies');
    if (!error && data) {
      setCompanies(data);
    }
    setLoading(false);
  };

  return (
    <AdminContext.Provider value={{ companies, selectedCompanyId, setSelectedCompanyId, loading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
