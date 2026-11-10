export interface PrintPreset {
  id: string;
  tier: string;
  label: string;
  cmDimensions: string;
  inchDimensions: string;
  dpi: number;
  baseWidthPx: number;
  baseHeightPx: number;
  recommendedUse: string;
  pricePen: number;
  isAvailable?: boolean;
}

export interface FrameOption {
  id: string;
  name: string;
  description: string;
  colorHex: string;
  priceModifierPen: number;
  isAvailable: boolean;
}

/**
 * Extensible Frame Options for Personalized Wall Art (escalable desde platform_settings / products.customization_config)
 */
export const FRAME_OPTIONS: FrameOption[] = [
  {
    id: "canvas-bastidor",
    name: "Lienzo en Bastidor de Galería",
    description:
      "Lienzo tensado sobre bastidor de madera pino seco al horno (listo para colgar)",
    colorHex: "#E8E2D9",
    priceModifierPen: 0,
    isAvailable: true,
  },
  {
    id: "frame-oak",
    name: "Marco de Madera Roble Natural",
    description:
      "Moldura flotante de madera natural con acabado satinado cálido",
    colorHex: "#B6895B",
    priceModifierPen: 35,
    isAvailable: true,
  },
  {
    id: "frame-black",
    name: "Marco Negro Galería Mate",
    description:
      "Moldura minimalista en negro mate de museo con vidrio antirreflejo",
    colorHex: "#1C1917",
    priceModifierPen: 40,
    isAvailable: true,
  },
  {
    id: "frame-gold",
    name: "Marco Dorado Clásico Imperial",
    description:
      "Moldura tallada en tono bronce/dorado envejecido ideal para retratos reales",
    colorHex: "#C59B27",
    priceModifierPen: 50,
    isAvailable: true,
  },
];

/**
 * Predefined print sizes ordered from Largest (XL) to Smallest (S)
 */
export const PRINT_PRESETS: PrintPreset[] = [
  {
    id: "xl-50x70",
    tier: "Extra Grande (XL)",
    label: "50 × 70 cm",
    cmDimensions: "50 × 70 cm",
    inchDimensions: '20 × 28"',
    dpi: 300,
    baseWidthPx: 3500,
    baseHeightPx: 4900,
    recommendedUse: "Pared principal de sala o comedor",
    pricePen: 220,
  },
  {
    id: "lg-40x50",
    tier: "Grande (L)",
    label: "40 × 50 cm",
    cmDimensions: "40 × 50 cm",
    inchDimensions: '16 × 20"',
    dpi: 300,
    baseWidthPx: 3000,
    baseHeightPx: 3750,
    recommendedUse: "Lienzo protagonista en dormitorio o estudio",
    pricePen: 180,
  },
  {
    id: "md-30x40",
    tier: "Mediano (M)",
    label: "30 × 40 cm",
    cmDimensions: "30 × 40 cm",
    inchDimensions: '12 × 16"',
    dpi: 300,
    baseWidthPx: 2400,
    baseHeightPx: 3200,
    recommendedUse: "Cuadro clásico de galería o pasillo",
    pricePen: 140,
  },
  {
    id: "sq-30x30",
    tier: "Cuadrado (M)",
    label: "30 × 30 cm",
    cmDimensions: "30 × 30 cm",
    inchDimensions: '12 × 12"',
    dpi: 300,
    baseWidthPx: 3000,
    baseHeightPx: 3000,
    recommendedUse: "Formato cuadrado simétrico sin recorte",
    pricePen: 130,
  },
  {
    id: "sm-20x25",
    tier: "Pequeño (S)",
    label: "20 × 25 cm",
    cmDimensions: "20 × 25 cm",
    inchDimensions: '8 × 10" / A4',
    dpi: 300,
    baseWidthPx: 1800,
    baseHeightPx: 2250,
    recommendedUse: "Portarretrato de escritorio, repisa o regalo",
    pricePen: 100,
  },
];

export type PrintFinishMode = "full-bleed" | "museum-matte";

/**
 * Exports the portrait scaled to the exact print preset dimensions at high interpolation quality.
 * Automatically respects the source image's orientation (landscape for 2 pets vs portrait/square).
 */
export async function exportPrintReadyImage(
  imageSrc: string,
  preset: PrintPreset,
  finishMode: PrintFinishMode = "full-bleed",
): Promise<{ dataUrl: string; widthPx: number; heightPx: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (
      (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) &&
      typeof window !== "undefined" &&
      !imageSrc.startsWith(window.location.origin)
    ) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      const srcW = img.naturalWidth || img.width || 1024;
      const srcH = img.naturalHeight || img.height || 1024;
      const isLandscape = srcW > srcH * 1.05;

      // Adapt preset orientation to match the portrait (e.g., 70x50cm for landscape 2-pet scenes)
      const targetW =
        isLandscape && preset.baseHeightPx > preset.baseWidthPx
          ? preset.baseHeightPx
          : preset.baseWidthPx;
      const targetH =
        isLandscape && preset.baseHeightPx > preset.baseWidthPx
          ? preset.baseWidthPx
          : preset.baseHeightPx;

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo inicializar el lienzo de exportación"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill background with archival museum white
      ctx.fillStyle = "#FAF8F5";
      ctx.fillRect(0, 0, targetW, targetH);

      if (finishMode === "museum-matte") {
        // Draw with an 8% archival gallery border around the image (no cropping of the artwork)
        const margin = Math.round(Math.min(targetW, targetH) * 0.075);
        const availW = targetW - margin * 2;
        const availH = targetH - margin * 2;
        const scale = Math.min(availW / srcW, availH / srcH);
        const drawW = Math.round(srcW * scale);
        const drawH = Math.round(srcH * scale);
        const offsetX = Math.round((targetW - drawW) / 2);
        const offsetY = Math.round((targetH - drawH) / 2);

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      } else {
        // Full-bleed cover crop anchored to top-headroom (22% from top) so the pet's head,
        // ears, and crown are never cut off when adapting between portrait and square formats
        const scale = Math.max(targetW / srcW, targetH / srcH);
        const drawW = Math.round(srcW * scale);
        const drawH = Math.round(srcH * scale);
        const offsetX = Math.round((targetW - drawW) / 2);
        const offsetY = Math.round((targetH - drawH) * 0.22);

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      }

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      resolve({ dataUrl, widthPx: targetW, heightPx: targetH });
    };

    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}

