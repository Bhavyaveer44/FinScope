"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReportHistory, ReportSummary } from "@/lib/api";

export default function History() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect with an empty dependency array [] runs once, when the page loads --
  // this is how to fetch data on mount in a client component.
  useEffect(() => {
    getReportHistory()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Report history</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            New search
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && reports.length === 0 && (
          <p className="text-gray-500">No reports yet — go research a ticker.</p>
        )}

        <ul className="divide-y">
          {reports.map((r) => (
            <li key={r.id} className="py-3">
              <Link href={`/history/${r.id}`} className="flex items-center justify-between hover:underline">
                <span className="font-medium">{r.ticker}</span>
                <span className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                  {r.was_revised && " · revised"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}