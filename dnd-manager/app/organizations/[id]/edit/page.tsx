import { notFound } from "next/navigation";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { DeleteOrganizationButton } from "@/components/ui/delete-organization-button";
import { deleteOrganization, updateOrganization } from "@/lib/actions/organizations";
import { createClient } from "@/lib/supabase/server";

export default async function EditOrganizationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, logo_url")
    .eq("id", params.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      notFound();
    }
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const organization = data;

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateOrganization(params.id, formData);
  }

  async function handleDelete() {
    "use server";
    await deleteOrganization(params.id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-[0.35em] text-[#00ffff]">
          Edit Organization
        </h1>
        <p className="mt-2 text-sm text-[#94a3b8]">
          Update the details below or replace the current logo. Removing the logo will fall back to the default icon.
        </p>
      </div>

      <OrganizationForm
        action={handleUpdate}
        cancelHref={`/organizations/${params.id}`}
        defaultValues={{ name: organization.name, description: organization.description }}
        logoUrl={organization.logo_url}
        showLogoRemove
        submitLabel="Save Changes"
      />

      <section className="space-y-4 rounded border border-red-500/30 bg-[#150616] p-6">
        <div>
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-red-400">
            Danger Zone
          </h2>
          <p className="mt-2 text-sm text-[#f8c4d9]">
            Deleting this organization removes its affiliations. Campaigns, sessions, and characters remain in your vault.
          </p>
        </div>
        <form action={handleDelete}>
          <DeleteOrganizationButton />
        </form>
      </section>
    </div>
  );
}
