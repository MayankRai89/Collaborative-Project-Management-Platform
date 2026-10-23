import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  CheckSquare,
  Users,
  Archive,
  RefreshCw,
  ArrowLeft,
  Edit,
  Trash2,
  X,
  UserCheck,
} from "lucide-react";

export default function ProjectLayout() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPmModalOpen, setIsPmModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [selectedPmId, setSelectedPmId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: projectRes, isLoading, error, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`),
  });

  // Query Project Managers for Admin quick assignment
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-lookup"],
    queryFn: () => api.get("/users?limit=100"),
    enabled: user?.role === "admin",
  });

  const projectManagers = (usersData?.data || []).filter(
    (u) => u.isActive && u.role === "project_manager"
  );

  const project = projectRes?.project || projectRes?.data;
  const myRole = projectRes?.myRole || project?.myRole || (user?.role === "admin" ? "admin" : "viewer");
  const canManage = myRole === "admin" || myRole === "project_manager";

  const archiveMutation = useMutation({
    mutationFn: () =>
      project?.status === "archived"
        ? api.patch(`/projects/${id}/restore`)
        : api.patch(`/projects/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
    onError: (err) => {
      alert(err.message || "Failed to delete project");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ name, description, managerId }) => {
      await api.patch(`/projects/${id}`, { name, description });
      const currentPmId = project?.manager?._id || project?.manager;
      if (managerId && managerId !== currentPmId) {
        await api.patch(`/projects/${id}/manager`, { managerId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditModalOpen(false);
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update project");
    },
  });

  const assignManagerMutation = useMutation({
    mutationFn: (managerId) => api.patch(`/projects/${id}/manager`, { managerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-members", id] });
      setIsPmModalOpen(false);
    },
    onError: (err) => {
      alert(err.message || "Failed to assign project manager");
    },
  });

  const openEditModal = () => {
    setEditName(project?.name || "");
    setEditDescription(project?.description || "");
    setEditManagerId(project?.manager?._id || project?.manager || "");
    setErrorMsg("");
    setIsEditModalOpen(true);
  };

  const openPmModal = () => {
    setSelectedPmId(project?.manager?._id || project?.manager || "");
    setIsPmModalOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
          // INITIALIZING_PROJECT_TELEMETRY...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="border border-[#EF4444] bg-[#FEF2F2] p-8 text-center">
          <p className="font-['Bebas_Neue','Oswald'] text-3xl text-[#EF4444] uppercase">
            // FAILED TO LOAD PROJECT
          </p>
          <p className="text-xs font-mono text-[#737373] mt-2">
            {error?.message || "PROJECT NODE DOES NOT EXIST OR PERMISSION WAS REVOKED."}
          </p>
          <Link
            to="/projects"
            className="mt-6 inline-flex items-center gap-2 border border-black bg-black text-white px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>RETURN TO PROJECTS</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* BREADCRUMB */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#737373] hover:text-[#0A0A0A] uppercase transition-colors"
        >
          <span>&larr; ALL PROJECTS</span>
        </Link>
        <span className="text-[10px] font-mono text-[#737373] uppercase">
          NODE ID // {project._id}
        </span>
      </div>

      {/* PROJECT HEADER CARD */}
      <div className="border border-[#0A0A0A] bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_#0A0A0A] mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#E5E5E0] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase border border-black ${
                  project.status === "archived"
                    ? "bg-[#EF4444] text-white"
                    : "bg-[#0A0A0A] text-[#C6FF3D]"
                }`}
              >
                {project.status}
              </span>
              <span className="text-xs font-mono text-[#737373] uppercase">
                YOUR ROLE: <strong className="text-black">[{myRole}]</strong>
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono bg-[#FAF9F5] px-2 py-0.5 border border-[#E5E5E0]">
                <span className="text-[#737373]">PM:</span>
                <strong className="text-black">
                  {project.manager?.name || "UNASSIGNED"}
                </strong>
                {user?.role === "admin" && (
                  <button
                    onClick={openPmModal}
                    className="ml-1 text-[10px] border border-black px-1.5 py-0 hover:bg-[#C6FF3D] text-black uppercase font-bold"
                  >
                    CHANGE
                  </button>
                )}
              </div>
            </div>

            <h1 className="font-['Bebas_Neue','Oswald'] text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#0A0A0A] uppercase leading-none">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-3 text-xs sm:text-sm font-sans text-[#525252] max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {user?.role === "admin" && (
              <button
                onClick={openEditModal}
                className="border border-[#0A0A0A] bg-white text-[#0A0A0A] px-3.5 py-2 text-xs font-mono font-bold uppercase hover:bg-[#FAF9F5] transition-all flex items-center gap-1.5"
                title="Edit Project Details"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>EDIT</span>
              </button>
            )}

            {canManage && (
              <button
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="border border-[#0A0A0A] px-3.5 py-2 text-xs font-mono font-bold uppercase hover:bg-[#0A0A0A] hover:text-white transition-all flex items-center gap-2"
              >
                {project.status === "archived" ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>RESTORE</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    <span>ARCHIVE</span>
                  </>
                )}
              </button>
            )}

            {user?.role === "admin" && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Permanently delete project "${project.name}" and all associated tasks?`
                    )
                  ) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="border border-[#EF4444] text-[#EF4444] px-3.5 py-2 text-xs font-mono font-bold uppercase hover:bg-[#EF4444] hover:text-white transition-all flex items-center gap-1.5"
                title="Delete Project"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>DELETE</span>
              </button>
            )}
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 pt-6">
          <NavLink
            to={`/projects/${id}`}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                isActive
                  ? "bg-[#0A0A0A] text-[#C6FF3D] border-[#0A0A0A]"
                  : "border-transparent text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F2]"
              }`
            }
          >
            <CheckSquare className="h-4 w-4" />
            <span>01 // TASKS</span>
          </NavLink>

          <NavLink
            to={`/projects/${id}/team`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                isActive
                  ? "bg-[#0A0A0A] text-[#C6FF3D] border-[#0A0A0A]"
                  : "border-transparent text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F2]"
              }`
            }
          >
            <Users className="h-4 w-4" />
            <span>02 // TEAM ROSTER</span>
          </NavLink>
        </div>
      </div>

      {/* OUTLET FOR PROJECT TASKS & TEAM */}
      <Outlet context={{ project, myRole, canManage, refetchProject: refetch }} />

      {/* ADMIN EDIT PROJECT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
              <h3 className="font-['Bebas_Neue','Oswald'] text-3xl uppercase text-[#0A0A0A]">
                EDIT PROJECT SCOPE
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-[#F5F5F2] border border-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 border border-[#EF4444] bg-[#FEF2F2] p-3 text-xs font-mono font-bold text-[#EF4444]">
                [!] {errorMsg}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editName.trim()) {
                  setErrorMsg("PROJECT NAME IS REQUIRED");
                  return;
                }
                updateProjectMutation.mutate({
                  name: editName.trim(),
                  description: editDescription,
                  managerId: editManagerId,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  PROJECT NAME *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  ASSIGNED PROJECT MANAGER
                </label>
                <select
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                >
                  <option value="">NO ASSIGNED MANAGER</option>
                  {projectManagers.map((pm) => (
                    <option key={pm._id} value={pm._id}>
                      {pm.name} ({pm.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E5E5E0] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border border-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="border border-black bg-[#0A0A0A] px-5 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors"
                >
                  {updateProjectMutation.isPending ? "SAVING..." : "UPDATE PROJECT ->"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CHANGE PM MODAL */}
      {isPmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-4">
              <h3 className="font-['Bebas_Neue','Oswald'] text-2xl uppercase text-[#0A0A0A]">
                ASSIGN PROJECT MANAGER
              </h3>
              <button
                onClick={() => setIsPmModalOpen(false)}
                className="p-1 hover:bg-[#F5F5F2] border border-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs font-mono text-[#737373] mb-4">
              SELECT NEW PROJECT MANAGER FOR <strong className="text-black">{project.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  PROJECT MANAGER
                </label>
                <select
                  value={selectedPmId}
                  onChange={(e) => setSelectedPmId(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                >
                  <option value="">SELECT A PROJECT MANAGER...</option>
                  {projectManagers.map((pm) => (
                    <option key={pm._id} value={pm._id}>
                      {pm.name} ({pm.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E5E5E0] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPmModalOpen(false)}
                  className="border border-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={!selectedPmId || assignManagerMutation.isPending}
                  onClick={() => assignManagerMutation.mutate(selectedPmId)}
                  className="border border-black bg-[#0A0A0A] px-5 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors disabled:opacity-50"
                >
                  {assignManagerMutation.isPending ? "UPDATING..." : "CONFIRM ASSIGNMENT ->"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
