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

        <article className="prose prose-invert max-w-none px-8 py-8 text-slate-200 prose-headings:font-bold prose-h1:text-3xl prose-h1:text-white prose-h2:text-2xl prose-h2:text-blue-300 prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-xl prose-h3:text-cyan-300 prose-h3:mt-5 prose-h3:mb-2 prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4 prose-ul:text-slate-300 prose-ul:space-y-2 prose-li:text-slate-300 prose-strong:text-blue-300 prose-strong:font-bold prose-code:bg-slate-700 prose-code:text-cyan-300 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-hr:border-slate-700">
          <ReactMarkdown>{report}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}