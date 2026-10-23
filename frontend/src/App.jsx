import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Users from "./pages/admin/Users";
import ProjectList from "./pages/projects/ProjectList";
import ProjectLayout from "./pages/projects/ProjectLayout";
import ProjectTasks from "./pages/projects/ProjectTasks";
import ProjectTeam from "./pages/projects/ProjectTeam";
import TaskDetail from "./pages/tasks/TaskDetail";
import MyTasks from "./pages/tasks/MyTasks";

export default function App() {
  return (
    <Routes>
      {/* PUBLIC AUTH ROUTES */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED ROUTES (LOGGED-IN OPERATIVES) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/tasks" element={<MyTasks />} />
        <Route path="/my-tasks" element={<Navigate to="/tasks" replace />} />

        {/* NESTED PROJECT ROUTES */}
        <Route path="/projects/:id" element={<ProjectLayout />}>
          <Route index element={<ProjectTasks />} />
          <Route path="tasks" element={<ProjectTasks />} />
          <Route path="team" element={<ProjectTeam />} />
        </Route>

        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/profile" element={<Profile />} />

        {/* ADMIN EXCLUSIVE ROUTE */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/users" element={<Users />} />
        </Route>
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
