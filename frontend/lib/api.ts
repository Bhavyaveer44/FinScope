const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
const rawUrls = [
  configuredApiUrl,
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:8000"] : []),
].filter((value): value is string => Boolean(value));
const API_URLS = Array.from(new Set(rawUrls));

async function fetchWithFallback(path: string, init?: RequestInit): Promise<Response> {
  if (API_URLS.length === 0) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  let lastError: unknown;

  for (const baseUrl of API_URLS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, init);
      if (res.ok) return res;

      const body = await res.json().catch(() => ({}));
      lastError = new Error(body.detail || `Request failed (${res.status})`);

      if (baseUrl === API_URLS[API_URLS.length - 1]) {
        throw lastError;
      }
    } catch (error) {
      lastError = error;

      if (baseUrl === API_URLS[API_URLS.length - 1]) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("Request failed");
}

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

export type ReportDetail = {
  id: string;
  ticker: string;
  final_report: string;
  draft_report: string;
  critique: string;
  was_revised: boolean;
  raw_data: Record<string, unknown>;
  created_at: string;
};

export async function runResearch(ticker: string): Promise<ResearchResult> {
  const res = await fetchWithFallback(`/research/${ticker}`, { method: "POST" });
  return res.json();
}

export async function getReportHistory(): Promise<ReportSummary[]> {
  const res = await fetchWithFallback("/reports");
  return res.json();
}

export async function getReportById(id: string): Promise<ReportDetail> {
  const res = await fetchWithFallback(`/reports/${id}`);
  return res.json();
}

export async function askFollowUp(reportId: string, question: string): Promise<{ answer: string }> {
  const res = await fetchWithFallback(`/reports/${reportId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return res.json();
}