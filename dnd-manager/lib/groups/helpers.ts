import {
  groupIdSchema,
  groupRoleSchema,
  type CharacterGroupAffiliationInput,
} from "@/lib/validations/group";

export function extractGroupIds(
  formData: FormData,
  field = "group_ids"
): string[] {
  const rawValues = formData
    .getAll(field)
    .filter((value): value is string => typeof value === "string");

  const collected = rawValues.filter(Boolean);

  const singleFallback = formData.get("group_id");
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

  return unique.filter((id) => groupIdSchema.safeParse(id).success);
}

export function extractCharacterGroupAffiliations(
  formData: FormData,
  field = "group_roles",
  defaultRole: CharacterGroupAffiliationInput["role"] = "npc"
): CharacterGroupAffiliationInput[] {
  const rawValues = formData
    .getAll(field)
    .filter((value): value is string => typeof value === "string");

  const parsed: CharacterGroupAffiliationInput[] = [];

  for (const entry of rawValues) {
    const [groupIdPart, rolePart] = entry.split(":");

    if (!groupIdPart || !rolePart) {
      continue;
    }

    const groupIdResult = groupIdSchema.safeParse(groupIdPart.trim());
    const roleResult = groupRoleSchema.safeParse(
      rolePart.trim() as CharacterGroupAffiliationInput["role"]
    );

    if (groupIdResult.success && roleResult.success) {
      parsed.push({
        groupId: groupIdResult.data,
        role: roleResult.data,
      });
    }
  }

  if (parsed.length === 0) {
    const ids = extractGroupIds(formData);
    return ids.map((groupId) => ({
      groupId,
      role: defaultRole,
    }));
  }

  const deduped = new Map<string, CharacterGroupAffiliationInput>();
  parsed.forEach((affiliation) => {
    deduped.set(affiliation.groupId, affiliation);
  });

  return Array.from(deduped.values());
}
