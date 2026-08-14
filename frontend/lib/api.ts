const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ResearchResult = {
  id: string;
  ticker: string;
  final_report: string;
  was_revised: boolean;
  from_cache: boolean;
};

export type ReportSummary = {
  id: string;
  ticker: string;
  was_revised: boolean;
  created_at: string;
};

export async function runResearch(ticker: string): Promise<ResearchResult> {
  const res = await fetch(`${API_URL}/research/${ticker}`, { method: "POST" });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }

  return res.json();
}

export async function getReportHistory(): Promise<ReportSummary[]> {
  const res = await fetch(`${API_URL}/reports`);
  if (!res.ok) throw new Error("Couldn't load report history");
  return res.json();
}

export async function getReportById(id: string) {
  const res = await fetch(`${API_URL}/reports/${id}`);
  if (!res.ok) throw new Error("Report not found");
  return res.json();
}