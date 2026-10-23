import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../utils/auth";
import { ApiError } from "../../utils/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// Matches the users created by `npm run seed` in the backend
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@example.com", password: "Admin@123" },
  {
    label: "Project Manager",
    email: "pm@example.com",
    password: "Manager@123",
  },
  { label: "Team Member", email: "member@example.com", password: "Member@123" },
  { label: "Viewer", email: "viewer@example.com", password: "Viewer@123" },
];

export default function Login() {
  const location = useLocation();
  const { user, isLoading, login } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  // After login, go back to the page the user originally wanted (set by ProtectedRoute)
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  // Already logged in, or just logged in: this redirect handles both cases
  if (!isLoading && user) return <Navigate to={redirectTo} replace />;

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login(values.email, values.password);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Login failed");
    }
  };

  const fillDemo = (account) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Project Manager platform</p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Demo accounts (click to fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
