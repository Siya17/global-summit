import { Fragment, type ReactNode } from "react";
import { glossaryPattern, lookupGlossary } from "../lib/glossary";

// Renders a string and turns the first mention of each known term into a
// hover / tap tooltip with a plain-language definition. Each term is
// explained at most once per passage so the text stays readable.
export function GlossaryText({ text }: { text: string }) {
  const used = new Set<string>();
  const parts = text.split(glossaryPattern);
  const nodes: ReactNode[] = parts.map((part, index) => {
    if (!part) return null;
    const entry = lookupGlossary(part);
    if (entry && !used.has(entry.term)) {
      used.add(entry.term);
      return (
        <span
          key={index}
          className="glossary-term"
          tabIndex={0}
          role="note"
          aria-label={`${part}: ${entry.definition}`}
        >
          {part}
          <span className="glossary-pop" aria-hidden="true">
            {entry.definition}
          </span>
        </span>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
  return <>{nodes}</>;
}
