export default function Footer() {
  return (
    <footer className="border-t border-[#E5E5E0] bg-[#FFFFFF] py-6 px-6 lg:px-10 text-xs font-mono text-[#737373] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="font-bold text-[#0A0A0A]">SNITCH // OS</span>
        <span>&copy; {new Date().getFullYear()} COLLABORATIVE MANAGEMENT PLATFORM</span>
      </div>
      <div className="flex items-center gap-4 uppercase tracking-wider">
        <span>SECURITY: ENFORCED</span>
        <span>OPTIMISTIC_LOCKING: v1</span>
      </div>
    </footer>
  );
}
