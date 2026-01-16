import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  telegramUserId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (telegramData: any) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (telegramData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/telegram", telegramData);
      const result = await response.json();
      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refetch = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
