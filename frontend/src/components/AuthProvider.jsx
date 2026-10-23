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
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("token");
          return null; // simply not logged in
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res?.token) localStorage.setItem("token", res.token);
    queryClient.setQueryData(["me"], res.user);
    return res.user;
  };

  const logout = async () => {
    localStorage.removeItem("token");
    // Optimistically clear immediately so the UI responds in 0ms without waiting for network
    queryClient.setQueryData(["me"], null);
    queryClient.clear();
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore background logout network errors
    }
  };

  return (
    <AuthContext.Provider
      value={{ user: user ?? null, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
