"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, History } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isHistory = pathname.startsWith("/history");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition transform duration-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                FinScope
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block -mt-0.5">
              Autonomous Equity Research
            </p>
          </div>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
              isHome
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span>Terminal</span>
          </Link>
          <Link
            href="/history"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
              isHistory
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
