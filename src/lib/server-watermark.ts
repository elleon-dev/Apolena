import fs from "fs";
import path from "path";
import sharp from "sharp";

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
async function resolveSourceToBuffer(source: string): Promise<Buffer> {
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

    // Prepare official logo as base64 for embedding inside the SVG watermark
    let logoDataUri = "";
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const resizedLogoBuf = await sharp(logoPath)
        .resize({ width: 160, withoutEnlargement: true })
        .png()
        .toBuffer();
      logoDataUri = `data:image/png;base64,${resizedLogoBuf.toString("base64")}`;
    }

    // Build SVG overlay with repeating diagonal pattern + bottom security banner
    const patternW = 240;
    const patternH = 160;
    const footerH = 54;

    const svgOverlay = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="apolenaSecGrid" width="${patternW}" height="${patternH}" patternTransform="rotate(-26)" patternUnits="userSpaceOnUse">
          ${
            logoDataUri
              ? `<image href="${logoDataUri}" x="55" y="14" width="130" height="42" opacity="0.24" />`
              : ""
          }
          <text x="120" y="78" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="13" fill="#102854" fill-opacity="0.26">APOLENA · MUESTRA PROTEGIDA</text>
          <text x="119" y="77" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="13" fill="#FFFFFF" fill-opacity="0.34">APOLENA · MUESTRA PROTEGIDA</text>
          <text x="120" y="96" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#FD9414" fill-opacity="0.32">PROHIBIDA SU IMPRESIÓN · 300 DPI EN TALLER</text>
        </pattern>
        <linearGradient id="footerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0C192A" stop-opacity="0" />
          <stop offset="45%" stop-color="#0C192A" stop-opacity="0.78" />
          <stop offset="100%" stop-color="#0C192A" stop-opacity="0.95" />
        </linearGradient>
      </defs>

      <!-- Full-canvas diagonal watermark mesh covering face, fur, and costume -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#apolenaSecGrid)" />

      <!-- Bottom Institutional Protection Strip -->
      <rect x="0" y="${height - footerH * 1.6}" width="${width}" height="${footerH * 1.6}" fill="url(#footerGrad)" />

      <rect x="14" y="${height - 42}" width="132" height="32" rx="16" fill="#FAF6F0" fill-opacity="0.95" />
      ${
        logoDataUri
          ? `<image href="${logoDataUri}" x="26" y="${height - 38}" width="108" height="24" />`
          : `<text x="80" y="${height - 22}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="14" fill="#102854">Apolena</text>`
      }

      <text x="${width - 14}" y="${height - 26}" text-anchor="end" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#FD9414">VISTA PREVIA CON MARCA DE AGUA</text>
      <text x="${width - 14}" y="${height - 13}" text-anchor="end" font-family="Arial, sans-serif" font-size="9.5" fill="#E7E5E4">Tu cuadro físico se fabrica sin marcas a 300 DPI</text>
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

    return `data:image/jpeg;base64,${outBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("[burnServerSideWatermark warning]:", err);
    return sourceImageUrl;
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
    masterMap[v.id] = v.imageUrl;
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

  const firstWm = watermarkedVariants[0]?.imageUrl || "";
  const firstMaster = variants[0]?.imageUrl || "";

  return {
    watermarkedOutputUrl: firstWm,
    watermarkedVariants,
    masterOutputUrl: firstMaster,
  };
}

/**
 * Resolves the clean 300 DPI master artwork URL from the server vault
 * when creating an order or when an admin / completed-order buyer requests it.
 */
export function resolveCleanMasterArtwork(
  jobId?: string | null,
  variantId?: string | null,
  fallbackUrl?: string | null,
): string | null {
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
  }

  return fallbackUrl || null;
}

