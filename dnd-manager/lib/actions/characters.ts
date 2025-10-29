"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { collectMentionTargets } from "@/lib/mentions";
import { assertUniqueValue } from "@/lib/supabase/ensure-unique";
import { createClient } from "@/lib/supabase/server";
import { 
  getString, 
  getFile, 
  getName, 
  getBackstory, 
  getLocation, 
  getRace, 
  getClass, 
  getLevel, 
  validateName,
  validateBackstory,
  validateLocation,
  validateRace,
  validateClass,
  validateLevel
} from '@/lib/utils/form-data'
import { STORAGE_BUCKETS } from '@/lib/utils/storage'
import {
  deleteImage,
  getStoragePathFromUrl,
  uploadImage,
} from "@/lib/supabase/storage";
import { characterSchema } from "@/lib/validations/schemas";
import { CharacterStatus, PlayerType } from "@/lib/characters/constants";
import { toTitleCase } from "@/lib/utils";
import {
  resolveGroupIds,
  setCharacterGroups,
  syncSessionGroupsFromCharacters,
} from "@/lib/actions/groups";
import { getIdList } from "@/lib/utils/form-data";
import { extractGroupIds } from "@/lib/groups/helpers";
import type { CharacterGroupAffiliationInput } from "@/lib/validations/group";

