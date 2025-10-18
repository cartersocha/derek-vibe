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
    level: getNumberOrNull(formData, "level"),
    backstory: getStringOrNull(formData, "backstory"),
    strength: getNumberOrNull(formData, "strength"),
    dexterity: getNumberOrNull(formData, "dexterity"),
    constitution: getNumberOrNull(formData, "constitution"),
    intelligence: getNumberOrNull(formData, "intelligence"),
    wisdom: getNumberOrNull(formData, "wisdom"),
    charisma: getNumberOrNull(formData, "charisma"),
    image_url: imageUrl,
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

  revalidatePath("/characters");
  redirect("/characters");
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
    level: getNumberOrNull(formData, "level"),
    backstory: getStringOrNull(formData, "backstory"),
    strength: getNumberOrNull(formData, "strength"),
    dexterity: getNumberOrNull(formData, "dexterity"),
    constitution: getNumberOrNull(formData, "constitution"),
    intelligence: getNumberOrNull(formData, "intelligence"),
    wisdom: getNumberOrNull(formData, "wisdom"),
    charisma: getNumberOrNull(formData, "charisma"),
    image_url: imageUrl,
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
  redirect("/characters");
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

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStringOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getNumberOrNull(formData: FormData, key: string): number | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}
