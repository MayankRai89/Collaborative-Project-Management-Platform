import { useAuth, ROLE_LABELS } from "../utils/auth";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as {user.email} ({ROLE_LABELS[user.role]})
      </p>
      <button
        onClick={logout}
        className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
      >
        Log out
      </button>
    </main>
  );
}
