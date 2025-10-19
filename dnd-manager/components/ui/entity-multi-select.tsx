"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type EntityOption = {
  value: string;
  label: string;
  hint?: string | null;
};

interface EntityMultiSelectProps {
  id: string;
  name: string;
  options: EntityOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function EntityMultiSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = "Select items",
  emptyMessage = "No items available",
}: EntityMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const normalizedSelections = useMemo(() => {
    const unique = new Set<string>();
    return value.filter((entry) => {
      if (!entry || unique.has(entry)) {
        return false;
      }
      unique.add(entry);
      return true;
    });
  }, [value]);

  const filteredOptions = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(trimmed));
  }, [options, searchTerm]);

  useEffect(() => {
    if (open) return;
    setSearchTerm("");
  }, [open]);

  const summary = (() => {
    if (normalizedSelections.length === 0) {
      return placeholder;
    }

    const labels = normalizedSelections
      .map((selection) => options.find((option) => option.value === selection)?.label)
      .filter(Boolean) as string[];

    if (labels.length === 0) {
      return placeholder;
    }
    if (labels.length <= 2) {
      return labels.join(", ");
    }
    return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
  })();

  const toggleSelection = (selection: string) => {
    onChange(
      normalizedSelections.includes(selection)
        ? normalizedSelections.filter((current) => current !== selection)
        : [...normalizedSelections, selection]
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {normalizedSelections.map((selection) => (
        <input key={selection} type="hidden" name={name} value={selection} />
      ))}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-dropdown`}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[#0f0f23] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff] ${
          open
            ? "border-[#ff00ff] text-[#ff00ff] shadow-lg shadow-[#ff00ff]/30"
            : normalizedSelections.length > 0
            ? "border-[#00ffff] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff]"
            : "border-[#00ffff] text-gray-500 hover:border-[#ff00ff] hover:text-[#ff00ff]"
        }`}
      >
        <span className="truncate text-left">{summary}</span>
        <span className="text-xs text-[#ff00ff]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          id={`${id}-dropdown`}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-2xl shadow-[#00ffff]/20"
        >
          <div className="border-b border-[#1a1a3e] px-3 py-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search"
              className="w-full rounded bg-[#0a0a1f] px-3 py-2 text-sm text-[#00ffff] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff00ff]"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs font-mono text-gray-500">{emptyMessage}</p>
            ) : (
              <ul className="divide-y divide-[#1a1a3e]">
                {filteredOptions.map((option) => {
                  const checked = normalizedSelections.includes(option.value);
                  return (
                    <li key={option.value}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[#00ffff] transition-colors duration-150 hover:bg-[#1a1a3e]/60">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelection(option.value)}
                          className="h-4 w-4 rounded border-[#00ffff]/40 bg-[#0f0f23] text-[#ff00ff] focus:ring-[#ff00ff]"
                        />
                        <span className="flex-1">
                          <span className="block truncate font-semibold uppercase tracking-[0.25em]">
                            {option.label}
                          </span>
                          {option.hint ? (
                            <span className="text-[10px] uppercase tracking-[0.3em] text-[#64748b]">
                              {option.hint}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#00ffff]/20 bg-[#050517] px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#00ffff] transition hover:text-[#ff00ff]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded bg-[#ff00ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#cc00cc]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
