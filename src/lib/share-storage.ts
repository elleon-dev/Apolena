import fs from "fs";
import path from "path";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  externalizeBase64Image,
  SUPABASE_MEDIA_BUCKET,
  uploadBufferToStorage,
} from "@/lib/image-storage";

export interface SharedCreationRecord {
  id: string;
  imageUrl: string;
  themeName: string;
  characterId: string;
  petName?: string | null;
  frameName?: string | null;
  format?: "story" | "post";
  createdAt: string;
}

const SHARE_ID_REGEX = /^[a-zA-Z0-9_-]{6,32}$/;

export async function saveSharedCreation(input: {
  cardDataUrl: string;
  themeName: string;
  characterId: string;
  petName?: string | null;
  frameName?: string | null;
  format?: "story" | "post";
}): Promise<SharedCreationRecord> {
  const shareId = crypto.randomBytes(6).toString("hex");

  const imageUrl =
    (await externalizeBase64Image(input.cardDataUrl, "shares", {
      maxDimension: 1400,
      quality: 88,
    })) || input.cardDataUrl;

  const record: SharedCreationRecord = {
    id: shareId,
    imageUrl,
    themeName: (input.themeName || "Retrato Personalizado").trim().slice(0, 100),
    characterId: (input.characterId || "").trim().slice(0, 100),
    petName: input.petName?.trim() ? input.petName.trim().slice(0, 40) : null,
    frameName: input.frameName?.trim()
      ? input.frameName.trim().slice(0, 80)
      : null,
    format: input.format === "post" ? "post" : "story",
    createdAt: new Date().toISOString(),
  };

  const jsonBuffer = Buffer.from(JSON.stringify(record), "utf8");
  await uploadBufferToStorage(
    jsonBuffer,
    "shares",
    `${shareId}.json`,
    "application/json",
  );

  return record;
}

export async function getSharedCreationById(
  id: string,
): Promise<SharedCreationRecord | null> {
  const cleanId = (id || "").trim();
  if (!SHARE_ID_REGEX.test(cleanId)) return null;

  // 1. Intentar leer desde Supabase Storage (producción y desarrollo con Supabase)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .download(`shares/${cleanId}.json`);
      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text) as SharedCreationRecord;
        if (parsed?.id && parsed?.imageUrl) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[getSharedCreationById Supabase fallback]:", err);
    }
  }

  // 2. Fallback a disco local (public/uploads/shares/<id>.json)
  try {
    const localPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "shares",
      `${cleanId}.json`,
    );
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, "utf8");
      const parsed = JSON.parse(raw) as SharedCreationRecord;
      if (parsed?.id && parsed?.imageUrl) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[getSharedCreationById local fallback]:", err);
  }

  return null;
}
