import {
  organizationIdSchema,
  organizationRoleSchema,
  type CharacterOrganizationAffiliationInput,
} from "@/lib/validations/organization";

export function extractOrganizationIds(
  formData: FormData,
  field = "organization_ids"
): string[] {
  const rawValues = formData
    .getAll(field)
    .filter((value): value is string => typeof value === "string");

  const collected = rawValues.filter(Boolean);

  const singleFallback = formData.get("organization_id");
  if (
    collected.length === 0 &&
    typeof singleFallback === "string" &&
    singleFallback.trim()
  ) {
    collected.push(singleFallback.trim());
  }

  const unique = Array.from(
    new Set(collected.map((value) => value.trim()))
  ).filter(Boolean);

  if (unique.length === 0) {
    return [];
  }

  return unique.filter((id) => organizationIdSchema.safeParse(id).success);
}

export function extractCharacterOrganizationAffiliations(
  formData: FormData,
  field = "organization_roles",
  defaultRole: CharacterOrganizationAffiliationInput["role"] = "npc"
): CharacterOrganizationAffiliationInput[] {
  const rawValues = formData
    .getAll(field)
    .filter((value): value is string => typeof value === "string");

  const parsed: CharacterOrganizationAffiliationInput[] = [];

  for (const entry of rawValues) {
    const [orgIdPart, rolePart] = entry.split(":");

    if (!orgIdPart || !rolePart) {
      continue;
    }

    const orgIdResult = organizationIdSchema.safeParse(orgIdPart.trim());
    const roleResult = organizationRoleSchema.safeParse(
      rolePart.trim() as CharacterOrganizationAffiliationInput["role"]
    );

    if (orgIdResult.success && roleResult.success) {
      parsed.push({
        organizationId: orgIdResult.data,
        role: roleResult.data,
      });
    }
  }

  if (parsed.length === 0) {
    const ids = extractOrganizationIds(formData);
    return ids.map((organizationId) => ({
      organizationId,
      role: defaultRole,
    }));
  }

  const deduped = new Map<string, CharacterOrganizationAffiliationInput>();
  parsed.forEach((affiliation) => {
    deduped.set(affiliation.organizationId, affiliation);
  });

  return Array.from(deduped.values());
}
