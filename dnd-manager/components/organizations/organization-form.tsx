import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface OrganizationFormProps {
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  defaultValues?: {
    name?: string;
    description?: string | null;
  };
  logoUrl?: string | null;
  submitLabel: string;
  showLogoRemove?: boolean;
  children?: ReactNode;
}

export function OrganizationForm({
  action,
  cancelHref,
  defaultValues,
  logoUrl,
  submitLabel,
  showLogoRemove = false,
  children,
}: OrganizationFormProps) {
  return (
    <form
      action={action}
      className="space-y-6 rounded border border-[#00ffff]/20 bg-[#0f0f23] p-6 shadow-[0_0_25px_rgba(0,255,255,0.08)]"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
        >
          Organization Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={defaultValues?.name ?? ""}
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40"
          placeholder="Waterdeep Adventurers Guild"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded border border-[#00ffff]/30 bg-[#050517] px-4 py-3 text-[#e2e8f0] outline-none transition focus:border-[#ff00ff] focus:ring-2 focus:ring-[#ff00ff]/40"
          placeholder="Share the mission, history, or vibe of this organization."
        />
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="logo"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff]"
          >
            Logo
          </label>
          <input
            type="file"
            id="logo"
            name="logo"
            accept="image/*"
            className="block w-full text-sm text-[#94a3b8] file:mr-4 file:rounded file:border-0 file:bg-[#00ffff] file:px-4 file:py-2 file:text-sm file:font-semibold file:tracking-[0.25em] file:text-black hover:file:bg-[#ff00ff]"
          />
          <p className="mt-2 text-xs text-[#64748b]">
            Optional image to represent the organization. PNG or SVG works best.
          </p>
        </div>

        {logoUrl ? (
          <div className="flex items-center gap-4 rounded border border-[#00ffff]/20 bg-[#050517] p-3">
            <div className="relative h-16 w-16 overflow-hidden rounded border border-[#00ffff]/30">
              <Image src={logoUrl} alt="Current logo" fill sizes="64px" className="object-contain" />
            </div>
            <div className="text-xs text-[#94a3b8]">
              <p className="font-semibold uppercase tracking-[0.3em] text-[#00ffff]">Current Logo</p>
              <p>Upload a new file to replace the existing image.</p>
            </div>
          </div>
        ) : null}

        {showLogoRemove && logoUrl ? (
          <label className="flex items-center gap-3 text-xs text-[#94a3b8]">
            <input
              type="checkbox"
              name="logo_remove"
              value="true"
              className="h-4 w-4 rounded border-[#00ffff]/40 bg-[#050517] text-[#ff00ff] focus:ring-[#ff00ff]"
            />
            Remove current logo
          </label>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="flex-1 rounded bg-[#ff00ff] px-4 py-3 text-sm font-bold uppercase tracking-[0.35em] text-black transition hover:bg-[#d400d4]"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="flex-1 rounded border border-[#00ffff]/30 px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff] transition hover:border-[#ff00ff] hover:text-[#ff00ff]"
        >
          Cancel
        </Link>
      </div>

      {children}
    </form>
  );
}
