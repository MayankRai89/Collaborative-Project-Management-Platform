import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const ROLE_LABELS = {
  admin: "Admin",
  project_manager: "Project Manager",
  team_member: "Team Member",
  viewer: "Viewer",
};
