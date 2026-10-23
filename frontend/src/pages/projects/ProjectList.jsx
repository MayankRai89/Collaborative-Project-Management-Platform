import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  Search,
  Plus,
  X,
  Archive,
  RefreshCw,
  Trash2,
  ExternalLink,
  Edit,
  UserCheck,
  Layers,
  LayoutGrid,
  Users,
  CheckSquare,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function ProjectList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.systemRole === "admin";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'hierarchy'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [changingPmProject, setChangingPmProject] = useState(null);

  // Create form state
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createManagerId, setCreateManagerId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editManagerId, setEditManagerId] = useState("");

  // Quick PM state
  const [quickPmId, setQuickPmId] = useState("");

  // Expanded project rows in hierarchy view
  const [expandedProjects, setExpandedProjects] = useState({});

  const toggleProjectExpand = (projId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projId]: !prev[projId],
    }));
  };

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects", search, statusFilter],
    queryFn: () => {
      let query = `/projects?limit=50&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      return api.get(query);
    },
  });

  // Query all active users for PM selection (accessible by Admins)
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-lookup"],
    queryFn: () => api.get("/users?limit=100"),
    enabled: isAdmin,
  });

  const allActiveUsers = usersData?.data || [];
  const projectManagers = allActiveUsers.filter(
    (u) => u.isActive && u.role === "project_manager"
  );

  const createProjectMutation = useMutation({
    mutationFn: (newProj) => api.post("/projects", newProj),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateModalOpen(false);
      setCreateName("");
      setCreateDescription("");
      setCreateManagerId("");
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to create project");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, name, description, managerId, currentManagerId }) => {
      await api.patch(`/projects/${id}`, { name, description });
      if (managerId && managerId !== currentManagerId) {
        await api.patch(`/projects/${id}/manager`, { managerId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update project");
    },
  });

  const assignManagerMutation = useMutation({
    mutationFn: ({ projectId, managerId }) =>
      api.patch(`/projects/${projectId}/manager`, { managerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setChangingPmProject(null);
      setQuickPmId("");
    },
    onError: (err) => {
      alert(err.message || "Failed to assign project manager");
    },
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: ({ id, isArchived }) =>
      isArchived
        ? api.patch(`/projects/${id}/restore`)
        : api.patch(`/projects/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!createName.trim()) {
      setErrorMsg("PROJECT NAME IS REQUIRED");
      return;
    }
    const payload = { name: createName.trim(), description: createDescription };
    if (createManagerId) payload.managerId = createManagerId;
    createProjectMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMsg("PROJECT NAME IS REQUIRED");
      return;
    }
    updateProjectMutation.mutate({
      id: editingProject._id,
      name: editName.trim(),
      description: editDescription,
      managerId: editManagerId,
      currentManagerId: editingProject.manager?._id || editingProject.manager,
    });
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setEditName(proj.name || "");
    setEditDescription(proj.description || "");
    setEditManagerId(proj.manager?._id || proj.manager || "");
    setErrorMsg("");
  };

  const projects = projectsData?.data || [];

  return (
    <DashboardLayout
      title="PROJECTS // INDEX"
      subtitle="CENTRALIZED ASSET PIPELINE & RESOURCE ALLOCATION"
    >
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
            <input
              type="text"
              placeholder="SEARCH PROJECTS BY TITLE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#0A0A0A] bg-white pl-9 pr-4 py-2.5 text-xs font-mono placeholder-[#A3A3A3] outline-none focus:bg-[#FAF9F5] focus:ring-2 focus:ring-[#C6FF3D]"
            />
          </div>

          <div className="flex border border-[#0A0A0A] bg-white divide-x divide-[#0A0A0A]">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-2 text-xs font-mono font-bold uppercase transition-colors ${
                statusFilter === "active" ? "bg-[#0A0A0A] text-white" : "text-[#737373] hover:text-[#0A0A0A]"
              }`}
            >
              ACTIVE
            </button>
            <button
              onClick={() => setStatusFilter("archived")}
              className={`px-3 py-2 text-xs font-mono font-bold uppercase transition-colors ${
                statusFilter === "archived" ? "bg-[#0A0A0A] text-white" : "text-[#737373] hover:text-[#0A0A0A]"
              }`}
            >
              ARCHIVED
            </button>
          </div>

          {/* ADMIN VIEW MODE SWITCH */}
          {isAdmin && (
            <div className="flex border border-[#0A0A0A] bg-white divide-x divide-[#0A0A0A]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid" ? "bg-[#0A0A0A] text-[#C6FF3D]" : "text-[#737373] hover:text-[#0A0A0A]"
                }`}
                title="Grid Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("hierarchy")}
                className={`p-2 transition-colors ${
                  viewMode === "hierarchy" ? "bg-[#0A0A0A] text-[#C6FF3D]" : "text-[#737373] hover:text-[#0A0A0A]"
                }`}
                title="Global Hierarchy Oversight"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 border border-[#0A0A0A] bg-[#0A0A0A] px-4 py-2.5 text-xs font-mono font-bold text-white uppercase tracking-wider hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>NEW PROJECT</span>
          </button>
        )}
      </div>

      {/* PROJECTS DISPLAY */}
      {isLoading ? (
        <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
          // QUERYING_PROJECT_NODES...
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-[#0A0A0A] bg-white p-16 text-center">
          <p className="font-['Bebas_Neue','Oswald'] text-3xl text-[#0A0A0A] tracking-wider uppercase">
            // ZERO ACTIVE PROJECTS IN PIPELINE
          </p>
          <p className="text-xs font-mono text-[#737373] mt-2">
            NO PROJECTS REGISTERED MATCHING YOUR ACCESS PRIVILEGES.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* STANDARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const isArchived = proj.status === "archived";
            const isManagerOfThis =
              proj.manager?._id === user?._id || proj.manager === user?._id;
            const canManage =
              isAdmin ||
              user?.role === "project_manager" ||
              proj.myRole === "project_manager" ||
              isManagerOfThis;
            return (
              <div
                key={proj._id}
                className="border border-[#0A0A0A] bg-white p-6 shadow-[3px_3px_0px_0px_#0A0A0A] hover:shadow-[5px_5px_0px_0px_#C6FF3D] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3 mb-4">
                    <span className="text-[10px] font-mono text-[#737373] uppercase tracking-widest">
                      NODE // #{proj._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase ${
                        isArchived
                          ? "bg-[#EF4444] text-white"
                          : "bg-[#0A0A0A] text-[#C6FF3D]"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <Link to={`/projects/${proj._id}`} className="group block">
                    <h3 className="font-['Bebas_Neue','Oswald'] text-3xl tracking-tight text-[#0A0A0A] group-hover:text-[#0A0A0A] group-hover:underline leading-tight mb-2">
                      {proj.name}
                    </h3>
                  </Link>
                  <p className="text-xs font-sans text-[#737373] line-clamp-3 mb-6">
                    {proj.description || "NO_DESCRIPTION_REGISTERED"}
                  </p>
                </div>

                <div>
                  <div className="border-t border-[#E5E5E0] pt-4 mb-3 flex items-center justify-between text-[11px] font-mono text-[#737373]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">PM:</span>
                      <span className="text-[#0A0A0A] font-medium">
                        {proj.manager?.name || "UNASSIGNED"}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setChangingPmProject(proj);
                            setQuickPmId(proj.manager?._id || proj.manager || "");
                          }}
                          className="ml-1 text-[10px] border border-black px-1.5 py-0.2 hover:bg-[#C6FF3D] text-black font-mono uppercase font-bold"
                          title="Quick Change PM"
                        >
                          CHANGE
                        </button>
                      )}
                    </div>
                    <span className="font-bold text-[#0A0A0A] bg-[#F5F5F2] px-1.5 py-0.5 border border-[#E5E5E0]">
                      {proj.myRole}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[#E5E5E0] pt-3">
                    <Link
                      to={`/projects/${proj._id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#0A0A0A] hover:underline"
                    >
                      <span>OPEN PROJECT</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <button
                          onClick={() => openEditModal(proj)}
                          className="border border-[#0A0A0A] px-2 py-1 text-[10px] font-mono font-bold uppercase hover:bg-[#0A0A0A] hover:text-white transition-colors"
                          title="Edit Project Scope"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      )}

                      {canManage && (
                        <button
                          onClick={() =>
                            toggleArchiveMutation.mutate({
                              id: proj._id,
                              isArchived,
                            })
                          }
                          disabled={toggleArchiveMutation.isPending}
                          className="border border-[#0A0A0A] px-2 py-1 text-[10px] font-mono font-bold uppercase hover:bg-[#0A0A0A] hover:text-white transition-colors"
                          title={isArchived ? "Restore Project" : "Archive Project"}
                        >
                          {isArchived ? (
                            <RefreshCw className="h-3 w-3" />
                          ) : (
                            <Archive className="h-3 w-3" />
                          )}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Permanently delete project "${proj.name}" and all tasks?`
                              )
                            ) {
                              deleteProjectMutation.mutate(proj._id);
                            }
                          }}
                          disabled={deleteProjectMutation.isPending}
                          className="border border-[#EF4444] text-[#EF4444] px-2 py-1 text-[10px] font-mono font-bold uppercase hover:bg-[#EF4444] hover:text-white transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* HIERARCHY OVERSIGHT VIEW FOR ADMINS */
        <div className="space-y-6">
          {projects.map((proj) => {
            const isExpanded = expandedProjects[proj._id] ?? true;
            const members = proj.members || [];
            const tasks = proj.tasks || [];
            const isArchived = proj.status === "archived";
            return (
              <div
                key={proj._id}
                className="border-2 border-[#0A0A0A] bg-white shadow-[4px_4px_0px_0px_#0A0A0A]"
              >
                {/* PROJECT HEADER CARD */}
                <div className="p-4 sm:p-5 border-b border-[#0A0A0A] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleProjectExpand(proj._id)}
                      className="p-1 border border-black hover:bg-[#0A0A0A] hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 uppercase border border-black ${
                            isArchived ? "bg-[#EF4444] text-white" : "bg-[#0A0A0A] text-[#C6FF3D]"
                          }`}
                        >
                          {proj.status}
                        </span>
                        <Link
                          to={`/projects/${proj._id}`}
                          className="font-['Bebas_Neue','Oswald'] text-2xl text-[#0A0A0A] hover:underline uppercase tracking-wide flex items-center gap-1.5"
                        >
                          <span>{proj.name}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-[#737373]" />
                        </Link>
                      </div>
                      {proj.description && (
                        <p className="text-xs font-sans text-[#737373] line-clamp-1 mt-0.5">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* ASSIGNED PM */}
                    <div className="flex items-center gap-2 border border-black bg-white px-3 py-1.5 text-xs font-mono">
                      <Shield className="h-3.5 w-3.5 text-[#0A0A0A]" />
                      <span className="text-[#737373]">PM:</span>
                      <strong className="text-black">
                        {proj.manager?.name || "UNASSIGNED"}
                      </strong>
                      <button
                        onClick={() => {
                          setChangingPmProject(proj);
                          setQuickPmId(proj.manager?._id || proj.manager || "");
                        }}
                        className="ml-1 border border-black px-1.5 py-0.2 text-[10px] uppercase font-bold hover:bg-[#C6FF3D]"
                      >
                        CHANGE
                      </button>
                    </div>

                    <button
                      onClick={() => openEditModal(proj)}
                      className="border border-[#0A0A0A] px-2.5 py-1.5 text-xs font-mono font-bold uppercase hover:bg-black hover:text-white transition-colors"
                      title="Edit Project"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        toggleArchiveMutation.mutate({
                          id: proj._id,
                          isArchived,
                        })
                      }
                      className="border border-[#0A0A0A] px-2.5 py-1.5 text-xs font-mono font-bold uppercase hover:bg-black hover:text-white transition-colors"
                      title={isArchived ? "Restore Project" : "Archive Project"}
                    >
                      {isArchived ? (
                        <RefreshCw className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Permanently delete project "${proj.name}" and all tasks?`
                          )
                        ) {
                          deleteProjectMutation.mutate(proj._id);
                        }
                      }}
                      className="border border-[#EF4444] text-[#EF4444] px-2.5 py-1.5 text-xs font-mono font-bold uppercase hover:bg-[#EF4444] hover:text-white transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE BODY: SQUAD & ALL TASKS */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SQUAD MEMBERS */}
                    <div className="border border-[#0A0A0A] bg-[#FFFFFF] p-4 shadow-[2px_2px_0px_0px_#0A0A0A]">
                      <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-2 mb-3">
                        <span className="font-['Bebas_Neue','Oswald'] text-lg uppercase tracking-wider text-[#0A0A0A]">
                          PROJECT SQUAD [{members.length}]
                        </span>
                        <Link
                          to={`/projects/${proj._id}/team`}
                          className="text-[10px] font-mono font-bold uppercase text-[#737373] hover:text-black hover:underline"
                        >
                          ROSTER &rarr;
                        </Link>
                      </div>

                      {members.length === 0 ? (
                        <div className="text-xs font-mono text-[#A3A3A3] italic p-3 text-center">
                          NO OPERATIVES ATTACHED
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {members.map((m) => (
                            <div
                              key={m._id}
                              className="border border-[#E5E5E0] p-2 text-xs font-mono flex items-center justify-between bg-[#FAF9F5]"
                            >
                              <div>
                                <div className="font-bold text-[#0A0A0A]">
                                  {m.user?.name || "Operative"}
                                </div>
                                <div className="text-[10px] text-[#737373]">
                                  {m.user?.email || ""}
                                </div>
                              </div>
                              <span className="text-[9px] border border-black px-1.5 py-0.2 uppercase font-bold bg-[#F5F5F2]">
                                {m.role.replace("_", " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SPRINT TASKS & ASSIGNED TEAMMATES */}
                    <div className="lg:col-span-2 border border-[#0A0A0A] bg-[#FFFFFF] p-4 shadow-[2px_2px_0px_0px_#0A0A0A]">
                      <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-2 mb-3">
                        <span className="font-['Bebas_Neue','Oswald'] text-lg uppercase tracking-wider text-[#0A0A0A]">
                          ALL SPRINT TASKS [{tasks.length}]
                        </span>
                        <Link
                          to={`/projects/${proj._id}`}
                          className="text-[10px] font-mono font-bold uppercase text-[#737373] hover:text-black hover:underline"
                        >
                          TASK BOARD &rarr;
                        </Link>
                      </div>

                      {tasks.length === 0 ? (
                        <div className="text-xs font-mono text-[#A3A3A3] italic p-6 text-center">
                          NO TASKS LOGGED IN THIS PROJECT.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead>
                              <tr className="border-b border-[#E5E5E0] bg-[#FAF9F5] text-[#737373]">
                                <th className="p-2">TASK TITLE</th>
                                <th className="p-2">STATUS</th>
                                <th className="p-2">ASSIGNED TEAM MEMBER</th>
                                <th className="p-2 text-right">VERSION</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5E0]">
                              {tasks.map((t) => (
                                <tr key={t._id} className="hover:bg-[#FAF9F5]">
                                  <td className="p-2">
                                    <Link
                                      to={`/tasks/${t._id}`}
                                      className="font-bold text-[#0A0A0A] hover:underline"
                                    >
                                      {t.title}
                                    </Link>
                                  </td>
                                  <td className="p-2">
                                    <span className="border border-black px-1.5 py-0.2 text-[9px] uppercase font-bold bg-[#F5F5F2]">
                                      {t.status.replace("_", " ")}
                                    </span>
                                  </td>
                                  <td className="p-2">
                                    {t.assignee?.name ? (
                                      <span className="font-bold text-[#0A0A0A] bg-[#C6FF3D] px-1.5 py-0.5 border border-black text-[10px]">
                                        {t.assignee.name}
                                      </span>
                                    ) : (
                                      <span className="text-[#A3A3A3] italic text-[11px]">
                                        UNASSIGNED
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2 text-right text-[10px] text-[#737373]">
                                    v{t.version ?? 1}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
              <h3 className="font-['Bebas_Neue','Oswald'] text-3xl uppercase text-[#0A0A0A]">
                INITIALIZE NEW PROJECT NODE
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  PROJECT NAME *
                </label>
                <input
                  type="text"
                  placeholder="E.G., MOBILE APP MVP"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
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
                  placeholder="MISSION BRIEFING & SCOPE..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  ASSIGN PROJECT MANAGER
                </label>
                <select
                  value={createManagerId}
                  onChange={(e) => setCreateManagerId(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                >
                  <option value="">SELECT A PROJECT MANAGER (OPTIONAL)</option>
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
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border border-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="border border-black bg-[#0A0A0A] px-5 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors"
                >
                  {createProjectMutation.isPending ? "INITIALIZING..." : "CONFIRM CREATION ->"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
              <h3 className="font-['Bebas_Neue','Oswald'] text-3xl uppercase text-[#0A0A0A]">
                EDIT PROJECT // #{editingProject._id.slice(-6).toUpperCase()}
              </h3>
              <button
                onClick={() => setEditingProject(null)}
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

            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  onClick={() => setEditingProject(null)}
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
      {changingPmProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-4">
              <h3 className="font-['Bebas_Neue','Oswald'] text-2xl uppercase text-[#0A0A0A]">
                REASSIGN PROJECT MANAGER
              </h3>
              <button
                onClick={() => setChangingPmProject(null)}
                className="p-1 hover:bg-[#F5F5F2] border border-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs font-mono text-[#737373] mb-4">
              ASSIGN PM FOR PROJECT: <strong className="text-black">{changingPmProject.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  SELECT PROJECT MANAGER
                </label>
                <select
                  value={quickPmId}
                  onChange={(e) => setQuickPmId(e.target.value)}
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
                  onClick={() => setChangingPmProject(null)}
                  className="border border-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={!quickPmId || assignManagerMutation.isPending}
                  onClick={() =>
                    assignManagerMutation.mutate({
                      projectId: changingPmProject._id,
                      managerId: quickPmId,
                    })
                  }
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
