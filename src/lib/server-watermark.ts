import fs from "fs";
import path from "path";
import sharp from "sharp";
import { externalizeBase64Image } from "@/lib/image-storage";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface MasterArtworkVaultEntry {
  jobId: string;
  masterVariants: Record<string, string>; // variantId -> clean HD imageUrl
  watermarkedVariants: Record<string, string>; // variantId -> watermarked preview dataUrl
  createdAt: string;
}

const VAULT_FILE_PATH = path.join(
  process.cwd(),
  ".apolena-master-art-vault.json",
);

const globalForVault = globalThis as unknown as {
  masterArtVault?: Map<string, MasterArtworkVaultEntry>;
};

const memoryVault: Map<string, MasterArtworkVaultEntry> =
  globalForVault.masterArtVault ?? new Map();
if (process.env.NODE_ENV !== "production") {
  globalForVault.masterArtVault = memoryVault;
}

function loadVaultFromDisk(): void {
  try {
    if (fs.existsSync(VAULT_FILE_PATH)) {
      const raw = fs.readFileSync(VAULT_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw) as Record<string, MasterArtworkVaultEntry>;
      for (const [k, v] of Object.entries(parsed)) {
        memoryVault.set(k, v);
      }
    }
  } catch {
    // ignore
  }
}

function persistVaultToDisk(): void {
  try {
    const obj: Record<string, MasterArtworkVaultEntry> = {};
    // Keep last 60 jobs on disk so file stays small
    const entries = Array.from(memoryVault.entries()).slice(-60);
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(obj), "utf8");
  } catch {
    // ignore
  }
}

/**
 * Resolves any data URI, local public file, or remote URL into a Buffer
 */
