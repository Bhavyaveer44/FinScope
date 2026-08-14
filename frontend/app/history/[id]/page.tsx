"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getReportById } from "@/lib/api";
import ReportView from "@/components/ReportView";

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReportById(id).then(setReport).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-center mt-12 text-red-600">{error}</p>;
  if (!report) return <p className="text-center mt-12 text-gray-500">Loading...</p>;

  return (
    <main className="min-h-screen px-6 py-12">
      <ReportView
        ticker={report.ticker}
        report={report.final_report}
        wasRevised={report.was_revised}
      />
    </main>
  );
}