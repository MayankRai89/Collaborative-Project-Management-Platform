import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../utils/api";
import { AuthContext } from "../utils/auth";

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // The cookie is httpOnly, so JavaScript can't read it. We ask the server "who am I?" instead.
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return (await api.get("/auth/me")).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null; // simply not logged in
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    queryClient.setQueryData(["me"], res.user);
    return res.user;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    queryClient.clear(); // drop every cached query so the next user never sees old data
    queryClient.setQueryData(["me"], null);
  };

  return (
    <AuthContext.Provider
      value={{ user: user ?? null, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
