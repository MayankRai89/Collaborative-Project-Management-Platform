import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../utils/auth";
import { ApiError } from "../../utils/api";

const schema = z.object({
  email: z.string().email("ENTER A VALID EMAIL ADDRESS"),
  password: z.string().min(1, "PASSWORD IS REQUIRED"),
});

// Demo accounts aligned with backend seed data
const DEMO_ACCOUNTS = [
  { label: "ADMIN", role: "admin", email: "admin@example.com", password: "Admin@123" },
  { label: "PROJECT MANAGER", role: "project_manager", email: "pm@example.com", password: "Manager@123" },
  { label: "TEAM MEMBER", role: "team_member", email: "member@example.com", password: "Member@123" },
  { label: "VIEWER", role: "viewer", email: "viewer@example.com", password: "Viewer@123" },
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

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  if (!isLoading && user) return <Navigate to={redirectTo} replace />;

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login(values.email, values.password);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message.toUpperCase() : "AUTHENTICATION FAILED");
    }
  };

  const fillDemo = (account) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F5F5F2] text-[#0A0A0A]">
      {/* LEFT: Streetwear Editorial Brand Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] text-[#F5F5F2] flex-col justify-between p-16 border-r border-[#262626] relative overflow-hidden">
        {/* Top Branding */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#C6FF3D] text-[#0A0A0A] font-black px-2 py-0.5 text-xs font-mono tracking-widest">
              SNITCH // OS
            </span>
            <span className="text-xs font-mono text-[#737373]">SYS_CORE v2.4</span>
          </div>
          <span className="font-mono text-xs text-[#737373] tracking-wider">[SEC_TIER: RBAC_4]</span>
        </div>

        {/* Center Big Typography */}
        <div className="my-auto z-10 py-12">
          <div className="text-xs font-mono tracking-widest text-[#C6FF3D] mb-3 uppercase">
            // WORKSPACE ACCESS PROTOCOL
          </div>
          <h1 className="font-['Bebas_Neue','Oswald'] text-8xl xl:text-9xl tracking-tight leading-[0.88] text-[#F5F5F2] uppercase">
            COLLABORATE<br />
            <span className="text-[#C6FF3D]">SHIP CODE</span><br />
            REPEAT.
          </h1>
          <p className="mt-6 text-[#A3A3A3] text-sm max-w-md font-sans leading-relaxed">
            High-velocity project management platform built for agile execution. Strict role-based isolation, optimistic task concurrency, and real-time auditability.
          </p>
        </div>

        {/* Bottom Metadata */}
        <div className="flex items-center justify-between text-xs font-mono text-[#737373] border-t border-[#262626] pt-6 z-10">
          <span>STATUS: ONLINE [DEV_PORT: 4000]</span>
          <span>&copy; 2026 ALL RIGHTS RESERVED</span>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#0A0A0A] p-8 sm:p-10 shadow-[4px_4px_0px_0px_#0A0A0A]">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-[#737373] uppercase">
                AUTHENTICATION
              </span>
              <h2 className="font-['Bebas_Neue','Oswald'] text-4xl tracking-tight leading-none text-[#0A0A0A] mt-1">
                SIGN IN TO WORKSPACE
              </h2>
            </div>
            <span className="h-3 w-3 bg-[#C6FF3D] border border-black inline-block"></span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono font-bold tracking-wider text-[#0A0A0A] uppercase mb-1.5"
              >
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full border border-[#0A0A0A] bg-white px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-[#A3A3A3] outline-none focus:bg-[#FAF9F5] focus:ring-2 focus:ring-[#C6FF3D]"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-mono font-bold text-[#EF4444]">
                  [!] {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono font-bold tracking-wider text-[#0A0A0A] uppercase mb-1.5"
              >
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full border border-[#0A0A0A] bg-white px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-[#A3A3A3] outline-none focus:bg-[#FAF9F5] focus:ring-2 focus:ring-[#C6FF3D]"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs font-mono font-bold text-[#EF4444]">
                  [!] {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                className="border border-[#EF4444] bg-[#FEF2F2] p-3 text-xs font-mono font-bold text-[#EF4444]"
              >
                [ERROR] {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border border-[#0A0A0A] bg-[#0A0A0A] py-3 text-sm font-mono font-bold uppercase tracking-widest text-white transition-all hover:bg-[#C6FF3D] hover:text-[#0A0A0A] disabled:opacity-50"
            >
              {isSubmitting ? "AUTHENTICATING..." : "ENTER WORKSPACE ->"}
            </button>
          </form>

          {/* Quick-fill Demo Accounts */}
          <div className="mt-8 border-t border-[#E5E5E0] pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#737373]">
                DEMO PRESETS (ONE-CLICK FILL)
              </span>
              <span className="text-[10px] font-mono bg-[#E5E5E0] px-1 text-[#0A0A0A]">TEST ENV</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a)}
                  className="group flex flex-col items-start border border-[#0A0A0A] bg-[#F5F5F2] p-2.5 text-left transition-all hover:bg-[#0A0A0A] hover:text-white"
                >
                  <span className="text-xs font-mono font-black tracking-wider group-hover:text-[#C6FF3D]">
                    {a.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#737373] group-hover:text-[#A3A3A3] truncate w-full">
                    {a.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
