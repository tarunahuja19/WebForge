import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("hostelos_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem("hostelos_role") || null;
  });

  const setAuth = (newUser: any, newRole: string) => {
    setUser(newUser);
    setRole(newRole);
    localStorage.setItem("hostelos_user", JSON.stringify(newUser));
    localStorage.setItem("hostelos_role", newRole);
    // Seed query cache if needed
    if (newUser) {
      queryClient.setQueryData(getGetCurrentUserQueryKey(), newUser);
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("hostelos_user");
    localStorage.removeItem("hostelos_role");
    queryClient.removeQueries();
  };

  return { user, role, setAuth, logout };
}