/**
 * Generates a protected preview image for the customer with the official Apolena
 * logo watermark, diagonal security pattern, and low-resolution web export (max 900px)
 * so the customer can share/preview their design on social media or WhatsApp
 * without exposing the 300 DPI master production file.
 */
export async function exportWatermarkedPreviewImage(
  imageSrc: string,
  themeName: string = "Atelier Apolena",
): Promise<{ dataUrl: string; widthPx: number; heightPx: number }> {
  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      if (
        (src.startsWith("http://") || src.startsWith("https://")) &&
        typeof window !== "undefined" &&
        !src.startsWith(window.location.origin)
      ) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });

  const artImg = await loadImg(imageSrc);
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImg("/logo-light.png");
  } catch {
    try {
      logoImg = await loadImg("/logo.png");
    } catch {
      logoImg = null;
    }
  }

  const srcW = artImg.naturalWidth || artImg.width || 1024;
  const srcH = artImg.naturalHeight || artImg.height || 1536;

  // Limit customer preview to web screen resolution (max 900px on longest side, unsuitable for physical canvas printing)
  const maxPreviewDim = 900;
  const ratio = Math.min(maxPreviewDim / srcW, maxPreviewDim / srcH, 1);
  const targetW = Math.round(srcW * ratio);
  const targetH = Math.round(srcH * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo inicializar el lienzo de marca de agua");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Draw the base artwork
  ctx.drawImage(artImg, 0, 0, targetW, targetH);

  // 2. Diagonal repeating security watermark pattern across the entire image (including face/torso)
  ctx.save();
  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate((-28 * Math.PI) / 180);

  const stepX = 230;
  const stepY = 145;
  ctx.font = "700 15px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = -targetH; y <= targetH; y += stepY) {
    for (let x = -targetW; x <= targetW; x += stepX) {
      // Subtle dark shadow + translucent white text so it is visible on both dark and light fur
      ctx.fillStyle = "rgba(23, 75, 61, 0.25)";
      ctx.fillText("APOLENA · MUESTRA DIGITAL", x + 1, y + 1);
      ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
      ctx.fillText("APOLENA · MUESTRA DIGITAL", x, y);

      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        const wmLogoW = 72;
        const wmLogoH = Math.round(
          (logoImg.naturalHeight / Math.max(1, logoImg.naturalWidth)) * wmLogoW,
        );
        ctx.drawImage(
          logoImg,
          x - wmLogoW / 2,
          y + 16,
          wmLogoW,
          wmLogoH,
        );
        ctx.restore();
      }
    }
  }
  ctx.restore();

  // 3. Center-bottom translucent badge with official Apolena Logo on Primary #174B3D
  const footerHeight = 64;
  const grad = ctx.createLinearGradient(0, targetH - footerHeight * 1.8, 0, targetH);
  grad.addColorStop(0, "rgba(23, 75, 61, 0)");
  grad.addColorStop(0.5, "rgba(23, 75, 61, 0.78)");
  grad.addColorStop(1, "rgba(23, 75, 61, 0.96)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, targetH - footerHeight * 1.8, targetW, footerHeight * 1.8);

  if (logoImg) {
    const logoDrawW = 54;
    const logoDrawH = Math.round(
      (logoImg.naturalHeight / Math.max(1, logoImg.naturalWidth)) * logoDrawW,
    );
    ctx.drawImage(
      logoImg,
      18,
      targetH - logoDrawH - 10,
      logoDrawW,
      logoDrawH,
    );
  }

  // Right-side protection legend
  ctx.save();
  ctx.textAlign = "right";
  ctx.fillStyle = "#c6a26c";
  ctx.font = "700 11px sans-serif";
  ctx.fillText(
    "MUESTRA PROTEGIDA · NO APTA PARA IMPRENTA",
    targetW - 18,
    targetH - 30,
  );
  ctx.fillStyle = "rgba(255, 251, 242, 0.90)";
  ctx.font = "500 10px sans-serif";
  ctx.fillText(
    `${themeName} · Impresión exclusiva 300 DPI en apolena.pe`,
    targetW - 18,
    targetH - 15,
  );
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { dataUrl, widthPx: targetW, heightPx: targetH };
}
