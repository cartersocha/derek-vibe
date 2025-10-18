"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteImage,
  getStoragePathFromUrl,
  uploadImage,
} from "@/lib/supabase/storage";
import { characterSchema } from "@/lib/validations/schemas";
import { sanitizeNullableText, sanitizeText } from "@/lib/security/sanitize";
import { PlayerType } from "@/lib/characters/constants";

const CHARACTER_BUCKET = "character-images" as const;

export async function createCharacter(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const characterId = randomUUID();

  const imageFile = getFile(formData, "image");
  let imageUrl: string | null = null;

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

  const data = {
    name: getString(formData, "name"),
    race: getStringOrNull(formData, "race"),
    class: getStringOrNull(formData, "class"),
    level: getStringOrNull(formData, "level"),
    backstory: getStringOrNull(formData, "backstory"),
    image_url: imageUrl,
    player_type: (getString(formData, "player_type") || "npc") as PlayerType,
    last_known_location: getStringOrNull(formData, "last_known_location"),
  };

  const result = characterSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Validation failed");
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

export async function createCharacterInline(name: string): Promise<{
  id: string;
  name: string;
}> {
  const supabase = await createClient();
  const sanitized = sanitizeText(name).trim();

  if (!sanitized) {
    throw new Error("Character name is required");
  }

  const truncated = sanitized.slice(0, 100);
  const characterId = randomUUID();

  const { error } = await supabase.from("characters").insert({
    id: characterId,
    name: truncated,
    player_type: "npc",
  });

  if (error) {
    throw new Error(error.message);
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

  const data = {
    name: getString(formData, "name"),
    race: getStringOrNull(formData, "race"),
    class: getStringOrNull(formData, "class"),
    level: getStringOrNull(formData, "level"),
    backstory: getStringOrNull(formData, "backstory"),
    image_url: imageUrl,
    player_type: (getString(formData, "player_type") || "npc") as PlayerType,
    last_known_location: getStringOrNull(formData, "last_known_location"),
  };

  const result = characterSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Validation failed");
  }

  const { error } = await supabase
    .from("characters")
    .update(result.data)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
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

  const sessionsToRevalidate = new Set([...previousSessionIds, ...sessionIds]);
  sessionsToRevalidate.forEach((sessionId) => {
    revalidatePath(`/sessions/${sessionId}`);
  });
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  return sanitizeText(value).trim();
}

function getStringOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  return sanitizeNullableText(value);
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}