export async function resolveSourceToBuffer(source: string): Promise<Buffer> {
  if (source.startsWith("data:")) {
    const commaIdx = source.indexOf(",");
    const b64 = source.substring(commaIdx + 1);
    return Buffer.from(b64, "base64");
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    if (!source.includes("localhost") && !source.includes("127.0.0.1")) {
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Failed to fetch image: ${source}`);
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    }
  }

  const cleanRel = source.replace(/^https?:\/\/[^\/]+/, "").replace(/^\//, "");
  const localFile = path.join(process.cwd(), "public", cleanRel);
  if (fs.existsSync(localFile)) {
    return fs.readFileSync(localFile);
  }

  throw new Error(`Could not resolve source buffer for ${source.slice(0, 50)}`);
}

/**
 * Burns the official Apolena logo (`public/logo.png`) and repeating diagonal
 * security watermark directly into the pixel buffer on the server, downscaling
 * the preview to web resolution (max 860px, JPEG q=80) so the browser never
 * receives the clean 300 DPI master file during studio preview.
 */
export async function burnServerSideWatermark(
  sourceImageUrl: string,
): Promise<string> {
  try {
    const srcBuffer = await resolveSourceToBuffer(sourceImageUrl);
    const baseImage = sharp(srcBuffer);
    const meta = await baseImage.metadata();

    const origW = meta.width || 1024;
    const origH = meta.height || 1536;

    const maxPreviewDim = 860;
    const scale = Math.min(maxPreviewDim / origW, maxPreviewDim / origH, 1);
    const width = Math.max(320, Math.round(origW * scale));
    const height = Math.max(320, Math.round(origH * scale));

    // Prepare official logo and pre-rendered watermark text PNGs as base64.
    // Using pre-rendered PNGs avoids librsvg/fontconfig tofu boxes ("□□□") on
    // Vercel serverless Linux where system fonts (Georgia/Arial) are not installed.
    let logoDataUri = "";
    const logoLightPath = path.join(process.cwd(), "public", "logo-light.png");
    const logoNormalPath = path.join(process.cwd(), "public", "logo.png");
    const chosenLogoPath = fs.existsSync(logoLightPath)
      ? logoLightPath
      : logoNormalPath;
    if (fs.existsSync(chosenLogoPath)) {
      const resizedLogoBuf = await sharp(chosenLogoPath)
        .resize({ width: 160, withoutEnlargement: true })
        .png()
        .toBuffer();
      logoDataUri = `data:image/png;base64,${resizedLogoBuf.toString("base64")}`;
    }

    let tileTextDataUri = "";
    const tileTextPath = path.join(
      process.cwd(),
      "public",
      "watermarks",
      "wm-tile-text.png",
    );
    if (fs.existsSync(tileTextPath)) {
      tileTextDataUri = `data:image/png;base64,${fs.readFileSync(tileTextPath).toString("base64")}`;
    }

    let footerTextDataUri = "";
    const footerTextPath = path.join(
      process.cwd(),
      "public",
      "watermarks",
      "wm-footer-text.png",
    );
    if (fs.existsSync(footerTextPath)) {
      footerTextDataUri = `data:image/png;base64,${fs.readFileSync(footerTextPath).toString("base64")}`;
    }

    // Build SVG overlay with subtle, well-spaced diagonal pattern + clean bottom security banner
    const patternW = 340;
    const patternH = 240;
    const footerH = 48;
    const footerTextW = Math.min(320, Math.max(210, width - 92));
    const footerTextH = Math.round((footerTextW * 72) / 640);

    const svgOverlay = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="apolenaSecGrid" width="${patternW}" height="${patternH}" patternTransform="rotate(-24)" patternUnits="userSpaceOnUse">
          ${
            logoDataUri
              ? `<image href="${logoDataUri}" x="115" y="18" width="110" height="40" opacity="0.14" />`
              : ""
          }
          ${
            tileTextDataUri
              ? `<image href="${tileTextDataUri}" x="40" y="60" width="260" height="28" opacity="0.95" />`
              : ""
          }
        </pattern>
        <linearGradient id="footerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#174B3D" stop-opacity="0" />
          <stop offset="50%" stop-color="#174B3D" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#174B3D" stop-opacity="0.92" />
        </linearGradient>
      </defs>

      <!-- Subtle diagonal watermark mesh -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#apolenaSecGrid)" />

      <!-- Bottom Institutional Protection Strip -->
      <rect x="0" y="${height - footerH * 1.5}" width="${width}" height="${footerH * 1.5}" fill="url(#footerGrad)" />

      ${
        logoDataUri
          ? `<image href="${logoDataUri}" x="16" y="${height - 40}" width="58" height="32" />`
          : ""
      }

      ${
        footerTextDataUri
          ? `<image href="${footerTextDataUri}" x="${width - footerTextW - 12}" y="${height - footerTextH - 6}" width="${footerTextW}" height="${footerTextH}" />`
          : ""
      }
    </svg>`;

    const outBuffer = await baseImage
      .resize(width, height, { fit: "inside", withoutEnlargement: true })
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    const rawPreviewDataUri = `data:image/jpeg;base64,${outBuffer.toString("base64")}`;
    return (
      (await externalizeBase64Image(rawPreviewDataUri, "previews", {
        maxDimension: 860,
        quality: 80,
      })) || rawPreviewDataUri
    );
  } catch (err) {
    console.warn("[burnServerSideWatermark warning]:", err);
    return sourceImageUrl;
  }
}

/**
 * Durable copy of the vault inside `generation_jobs` (Prisma): the clean masters live in
 * `settings.master_variants` and `hd_output_image_url`, which are never returned to the studio.
 * The local JSON/memory vault alone is lost on restarts and serverless instances.
 */
export interface JobPersistenceMeta {
  templateId: string;
  petName?: string;
  species?: string;
  petImageUrl?: string;
  provider?: string;
  modelUsed?: string;
}

async function persistMasterVaultToDatabase(
  jobId: string,
  masterMap: Record<string, string>,
  watermarkedVariants: Array<Record<string, any>>,
  meta?: JobPersistenceMeta,
): Promise<void> {
  if (!isDatabaseConfigured() || !UUID_REGEX.test(jobId)) return;
  const firstWm = String(watermarkedVariants[0]?.imageUrl || "");
  const firstMaster = Object.values(masterMap)[0] || null;
  const safePetImage =
    meta?.petImageUrl && !meta.petImageUrl.startsWith("data:")
      ? meta.petImageUrl
      : "inline-upload";
  const settings = { master_variants: masterMap };
  try {
    await prisma.generationJob.upsert({
      where: { id: jobId },
      update: {
        status: "completed",
        progress: 100,
        output_image_url: firstWm || null,
        hd_output_image_url: firstMaster,
        variants: watermarkedVariants as any,
        settings: settings as any,
      },
      create: {
        id: jobId,
        template_id: meta?.templateId || "custom",
        pet_name: meta?.petName || "Mi Mascota",
        species: meta?.species || "dog",
        pet_image_url: safePetImage,
        provider: meta?.provider || "openai",
        model_used: meta?.modelUsed || null,
        status: "completed",
        progress: 100,
        current_step: "Retrato revelado",
        output_image_url: firstWm || null,
        hd_output_image_url: firstMaster,
        variants: watermarkedVariants as any,
        settings: settings as any,
      },
    });
  } catch (err) {
    console.warn("[persistMasterVaultToDatabase warning]:", err);
  }
}

/**
 * Stores the clean HD master variants in the server vault and returns
 * the server-watermarked variants safe to send to the client browser.
 */
export async function protectAndStoreJobVariants(
  jobId: string,
  variants: Array<{
    id: string;
    provider: any;
    providerTitle: string;
    modelUsed: string;
    imageUrl: string;
    executionSeconds: number;
  }>,
  meta?: JobPersistenceMeta,
): Promise<{
  watermarkedOutputUrl: string;
  watermarkedVariants: typeof variants;
  masterOutputUrl: string;
}> {
  loadVaultFromDisk();

  const masterMap: Record<string, string> = {};
  const watermarkedMap: Record<string, string> = {};
  const watermarkedVariants: typeof variants = [];

  for (const v of variants) {
    // Keep the master at native resolution with near-lossless quality for 300 DPI printing
    const cleanMasterUrl =
      (await externalizeBase64Image(v.imageUrl, "artworks", {
        maxDimension: 4096,
        quality: 95,
      })) || v.imageUrl;
    masterMap[v.id] = cleanMasterUrl;
    const wmUrl = await burnServerSideWatermark(v.imageUrl);
    watermarkedMap[v.id] = wmUrl;
    watermarkedVariants.push({
      ...v,
      imageUrl: wmUrl,
    });
  }

  memoryVault.set(jobId, {
    jobId,
    masterVariants: masterMap,
    watermarkedVariants: watermarkedMap,
    createdAt: new Date().toISOString(),
  });
  persistVaultToDisk();
  await persistMasterVaultToDatabase(jobId, masterMap, watermarkedVariants, meta);

  const firstWm = watermarkedVariants[0]?.imageUrl || "";
  const firstMaster =
    Object.values(masterMap)[0] || variants[0]?.imageUrl || "";

  return {
    watermarkedOutputUrl: firstWm,
    watermarkedVariants,
    masterOutputUrl: firstMaster,
  };
}

/** True when the URL points to a watermarked web preview (never valid for printing). */
export function isWatermarkedPreviewUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes("/previews/") || url.includes("/uploads/previews/");
}

