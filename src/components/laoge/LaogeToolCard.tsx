import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { LaogeChat } from "./LaogeChat";

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "select";
  options?: string[];
}

interface LaogeToolCardProps {
  tool: string;
  title: string;
  description: string;
  icon: string;
  fields: FieldConfig[];
}

export function LaogeToolCard({ tool, title, description, icon, fields }: LaogeToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const hasInput = fields.some(f => inputs[f.key]?.trim());
    if (!hasInput) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setInputs({});
  };

  const handleClose = () => {
    setExpanded(false);
    setSubmitted(false);
    setInputs({});
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all group text-left"
      >
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[hsl(var(--laoge-text))] text-base">{title}</div>
          <div className="text-xs text-[hsl(var(--laoge-text-muted))] mt-0.5 truncate">{description}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-[hsl(var(--laoge-text-muted))] group-hover:text-[hsl(var(--laoge-accent))] transition-colors flex-shrink-0" />
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--laoge-border))]">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-[hsl(var(--laoge-text))]">{title}</span>
        </div>
        <button onClick={handleClose} className="p-1 rounded-lg hover:bg-[hsl(var(--laoge-bg))] transition-colors">
          <X className="w-5 h-5 text-[hsl(var(--laoge-text-muted))]" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {!submitted ? (
          <>
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-[hsl(var(--laoge-text))]">{field.label}</label>
                {field.type === "select" && field.options ? (
                  <select
                    value={inputs[field.key] || ""}
                    onChange={(e) => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg bg-[hsl(var(--laoge-bg))] border border-[hsl(var(--laoge-border))] text-[hsl(var(--laoge-text))] p-3 text-sm focus:outline-none focus:border-[hsl(var(--laoge-accent))]"
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={inputs[field.key] || ""}
                    onChange={(e) => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg bg-[hsl(var(--laoge-bg))] border border-[hsl(var(--laoge-border))] text-[hsl(var(--laoge-text))] p-3 text-sm placeholder:text-[hsl(var(--laoge-text-muted))] focus:outline-none focus:border-[hsl(var(--laoge-accent))]"
                  />
                )}
              </div>
            ))}
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-lg bg-[hsl(var(--laoge-accent))] text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              问老哥
            </button>
          </>
        ) : (
          <LaogeChat tool={tool} inputs={inputs} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
