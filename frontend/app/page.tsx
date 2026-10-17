"use client";

import { useState, useEffect, useRef } from "react";
import { runResearch, ResearchResult } from "@/lib/api";
import ReportView from "@/components/ReportView";
import AskFollowUp from "@/components/AskFollowUp";
import {
  Search,
  ArrowRight,
  AlertCircle,
  X,
  Clock,
  Layers,
} from "lucide-react";

const POPULAR_TICKERS = ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "TSLA"];

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const reportSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (loading) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [loading]);

  async function executeResearch(symbol: string) {
    const cleanTicker = symbol.trim().toUpperCase();
    if (!cleanTicker) return;

    setElapsedSeconds(0);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await runResearch(cleanTicker);
      setResult(data);
      // Smoothly scroll to report section once loaded
      setTimeout(() => {
        reportSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while researching.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeResearch(ticker);
  }

  function handleSelectTicker(t: string) {
    setTicker(t);
    executeResearch(t);
  }

  return (
    <main className="min-h-screen text-slate-100 flex flex-col justify-between">
      {/* Hero & Search Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 w-full">
        {/* Top Feature Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 shadow-sm backdrop-blur-sm">
            <span>Autonomous Plan → Act → Reflect Multi-Pass Agent</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Institutional Equity Research
            </span>{" "}
            <br className="hidden sm:inline" />
            <span className="bg-cyan-600 bg-clip-text text-transparent">
              at Machine Speed
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Generate verifiable, institutional-grade equity research notes. Grounded in deterministic market data with autonomous fact-checking to eradicate hallucinations.
          </p>
        </div>

        {/* Search Terminal Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-2xl backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 relative">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Enter stock ticker (e.g., AAPL, NVDA, MSFT)"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-12 pr-10 py-3.5 text-base font-semibold tracking-wider text-white placeholder:text-slate-500 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
                {ticker && !loading && (
                  <button
                    type="button"
                    onClick={() => setTicker("")}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="h-12 sm:h-auto px-7 rounded-xl font-semibold text-sm text-white bg-cyan-800 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transform active:scale-98 shrink-0"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <span>Generate Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Popular:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {POPULAR_TICKERS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelectTicker(item)}
                      disabled={loading}
                      className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 font-mono text-[11px] font-medium border border-slate-700/60 transition"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <span>Enter ↵</span>
              </div>
            </div>
          </div>

          {/* Loading Multi-step Stepper Card */}
          {loading && (
            <div className="mt-6 bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-6 shadow-2xl backdrop-blur-md animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    Agent Pipeline Running for {ticker.trim()}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{elapsedSeconds}s elapsed</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Fetching market data and generating a fact-checked report. This can take a minute or two...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-200">Research Failed</h4>
                <p className="text-xs text-red-300/90 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Cards Grid (displayed when no result is present) */}
        {!result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto pt-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                  Self-Fact-Checking Loop
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A dedicated LLM audit pass checks drafts against raw market metrics to intercept hallucinated numbers and enforce factual accuracy.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                  Live Fundamentals & News
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deterministic real-time financial data, ratios, valuation multiples, and recent catalyst headlines directly via yfinance.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                  30m Freshness Caching
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant report retrieval with intelligent 30-minute caching and dual-engine SQLite/Supabase synchronization.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Report Section */}
      {result && (
        <div ref={reportSectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 w-full animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Research Output</span>
            </h2>
            <button
              onClick={() => {
                setResult(null);
                setTicker("");
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 transition"
            >
              Analyze Another Ticker
            </button>
          </div>

          <ReportView
            ticker={result.ticker}
            report={result.final_report}
            wasRevised={result.was_revised}
            fromCache={result.from_cache}
          />

          <AskFollowUp reportId={result.id} />
        </div>
      )}
    </main>
  );
}