/**
 * Resolves the clean 300 DPI master artwork URL when creating an order or when an
 * admin / completed-order buyer requests it. Lookup order:
 * 1. Local vault (memory/disk) by job + variant.
 * 2. `generation_jobs.settings.master_variants` / `hd_output_image_url` in the database.
 * 3. Reverse lookup of the watermarked preview URL inside the local vault.
 * Returns `fallbackUrl` only when nothing better exists (callers must check
 * `isWatermarkedPreviewUrl` before using it for production).
 */
export async function resolveCleanMasterArtwork(
  jobId?: string | null,
  variantId?: string | null,
  fallbackUrl?: string | null,
): Promise<string | null> {
  loadVaultFromDisk();

  if (jobId) {
    const entry = memoryVault.get(jobId);
    if (entry) {
      if (variantId && entry.masterVariants[variantId]) {
        return entry.masterVariants[variantId];
      }
      const firstMaster = Object.values(entry.masterVariants)[0];
      if (firstMaster) return firstMaster;
    }

    if (isDatabaseConfigured() && UUID_REGEX.test(jobId)) {
      try {
        const row = await prisma.generationJob.findUnique({
          where: { id: jobId },
          select: { settings: true, hd_output_image_url: true },
        });
        const masters = ((row?.settings as any)?.master_variants || {}) as Record<
          string,
          string
        >;
        if (variantId && masters[variantId]) return masters[variantId];
        const firstDbMaster = Object.values(masters)[0] || row?.hd_output_image_url;
        if (firstDbMaster) return firstDbMaster;
      } catch (err) {
        console.warn("[resolveCleanMasterArtwork DB warning]:", err);
      }
    }
  }

  if (fallbackUrl && isWatermarkedPreviewUrl(fallbackUrl)) {
    for (const entry of Array.from(memoryVault.values())) {
      for (const [vid, wmUrl] of Object.entries(entry.watermarkedVariants)) {
        if (wmUrl === fallbackUrl && entry.masterVariants[vid]) {
          return entry.masterVariants[vid];
        }
      }
    }
  }

  return fallbackUrl || null;
}
