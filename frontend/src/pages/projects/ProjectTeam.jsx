import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../utils/api";
import { UserPlus, Trash2, X, Shield, Search } from "lucide-react";

export default function ProjectTeam() {
  const { project, canManage } = useOutletContext();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("team_member");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: membersRes, isLoading } = useQuery({
    queryKey: ["project-members", project._id],
    queryFn: () => api.get(`/projects/${project._id}/members`),
  });

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["user-lookup", userQuery],
    queryFn: () => api.get(`/users/lookup?search=${encodeURIComponent(userQuery)}`),
    enabled: userQuery.trim().length >= 2,
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload) => api.post(`/projects/${project._id}/members`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", project._id] });
      setIsAddModalOpen(false);
      setUserQuery("");
      setSelectedUser(null);
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to add member");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      api.patch(`/projects/${project._id}/members/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", project._id] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.delete(`/projects/${project._id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", project._id] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks", project._id] });
    },
  });

  const members = membersRes?.data || [];

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg("PLEASE SELECT A CANDIDATE OPERATIVE");
      return;
    }
    addMemberMutation.mutate({ userId: selectedUser._id, role: selectedRole });
  };

  return (
    <div>
      {/* TOOLBAR */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-['Bebas_Neue','Oswald'] text-3xl text-[#0A0A0A] uppercase tracking-wide">
            ASSIGNED SQUAD // [{members.length} OPERATIVES]
          </h2>
          <p className="text-xs font-mono text-[#737373] uppercase">
            ROLE-BASED AUTHORIZATION & ASSIGNMENT ALLOCATION
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 border border-black bg-[#0A0A0A] text-white px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>ADD MEMBER</span>
          </button>
        )}
      </div>

      {/* TEAM TABLE */}
      {isLoading ? (
        <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
          // LOADING_TEAM_ROSTER...
        </div>
      ) : members.length === 0 ? (
        <div className="border border-dashed border-[#0A0A0A] bg-white p-12 text-center">
          <p className="font-['Bebas_Neue','Oswald'] text-2xl text-[#0A0A0A] uppercase tracking-wider">
            // ROSTER EMPTY
          </p>
          <p className="text-xs font-mono text-[#737373] mt-2">
            NO ADDITIONAL OPERATIVES ASSIGNED TO THIS PROJECT NODE.
          </p>
        </div>
      ) : (
        <div className="border border-[#0A0A0A] bg-white overflow-x-auto shadow-[3px_3px_0px_0px_#0A0A0A]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-[#F5F5F2]">
                <th className="p-3.5 uppercase font-bold tracking-wider">OPERATIVE</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">EMAIL</th>
                <th className="p-3.5 uppercase font-bold tracking-wider">PROJECT ROLE</th>
                <th className="p-3.5 uppercase font-bold tracking-wider text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {members.map((m) => {
                const isProjectManager = m.role === "project_manager";
                return (
                  <tr key={m.user._id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="p-3.5 font-bold text-[#0A0A0A] flex items-center gap-2">
                      <div className="h-6 w-6 bg-[#0A0A0A] text-[#C6FF3D] font-bold flex items-center justify-center text-[10px] border border-black">
                        {m.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{m.user.name}</span>
                    </td>
                    <td className="p-3.5 text-[#737373]">{m.user.email}</td>
                    <td className="p-3.5">
                      {canManage && m.role !== "project_manager" ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              userId: m.user._id,
                              role: e.target.value,
                            })
                          }
                          className="border border-[#0A0A0A] bg-white px-2.5 py-1 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                        >
                          <option value="team_member">TEAM MEMBER</option>
                          <option value="viewer">VIEWER</option>
                        </select>
                      ) : (
                        <span className="border border-[#0A0A0A] px-2 py-0.5 text-[10px] uppercase font-bold bg-[#C6FF3D] text-[#0A0A0A]">
                          {m.role.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {canManage && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${m.user.name} from project? Their assigned tasks will be reset to unassigned.`
                              )
                            ) {
                              removeMemberMutation.mutate(m.user._id);
                            }
                          }}
                          disabled={removeMemberMutation.isPending}
                          className="text-[#EF4444] hover:text-black p-1 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="h-4 w-4 inline" />
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

      {/* ADD MEMBER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md border border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
              <h3 className="font-['Bebas_Neue','Oswald'] text-3xl uppercase text-[#0A0A0A]">
                ADD OPERATIVE TO SQUAD
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  SEARCH USER (MIN 2 CHARS)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
                  <input
                    type="text"
                    placeholder="NAME OR EMAIL..."
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    className="w-full border border-black pl-9 pr-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  />
                </div>

                {/* Candidate list */}
                {isSearching && (
                  <div className="text-[11px] font-mono text-[#737373] mt-1.5">
                    SEARCHING REGISTRY...
                  </div>
                )}
                {searchResults?.data && searchResults.data.length > 0 && !selectedUser && (
                  <div className="mt-2 border border-black max-h-40 overflow-y-auto divide-y divide-[#E5E5E0] bg-[#FAF9F5]">
                    {searchResults.data.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="w-full text-left p-2.5 hover:bg-[#0A0A0A] hover:text-white transition-colors text-xs font-mono flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px] text-[#737373]">{u.email}</div>
                        </div>
                        <span className="text-[10px] border border-black px-1.5 py-0.5">
                          SELECT
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 p-2 border border-black bg-[#C6FF3D] text-[#0A0A0A] flex items-center justify-between text-xs font-mono font-bold">
                    <span>
                      SELECTED: {selectedUser.name} ({selectedUser.email})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-black hover:underline"
                    >
                      CHANGE
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  PROJECT ROLE
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                >
                  <option value="team_member">TEAM MEMBER</option>
                  <option value="viewer">VIEWER</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E5E5E0] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border border-black px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending || !selectedUser}
                  className="border border-black bg-[#0A0A0A] px-5 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors disabled:opacity-50"
                >
                  {addMemberMutation.isPending ? "ADDING..." : "CONFIRM ASSIGNMENT ->"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
