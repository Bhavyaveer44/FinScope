"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReportHistory, ReportSummary } from "@/lib/api";

export default function History() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportHistory()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Report History</h1>
          <Link href="/" className="text-sm text-slate-300 hover:text-blue-400 transition">
            New search
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mb-4"></div>
            <p className="text-slate-400">Loading reports...</p>
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg mb-4">No reports yet</p>
            <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition font-semibold">
              Start researching →
            </Link>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="grid gap-3">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/history/${r.id}`}
                className="group bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-blue-500 hover:bg-slate-800/80 transition transform hover:scale-102 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {r.ticker}
                    </div>
                    <div className="flex gap-2">
                      {r.was_revised && (
                        <span className="text-xs px-2 py-1 bg-amber-900/30 border border-amber-500/50 rounded text-amber-200">✓ Revised</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm group-hover:text-slate-300 transition">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-slate-500 text-xs group-hover:text-slate-400 transition">
                      {new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}