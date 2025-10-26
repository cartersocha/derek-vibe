"use client";

import Link from "next/link";
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
  createOption?: {
    href: string;
    label: string;
  };
}

export function EntityMultiSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = "Select items",
  emptyMessage = "No items available",
  createOption,
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
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] ${
          open
            ? "border-[var(--cyber-magenta)] text-[var(--cyber-magenta)] shadow-lg shadow-[var(--cyber-magenta)]/30"
            : normalizedSelections.length > 0
            ? "border-[var(--cyber-cyan)] text-[var(--cyber-cyan)] hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
            : "border-[var(--cyber-cyan)] text-[var(--text-muted)] hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
        }`}
      >
        <span className="truncate text-left">{summary}</span>
        <span className="text-xs text-[var(--cyber-magenta)]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          id={`${id}-dropdown`}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] shadow-2xl shadow-[var(--cyber-cyan)]/20"
        >
          <div className="border-b border-[var(--bg-card)] px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search"
                className="w-full rounded bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--cyber-cyan)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)]"
              />
              {createOption ? (
                <Link
                  href={createOption.href}
                  onClick={() => setOpen(false)}
                  className="whitespace-nowrap rounded border border-dashed border-[var(--cyber-magenta)]/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--cyber-magenta)] transition hover:border-[var(--cyber-magenta)] hover:bg-[var(--bg-card)]/60"
                >
                  + {createOption.label}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs font-mono text-[var(--text-muted)]">{emptyMessage}</p>
            ) : (
              <ul className="divide-y divide-[var(--bg-card)]">
                {filteredOptions.map((option) => {
                  const checked = normalizedSelections.includes(option.value);
                  return (
                    <li key={option.value}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[var(--cyber-cyan)] transition-colors duration-150 hover:bg-[var(--bg-card)]/60">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelection(option.value)}
                          className="h-4 w-4 rounded border-[var(--cyber-cyan)]/40 bg-[var(--bg-dark)] text-[var(--cyber-magenta)] focus:ring-[var(--cyber-magenta)]"
                        />
                        <span className="flex-1">
                          <span className="block truncate font-semibold uppercase tracking-[0.25em]">
                            {option.label}
                          </span>
                          {option.hint ? (
                            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
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

          <div className="flex items-center justify-between gap-2 border-t border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className="rounded px-[var(--pill-padding-x-medium)] py-[var(--pill-padding-y-medium)] text-xs font-bold uppercase tracking-wider text-[var(--cyber-cyan)] transition hover:text-[var(--cyber-magenta)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded bg-[var(--cyber-magenta)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[var(--cyber-magenta)]/80"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