// Detects environments where `campaign_characters` table hasn't been created yet
const isMissingCampaignCharactersTable = (error: { message?: string | null; code?: string | null } | null | undefined) => {
  if (!error) {
    return false;
  }

  const code = error.code?.toUpperCase();
  if (code === "42P01") {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";
  return message.includes("campaign_characters");
};

// List characters with pagination
export async function getCharactersList(
  supabase: SupabaseClient,
  { limit = 20, offset = 0 } = {}
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const CHARACTER_BUCKET = STORAGE_BUCKETS.CHARACTERS;

export async function createCharacter(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const characterId = randomUUID();

  const groupFieldTouched =
    formData.get("group_field_present") === "true" ||
    formData.has("group_roles") ||
    formData.has("group_ids") ||
    formData.has("group_id");

  const selectedGroupIds = extractGroupIds(formData);
  const selectedCampaignIds = getIdList(formData, "campaign_ids");

  const imageFile = getFile(formData, "image");
  let imageUrl: string | null = null;

  const normalizedName = toTitleCase(getName(formData, "name"));

  // Validate name before proceeding
  if (!validateName(normalizedName)) {
    throw new Error("Invalid character name. Name must be between 1-100 characters and contain no dangerous content.");
  }

  await assertUniqueValue(supabase, {
    table: "characters",
    column: "name",
    value: normalizedName,
    errorMessage: "Character name already exists. Choose a different name.",
  });

  if (imageFile) {
    const { url, error } = await uploadImage(
      CHARACTER_BUCKET,
      imageFile,
      `characters/${characterId}`
    );

    if (error) {
      throw new Error(`Failed to upload character image: ${error.message}`);
    }

    imageUrl = url;
  }

  // Validate all input fields
  const race = getRace(formData, "race");
  const characterClass = getClass(formData, "class");
  const level = getLevel(formData, "level");
  const backstory = getBackstory(formData, "backstory");
  const location = getLocation(formData, "last_known_location");

  if (race && !validateRace(race)) {
    throw new Error("Invalid race. Race must be 50 characters or less and contain no dangerous content.");
  }
  if (characterClass && !validateClass(characterClass)) {
    throw new Error("Invalid class. Class must be 50 characters or less and contain no dangerous content.");
  }
  if (level && !validateLevel(level)) {
    throw new Error("Invalid level. Level must be 20 characters or less and contain no dangerous content.");
  }
  if (backstory && !validateBackstory(backstory)) {
    throw new Error("Invalid backstory. Backstory must be 10,000 characters or less and contain no dangerous content.");
  }
  if (location && !validateLocation(location)) {
    throw new Error("Invalid location. Location must be 200 characters or less and contain no dangerous content.");
  }

  const data = {
    name: normalizedName,
    race: race || null,
    class: characterClass || null,
    level: level || null,
    backstory: backstory || null,
    image_url: imageUrl,
    player_type: (getString(formData, "player_type") || "npc") as PlayerType,
    last_known_location: location || null,
    status: (getString(formData, "status") || "alive") as CharacterStatus,
  };

  const result = characterSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Validation failed");
  }

  let groupAffiliations: CharacterGroupAffiliationInput[] = selectedGroupIds.map(
    (groupId) => ({
      groupId,
      role: result.data.player_type,
    })
  );

  if (groupAffiliations.length === 0 && !groupFieldTouched) {
    const fallbackGroupIds = await resolveGroupIds(supabase, []);
    groupAffiliations = fallbackGroupIds.map((groupId) => ({
      groupId,
      role: result.data.player_type,
    }));
  }

  const { error } = await supabase
    .from("characters")
    .insert({ id: characterId, ...result.data });

  if (error) {
    if (imageUrl) {
      const path = getStoragePathFromUrl(CHARACTER_BUCKET, imageUrl);
      await deleteImage(CHARACTER_BUCKET, path);
    }
    throw new Error(error.message);
  }

  if (groupAffiliations.length > 0 || groupFieldTouched) {
    const touchedGroupIds = await setCharacterGroups(
      supabase,
      characterId,
      groupAffiliations
    );
    if (touchedGroupIds.length > 0) {
      revalidatePath("/groups");
      Array.from(new Set(touchedGroupIds)).forEach((groupId) => {
        revalidatePath(`/groups/${groupId}`);
      });
    }
  }

  // Sync campaign_characters if provided
  if (Array.isArray(selectedCampaignIds)) {
    // Clear existing links first
    const { error: deleteCampaignLinksError } = await supabase
      .from("campaign_characters")
      .delete()
      .eq("character_id", characterId);

    if (deleteCampaignLinksError) {
      if (!isMissingCampaignCharactersTable(deleteCampaignLinksError) && deleteCampaignLinksError.code !== "PGRST116") {
        throw new Error(deleteCampaignLinksError.message);
      }
    }

    // Only attempt inserts if table exists (i.e., delete did not fail due to missing table)
    if (!isMissingCampaignCharactersTable(deleteCampaignLinksError) && selectedCampaignIds.length > 0) {
      const inserts = Array.from(new Set(selectedCampaignIds)).map((campaignId) => ({
        campaign_id: campaignId,
        character_id: characterId,
      }));
      const { error: insertCampaignLinksError } = await supabase
        .from("campaign_characters")
        .insert(inserts);
      if (insertCampaignLinksError) {
        if (!isMissingCampaignCharactersTable(insertCampaignLinksError)) {
          throw new Error(insertCampaignLinksError.message);
        }
      } else {
        revalidatePath("/campaigns");
        Array.from(new Set(selectedCampaignIds)).forEach((campaignId) => {
          revalidatePath(`/campaigns/${campaignId}`);
        });
      }
    }
  }

  const newlyLinkedSessions = await ensureMentionedSessionsLinked(
    supabase,
    characterId,
    result.data.backstory ?? null
  );

  if (newlyLinkedSessions.length > 0) {
    revalidatePath("/sessions");
    newlyLinkedSessions.forEach(({ id: sessionId, campaign_id }) => {
      revalidatePath(`/sessions/${sessionId}`);
      if (campaign_id) {
        revalidatePath(`/campaigns/${campaign_id}`);
      }
    });
  }

  const redirectToRaw = formData.get("redirect_to");

  revalidatePath("/characters");

  if (typeof redirectToRaw === "string") {
    const trimmed = redirectToRaw.trim();
    if (trimmed.startsWith("/")) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const targetUrl = new URL(trimmed, origin);
      targetUrl.searchParams.set("newCharacterId", characterId);
      revalidatePath(targetUrl.pathname);
      redirect(
        `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
      );
    }
  }

  redirect("/characters");
}

export async function createCharacterInline(
  name: string,
  groupIds?: string[]
): Promise<{
  id: string;
  name: string;
}> {
  const supabase = await createClient();
  const sanitized = name.trim();

  if (!sanitized) {
    throw new Error("Character name is required");
  }

  const normalized = toTitleCase(sanitized);
  const truncated = normalized.slice(0, 100);
  await assertUniqueValue(supabase, {
    table: "characters",
    column: "name",
    value: truncated,
    errorMessage: "Character name already exists. Choose a different name.",
  });
  const characterId = randomUUID();
  const { error } = await supabase.from("characters").insert({
    id: characterId,
    name: truncated,
    player_type: "npc",
    status: "alive",
  });

  if (error) {
    throw new Error(error.message);
  }

  // Only assign groups if explicitly provided
  const desiredGroupIds = Array.isArray(groupIds) && groupIds.length > 0
    ? groupIds
    : [];

  // Don't call resolveGroupIds for fallback - just use what's explicitly provided
  if (desiredGroupIds.length > 0) {
    const affiliations = desiredGroupIds.map((groupId) => ({
      groupId,
      role: "npc" as CharacterGroupAffiliationInput["role"],
    }));

    const touchedGroupIds = await setCharacterGroups(
      supabase,
      characterId,
      affiliations
    );
    if (touchedGroupIds.length > 0) {
      revalidatePath("/groups");
      Array.from(new Set(touchedGroupIds)).forEach((groupId) => {
        revalidatePath(`/groups/${groupId}`);
      });
    }
  }

  revalidatePath("/characters");

  return {
    id: characterId,
    name: truncated,
  };
}

export async function updateCharacter(
  id: string,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const groupFieldTouched =
    formData.get("group_field_present") === "true" ||
    formData.has("group_roles") ||
    formData.has("group_ids") ||
    formData.has("group_id");

  const selectedGroupIds = extractGroupIds(formData);
  const selectedCampaignIds = getIdList(formData, "campaign_ids");

  const { data: existing, error: fetchError } = await supabase
    .from("characters")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error("Character not found");
  }

  const imageFile = getFile(formData, "image");
  const removeImage = formData.get("image_remove") === "true";
  let imageUrl = existing.image_url;

  const normalizedName = toTitleCase(getName(formData, "name"));

  // Validate name before proceeding
  if (!validateName(normalizedName)) {
    throw new Error("Invalid character name. Name must be between 1-100 characters and contain no dangerous content.");
  }

  await assertUniqueValue(supabase, {
    table: "characters",
    column: "name",
    value: normalizedName,
    excludeId: id,
    errorMessage: "Character name already exists. Choose a different name.",
  });

  if (imageFile) {
    const { url, path, error } = await uploadImage(
      CHARACTER_BUCKET,
      imageFile,
      `characters/${id}`
    );

    if (error) {
      throw new Error(`Failed to upload character image: ${error.message}`);
    }

    const previousPath = getStoragePathFromUrl(CHARACTER_BUCKET, imageUrl);
    if (previousPath && previousPath !== path) {
      const { error: deletePreviousError } = await deleteImage(
        CHARACTER_BUCKET,
        previousPath
      );

      if (deletePreviousError) {
        console.error(
          "Failed to remove previous character image",
          deletePreviousError
        );
      }
    }

    imageUrl = url;
  } else if (removeImage && imageUrl) {
    const path = getStoragePathFromUrl(CHARACTER_BUCKET, imageUrl);
    const { error } = await deleteImage(CHARACTER_BUCKET, path);

    if (error) {
      throw new Error(`Failed to delete character image: ${error.message}`);
    }

    imageUrl = null;
  }

  // Validate all input fields
  const race = getRace(formData, "race");
  const characterClass = getClass(formData, "class");
  const level = getLevel(formData, "level");
  const backstory = getBackstory(formData, "backstory");
  const location = getLocation(formData, "last_known_location");

  if (race && !validateRace(race)) {
    throw new Error("Invalid race. Race must be 50 characters or less and contain no dangerous content.");
  }
  if (characterClass && !validateClass(characterClass)) {
    throw new Error("Invalid class. Class must be 50 characters or less and contain no dangerous content.");
  }
  if (level && !validateLevel(level)) {
    throw new Error("Invalid level. Level must be 20 characters or less and contain no dangerous content.");
  }
  if (backstory && !validateBackstory(backstory)) {
    throw new Error("Invalid backstory. Backstory must be 10,000 characters or less and contain no dangerous content.");
  }
  if (location && !validateLocation(location)) {
    throw new Error("Invalid location. Location must be 200 characters or less and contain no dangerous content.");
  }

  const data = {
    name: normalizedName,
    race: race || null,
    class: characterClass || null,
    level: level || null,
    backstory: backstory || null,
    image_url: imageUrl,
    player_type: (getString(formData, "player_type") || "npc") as PlayerType,
    last_known_location: location || null,
    status: (getString(formData, "status") || "alive") as CharacterStatus,
  };

  const result = characterSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Validation failed");
  }

  const groupAffiliations: CharacterGroupAffiliationInput[] = selectedGroupIds.map(
    (groupId) => ({
      groupId,
      role: result.data.player_type,
    })
  );

  const { error } = await supabase
    .from("characters")
    .update(result.data)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (groupFieldTouched || groupAffiliations.length > 0) {
    const touchedGroupIds = await setCharacterGroups(
      supabase,
      id,
      groupAffiliations
    );
    if (touchedGroupIds.length > 0) {
      revalidatePath("/groups");
      Array.from(new Set(touchedGroupIds)).forEach((groupId) => {
        revalidatePath(`/groups/${groupId}`);
      });

      // Sync groups to ALL sessions this character is in
      const { data: characterSessions } = await supabase
        .from('session_characters')
        .select('session_id')
        .eq('character_id', id);

      const sessionIds = characterSessions?.map(sc => sc.session_id) || [];
      
      if (sessionIds.length > 0) {
        revalidatePath("/sessions");
        for (const sessionId of sessionIds) {
          await syncSessionGroupsFromCharacters(supabase, sessionId);
          revalidatePath(`/sessions/${sessionId}`);
        }
      }
    }
  }

  // Sync campaign_characters if list provided in the form
  if (Array.isArray(selectedCampaignIds)) {
    const { error: deleteCampaignLinksError } = await supabase
      .from("campaign_characters")
      .delete()
      .eq("character_id", id);

    if (deleteCampaignLinksError) {
      if (!isMissingCampaignCharactersTable(deleteCampaignLinksError) && deleteCampaignLinksError.code !== "PGRST116") {
        throw new Error(deleteCampaignLinksError.message);
      }
    }

    // Only attempt inserts if table exists
    if (!isMissingCampaignCharactersTable(deleteCampaignLinksError) && selectedCampaignIds.length > 0) {
      const inserts = Array.from(new Set(selectedCampaignIds)).map((campaignId) => ({
        campaign_id: campaignId,
        character_id: id,
      }));
      const { error: insertCampaignLinksError } = await supabase
        .from("campaign_characters")
        .insert(inserts);
      if (insertCampaignLinksError) {
        if (!isMissingCampaignCharactersTable(insertCampaignLinksError)) {
          throw new Error(insertCampaignLinksError.message);
        }
      } else {
        revalidatePath("/campaigns");
        Array.from(new Set(selectedCampaignIds)).forEach((campaignId) => {
          revalidatePath(`/campaigns/${campaignId}`);
        });
      }
    }
  }

  const newlyLinkedSessions = await ensureMentionedSessionsLinked(
    supabase,
    id,
    result.data.backstory ?? null
  );

  if (newlyLinkedSessions.length > 0) {
    revalidatePath("/sessions");
    for (const { id: sessionId, campaign_id } of newlyLinkedSessions) {
      await syncSessionGroupsFromCharacters(supabase, sessionId);
      revalidatePath(`/sessions/${sessionId}`);
      if (campaign_id) {
        revalidatePath(`/campaigns/${campaign_id}`);
      }
    }
  }

  revalidatePath("/characters");
  revalidatePath(`/characters/${id}`);
  redirect(`/characters/${id}`);
}

export async function deleteCharacter(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("characters")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(fetchError.message);
  }

  const { error } = await supabase.from("characters").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (existing?.image_url) {
    const path = getStoragePathFromUrl(CHARACTER_BUCKET, existing.image_url);
    const { error: storageError } = await deleteImage(CHARACTER_BUCKET, path);

    if (storageError) {
      console.error("Failed to remove character image from storage", storageError);
    }
  }

  revalidatePath("/characters");
  redirect("/characters");
}

export async function updateCharacterSessions(
  id: string,
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const sessionIds = Array.from(new Set(formData.getAll("session_ids") as string[]));

  const { data: existingLinks, error: fetchError } = await supabase
    .from("session_characters")
    .select("session_id")
    .eq("character_id", id);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const previousSessionIds = new Set(existingLinks?.map((link) => link.session_id) || []);

  const { error: deleteError } = await supabase
    .from("session_characters")
    .delete()
    .eq("character_id", id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (sessionIds.length > 0) {
    const inserts = sessionIds.map((sessionId) => ({
      session_id: sessionId,
      character_id: id,
    }));

    const { error: insertError } = await supabase
      .from("session_characters")
      .insert(inserts);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  revalidatePath("/characters");
  revalidatePath(`/characters/${id}`);
  revalidatePath("/sessions");

  // Sync groups for all affected sessions
  const sessionsToRevalidate = new Set([...previousSessionIds, ...sessionIds]);
  for (const sessionId of sessionsToRevalidate) {
    await syncSessionGroupsFromCharacters(supabase, sessionId);
    revalidatePath(`/sessions/${sessionId}`);
  }
}

async function ensureMentionedSessionsLinked(
  supabase: SupabaseClient,
  characterId: string,
  backstory: string | null
): Promise<Array<{ id: string; campaign_id: string | null }>> {
  const trimmed = backstory?.trim();

  if (!trimmed) {
    return [];
  }

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, name, campaign_id")
    .returns<Array<{ id: string; name: string; campaign_id: string | null }>>();

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  if (!sessionsData || sessionsData.length === 0) {
    return [];
  }

  const sessionTargets = sessionsData
    .filter((session) => Boolean(session.name))
    .map((session) => ({
      id: session.id,
      name: session.name,
      href: `/sessions/${session.id}`,
      kind: "session" as const,
    }));

  if (sessionTargets.length === 0) {
    return [];
  }

  const mentionedSessions = collectMentionTargets(trimmed, sessionTargets, "session");

  if (mentionedSessions.length === 0) {
    return [];
  }

  const { data: existingLinks, error: existingError } = await supabase
    .from("session_characters")
    .select("session_id")
    .eq("character_id", characterId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingIds = new Set(existingLinks?.map((link) => link.session_id) ?? []);

  const newSessionIds = mentionedSessions
    .map((session) => session.id)
    .filter((sessionId) => !existingIds.has(sessionId));

  if (newSessionIds.length === 0) {
    return [];
  }

  const inserts = newSessionIds.map((sessionId) => ({
    session_id: sessionId,
    character_id: characterId,
  }));

  const { error: insertError } = await supabase
    .from("session_characters")
    .insert(inserts);

  if (insertError) {
    throw new Error(insertError.message);
  }

  const campaignLookup = new Map(
    sessionsData.map((session) => [session.id, session.campaign_id ?? null])
  );

  return newSessionIds.map((sessionId) => ({
    id: sessionId,
    campaign_id: campaignLookup.get(sessionId) ?? null,
  }));
}
