"use client";

import Link from "next/link";
import type { ChangeEventHandler, ReactNode } from "react";

type IndexHeaderProps = {
  title: string;
  searchId?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: ChangeEventHandler<HTMLInputElement>;
  searchDisabled?: boolean;
  actionHref?: string;
  actionLabel?: string;
};

export function IndexHeader({
  title,
  searchId,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchDisabled,
  actionHref,
  actionLabel,
}: IndexHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="retro-title text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words">{title}</h1>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        {searchId && searchPlaceholder && searchValue !== undefined && onSearchChange && (
          <>
            <label className="sr-only" htmlFor={searchId}>
              Search {title.toLowerCase()}
            </label>
            <input
              id={searchId}
              value={searchValue}
              onChange={onSearchChange}
              type="search"
              disabled={searchDisabled}
              className="h-9 w-full rounded border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-primary)] focus:border-[var(--cyber-magenta)] focus:outline-none focus:ring-1 focus:ring-[var(--cyber-magenta)] disabled:border-opacity-20 disabled:text-[var(--text-muted)] sm:w-52"
            />
          </>
        )}
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="w-full rounded bg-[var(--cyber-magenta)] px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-black transition-all duration-200 shadow-lg shadow-[var(--cyber-magenta)]/50 hover:bg-[var(--cyber-magenta)]/80 sm:w-auto sm:px-5 sm:py-2.5 sm:text-sm"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

type IndexEmptyStateProps = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
};

export function IndexEmptyState({ title, description, actionHref, actionLabel }: IndexEmptyStateProps) {
  return (
    <div className="rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)]/50 p-12 text-center shadow-2xl backdrop-blur-sm">
      <h3 className="mb-2 text-lg font-medium uppercase tracking-wider text-[var(--cyber-cyan)]">{title}</h3>
      <p className="mb-6 font-mono text-sm text-[var(--text-secondary)]">{description}</p>
      <Link
        href={actionHref}
        className="inline-block w-full rounded bg-[var(--cyber-magenta)] px-4 py-2 text-center text-sm font-bold uppercase tracking-wider text-black transition-all duration-200 shadow-lg shadow-[var(--cyber-magenta)]/50 hover:bg-[var(--cyber-magenta)]/80 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

type IndexSearchEmptyStateProps = {
  message: string;
  icon?: ReactNode;
};

export function IndexSearchEmptyState({ message, icon }: IndexSearchEmptyStateProps) {
  return (
    <div className="rounded border border-dashed border-[var(--cyber-cyan)]/40 bg-[var(--bg-dark)]/60 p-8 text-center">
      {icon}
      <p className="font-mono text-sm text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}
