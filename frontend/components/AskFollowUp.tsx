"use client";

import { useState } from "react";
import { askFollowUp } from "@/lib/api";

type Props = { reportId: string };

export default function AskFollowUp({ reportId }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const data = await askFollowUp(reportId, question.trim());
      setAnswer(data.answer);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't retrieve answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">💬</span>
        <h3 className="text-lg font-semibold text-white">Ask a Follow-Up Question</h3>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Ask about financials, news, or metrics. Answers are strictly grounded in this report&apos;s source data.
      </p>

      <form onSubmit={handleAsk} className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What are the main revenue drivers or risks?"
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m9-9a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thinking...
            </span>
          ) : (
            "Ask"
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-200">
          ❌ {error}
        </div>
      )}

      {answer && (
        <div className="mt-4 p-4 rounded-lg bg-slate-700/60 border border-slate-600">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <span>🤖 FinScout Analysis</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}