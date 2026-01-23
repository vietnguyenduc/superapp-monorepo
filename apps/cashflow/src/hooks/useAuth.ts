// MOCKED useAuth for Cypress and frontend testing without Supabase or login
export const useAuth = () => {
  const user = {
    id: "test-user",
    email: "test@example.com",
    full_name: "Test User",
    phone: "0123456789",
    position: "admin",
    role: "admin" as const,
    branch_id: "1",
    branch: {
      id: "1",
      name: "Main Branch",
      code: "MB001",
      address: "123 Main St",
      phone: "0123456789",
      email: "main@branch.com",
      manager_id: "test-user",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
  return {
    user,
    session: {
      access_token: "mock-token",
      refresh: () => Promise.resolve({ error: null }),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
    loading: false,
    error: null,
    signIn: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    updateProfile: async () => ({ data: user, error: null }),
    clearError: () => {},
    isAuthenticated: true,
  };
};
