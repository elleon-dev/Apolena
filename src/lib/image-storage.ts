import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Ensures the target subdirectory inside `public/uploads/` exists.
 */
function ensureUploadsSubdir(subdir: string): string {
  const fullDir = path.join(PUBLIC_UPLOADS_DIR, subdir);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
  return fullDir;
}

/**
 * Converts a base64 `data:image/...` string into a compressed file on disk
 * inside `public/uploads/<subdir>/` and returns its lightweight public URL
 * (e.g. `/uploads/artworks/a1b2c3d4.jpg`).
 *
 * If the input is already a short URL or null/undefined, returns it unchanged.
 */
export async function externalizeBase64Image(
  inputUrl: string | null | undefined,
  subdir: "artworks" | "previews" | "pets" | "proofs" | "characters" = "artworks",
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

    // Deterministic content hash so identical images are deduplicated on disk
    const hash = crypto
      .createHash("sha1")
      .update(rawBuffer)
      .digest("hex")
      .slice(0, 20);

    const fileName = `${hash}.jpg`;
    const relUrl = `/uploads/${subdir}/${fileName}`;
    const targetDir = ensureUploadsSubdir(subdir);
    const fullPath = path.join(targetDir, fileName);

    if (fs.existsSync(fullPath)) {
      return relUrl;
    }

    const maxDim =
      options?.maxDimension ??
      (subdir === "artworks" ? 2048 : subdir === "characters" ? 900 : 1200);
    const quality =
      options?.quality ?? (subdir === "artworks" ? 88 : 82);

    const optimizedBuffer = await sharp(rawBuffer)
      .resize(maxDim, maxDim, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    fs.writeFileSync(fullPath, optimizedBuffer);
    return relUrl;
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
