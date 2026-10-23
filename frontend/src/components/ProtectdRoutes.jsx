import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../utils/auth";

// Usage: <Route element={<ProtectedRoute />}>                       any logged-in user
//        <Route element={<ProtectedRoute roles={['admin']} />}>     admin only
export default function ProtectedRoute({ roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
