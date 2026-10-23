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
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  // Load My Tasks
  const { data: myTasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: () => api.get("/tasks/mine?limit=5"),
  });

  // Load Projects
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects?limit=4"),
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: My Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-3">
            <h2 className="font-['Bebas_Neue','Oswald'] text-2xl tracking-wider uppercase text-[#0A0A0A]">
              MY TASKS // ACTION REQUIRED
            </h2>
            <Link
              to="/projects"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#0A0A0A] hover:text-[#C6FF3D] flex items-center gap-1"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loadingTasks ? (
            <div className="border border-[#E5E5E0] bg-white p-8 text-center font-mono text-xs text-[#737373]">
              // LOADING_TASKS...
            </div>
          ) : tasks.length === 0 ? (
            <div className="border border-dashed border-[#0A0A0A] bg-white p-8 text-center">
              <p className="font-['Bebas_Neue','Oswald'] text-2xl text-[#0A0A0A] tracking-wider uppercase">
                // ZERO IN FLIGHT. TOUCH GRASS OR SHIP CODE.
              </p>
              <p className="text-xs font-mono text-[#737373] mt-1">
                You have no tasks pending assignment.
              </p>
            </div>
          ) : (
            <div className="border border-[#0A0A0A] bg-white divide-y divide-[#E5E5E0]">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F5] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase ${
                          task.status === "done"
                            ? "bg-[#C6FF3D] text-[#0A0A0A]"
                            : task.status === "in_progress"
                            ? "bg-[#0A0A0A] text-white"
                            : "bg-[#E5E5E0] text-[#0A0A0A]"
                        }`}
                      >
                        [{task.status.replace("_", " ")}]
                      </span>
                      <span className="text-xs font-mono text-[#737373]">v{task.version}</span>
                    </div>
                    <div className="font-bold text-sm text-[#0A0A0A]">{task.title}</div>
                    {task.project && (
                      <div className="text-xs font-mono text-[#737373]">
                        PROJECT: {task.project.name}
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
              PROJECTS // ACTIVE
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
              {projects.map((proj) => (
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
    </DashboardLayout>
  );
}
