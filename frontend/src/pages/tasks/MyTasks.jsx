import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  CheckSquare,
  Search,
  Calendar,
  AlertTriangle,
  FolderGit2,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "todo", label: "TO DO" },
  { value: "in_progress", label: "IN PROGRESS" },
  { value: "review", label: "IN REVIEW" },
  { value: "done", label: "DONE" },
];

const PRIORITY_STYLES = {
  low: "bg-[#F5F5F2] text-[#737373] border border-[#E5E5E0]",
  medium: "bg-[#0A0A0A] text-white border border-black",
  high: "bg-[#F59E0B] text-black border border-black",
  urgent: "bg-[#EF4444] text-white border border-black animate-pulse",
};

export default function MyTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [conflictTask, setConflictTask] = useState(null);

  // Fetch all tasks assigned to the logged-in user across all projects
  const {
    data: tasksRes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-tasks-all"],
    queryFn: () => api.get("/tasks/mine?limit=100"),
  });

  const allTasks = tasksRes?.data || [];

  // Concurrency-aware inline status update
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, version, status }) =>
      api.patch(`/tasks/${taskId}`, { version, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks-all"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      setConflictTask(null);
    },
    onError: (err, variables) => {
      if (err instanceof ApiError && err.status === 409) {
        setConflictTask({
          taskId: variables.taskId,
          serverTask: err.data?.currentTask,
          message: err.data?.message || "Task version mismatch detected.",
        });
      } else {
        alert(err.message || "Failed to update task status");
      }
    },
  });

  const handleStatusChange = (task, newStatus) => {
    updateTaskMutation.mutate({
      taskId: task._id,
      version: task.version,
      status: newStatus,
    });
  };

  // Filter tasks locally
  const filteredTasks = allTasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchProj = t.project?.name?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchProj;
    }
    return true;
  });

  const countTodo = allTasks.filter((t) => t.status === "todo").length;
  const countInProgress = allTasks.filter((t) => t.status === "in_progress").length;
  const countReview = allTasks.filter((t) => t.status === "review").length;
  const countDone = allTasks.filter((t) => t.status === "done").length;
  const countOverdue = allTasks.filter(
    (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return (
    <DashboardLayout
      title="MY ASSIGNED SPRINT TASKS"
      subtitle={`OPERATIVE HANDLE: ${user?.name?.toUpperCase() || "OPERATOR"} // CENTRALIZED ASSIGNMENT ROSTER`}
    >
      {/* 409 OCC CONFLICT BANNER */}
      {conflictTask && (
        <div className="mb-6 border-2 border-[#EF4444] bg-[#FEF2F2] p-4 text-[#0A0A0A] shadow-[4px_4px_0px_0px_#EF4444]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#EF4444] shrink-0" />
              <div>
                <strong className="font-mono text-xs text-[#EF4444] uppercase block">
                  VERSION LOCK CONFLICT // HTTP 409
                </strong>
                <p className="text-xs font-mono text-[#0A0A0A] mt-0.5">
                  Another operative committed an update while you were viewing this task.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                refetch();
                setConflictTask(null);
              }}
              className="flex items-center gap-1.5 border border-black bg-black text-[#C6FF3D] px-3 py-1.5 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-black transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>SYNC LATEST</span>
            </button>
          </div>
        </div>
      )}

      {/* METRIC COUNTERS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => setStatusFilter("all")}
          className={`border border-[#0A0A0A] p-3 text-left transition-all ${
            statusFilter === "all"
              ? "bg-[#0A0A0A] text-white shadow-[3px_3px_0px_0px_#C6FF3D]"
              : "bg-white hover:bg-[#FAF9F5]"
          }`}
        >
          <div className="text-[10px] font-mono text-[#737373] uppercase">TOTAL</div>
          <div className="font-['Bebas_Neue','Oswald'] text-2xl leading-none mt-1">
            {allTasks.length}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("todo")}
          className={`border border-[#0A0A0A] p-3 text-left transition-all ${
            statusFilter === "todo"
              ? "bg-[#0A0A0A] text-[#C6FF3D] shadow-[3px_3px_0px_0px_#0A0A0A]"
              : "bg-white hover:bg-[#FAF9F5]"
          }`}
        >
          <div className="text-[10px] font-mono text-[#737373] uppercase">TO DO</div>
          <div className="font-['Bebas_Neue','Oswald'] text-2xl leading-none mt-1">
            {countTodo}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("in_progress")}
          className={`border border-[#0A0A0A] p-3 text-left transition-all ${
            statusFilter === "in_progress"
              ? "bg-[#0A0A0A] text-[#C6FF3D] shadow-[3px_3px_0px_0px_#0A0A0A]"
              : "bg-white hover:bg-[#FAF9F5]"
          }`}
        >
          <div className="text-[10px] font-mono text-[#737373] uppercase">IN PROGRESS</div>
          <div className="font-['Bebas_Neue','Oswald'] text-2xl leading-none mt-1">
            {countInProgress}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("review")}
          className={`border border-[#0A0A0A] p-3 text-left transition-all ${
            statusFilter === "review"
              ? "bg-[#0A0A0A] text-[#C6FF3D] shadow-[3px_3px_0px_0px_#0A0A0A]"
              : "bg-white hover:bg-[#FAF9F5]"
          }`}
        >
          <div className="text-[10px] font-mono text-[#737373] uppercase">IN REVIEW</div>
          <div className="font-['Bebas_Neue','Oswald'] text-2xl leading-none mt-1">
            {countReview}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("done")}
          className={`border border-[#0A0A0A] p-3 text-left transition-all ${
            statusFilter === "done"
              ? "bg-[#0A0A0A] text-[#C6FF3D] shadow-[3px_3px_0px_0px_#0A0A0A]"
              : "bg-white hover:bg-[#FAF9F5]"
          }`}
        >
          <div className="text-[10px] font-mono text-[#737373] uppercase">COMPLETED</div>
          <div className="font-['Bebas_Neue','Oswald'] text-2xl leading-none mt-1 text-[#22C55E]">
            {countDone}
          </div>
        </button>

        <div className="border border-[#EF4444] bg-[#FEF2F2] p-3 text-left">
          <div className="text-[10px] font-mono text-[#EF4444] uppercase font-bold">OVERDUE</div>
          <div className="font-['Bebas_Neue','Oswald'] text-2xl leading-none mt-1 text-[#EF4444]">
            {countOverdue}
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
            <input
              type="text"
              placeholder="SEARCH BY TASK TITLE, DETAILS, OR PROJECT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-black bg-white pl-9 pr-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-black bg-white px-3 py-2 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D]"
          >
            <option value="all">ALL STATUSES</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-black bg-white px-3 py-2 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D]"
          >
            <option value="all">ALL PRIORITIES</option>
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
            <option value="urgent">URGENT</option>
          </select>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 border border-black bg-[#0A0A0A] text-white px-3.5 py-2 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>REFRESH</span>
        </button>
      </div>

      {/* TASK LIST TABLE */}
      {isLoading ? (
        <div className="border border-black bg-white p-12 text-center font-mono text-xs text-[#737373]">
          // QUERYING_YOUR_ASSIGNED_SPRINT_TASKS...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="border-2 border-dashed border-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_#0A0A0A]">
          <p className="font-['Bebas_Neue','Oswald'] text-3xl text-[#0A0A0A] uppercase tracking-wider">
            // ZERO PENDING ACTIONS
          </p>
          <p className="text-xs font-mono text-[#737373] mt-2">
            NO SPRINT TASKS CURRENTLY MATCH YOUR FILTER CRITERIA.
          </p>
          <Link
            to="/projects"
            className="mt-6 inline-flex items-center gap-2 border border-black bg-black text-white px-5 py-2.5 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-black transition-all"
          >
            BROWSE ALL ACTIVE PROJECTS &rarr;
          </Link>
        </div>
      ) : (
        <div className="border border-black bg-white overflow-x-auto shadow-[4px_4px_0px_0px_#0A0A0A]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-black bg-black text-white">
                <th className="p-3.5 uppercase font-bold tracking-wider">TASK ID</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">TASK TITLE & SCOPE</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">PARENT PROJECT</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">STATUS</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">PRIORITY</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">DEADLINE</th>
                <th className="p-3.5 uppercase font-bold tracking-wider text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {filteredTasks.map((task) => {
                const isOverdue =
                  task.status !== "done" &&
                  task.dueDate &&
                  new Date(task.dueDate) < new Date();

                return (
                  <tr
                    key={task._id}
                    className="hover:bg-[#FAF9F5] transition-colors group"
                  >
                    <td className="p-3.5 font-bold">
                      <Link
                        to={`/tasks/${task._id}`}
                        className="hover:underline text-black font-mono"
                      >
                        #{task._id.slice(-6).toUpperCase()}
                      </Link>
                    </td>

                    <td className="p-3.5 max-w-sm">
                      <Link
                        to={`/tasks/${task._id}`}
                        className="font-bold text-sm text-black group-hover:underline block"
                      >
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className="text-[11px] text-[#737373] line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5">
                      {task.project ? (
                        <Link
                          to={`/projects/${task.project._id || task.project}`}
                          className="flex items-center gap-1.5 font-bold text-black hover:underline"
                        >
                          <FolderGit2 className="h-3.5 w-3.5 text-[#737373]" />
                          <span>{task.project.name || "PROJECT SPRINT"}</span>
                        </Link>
                      ) : (
                        <span className="text-[#737373] italic">ORPHANED_TASK</span>
                      )}
                    </td>

                    {/* INLINE STATUS UPDATE FOR ASSIGNEE */}
                    <td className="p-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        disabled={updateTaskMutation.isPending}
                        className="border border-black bg-white px-2 py-1 text-xs font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {task.dueDate ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                            isOverdue
                              ? "text-[#EF4444] font-bold"
                              : "text-[#737373]"
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          {isOverdue && <span className="text-[9px] uppercase">[LATE]</span>}
                        </span>
                      ) : (
                        <span className="text-[#A3A3A3] text-[11px]">NO_DEADLINE</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <Link
                        to={`/tasks/${task._id}`}
                        className="inline-flex items-center gap-1 border border-black bg-white px-2.5 py-1 text-[11px] font-mono font-bold uppercase hover:bg-[#C6FF3D] transition-colors"
                      >
                        <span>OPEN</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
