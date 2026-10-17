"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Copy,
  Check,
  Printer,
  Download,
  ShieldCheck,
  Zap,
  FileText,
  AlertTriangle,
  Database,
  GitCompare,
} from "lucide-react";

export type ReportViewProps = {
  ticker: string;
  report: string;
  wasRevised: boolean;
  fromCache?: boolean;
  draftReport?: string;
  critique?: string;
  rawData?: Record<string, unknown>;
  createdAt?: string;
};

export default function ReportView({
  ticker,
  report,
  wasRevised,
  fromCache,
  draftReport,
  critique,
  rawData,
  createdAt,
}: ReportViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"final" | "critique" | "raw" | "draft">("final");

  const hasAuditData = Boolean(critique || rawData || draftReport);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([report], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${ticker}_FinScope_Research_Report.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Header Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-slate-700/80">
        <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-900/90 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-[1.5px] shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-xl font-black text-transparent bg-clip-text bg-blue-600 hover:bg-blue-500">
                    {ticker}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white">{ticker}</h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Equity Research
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {createdAt
                    ? `Generated on ${new Date(createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Autonomous Multi-Agent Synthesis"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition shadow-sm"
                title="Copy markdown text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition shadow-sm"
                title="Download Markdown Report"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export .md</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition shadow-sm"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Verification Status Badges Bar */}
        <div className="px-6 sm:px-8 py-3 bg-slate-900/60 border-b border-slate-800/60 flex items-center gap-3 flex-wrap text-xs">
          {wasRevised ? (
            <div className="flex items-center px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="font-medium">Self-Checked & Fact-Corrected</span>
              <span className="hidden md:inline text-[11px] text-amber-400/80 ml-1.5">
                (Critique audit eliminated discrepancies)
              </span>
            </div>
          ) : (
            <div className="flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span className="font-medium">Ground Truth Grounded</span>
              <span className="hidden md:inline text-[11px] text-emerald-400/80 ml-1.5">
                (Verified against raw metrics)
              </span>
            </div>
          )}

          {fromCache ? (
            <div className="flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
              <span>Cached Snapshot (&lt; 30m)</span>
            </div>
          ) : (
            <div className="flex items-center px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <span>Live Market Fetch</span>
            </div>
          )}
        </div>

        {/* Secondary Navigation Tabs if Audit Data is present */}
        {hasAuditData && (
          <div className="px-6 sm:px-8 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("final")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
                activeTab === "final"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Final Research Note</span>
            </button>

            {critique && (
              <button
                onClick={() => setActiveTab("critique")}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
                  activeTab === "critique"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Fact-Check Audit Log</span>
              </button>
            )}

            {draftReport && wasRevised && (
              <button
                onClick={() => setActiveTab("draft")}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
                  activeTab === "draft"
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Initial Unrevised Draft</span>
              </button>
            )}

            {rawData && (
              <button
                onClick={() => setActiveTab("raw")}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
                  activeTab === "raw"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Raw Market Data JSON</span>
              </button>
            )}
          </div>
        )}

        {/* Tab Content Display */}
        <div className="px-6 sm:px-10 py-8">
          {activeTab === "final" && (
            <article className="prose prose-invert max-w-none text-slate-200 prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h1:text-white prose-h1:border-b prose-h1:border-slate-800 prose-h1:pb-3 prose-h2:text-2xl prose-h2:text-cyan-300 prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:text-blue-300 prose-h3:mt-6 prose-h3:mb-2 prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4 prose-ul:text-slate-300 prose-ul:space-y-1.5 prose-li:text-slate-300 prose-strong:text-cyan-200 prose-strong:font-semibold prose-code:bg-slate-800 prose-code:text-cyan-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-hr:border-slate-800 prose-table:border prose-table:border-slate-800 prose-th:bg-slate-800/70 prose-th:text-slate-200 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-b prose-td:border-slate-800">
              <ReactMarkdown>{report}</ReactMarkdown>
            </article>
          )}

          {activeTab === "critique" && critique && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Agent Fact-Checking Audit Report</span>
                </div>
                The agent evaluated the draft against ground truth source metrics to find ungrounded claims, hallucinated figures, or missing critical data points.
              </div>
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {critique}
              </div>
            </div>
          )}

          {activeTab === "draft" && draftReport && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-200 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-purple-300 mb-1 text-sm">
                  <GitCompare className="w-4 h-4" />
                  <span>Initial Grounded Draft (Pre-Revision)</span>
                </div>
                This was the initial draft produced in Step 2, prior to the fact-checking pass and correction revision.
              </div>
              <article className="prose prose-invert max-w-none text-slate-300 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-300">
                <ReactMarkdown>{draftReport}</ReactMarkdown>
              </article>
            </div>
          )}

          {activeTab === "raw" && rawData && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-200 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-cyan-300 mb-1 text-sm">
                  <Database className="w-4 h-4" />
                  <span>Ground Truth Market Data Payload</span>
                </div>
                Raw metrics and news gathered deterministically via yfinance API.
              </div>
              <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300/90 overflow-x-auto max-h-[500px] leading-relaxed">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}