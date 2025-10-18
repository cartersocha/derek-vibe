import { createOrganization } from "@/lib/actions/organizations";
import { OrganizationForm } from "@/components/organizations/organization-form";

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-[0.35em] text-[#00ffff]">
          Create Organization
        </h1>
        <p className="mt-2 text-sm text-[#94a3b8]">
          Establish a new faction, table, or group to link campaigns, sessions, and characters together.
        </p>
      </div>

      <OrganizationForm
        action={createOrganization}
        cancelHref="/organizations"
        submitLabel="Save Organization"
      />
    </div>
  );
}
