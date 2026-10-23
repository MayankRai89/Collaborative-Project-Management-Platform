import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Everything inside needs a logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* F3 to F6 add: /projects, /projects/:id, /tasks/:id, /profile */}
      </Route>

      {/* F6 adds the admin-only /users page inside <ProtectedRoute roles={['admin']} /> */}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
