"use client";

import { useState } from "react";
import { runResearch, ResearchResult } from "@/lib/api";
import ReportView from "@/components/ReportView";
import Link from "next/link";

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await runResearch(ticker.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">FinScout</h1>
          <Link href="/history" className="text-sm text-blue-600 hover:underline">
            View history
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Enter a ticker, e.g. AAPL"
            className="flex-1 border rounded px-4 py-2 uppercase"
            maxLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? "Researching..." : "Research"}
          </button>
        </form>

        {/* Loading isn't instant, agent is running (data fetch + 2-3 LLM calls), 
            so telling the user what's happening instead of a bare spinner. */}
        {loading && (
          <p className="text-sm text-gray-500 mt-3">
            Fetching data, drafting, and fact-checking the report, takes ~10-20 seconds.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-3">{error}</p>
        )}
      </div>

      {result && (
        <ReportView
          ticker={result.ticker}
          report={result.final_report}
          wasRevised={result.was_revised}
          fromCache={result.from_cache}
        />
      )}
    </main>
  );
}