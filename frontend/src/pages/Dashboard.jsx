import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/auth";
import { api } from "../utils/api";
import DashboardLayout from "../components/layouts/DashboardLayout";
import {
  ArrowRight,
  FolderGit2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Shield,
  Layers,
  ExternalLink,
  Users,
  CheckSquare,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.systemRole === "admin";

  // Load My Tasks
  const { data: myTasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: () => api.get("/tasks/mine?limit=5"),
  });

  // Load Projects
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects?limit=10"),
  });

  const tasks = myTasksData?.data || [];
  const projects = projectsData?.data || [];

  const statActiveProjects = projects.filter((p) => p.status === "active").length || 0;
  const statMyTasks = myTasksData?.total || 0;
  const statOverdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length || 0;
  const statCompleted = tasks.filter((t) => t.status === "done").length || 0;

  return (
    <DashboardLayout
      title={`WELCOME BACK, ${user?.name || "OPERATOR"}`}
      subtitle="SYSTEM TELEMETRY // REAL-TIME PROJECT VELOCITY"
    >
      {/* 4 STAT BLOCKS (STREETWEAR LOOKBOOK GRID) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {/* Stat 01 */}
        <div className="border border-[#0A0A0A] bg-white p-5 shadow-[3px_3px_0px_0px_#0A0A0A]">
          <div className="flex items-center justify-between text-xs font-mono text-[#737373] uppercase tracking-wider mb-2">
            <span>01 // ACTIVE PROJECTS</span>
            <FolderGit2 className="h-4 w-4 text-[#0A0A0A]" />
          </div>
          <div className="font-['Bebas_Neue','Oswald'] text-5xl font-black text-[#0A0A0A]">
            {statActiveProjects < 10 ? `0${statActiveProjects}` : statActiveProjects}
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#737373]">IN PIPELINE</div>
        </div>

        {/* Stat 02 */}
        <div className="border border-[#0A0A0A] bg-white p-5 shadow-[3px_3px_0px_0px_#0A0A0A]">
          <div className="flex items-center justify-between text-xs font-mono text-[#737373] uppercase tracking-wider mb-2">
            <span>02 // ASSIGNED TO ME</span>
            <Clock className="h-4 w-4 text-[#0A0A0A]" />
          </div>
          <div className="font-['Bebas_Neue','Oswald'] text-5xl font-black text-[#0A0A0A]">
            {statMyTasks < 10 ? `0${statMyTasks}` : statMyTasks}
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#737373]">OPEN SPRINT TASKS</div>
        </div>

        {/* Stat 03 */}
        <div className="border border-[#0A0A0A] bg-white p-5 shadow-[3px_3px_0px_0px_#0A0A0A]">
          <div className="flex items-center justify-between text-xs font-mono text-[#737373] uppercase tracking-wider mb-2">
            <span>03 // OVERDUE</span>
            <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
          </div>
          <div className="font-['Bebas_Neue','Oswald'] text-5xl font-black text-[#EF4444]">
            {statOverdue < 10 ? `0${statOverdue}` : statOverdue}
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#EF4444] font-bold">NEEDS ATTENTION</div>
        </div>

        {/* Stat 04 */}
        <div className="border border-[#0A0A0A] bg-[#0A0A0A] text-white p-5 shadow-[3px_3px_0px_0px_#C6FF3D]">
          <div className="flex items-center justify-between text-xs font-mono text-[#A3A3A3] uppercase tracking-wider mb-2">
            <span>04 // COMPLETED</span>
            <CheckCircle2 className="h-4 w-4 text-[#C6FF3D]" />
          </div>
          <div className="font-['Bebas_Neue','Oswald'] text-5xl font-black text-[#C6FF3D]">
            {statCompleted < 10 ? `0${statCompleted}` : statCompleted}
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#C6FF3D]">STATUS: SHIPPED</div>
        </div>
      </div>

      {/* TWO SECTIONS: MY TASKS (60%) & RECENT PROJECTS (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left: My Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-3">
            <h2 className="font-['Bebas_Neue','Oswald'] text-2xl tracking-wider uppercase text-[#0A0A0A]">
              MY TASKS // ACTION REQUIRED
            </h2>
            <span className="text-xs font-mono font-bold text-[#737373]">
              [{tasks.length} VISIBLE]
            </span>
          </div>

          {loadingTasks ? (
            <div className="border border-[#E5E5E0] bg-white p-8 text-center font-mono text-xs text-[#737373]">
              // QUERYING_ASSIGNED_TASKS...
            </div>
          ) : tasks.length === 0 ? (
            <div className="border border-dashed border-[#0A0A0A] bg-white p-8 text-center">
              <p className="font-['Bebas_Neue','Oswald'] text-2xl text-[#0A0A0A] uppercase tracking-wider">
                // ZERO PENDING ACTIONS
              </p>
              <p className="text-xs font-mono text-[#737373] mt-1">
                YOU HAVE NO UNRESOLVED TASKS ASSIGNED TO YOUR OPERATIVE HANDLE.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="border border-[#0A0A0A] bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#C6FF3D] hover:shadow-[3px_3px_0px_0px_#0A0A0A] transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#737373] uppercase">
                        NODE #{task._id.slice(-5).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 uppercase border border-black bg-[#F5F5F2]">
                        {task.status.replace("_", " ")}
                      </span>
                    </div>

                    <Link
                      to={`/tasks/${task._id}`}
                      className="font-bold text-sm text-[#0A0A0A] group-hover:underline block"
                    >
                      {task.title}
                    </Link>

                    {task.project && (
                      <div className="text-xs font-mono text-[#737373]">
                        PROJECT: {task.project.name || "ACTIVE_PROJECT"}
                      </div>
                    )}
                  </div>

                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#737373]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-3">
            <h2 className="font-['Bebas_Neue','Oswald'] text-2xl tracking-wider uppercase text-[#0A0A0A]">
              PROJECTS // PIPELINE
            </h2>
            <Link
              to="/projects"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#0A0A0A] hover:text-[#C6FF3D] flex items-center gap-1"
            >
              <span>EXPLORE</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loadingProjects ? (
            <div className="border border-[#E5E5E0] bg-white p-8 text-center font-mono text-xs text-[#737373]">
              // LOADING_PROJECTS...
            </div>
          ) : projects.length === 0 ? (
            <div className="border border-dashed border-[#0A0A0A] bg-white p-6 text-center">
              <p className="font-['Bebas_Neue','Oswald'] text-xl text-[#0A0A0A] tracking-wider uppercase">
                // NO PROJECTS DETECTED.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((proj) => (
                <Link
                  key={proj._id}
                  to={`/projects/${proj._id}`}
                  className="block border border-[#0A0A0A] bg-white p-4 hover:border-[#C6FF3D] hover:shadow-[3px_3px_0px_0px_#0A0A0A] transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Bebas_Neue','Oswald'] text-lg uppercase text-[#0A0A0A] group-hover:text-[#0A0A0A]">
                      {proj.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 uppercase ${
                        proj.status === "archived"
                          ? "bg-[#EF4444] text-white"
                          : "bg-[#0A0A0A] text-[#C6FF3D]"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#737373] line-clamp-2 font-sans mb-3">
                    {proj.description || "NO_DESCRIPTION_PROVIDED"}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] border-t border-[#E5E5E0] pt-2">
                    <span>PM: {proj.manager?.name || "UNASSIGNED"}</span>
                    <span className="text-[#0A0A0A] font-bold">MY_ROLE: {proj.myRole}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADMIN GLOBAL OVERSIGHT SECTION (Visible when Admin) */}
      {isAdmin && (
        <div className="border-2 border-[#0A0A0A] bg-white p-6 shadow-[5px_5px_0px_0px_#0A0A0A]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-[#0A0A0A] text-[#C6FF3D] p-2">
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-['Bebas_Neue','Oswald'] text-3xl uppercase tracking-wide leading-none text-[#0A0A0A]">
                  ADMIN GLOBAL OVERSIGHT // SQUADS & TASK ASSIGNMENTS
                </h3>
                <p className="text-xs font-mono text-[#737373] uppercase mt-0.5">
                  CROSS-ORGANIZATIONAL TELEMETRY OF MANAGERS, MEMBERS & TASK ALLOCATIONS
                </p>
              </div>
            </div>

            <Link
              to="/users"
              className="inline-flex items-center gap-1.5 border border-black bg-[#0A0A0A] text-white px-3.5 py-2 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors shrink-0"
            >
              <Users className="h-4 w-4" />
              <span>DETAILED USER MATRIX &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const members = proj.members || [];
              const tasks = proj.tasks || [];
              return (
                <div
                  key={proj._id}
                  className="border border-[#0A0A0A] bg-[#FAF9F5] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-2 mb-2">
                      <span className="font-['Bebas_Neue','Oswald'] text-xl uppercase text-[#0A0A0A]">
                        {proj.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 uppercase border border-black bg-white">
                        {proj.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono mb-4">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-[#0A0A0A]" />
                        <span className="text-[#737373]">PM:</span>
                        <strong className="text-black">
                          {proj.manager?.name || "UNASSIGNED"}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#737373]" />
                        <span className="text-[#737373]">SQUAD SIZE:</span>
                        <strong>{members.length} OPERATIVES</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5 text-[#737373]" />
                        <span className="text-[#737373]">TASKS:</span>
                        <strong>{tasks.length} SPRINT ITEMS</strong>
                      </div>
                    </div>

                    {/* SAMPLE TASKS */}
                    {tasks.length > 0 && (
                      <div className="border-t border-[#E5E5E0] pt-2 mb-3 space-y-1.5">
                        <span className="text-[10px] font-mono text-[#737373] uppercase font-bold block">
                          RECENT TASK ASSIGNMENTS:
                        </span>
                        {tasks.slice(0, 3).map((t) => (
                          <div
                            key={t._id}
                            className="text-[11px] font-mono flex items-center justify-between bg-white p-1.5 border border-[#E5E5E0]"
                          >
                            <span className="truncate max-w-[150px] font-medium text-black">
                              {t.title}
                            </span>
                            <span className="text-[9px] bg-[#C6FF3D] px-1 py-0.2 border border-black uppercase font-bold">
                              {t.assignee?.name || "UNASSIGNED"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#E5E5E0] pt-2 flex items-center justify-between text-xs font-mono">
                    <Link
                      to={`/projects/${proj._id}`}
                      className="font-bold text-black hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>INSPECT PROJECT</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Link
                      to={`/projects/${proj._id}/team`}
                      className="text-[#737373] hover:text-black hover:underline text-[11px]"
                    >
                      TEAM ROSTER &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
