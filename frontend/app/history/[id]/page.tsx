"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReportById, ReportDetail as ReportDetailType } from "@/lib/api";
import ReportView from "@/components/ReportView";
import AskFollowUp from "@/components/AskFollowUp";

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getReportById(id)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-slate-300 hover:text-blue-400 transition">
            ← Back
          </Link>
          <Link href="/history" className="text-slate-300 hover:text-blue-400 transition">
            History
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {error && (
          <div className="p-6 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200 text-center">
            ✕ {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mb-4"></div>
            <p className="text-slate-400">Loading report...</p>
          </div>
        )}

        {report && (
          <>
            <ReportView
              ticker={report.ticker}
              report={report.final_report}
              wasRevised={report.was_revised}
            />
            <AskFollowUp reportId={report.id} />
          </>
        )}
      </div>
    </main>
  );
}