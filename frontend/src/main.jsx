import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import AuthProvider from "./components/AuthProvider";
import { ApiError } from "./utils/api";

const queryClient = new QueryClient({
  // If any request comes back 401 (token expired, or the account was deactivated), treat the user as logged out
  queryCache: new QueryCache({
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        queryClient.setQueryData(["me"], null);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute fresh cache: switching pages is instant
      gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
