import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { CheckSquare, Users, Archive, RefreshCw, ArrowLeft } from "lucide-react";

export default function ProjectLayout() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: projectRes, isLoading, error, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`),
  });

  const project = projectRes?.data;
  const myRole = project?.myRole || (user?.role === "admin" ? "admin" : "viewer");
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
      {/* BREADCRUMB & BACK */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#737373] hover:text-[#0A0A0A] uppercase transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
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
            <div className="flex items-center gap-3 mb-2">
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

          {canManage && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="border border-[#0A0A0A] px-3.5 py-2 text-xs font-mono font-bold uppercase hover:bg-[#0A0A0A] hover:text-white transition-all flex items-center gap-2"
              >
                {project.status === "archived" ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>RESTORE PROJECT</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    <span>ARCHIVE PROJECT</span>
                  </>
                )}
              </button>
            </div>
          )}
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
    </DashboardLayout>
  );
}
