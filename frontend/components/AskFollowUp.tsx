"use client";

import { useState } from "react";
import { askFollowUp } from "@/lib/api";
import {
  MessageSquare,
  Send,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

type Props = { reportId: string };

type QAPair = {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
};

const SUGGESTED_QUESTIONS = [
  "What are the primary revenue drivers and growth catalysts?",
  "What are the key financial and market risks?",
  "Break down the valuation multiples and debt profile",
  "Summarize the recent catalyst news and sentiment",
];

export default function AskFollowUp({ reportId }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QAPair[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleAsk(queryToSubmit?: string) {
    const q = (queryToSubmit ?? question).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);

    try {
      const data = await askFollowUp(reportId, q);
      const newPair: QAPair = {
        id: `${Date.now()}-${Math.random()}`,
        question: q,
        answer: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setHistory((prev) => [...prev, newPair]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't retrieve answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="mt-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Interactive Follow-Up Assistant
            </h3>
            <p className="text-xs text-slate-400">
              Grounded exclusively in this report&apos;s source data • Zero hallucinations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fact-Constrained</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Clear follow-up conversation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggested Chips */}
      {history.length === 0 && (
        <div className="mb-5">
          <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
            <span>Suggested questions:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(sq);
                  handleAsk(sq);
                }}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      {history.length > 0 && (
        <div className="space-y-4 mb-6">
          {history.map((item) => (
            <div key={item.id} className="space-y-3">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 shadow-md">
                  <p className="text-sm font-medium">{item.question}</p>
                  <span className="text-[10px] text-blue-200/80 mt-1 block text-right">
                    {item.timestamp}
                  </span>
                </div>
              </div>

              {/* FinScope AI Response */}
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-800/90 border border-slate-700/80 p-4 shadow-md">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      </div>
                      <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                        FinScope Analysis
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(item.id, item.answer)}
                      className="text-slate-400 hover:text-slate-200 transition p-1"
                      title="Copy response"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="mb-4 p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <p className="text-xs text-blue-200">
            Consulting verified report payload and fact metrics...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex gap-2.5 items-center"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this report (e.g., debt ratio, competition, risks)..."
            disabled={loading}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="h-11 px-5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-blue-500/20 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}