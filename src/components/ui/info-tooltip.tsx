"use client";

import { useState } from "react";

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex">
      {" "}
      {/* Changed from div */}
      <button
        type="button"
        className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-600 hover:text-white"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Mais informações"
      >
        i
      </button>
      {isVisible && (
        <span className="absolute left-1/2 top-full z-50 mt-2 block w-64 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-normal text-zinc-300 shadow-lg">
          <span className="absolute -top-1 left-1/2 block h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-zinc-700 bg-zinc-800" />
          {text}
        </span>
      )}
    </span>
  );
}
