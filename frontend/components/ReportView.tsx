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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{ticker} Research Report</h2>
        <div className="flex gap-2 text-xs">
          {/* Small badges to make agentic part visible, not hidden,
              proof that a critique loop actually ran. */}
          {wasRevised && (
            <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">
              Revised after self-check
            </span>
          )}
          {fromCache && (
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">
              From cache
            </span>
          )}
        </div>
      </div>

      {/* prose classes come from the Tailwind Typography plugin,
          makes react-markdown's output (headers, bullets, bold) look clean 
          without you writing custom CSS for every markdown element. */}
      <article className="prose prose-sm max-w-none">
        <ReactMarkdown>{report}</ReactMarkdown>
      </article>
    </div>
  );
}