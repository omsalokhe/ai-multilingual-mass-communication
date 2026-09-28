import React, { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types";
import { loginUser, registerUser, getCurrentUser, logoutUser } from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("mass_comm_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mass_comm_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem("mass_comm_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUser();
        setUser(profile);
        localStorage.setItem("mass_comm_user", JSON.stringify(profile));
      } catch (err) {
        console.warn("Session expired or invalid token:", err);
        localStorage.removeItem("mass_comm_token");
        localStorage.removeItem("mass_comm_user");
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await loginUser(payload);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("mass_comm_token", res.access_token);
    localStorage.setItem("mass_comm_user", JSON.stringify(res.user));
  };

  const register = async (payload: RegisterPayload) => {
    const res = await registerUser(payload);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("mass_comm_token", res.access_token);
    localStorage.setItem("mass_comm_user", JSON.stringify(res.user));
  };

  const logout = () => {
    logoutUser().catch(() => {});
    localStorage.removeItem("mass_comm_token");
    localStorage.removeItem("mass_comm_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
