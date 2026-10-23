import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../utils/api";
import { Plus, LayoutGrid, List, Search, X, CheckSquare, Clock } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "todo", label: "TO DO" },
  { value: "in_progress", label: "IN PROGRESS" },
  { value: "review", label: "IN REVIEW" },
  { value: "completed", label: "COMPLETED" },
];

const PRIORITY_STYLES = {
  low: "bg-[#F5F5F2] text-[#737373] border border-[#E5E5E0]",
  medium: "bg-[#0A0A0A] text-white border border-black",
  high: "bg-[#F59E0B] text-black border border-black",
  urgent: "bg-[#EF4444] text-white border border-black animate-pulse",
};

export default function ProjectTasks() {
  const { project, canManage } = useOutletContext();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState("table"); // 'table' | 'kanban'
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const { data: tasksRes, isLoading } = useQuery({
    queryKey: ["project-tasks", project._id],
    queryFn: () => api.get(`/projects/${project._id}/tasks`),
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload) => api.post(`/projects/${project._id}/tasks`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", project._id] });
      setIsModalOpen(false);
      setNewTask({ title: "", description: "", priority: "medium", status: "todo" });
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to create task");
    },
  });

  const allTasks = tasksRes?.data || [];

  const filteredTasks = allTasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      setErrorMsg("TASK TITLE IS MANDATORY");
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  return (
    <div>
      {/* FILTER & TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
            <input
              type="text"
              placeholder="FILTER BY KEYWORD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#0A0A0A] bg-white pl-9 pr-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#0A0A0A] bg-white px-3 py-2 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D]"
          >
            <option value="all">STATUS: ALL</option>
            <option value="todo">TO DO</option>
            <option value="in_progress">IN PROGRESS</option>
            <option value="review">IN REVIEW</option>
            <option value="completed">COMPLETED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-[#0A0A0A] bg-white px-3 py-2 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D]"
          >
            <option value="all">PRIORITY: ALL</option>
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
            <option value="urgent">URGENT</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* VIEW SWITCHER */}
          <div className="flex border border-[#0A0A0A] bg-white divide-x divide-[#0A0A0A]">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${
                viewMode === "table" ? "bg-[#0A0A0A] text-[#C6FF3D]" : "text-[#737373] hover:text-[#0A0A0A]"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 transition-colors ${
                viewMode === "kanban" ? "bg-[#0A0A0A] text-[#C6FF3D]" : "text-[#737373] hover:text-[#0A0A0A]"
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 border border-black bg-[#0A0A0A] text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>NEW TASK</span>
            </button>
          )}
        </div>
      </div>

      {/* TASKS VIEW */}
      {isLoading ? (
        <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
          // LOADING_PROJECT_TASKS...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="border border-dashed border-[#0A0A0A] bg-white p-12 text-center">
          <p className="font-['Bebas_Neue','Oswald'] text-2xl text-[#0A0A0A] uppercase tracking-wider">
            // NO TASKS RECORDED
          </p>
          <p className="text-xs font-mono text-[#737373] mt-2">
            INITIALIZE A TASK TO BEGIN SPRINT EXECUTION.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="border border-[#0A0A0A] bg-white overflow-x-auto shadow-[3px_3px_0px_0px_#0A0A0A]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F5F2]">
                <th className="p-3.5 uppercase font-bold tracking-wider">ID</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">TASK TITLE</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">STATUS</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">PRIORITY</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">ASSIGNEE</th>
                <th className="p-3.5 uppercase font-bold tracking-wider text-right">VERSION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {filteredTasks.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-[#FAF9F5] transition-colors cursor-pointer group"
                >
                  <td className="p-3.5 text-[#737373] font-mono">
                    <Link to={`/tasks/${t._id}`} className="hover:underline">
                      #{t._id.slice(-5).toUpperCase()}
                    </Link>
                  </td>
                  <td className="p-3.5">
                    <Link
                      to={`/tasks/${t._id}`}
                      className="font-bold text-[#0A0A0A] group-hover:underline"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="p-3.5">
                    <span className="border border-[#0A0A0A] px-2 py-0.5 text-[10px] font-bold uppercase bg-[#F5F5F2]">
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                        PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#737373]">
                    {t.assignee?.name || <span className="italic">UNASSIGNED</span>}
                  </td>
                  <td className="p-3.5 text-right font-mono text-[10px] text-[#737373]">
                    v{t.version ?? 1}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: "todo", title: "TO DO", filter: (t) => t.status === "todo" },
            {
              key: "in_progress",
              title: "IN PROGRESS",
              filter: (t) => t.status === "in_progress" || t.status === "review",
            },
            { key: "completed", title: "COMPLETED", filter: (t) => t.status === "completed" },
          ].map((col) => {
            const colTasks = filteredTasks.filter(col.filter);
            return (
              <div
                key={col.key}
                className="border border-[#0A0A0A] bg-[#FFFFFF] p-4 flex flex-col shadow-[3px_3px_0px_0px_#0A0A0A]"
              >
                <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-3 mb-4">
                  <h3 className="font-['Bebas_Neue','Oswald'] text-2xl tracking-wide text-[#0A0A0A]">
                    {col.title}
                  </h3>
                  <span className="bg-[#0A0A0A] text-[#C6FF3D] px-2 py-0.5 text-xs font-mono font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="border border-dashed border-[#E5E5E0] p-6 text-center text-xs font-mono text-[#A3A3A3]">
                      NO TASKS
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <Link
                        key={t._id}
                        to={`/tasks/${t._id}`}
                        className="block border border-[#0A0A0A] bg-[#F5F5F2] p-4 hover:bg-[#0A0A0A] hover:text-white transition-all group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                          <span className="text-[#737373] group-hover:text-[#A3A3A3]">
                            #{t._id.slice(-5).toUpperCase()}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm leading-snug group-hover:text-[#C6FF3D]">
                          {t.title}
                        </h4>
                        <div className="mt-3 pt-2 border-t border-[#E5E5E0] group-hover:border-[#282828] flex items-center justify-between text-[10px] font-mono text-[#737373] group-hover:text-[#A3A3A3]">
                          <span>{t.assignee?.name || "UNASSIGNED"}</span>
                          <span>v{t.version ?? 1}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
              <h3 className="font-['Bebas_Neue','Oswald'] text-3xl uppercase text-[#0A0A0A]">
                CREATE NEW TASK
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  TASK TITLE *
                </label>
                <input
                  type="text"
                  placeholder="E.G., IMPLEMENT JWT AUTH GUARD"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  DESCRIPTION
                </label>
                <textarea
                  rows={4}
                  placeholder="SPECIFICATIONS & ACCEPTANCE CRITERIA..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">
                    PRIORITY
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full border border-black p-2.5 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="urgent">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">
                    INITIAL STATUS
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full border border-black p-2.5 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  >
                    <option value="todo">TO DO</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="review">IN REVIEW</option>
                    <option value="completed">COMPLETED</option>
                  </select>
                </div>
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
                  disabled={createTaskMutation.isPending}
                  className="border border-black bg-[#0A0A0A] px-5 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors"
                >
                  {createTaskMutation.isPending ? "INITIALIZING..." : "SAVE TASK ->"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
