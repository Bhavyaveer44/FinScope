import { ShieldCheck, Cpu, Database } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/70 text-slate-400 text-xs py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold text-sm">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Autonomous Agentic Loop</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              FinScope uses a multi-pass pipeline: gathering real-time data via yfinance, generating grounded drafts, executing an LLM fact-checking audit, and applying unified self-corrections.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Hallucination Policy</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Metrics and follow-up Q&A are strictly constrained to fetched company financials, SEC filings, and recent market developments.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold text-sm">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Resilient Architecture</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Powered by Groq LLaMA-3.3 inference, 30-minute freshness caching, and dual-engine persistence (SQLite local with Supabase cloud synchronization).
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} FinScope. Autonomous Equity Research Agent.</p>
          <p className="text-center sm:text-right text-slate-500">
            ⚠️ AI-generated research note. Not financial advice. Verify all metrics independently.
          </p>
        </div>
      </div>
    </footer>
  );
}
