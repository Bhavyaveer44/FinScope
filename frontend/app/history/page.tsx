"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getReportHistory, ReportSummary } from "@/lib/api";
import {
  History,
  Search,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
} from "lucide-react";

export default function HistoryPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRevised, setFilterRevised] = useState<"all" | "revised" | "unrevised">("all");

  useEffect(() => {
    getReportHistory()
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = r.ticker.toLowerCase().includes(searchTerm.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (filterRevised === "revised") return r.was_revised;
      if (filterRevised === "unrevised") return !r.was_revised;
      return true;
    });
  }, [reports, searchTerm, filterRevised]);

  const revisedCount = useMemo(() => reports.filter((r) => r.was_revised).length, [reports]);

  return (
    <main className="min-h-screen text-slate-100 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 mb-2">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Research Archive</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Report History
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse previously generated equity notes, fact audits, and source payloads.
            </p>
          </div>

          <Link
            href="/"
            className="self-start sm:self-center inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-blue-500/20 transition"
          >
            <span>New Research</span>
          </Link>
        </div>

        {/* Stats Summary Bar */}
        {!loading && reports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Research Notes</p>
                <p className="text-xl font-bold text-white">{reports.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Fact-Audited & Revised</p>
                <p className="text-xl font-bold text-amber-300">{revisedCount}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Latest Activity</p>
                <p className="text-sm font-semibold text-white truncate">
                  {reports[0]?.ticker ? `${reports[0].ticker} Report` : "None"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by ticker (e.g. AAPL)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterRevised("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterRevised === "all"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setFilterRevised("revised")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterRevised === "revised"
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              Revised ({revisedCount})
            </button>
            <button
              onClick={() => setFilterRevised("unrevised")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterRevised === "unrevised"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              Direct Passes ({reports.length - revisedCount})
            </button>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800" />
                  <div className="space-y-2">
                    <div className="w-20 h-5 bg-slate-800 rounded" />
                    <div className="w-32 h-3 bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="w-24 h-4 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <div className="text-center py-20 px-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <History className="w-7 h-7 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Research Reports Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              You haven&apos;t generated any equity research notes yet. Enter any public stock ticker symbol on the terminal to compile your first report.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/20 transition"
            >
              <span>Start Your First Research</span>
            </Link>
          </div>
        )}

        {/* Filter Zero Results */}
        {!loading && reports.length > 0 && filteredReports.length === 0 && (
          <div className="text-center py-16 px-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <p className="text-slate-400 text-sm mb-3">
              No reports matching &quot;{searchTerm}&quot;
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterRevised("all");
              }}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Report Cards Grid */}
        {!loading && filteredReports.length > 0 && (
          <div className="grid gap-3">
            {filteredReports.map((r) => {
              const dateObj = new Date(r.created_at);
              const formattedDate = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <Link
                  key={r.id}
                  href={`/history/${r.id}`}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-cyan-500/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {/* Ticker Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/30 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <span className="font-extrabold text-base text-cyan-300 font-mono">
                        {r.ticker}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                          {r.ticker}
                        </h3>
                        {r.was_revised ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>Fact-Revised</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Direct Pass</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 group-hover:text-cyan-300 hidden sm:inline transition">
                      View Note
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 flex items-center justify-center transition">
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}