import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  Search,
  UserPlus,
  X,
  Check,
  AlertCircle,
  FolderGit2,
  CheckSquare,
  Shield,
  Layers,
  Users as UsersIcon,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("directory"); // 'directory' | 'hierarchy'
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Create User modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("team_member");
  const [errorMsg, setErrorMsg] = useState("");

  // Quick PM change modal state for hierarchy view
  const [changingPmProject, setChangingPmProject] = useState(null);
  const [selectedPmId, setSelectedPmId] = useState("");

  // Expanded projects in hierarchy view
  const [expandedProjects, setExpandedProjects] = useState({});

  const toggleProjectExpand = (projId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projId]: !prev[projId],
    }));
  };

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => {
      let query = "/users?limit=100";
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (roleFilter) query += `&role=${roleFilter}`;
      return api.get(query);
    },
  });

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["admin-projects-oversight"],
    queryFn: () => api.get("/projects?limit=50"),
  });

  const createUserMutation = useMutation({
    mutationFn: (newUser) => api.post("/users", newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("team_member");
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to create user");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }) =>
      api.patch(`/users/${userId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => {
      alert(err.message || "Failed to update user status");
    },
  });

  const assignManagerMutation = useMutation({
    mutationFn: ({ projectId, managerId }) =>
      api.patch(`/projects/${projectId}/manager`, { managerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects-oversight"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setChangingPmProject(null);
      setSelectedPmId("");
    },
    onError: (err) => {
      alert(err.message || "Failed to assign project manager");
    },
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg("ALL FIELDS ARE MANDATORY");
      return;
    }
    createUserMutation.mutate({ name, email, password, role });
  };

  const users = usersData?.data || [];
  const projects = projectsData?.data || [];
  const projectManagers = users.filter((u) => u.isActive);

  return (
    <DashboardLayout
      title="ADMIN CONSOLE // 360° OVERSIGHT"
      subtitle="SYSTEM PRIVILEGES, PROJECT HIERARCHIES & TASK ALLOCATIONS"
    >
      {/* TABS HEADER */}
      <div className="flex border-b border-[#0A0A0A] mb-8 gap-2">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-t-2 border-x transition-all ${
            activeTab === "directory"
              ? "bg-[#0A0A0A] text-[#C6FF3D] border-[#0A0A0A]"
              : "border-transparent text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F2]"
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          <span>01 // USER DIRECTORY & WORKLOAD</span>
        </button>
        <button
          onClick={() => setActiveTab("hierarchy")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-t-2 border-x transition-all ${
            activeTab === "hierarchy"
              ? "bg-[#0A0A0A] text-[#C6FF3D] border-[#0A0A0A]"
              : "border-transparent text-[#737373] hover:text-[#0A0A0A] hover:bg-[#F5F5F2]"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>02 // PROJECT & TASK ASSIGNMENT HIERARCHY</span>
        </button>
      </div>

      {activeTab === "directory" ? (
        /* TAB 1: 360 USER DIRECTORY & ASSIGNMENTS */
        <div>
          {/* TOOLBAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
                <input
                  type="text"
                  placeholder="SEARCH BY NAME OR EMAIL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-[#0A0A0A] bg-white pl-9 pr-4 py-2 text-xs font-mono placeholder-[#A3A3A3] outline-none focus:bg-[#FAF9F5] focus:ring-2 focus:ring-[#C6FF3D]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-[#0A0A0A] bg-white px-3 py-2 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D]"
              >
                <option value="">ALL ROLES</option>
                <option value="admin">ADMIN</option>
                <option value="project_manager">PROJECT MANAGER</option>
                <option value="team_member">TEAM MEMBER</option>
                <option value="viewer">VIEWER</option>
              </select>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 border border-[#0A0A0A] bg-[#0A0A0A] px-4 py-2 text-xs font-mono font-bold text-white uppercase tracking-wider hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>PROVISION USER</span>
            </button>
          </div>

          {/* USERS TABLE WITH 360° ASSIGNMENT COLUMNS */}
          {loadingUsers ? (
            <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
              // LOADING_USER_ROSTER...
            </div>
          ) : users.length === 0 ? (
            <div className="border border-dashed border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
              NO OPERATIVES FOUND MATCHING CRITERIA.
            </div>
          ) : (
            <div className="border border-[#0A0A0A] bg-white overflow-x-auto shadow-[3px_3px_0px_0px_#0A0A0A]">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F5F2]">
                    <th className="p-3.5 tracking-wider uppercase font-bold">OPERATIVE</th>
                    <th className="p-3.5 tracking-wider uppercase font-bold">SYSTEM ROLE & STATUS</th>
                    <th className="p-3.5 tracking-wider uppercase font-bold min-w-[200px]">
                      ASSIGNED PROJECTS & ROLES
                    </th>
                    <th className="p-3.5 tracking-wider uppercase font-bold min-w-[220px]">
                      ASSIGNED SPRINT TASKS
                    </th>
                    <th className="p-3.5 tracking-wider uppercase font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E0]">
                  {users.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    const userProjects = u.projects || [];
                    const userTasks = u.tasks || [];
                    return (
                      <tr key={u._id} className="hover:bg-[#FAF9F5] transition-colors align-top">
                        <td className="p-3.5 font-bold text-[#0A0A0A]">
                          <div>{u.name}</div>
                          <div className="text-[10px] text-[#737373] font-normal">{u.email}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="border border-[#0A0A0A] px-2 py-0.5 text-[10px] uppercase font-bold bg-[#F5F5F2]">
                              {u.role.replace("_", " ")}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                u.isActive
                                  ? "bg-[#C6FF3D] text-[#0A0A0A]"
                                  : "bg-[#EF4444] text-white"
                              }`}
                            >
                              {u.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                        </td>

                        {/* ASSIGNED PROJECTS */}
                        <td className="p-3.5">
                          {userProjects.length === 0 ? (
                            <span className="text-[#A3A3A3] text-[11px] italic">NONE</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {userProjects.map((p, idx) => (
                                <Link
                                  key={idx}
                                  to={`/projects/${p._id}`}
                                  className="inline-flex items-center gap-1.5 text-[11px] text-[#0A0A0A] hover:underline"
                                >
                                  <FolderGit2 className="h-3 w-3 text-[#737373] shrink-0" />
                                  <span className="font-bold">{p.name}</span>
                                  <span className="text-[9px] bg-[#E5E5E0] px-1 py-0.2 uppercase font-mono">
                                    [{p.role.replace("_", " ")}]
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* ASSIGNED TASKS */}
                        <td className="p-3.5">
                          {userTasks.length === 0 ? (
                            <span className="text-[#A3A3A3] text-[11px] italic">NO TASKS ASSIGNED</span>
                          ) : (
                            <div className="space-y-1">
                              {userTasks.map((t) => (
                                <Link
                                  key={t._id}
                                  to={`/tasks/${t._id}`}
                                  className="block border border-[#E5E5E0] bg-[#FAF9F5] p-1.5 hover:border-black transition-colors"
                                >
                                  <div className="font-bold text-[#0A0A0A] hover:underline truncate max-w-[240px]">
                                    {t.title}
                                  </div>
                                  <div className="flex items-center justify-between text-[9px] text-[#737373] mt-0.5">
                                    <span>{t.projectName}</span>
                                    <span className="uppercase font-bold text-black">[{t.status}]</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-[#737373] italic">CURRENT_USER</span>
                          ) : u.isActive ? (
                            <button
                              onClick={() => toggleActiveMutation.mutate({ userId: u._id, isActive: false })}
                              disabled={toggleActiveMutation.isPending}
                              className="border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white px-2.5 py-1 text-[10px] font-bold transition-all uppercase"
                            >
                              DEACTIVATE
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleActiveMutation.mutate({ userId: u._id, isActive: true })}
                              disabled={toggleActiveMutation.isPending}
                              className="border border-[#0A0A0A] bg-[#C6FF3D] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#C6FF3D] px-2.5 py-1 text-[10px] font-bold transition-all uppercase"
                            >
                              ACTIVATE
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: HIERARCHY OVERSIGHT VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-3">
            <div>
              <h3 className="font-['Bebas_Neue','Oswald'] text-2xl uppercase tracking-wider text-[#0A0A0A]">
                ALL PROJECTS // SQUAD & TASK BREAKDOWN
              </h3>
              <p className="text-xs font-mono text-[#737373] uppercase">
                COMPLETE DRILL-DOWN OF MANAGERS, OPERATIVES & CURRENT TASK DISTRIBUTION
              </p>
            </div>
          </div>

          {loadingProjects ? (
            <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
              // LOADING_PROJECT_HIERARCHIES...
            </div>
          ) : projects.length === 0 ? (
            <div className="border border-dashed border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
              NO PROJECTS RECORDED IN SYSTEM.
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((proj) => {
                const isExpanded = expandedProjects[proj._id] ?? true;
                const members = proj.members || [];
                const tasks = proj.tasks || [];
                return (
                  <div
                    key={proj._id}
                    className="border-2 border-[#0A0A0A] bg-white shadow-[4px_4px_0px_0px_#0A0A0A]"
                  >
                    {/* PROJECT HEADER BANNER */}
                    <div className="p-4 sm:p-5 border-b border-[#0A0A0A] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                                proj.status === "archived"
                                  ? "bg-[#EF4444] text-white"
                                  : "bg-[#0A0A0A] text-[#C6FF3D]"
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

                      {/* ASSIGNED PM */}
                      <div className="flex items-center gap-3 border border-black bg-white px-3 py-2 text-xs font-mono">
                        <Shield className="h-4 w-4 text-[#0A0A0A]" />
                        <div>
                          <span className="text-[10px] text-[#737373] uppercase block font-bold">
                            PROJECT MANAGER:
                          </span>
                          <span className="font-bold text-[#0A0A0A]">
                            {proj.manager?.name || "UNASSIGNED"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setChangingPmProject(proj);
                            setSelectedPmId(proj.manager?._id || proj.manager || "");
                          }}
                          className="ml-2 border border-black px-2 py-1 text-[10px] font-mono font-bold uppercase hover:bg-[#C6FF3D] transition-colors"
                        >
                          CHANGE PM
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE BODY: TEAM MEMBERS & TASKS */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1/3: SQUAD ROSTER */}
                        <div className="border border-[#0A0A0A] bg-[#FFFFFF] p-4 shadow-[2px_2px_0px_0px_#0A0A0A]">
                          <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-2 mb-3">
                            <span className="font-['Bebas_Neue','Oswald'] text-lg uppercase tracking-wider text-[#0A0A0A]">
                              SQUAD MEMBERS [{members.length}]
                            </span>
                            <Link
                              to={`/projects/${proj._id}/team`}
                              className="text-[10px] font-mono font-bold uppercase text-[#737373] hover:text-black hover:underline"
                            >
                              MANAGE
                            </Link>
                          </div>

                          {members.length === 0 ? (
                            <div className="text-xs font-mono text-[#A3A3A3] italic p-3 text-center">
                              NO OPERATIVES ASSIGNED
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

                        {/* 2/3: TASKS & ASSIGNED TEAMMATES */}
                        <div className="lg:col-span-2 border border-[#0A0A0A] bg-[#FFFFFF] p-4 shadow-[2px_2px_0px_0px_#0A0A0A]">
                          <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-2 mb-3">
                            <span className="font-['Bebas_Neue','Oswald'] text-lg uppercase tracking-wider text-[#0A0A0A]">
                              PROJECT SPRINT TASKS [{tasks.length}]
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
                              NO TASKS SCHEDULED IN THIS PROJECT.
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
        </div>
      )}

      {/* QUICK PM CHANGE MODAL */}
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
                  onClick={() => setChangingPmProject(null)}
                  className="border border-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={!selectedPmId || assignManagerMutation.isPending}
                  onClick={() =>
                    assignManagerMutation.mutate({
                      projectId: changingPmProject._id,
                      managerId: selectedPmId,
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

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
              <h3 className="font-['Bebas_Neue','Oswald'] text-3xl uppercase text-[#0A0A0A]">
                PROVISION NEW USER
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  placeholder="E.G., ALEX CHEN"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  placeholder="E.G., ALEX@COMPANY.COM"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  PASSWORD *
                </label>
                <input
                  type="password"
                  placeholder="MINIMUM 8 CHARACTERS"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  GLOBAL SYSTEM ROLE
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                >
                  <option value="team_member">TEAM MEMBER</option>
                  <option value="project_manager">PROJECT MANAGER</option>
                  <option value="viewer">VIEWER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E5E5E0] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="border border-black bg-[#0A0A0A] px-5 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors"
                >
                  {createUserMutation.isPending ? "PROVISIONING..." : "SAVE USER ->"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
