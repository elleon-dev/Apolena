import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { supabase, isSupabaseConfigured } from "./supabase";

export const SUPABASE_MEDIA_BUCKET = "apolena-media";

export type StorageSubdir =
  | "artworks"
  | "previews"
  | "pets"
  | "proofs"
  | "characters"
  | "products"
  | string;

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// In-memory set to prevent redundant re-uploads of the same image hash in the same session
const uploadedHashes = new Set<string>();

/**
 * Ensures the target subdirectory inside `public/uploads/` exists (used for local offline fallback).
 */
function ensureUploadsSubdir(subdir: string): string {
  const fullDir = path.join(PUBLIC_UPLOADS_DIR, subdir);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
  return fullDir;
}

/**
 * Uploads a raw buffer directly to Supabase Storage with automatic fallback to local disk.
 * Returns the public URL of the uploaded asset.
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  subdir: StorageSubdir,
  fileName: string,
  contentType = "image/jpeg",
): Promise<string> {
  const objectPath = `${subdir}/${fileName}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .upload(objectPath, buffer, {
          contentType,
          upsert: true,
        });

      if (!error) {
        const { data } = supabase.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .getPublicUrl(objectPath);
        if (data?.publicUrl) {
          uploadedHashes.add(`${subdir}/${fileName}`);
          return data.publicUrl;
        }
      } else {
        console.warn(
          "[uploadBufferToStorage Supabase warning]:",
          error.message,
        );
      }
    } catch (e) {
      console.warn("[uploadBufferToStorage Supabase error]:", e);
    }
  }

  // Fallback to local public/uploads for offline development
  const targetDir = ensureUploadsSubdir(subdir);
  const fullPath = path.join(targetDir, fileName);
  fs.writeFileSync(fullPath, buffer);
  return `/uploads/${subdir}/${fileName}`;
}

/**
 * Converts a base64 `data:image/...` string into a compressed image,
 * uploads it to Supabase Storage (`apolena-media/<subdir>/<hash>.jpg`)
 * and returns its public CDN URL.
 *
 * If the input is already a URL (http/https or relative path) or null/undefined,
 * returns it unchanged.
 */
export async function externalizeBase64Image(
  inputUrl: string | null | undefined,
  subdir: StorageSubdir = "artworks",
  options?: { maxDimension?: number; quality?: number },
): Promise<string | null> {
  if (!inputUrl) return null;
  if (!inputUrl.startsWith("data:image/")) {
    return inputUrl;
  }

  try {
    const commaIdx = inputUrl.indexOf(",");
    if (commaIdx === -1) return inputUrl;

    const b64Data = inputUrl.substring(commaIdx + 1);
    const rawBuffer = Buffer.from(b64Data, "base64");

    // Deterministic content hash so identical images are deduplicated
    const hash = crypto
      .createHash("sha1")
      .update(rawBuffer)
      .digest("hex")
      .slice(0, 20);

    const fileName = `${hash}.jpg`;
    const objectKey = `${subdir}/${fileName}`;

    // If already uploaded in this session to Supabase, return its public URL immediately
    if (uploadedHashes.has(objectKey) && isSupabaseConfigured && supabase) {
      const { data } = supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .getPublicUrl(objectKey);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }

    const maxDim =
      options?.maxDimension ??
      (subdir === "artworks" ? 2048 : subdir === "characters" ? 900 : 1200);
    const quality = options?.quality ?? (subdir === "artworks" ? 88 : 82);

    const optimizedBuffer = await sharp(rawBuffer)
      .resize(maxDim, maxDim, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    return await uploadBufferToStorage(
      optimizedBuffer,
      subdir,
      fileName,
      "image/jpeg",
    );
  } catch (err) {
    console.warn("[externalizeBase64Image warning]:", err);
    return inputUrl;
  }
}

/**
 * Removes any residual base64 blobs from an object before storing in `email_queue.data`
 * so email logs remain tiny (< 2 KB per row).
 */
export function stripHeavyFieldsForEmailData(
  customizations?: Record<string, any> | null,
): Record<string, any> | null {
  if (!customizations || typeof customizations !== "object") return null;
  const copy: Record<string, any> = {};
  for (const [k, v] of Object.entries(customizations)) {
    if (k === "master_art_url") continue;
    if (typeof v === "string" && v.startsWith("data:image/")) {
      copy[k] = "[base64-image-omitted]";
    } else {
      copy[k] = v;
    }
  }
  return copy;
}
