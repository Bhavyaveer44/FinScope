// components/ReportView.tsx
import ReactMarkdown from "react-markdown";

type Props = {
  ticker: string;
  report: string;
  wasRevised: boolean;
  fromCache?: boolean;
};

export default function ReportView({ ticker, report, wasRevised, fromCache }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">{ticker}</h2>
            <p className="text-blue-100 font-semibold">Research Report</p>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-800/50 border-b border-slate-700 flex gap-3">
          {wasRevised && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/30 border border-amber-500/50">
              <span className="text-amber-400">✓</span>
              <span className="text-xs font-medium text-amber-200">Revised after self-check</span>
            </div>
          )}
          {fromCache && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-500/50">
              <span className="text-slate-300">⚡</span>
              <span className="text-xs font-medium text-slate-300">Cached result</span>
            </div>
          )}
        </div>

        <article className="prose prose-invert prose-sm max-w-none px-8 py-8 text-slate-200">
          <style>{`
            .prose h2 { @apply text-2xl font-bold text-blue-300 mt-6 mb-3; }
            .prose h3 { @apply text-xl font-bold text-cyan-300 mt-5 mb-2; }
            .prose p { @apply text-slate-300 leading-relaxed mb-4; }
            .prose ul { @apply text-slate-300 space-y-2; }
            .prose li { @apply text-slate-300; }
            .prose strong { @apply text-blue-300 font-bold; }
            .prose code { @apply bg-slate-700 text-cyan-300 px-2 py-1 rounded text-sm; }
          `}</style>
          <ReactMarkdown>{report}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}