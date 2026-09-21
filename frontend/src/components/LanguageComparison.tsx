import { ReactNode } from "react";

interface LanguageComparisonProps {
  items: {
    language: string;
    languageCode?: string;
    children: ReactNode;
  }[];
}

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  kn: "🇮🇳",
  ta: "🇮🇳",
  te: "🇮🇳",
  mr: "🇮🇳",
};

export default function LanguageComparison({ items }: LanguageComparisonProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
        >
          {/* Language header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-base">
              {LANG_FLAGS[item.languageCode ?? ""] ?? "🌐"}
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {item.language}
            </span>
            {item.languageCode && (
              <span className="text-xs text-slate-400 uppercase font-mono">
                {item.languageCode}
              </span>
            )}
          </div>
          {/* Content */}
          <div className="p-4 flex-1">{item.children}</div>
        </div>
      ))}
    </div>
  );
}
