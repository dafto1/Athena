"use client";

import { useCallback, useState } from "react";

export type SearchMatch = {
  pageNumber: number;
  snippet: string;
};

export function usePdfSearch(goToPage: (page: number) => void) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  const applyMatch = useCallback(
    (nextIndex: number, nextMatches: SearchMatch[]) => {
      if (nextMatches.length === 0) return;
      const bounded = (nextIndex + nextMatches.length) % nextMatches.length;
      setMatchIndex(bounded);
      goToPage(nextMatches[bounded].pageNumber);
    },
    [goToPage]
  );

  const searchDocument = useCallback(
    async (pdf: { numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }> }) => {
      const term = query.trim();
      setActiveQuery(term);
      setMessage("");
      if (!term) {
        setMatches([]);
        setMatchIndex(0);
        return;
      }

      setSearching(true);
      try {
        const found: SearchMatch[] = [];
        const needle = term.toLowerCase();
        for (let page = 1; page <= pdf.numPages; page += 1) {
          const pdfPage = await pdf.getPage(page);
          const content = await pdfPage.getTextContent();
          const text = content.items
            .map((item) => (typeof item === "object" && item && "str" in item ? String(item.str) : ""))
            .join(" ");
          const lower = text.toLowerCase();
          let from = 0;
          while (from < lower.length) {
            const at = lower.indexOf(needle, from);
            if (at === -1) break;
            const snippet = text.slice(Math.max(0, at - 24), at + term.length + 24).trim();
            found.push({ pageNumber: page, snippet });
            from = at + term.length;
          }
        }
        setMatches(found);
        if (found.length === 0) {
          setMessage("No matching text in this PDF.");
        } else {
          applyMatch(0, found);
        }
      } catch {
        setMessage("Search could not run on this PDF.");
      } finally {
        setSearching(false);
      }
    },
    [applyMatch, query]
  );

  const goToPrevMatch = useCallback(() => {
    applyMatch(matchIndex - 1, matches);
  }, [applyMatch, matchIndex, matches]);

  const goToNextMatch = useCallback(() => {
    applyMatch(matchIndex + 1, matches);
  }, [applyMatch, matchIndex, matches]);

  const matchLabel =
    searching
      ? "Searching…"
      : matches.length > 0
        ? `${matchIndex + 1} / ${matches.length}`
        : "";

  return {
    query,
    setQuery,
    activeQuery,
    matchLabel,
    message,
    setMessage,
    searchDocument,
    goToPrevMatch,
    goToNextMatch,
  };
}
