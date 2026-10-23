import React from "react";
import Header from "../Header";
import Footer from "../Footer";
import { ShieldCheck, HeartPulse, Activity, Award } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#0A0A0A] flex flex-col justify-between">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="border-b border-[#0A0A0A] pb-6 mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-[#737373] uppercase">
            // PLATFORM OVERVIEW
          </span>
          <h1 className="font-['Bebas_Neue','Oswald'] text-6xl tracking-tight text-[#0A0A0A] mt-2">
            MISSION & TRANSPARENCY
          </h1>
          <p className="mt-3 text-sm font-mono text-[#525252] max-w-2xl">
            A state-of-the-art decentralized blood management and donation tracking ecosystem connecting blood labs, verified donors, and healthcare facilities with zero latency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: HeartPulse,
              title: "VERIFIED DONATIONS",
              desc: "Every blood unit is authenticated with unique cryptographic lot tags to prevent contamination and ensure trace integrity.",
            },
            {
              icon: Activity,
              title: "REAL-TIME TELEMETRY",
              desc: "Hospitals track live stock levels across regional blood banks and initiate urgent batch reserves in seconds.",
            },
            {
              icon: ShieldCheck,
              title: "CLINICAL REGISTRY",
              desc: "Strict clinical qualification protocols guaranteeing compliance with healthcare hygiene standards and eligibility criteria.",
            },
            {
              icon: Award,
              title: "COMMUNITY IMPACT",
              desc: "Rewarding regular donors with verified certification badges and automated reminders for their next eligible donation date.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A]"
              >
                <div className="h-10 w-10 bg-[#0A0A0A] text-[#C6FF3D] flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-['Bebas_Neue','Oswald'] text-2xl tracking-wide text-[#0A0A0A]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-[#737373] font-mono leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
