import React, { useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#0A0A0A] flex flex-col justify-between">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="border-b border-[#0A0A0A] pb-6 mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-[#737373] uppercase">
            // DISPATCH DESK
          </span>
          <h1 className="font-['Bebas_Neue','Oswald'] text-6xl tracking-tight text-[#0A0A0A] mt-2">
            CONTACT HEADQUARTERS
          </h1>
          <p className="mt-2 text-xs font-mono text-[#737373] uppercase tracking-wide">
            EMERGENCY LINE 24/7 FOR BLOOD REQUEST DISPATCH & REGISTRY SUPPORT
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A]">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-[#0A0A0A]" />
                <h3 className="font-['Bebas_Neue','Oswald'] text-xl">CENTRAL REGISTRY</h3>
              </div>
              <p className="text-xs font-mono text-[#525252]">
                742 Evergreen Medical Parkway, Blood Banking Division, Sector 4
              </p>
            </div>

            <div className="bg-white border border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A]">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-[#0A0A0A]" />
                <h3 className="font-['Bebas_Neue','Oswald'] text-xl">DIRECT DISPATCH</h3>
              </div>
              <p className="text-xs font-mono text-[#525252]">
                +1 (800) 555-BLOOD // Toll-Free Emergency Support
              </p>
            </div>

            <div className="bg-white border border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A]">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-[#0A0A0A]" />
                <h3 className="font-['Bebas_Neue','Oswald'] text-xl">ENCRYPTED COMMS</h3>
              </div>
              <p className="text-xs font-mono text-[#525252]">
                dispatch@bloodgrid.internal
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#0A0A0A] p-8 shadow-[4px_4px_0px_0px_#0A0A0A]">
            {submitted ? (
              <div className="text-center py-12">
                <span className="inline-block bg-[#C6FF3D] text-[#0A0A0A] font-mono font-bold text-xs px-3 py-1 mb-4">
                  MESSAGE DISPATCHED
                </span>
                <h3 className="font-['Bebas_Neue','Oswald'] text-3xl">TRANSMISSION RECEIVED</h3>
                <p className="text-xs font-mono text-[#737373] mt-2">
                  An operations officer will review your dispatch request shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold tracking-wider mb-1">
                    OFFICER NAME / ORGANIZATION
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe / St. Jude Memorial"
                    className="w-full border border-[#0A0A0A] p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold tracking-wider mb-1">
                    OFFICIAL EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@hospital.org"
                    className="w-full border border-[#0A0A0A] p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold tracking-wider mb-1">
                    TRANSMISSION NOTE
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Specify blood group requirements, camp query or technical inquiry..."
                    className="w-full border border-[#0A0A0A] p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0A0A0A] text-white py-3 text-xs font-mono font-bold tracking-widest uppercase hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors border border-black flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>TRANSMIT DISPATCH</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
