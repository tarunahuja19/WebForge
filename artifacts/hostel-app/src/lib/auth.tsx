import React, { createContext, useContext, ReactNode } from "react";
import { useAuth as useAuthHook } from "../hooks/use-auth";

const AuthContext = createContext<ReturnType<typeof useAuthHook> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
