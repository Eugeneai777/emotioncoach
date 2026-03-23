import { Lightbulb } from "lucide-react";

interface Suggestion {
  title: string;
  description: string;
  reason: string;
}

export function SuggestionCard({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        推荐方案
      </div>
      <div className="space-y-2.5">
        {suggestions.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-100">
            <p className="text-sm font-medium text-gray-900">{s.title}</p>
            <p className="text-xs text-gray-500 mt-1">{s.description}</p>
            <p className="text-xs text-amber-600 mt-1.5">💡 {s.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
