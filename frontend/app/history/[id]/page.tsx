"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReportById, ReportDetail as ReportDetailType } from "@/lib/api";
import ReportView from "@/components/ReportView";
import AskFollowUp from "@/components/AskFollowUp";
import {
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function ReportDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [report, setReport] = useState<ReportDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    getReportById(id)
      .then((data) => {
        if (!ignore) {
          setReport(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Report not found.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <main className="min-h-screen text-slate-100 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 hover:text-white transition px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back to History</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-semibold">
              {report ? report.ticker : "Report"}
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <span>New Research</span>
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/30 text-center max-w-xl mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-200 mb-1">Failed to Load Report</h3>
            <p className="text-xs text-red-300/80 mb-6">{error}</p>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700"
            >
              Return to Archives
            </Link>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl" />
                <div className="space-y-2">
                  <div className="w-24 h-6 bg-slate-800 rounded" />
                  <div className="w-40 h-3 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-slate-800/80 rounded" />
                <div className="w-5/6 h-4 bg-slate-800/80 rounded" />
                <div className="w-4/6 h-4 bg-slate-800/80 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Report Content */}
        {report && !loading && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <ReportView
              ticker={report.ticker}
              report={report.final_report}
              wasRevised={report.was_revised}
              draftReport={report.draft_report}
              critique={report.critique}
              rawData={report.raw_data}
              createdAt={report.created_at}
            />

            <AskFollowUp reportId={report.id} />
          </div>
        )}
      </div>
    </main>
  );
}