import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { Search, UserPlus, X, Check, AlertCircle } from "lucide-react";

export default function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Create User modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("team_member");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => {
      let query = "/users?limit=50";
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (roleFilter) query += `&role=${roleFilter}`;
      return api.get(query);
    },
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

  return (
    <DashboardLayout
      title="USER_DIRECTORY // ACCESS CONTROL"
      subtitle="SYSTEM PRIVILEGES & RBAC MANAGEMENT"
    >
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
          className="flex items-center justify-center gap-2 border border-black bg-[#0A0A0A] text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>CREATE USER</span>
        </button>
      </div>

      {/* USER TABLE */}
      {isLoading ? (
        <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
          // QUERYING_USER_REGISTRY...
        </div>
      ) : users.length === 0 ? (
        <div className="border border-dashed border-[#0A0A0A] bg-white p-12 text-center">
          <p className="font-['Bebas_Neue','Oswald'] text-2xl text-[#0A0A0A] uppercase tracking-wider">
            // NO ACCOUNTS MATCHING CRITERIA
          </p>
        </div>
      ) : (
        <div className="border border-[#0A0A0A] bg-white overflow-x-auto shadow-[3px_3px_0px_0px_#0A0A0A]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F5F2]">
                <th className="p-3.5 tracking-wider uppercase font-bold">NAME</th>
                <th className="p-3.5 tracking-wider uppercase font-bold">EMAIL</th>
                <th className="p-3.5 tracking-wider uppercase font-bold">SYSTEM ROLE</th>
                <th className="p-3.5 tracking-wider uppercase font-bold">STATUS</th>
                <th className="p-3.5 tracking-wider uppercase font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;
                return (
                  <tr key={u._id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="p-3.5 font-bold text-[#0A0A0A]">{u.name}</td>
                    <td className="p-3.5 text-[#737373]">{u.email}</td>
                    <td className="p-3.5">
                      <span className="border border-[#0A0A0A] px-2 py-0.5 text-[10px] uppercase font-bold bg-[#F5F5F2]">
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          u.isActive
                            ? "bg-[#C6FF3D] text-[#0A0A0A]"
                            : "bg-[#EF4444] text-white"
                        }`}
                      >
                        {u.isActive ? "ACTIVE" : "DEACTIVATED"}
                      </span>
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
                  placeholder="alex@example.com"
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
                  placeholder="MINIMUM 6 CHARACTERS"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  SYSTEM ROLE *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono bg-white uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                >
                  <option value="admin">ADMIN</option>
                  <option value="project_manager">PROJECT MANAGER</option>
                  <option value="team_member">TEAM MEMBER</option>
                  <option value="viewer">VIEWER</option>
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
                  {createUserMutation.isPending ? "PROVISIONING..." : "CREATE USER ->"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
