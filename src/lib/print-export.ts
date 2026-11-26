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
  compareAtPricePen?: number;
  isAvailable?: boolean;
}

export interface FrameOption {
  id: string;
  name: string;
  description: string;
  colorHex: string;
  priceModifierPen: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  images?: string[];
}

/**
 * Opciones oficiales de Marcos y Bastidores en Apolena (Tabla de Precios Oficial)
 * - Foto Lienzo - Estilo 3D (Bastidor incluido, + S/ 0)
 * - Marco Minimalista (Negro / Natural / Blanco, + S/ 45)
 * - Marco Madera Gold (Dorado Imperial, + S/ 55)
 */
export const FRAME_OPTIONS: FrameOption[] = [
  {
    id: "canvas-bastidor",
    name: "Foto Lienzo - Estilo 3D",
    description:
      "Lienzo canvas de algodón tensado sobre bastidor de madera maciza (listo para colgar sin marco adicional)",
    colorHex: "#E8E2D9",
    priceModifierPen: 0,
    isAvailable: true,
  },
  {
    id: "frame-minimalist-black",
    name: "Marco Minimalista Negro",
    description: "Moldura minimalista en negro mate de galería (+ S/ 45.00)",
    colorHex: "#1C1917",
    priceModifierPen: 45,
    isAvailable: true,
  },
  {
    id: "frame-minimalist-natural",
    name: "Marco Minimalista Natural",
    description:
      "Moldura minimalista en madera natural cálida escandinava (+ S/ 45.00)",
    colorHex: "#B6895B",
    priceModifierPen: 45,
    isAvailable: true,
  },
  {
    id: "frame-minimalist-white",
    name: "Marco Minimalista Blanco",
    description: "Moldura minimalista en blanco mate de museo (+ S/ 45.00)",
    colorHex: "#FFFFFF",
    priceModifierPen: 45,
    isAvailable: true,
  },
  {
    id: "frame-wood-gold",
    name: "Marco Madera (Gold)",
    description:
      "Moldura clásica en madera con acabado dorado imperial (+ S/ 55.00)",
    colorHex: "#C59B27",
    priceModifierPen: 55,
    isAvailable: true,
  },
];

/**
 * Medidas oficiales y precios de imprenta Apolena a 300 DPI
 * Actualizadas según la tabla oficial "PRICE AND SIZES"
 * Las medidas sin precio se marcan con isAvailable: false
 */
export const PRINT_PRESETS: PrintPreset[] = [
  {
    id: "size-20x30",
    tier: "Pequeño (S)",
    label: "20 × 30 cm",
    cmDimensions: "20 × 30 cm",
    inchDimensions: '8 × 12"',
    dpi: 300,
    baseWidthPx: 2362,
    baseHeightPx: 3543,
    recommendedUse:
      "Ideal para espacios reducidos, repisas, escritorios o composiciones de varios cuadros. Detalle sutil y versátil.",
    pricePen: 160,
    compareAtPricePen: 190,
    isAvailable: true,
  },
  {
    id: "size-30x40",
    tier: "Mediano (M)",
    label: "30 × 40 cm",
    cmDimensions: "30 × 40 cm",
    inchDimensions: '12 × 16"',
    dpi: 300,
    baseWidthPx: 3543,
    baseHeightPx: 4724,
    recommendedUse:
      "Ideal para paredes pequeñas o medianas y composiciones tipo galería. Gran equilibrio y presencia.",
    pricePen: 190,
    compareAtPricePen: 210,
    isAvailable: true,
  },
  {
    id: "size-40x60",
    tier: "Grande (L)",
    label: "40 × 60 cm",
    cmDimensions: "40 × 60 cm",
    inchDimensions: '16 × 24"',
    dpi: 300,
    baseWidthPx: 4724,
    baseHeightPx: 7087,
    recommendedUse:
      "La medida más popular. Excelente visibilidad y tamaño ideal para salas, dormitorios y oficinas.",
    pricePen: 210,
    compareAtPricePen: 230,
    isAvailable: true,
  },
  {
    id: "size-50x70",
    tier: "Extra Grande (XL)",
    label: "50 × 70 cm",
    cmDimensions: "50 × 70 cm",
    inchDimensions: '20 × 28"',
    dpi: 300,
    baseWidthPx: 5906,
    baseHeightPx: 8268,
    recommendedUse:
      "Ideal para aportar carácter y presencia en salas o comedores sin saturar el ambiente.",
    pricePen: 240,
    compareAtPricePen: 270,
    isAvailable: true,
  },
  {
    id: "size-60x90",
    tier: "Doble Extra Grande (2XL)",
    label: "60 × 90 cm",
    cmDimensions: "60 × 90 cm",
    inchDimensions: '24 × 36"',
    dpi: 300,
    baseWidthPx: 7087,
    baseHeightPx: 10630,
    recommendedUse:
      "Ideal como cuadro principal protagónico. Gran impacto visual sobre sillones, camas y pasillos amplios.",
    pricePen: 275,
    compareAtPricePen: 295,
    isAvailable: true,
  },
  // ── Medidas sin precio en la tabla oficial (desactivadas) ──
  {
    id: "size-30x20",
    tier: "Escritorio (30×20)",
    label: "30 × 20 cm",
    cmDimensions: "30 × 20 cm",
    inchDimensions: '12 × 8"',
    dpi: 300,
    baseWidthPx: 3600,
    baseHeightPx: 2400,
    recommendedUse: "Medida anterior reemplazada por 20 × 30 cm.",
    pricePen: 180,
    isAvailable: false,
  },
  {
    id: "size-45x30",
    tier: "Intermedio (45×30)",
    label: "45 × 30 cm",
    cmDimensions: "45 × 30 cm",
    inchDimensions: '12 × 18"',
    dpi: 300,
    baseWidthPx: 3000,
    baseHeightPx: 4500,
    recommendedUse: "Medida fuera de catálogo actual.",
    pricePen: 210,
    isAvailable: false,
  },
  {
    id: "size-60x40",
    tier: "Mediano Horizontal (60×40)",
    label: "60 × 40 cm",
    cmDimensions: "60 × 40 cm",
    inchDimensions: '24 × 16"',
    dpi: 300,
    baseWidthPx: 4800,
    baseHeightPx: 3200,
    recommendedUse: "Medida anterior reemplazada por 40 × 60 cm vertical.",
    pricePen: 240,
    isAvailable: false,
  },
  {
    id: "size-75x50",
    tier: "Intermedio (75×50)",
    label: "75 × 50 cm",
    cmDimensions: "75 × 50 cm",
    inchDimensions: '20 × 30"',
    dpi: 300,
    baseWidthPx: 3600,
    baseHeightPx: 5400,
    recommendedUse: "Medida fuera de catálogo actual.",
    pricePen: 270,
    isAvailable: false,
  },
  {
    id: "size-90x60",
    tier: "Grande Horizontal (90×60)",
    label: "90 × 60 cm",
    cmDimensions: "90 × 60 cm",
    inchDimensions: '36 × 24"',
    dpi: 300,
    baseWidthPx: 6000,
    baseHeightPx: 4000,
    recommendedUse: "Medida anterior reemplazada por 60 × 90 cm vertical.",
    pricePen: 300,
    isAvailable: false,
  },
  {
    id: "size-105x70",
    tier: "Punto Focal (3XL)",
    label: "105 × 70 cm",
    cmDimensions: "105 × 70 cm",
    inchDimensions: '28 × 42"',
    dpi: 300,
    baseWidthPx: 4200,
    baseHeightPx: 6300,
    recommendedUse: "Medida fuera de catálogo actual.",
    pricePen: 360,
    isAvailable: false,
  },
  {
    id: "size-120x80",
    tier: "Mural Master (4XL)",
    label: "120 × 80 cm",
    cmDimensions: "120 × 80 cm",
    inchDimensions: '32 × 48"',
    dpi: 300,
    baseWidthPx: 4800,
    baseHeightPx: 7200,
    recommendedUse: "Medida fuera de catálogo actual.",
    pricePen: 420,
    isAvailable: false,
  },
];

export type PrintFinishMode = "full-bleed" | "museum-matte";

/**
 * Margen obligatorio de remangado para bastidor/marco de madera:
 * +5 cm en cada uno de los 4 lados (arriba, abajo, izquierda, derecha) = +10 cm al ancho y +10 cm al alto.
 */
export const CANVAS_WRAP_BLEED_CM = 5;

export interface PrintBleedSpec {
  faceWidthCm: number;
  faceHeightCm: number;
  bleedCm: number;
  totalWidthCm: number;
  totalHeightCm: number;
  faceCmLabel: string;
  totalCmLabel: string;
  preset: PrintPreset;
}

/**
 * Resuelve la especificación de medida visible y la medida total de impresión (+5 cm en los 4 lados)
 * a partir de un PrintPreset, size_id o string de dimensiones en cm (ej. "40 × 60 cm").
 */
export function resolvePrintBleedSpec(
  input?: {
    sizeId?: string | null;
    cmDimensions?: string | null;
    preset?: PrintPreset | null;
  },
  bleedCm: number = CANVAS_WRAP_BLEED_CM,
): PrintBleedSpec {
  let matchedPreset: PrintPreset | undefined = input?.preset || undefined;

  const rawDims =
    input?.cmDimensions ||
    matchedPreset?.cmDimensions ||
    matchedPreset?.label ||
    "40 × 60 cm";
  const nums = rawDims.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  let faceWidthCm = nums[0] || 40;
  let faceHeightCm = nums[1] || 60;

  matchedPreset = PRINT_PRESETS.find((p) => {
    const pNums = p.cmDimensions.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    return pNums[0] === faceWidthCm && pNums[1] === faceHeightCm;
  });

  if (!matchedPreset && !input?.cmDimensions) {
    matchedPreset = input?.preset
      ? input.preset
      : input?.sizeId
        ? PRINT_PRESETS.find((p) => p.id === input.sizeId)
        : undefined;
  }

  if (!matchedPreset) {
    const cmToPx = (cm: number) => Math.round((cm / 2.54) * 300);
    matchedPreset = {
      id: input?.sizeId || `custom-${faceWidthCm}x${faceHeightCm}`,
      tier: "Medida personalizada",
      label: `${faceWidthCm} × ${faceHeightCm} cm`,
      cmDimensions: `${faceWidthCm} × ${faceHeightCm} cm`,
      inchDimensions: `${Number((faceWidthCm / 2.54).toFixed(1))} × ${Number((faceHeightCm / 2.54).toFixed(1))}"`,
      dpi: 300,
      baseWidthPx: cmToPx(faceWidthCm),
      baseHeightPx: cmToPx(faceHeightCm),
      recommendedUse: "Medida congelada según la personalización de la orden",
      pricePen: 0,
      isAvailable: true,
    };
  }

  const totalWidthCm = faceWidthCm + bleedCm * 2;
  const totalHeightCm = faceHeightCm + bleedCm * 2;

  return {
    faceWidthCm,
    faceHeightCm,
    bleedCm,
    totalWidthCm,
    totalHeightCm,
    faceCmLabel: `${faceWidthCm} × ${faceHeightCm} cm`,
    totalCmLabel: `${totalWidthCm} × ${totalHeightCm} cm`,
    preset: matchedPreset,
  };
}

/**
 * Exports the portrait scaled to the exact print preset dimensions at high interpolation quality,
 * adding +5 cm on all 4 sides (top, bottom, left, right) with continuous mirror-wrap bleed
 * so the canvas can be wrapped ("remangado") around the wooden frame without losing any part of the portrait.
 */
export async function exportPrintReadyImage(
  imageSrc: string,
  preset: PrintPreset,
  finishMode: PrintFinishMode = "full-bleed",
  bleedCm: number = CANVAS_WRAP_BLEED_CM,
  petName?: string | null,
): Promise<{
  dataUrl: string;
  blob: Blob | null;
  widthPx: number;
  heightPx: number;
  faceWidthPx: number;
  faceHeightPx: number;
  bleedPxX: number;
  bleedPxY: number;
  totalCmLabel: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (
      (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) &&
      typeof window !== "undefined" &&
      !imageSrc.startsWith(window.location.origin)
    ) {
      img.crossOrigin = "anonymous";
    }

    img.onload = async () => {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font loading error
        }
      }

      const srcW = img.naturalWidth || img.width || 1024;
      const srcH = img.naturalHeight || img.height || 1024;
      const isLandscape = srcW > srcH * 1.05;

      const spec = resolvePrintBleedSpec({ preset }, bleedCm);
      const faceWidthCm =
        isLandscape && spec.faceHeightCm > spec.faceWidthCm
          ? spec.faceHeightCm
          : spec.faceWidthCm;
      const faceHeightCm =
        isLandscape && spec.faceHeightCm > spec.faceWidthCm
          ? spec.faceWidthCm
          : spec.faceHeightCm;

      // Adapt preset orientation to match the portrait (e.g., 70x50cm for landscape 2-pet scenes)
      const faceW =
        isLandscape && preset.baseHeightPx > preset.baseWidthPx
          ? preset.baseHeightPx
          : preset.baseWidthPx;
      const faceH =
        isLandscape && preset.baseHeightPx > preset.baseWidthPx
          ? preset.baseWidthPx
          : preset.baseHeightPx;

      // 1. Renderizar el área visible frontal del cuadro (faceW × faceH) en un lienzo intermedio
      const faceCanvas = document.createElement("canvas");
      faceCanvas.width = faceW;
      faceCanvas.height = faceH;
      const faceCtx = faceCanvas.getContext("2d");
      if (!faceCtx) {
        reject(new Error("No se pudo inicializar el lienzo frontal"));
        return;
      }

      faceCtx.imageSmoothingEnabled = true;
      faceCtx.imageSmoothingQuality = "high";
      faceCtx.fillStyle = "#FAF8F5";
      faceCtx.fillRect(0, 0, faceW, faceH);

      if (finishMode === "museum-matte") {
        const margin = Math.round(Math.min(faceW, faceH) * 0.075);
        const availW = faceW - margin * 2;
        const availH = faceH - margin * 2;
        const scale = Math.min(availW / srcW, availH / srcH);
        const drawW = Math.round(srcW * scale);
        const drawH = Math.round(srcH * scale);
        const offsetX = Math.round((faceW - drawW) / 2);
        const offsetY = Math.round((faceH - drawH) / 2);
        faceCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
      } else {
        const scale = Math.max(faceW / srcW, faceH / srcH);
        const drawW = Math.round(srcW * scale);
        const drawH = Math.round(srcH * scale);
        const offsetX = Math.round((faceW - drawW) / 2);
        const offsetY = Math.round((faceH - drawH) * 0.22);
        faceCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
      }

      const inscription = petName?.trim();
      if (inscription) {
        faceCtx.save();
        const length = inscription.length;
        const referenceFontSize =
          length > 16 ? 24 : length > 11 ? 30 : length > 6 ? 36 : 48;
        let fontSize = Math.max(24, Math.round(referenceFontSize * (faceH / 560)));
        faceCtx.font = `400 ${fontSize}px 'Kaushan Script', 'Caveat', 'Brush Script MT', cursive`;
        const maxTextWidth = faceW * 0.70;
        const measuredWidth = faceCtx.measureText(inscription).width;
        if (measuredWidth > maxTextWidth) {
          fontSize = Math.max(20, Math.floor(fontSize * (maxTextWidth / measuredWidth)));
          faceCtx.font = `400 ${fontSize}px 'Kaushan Script', 'Caveat', 'Brush Script MT', cursive`;
        }

        const x = faceW - Math.round(faceW * 0.045);
        const y = faceH - Math.round(faceH * 0.085);
        faceCtx.translate(x, y);
        faceCtx.rotate((-6 * Math.PI) / 180);
        faceCtx.textAlign = "right";
        faceCtx.textBaseline = "middle";
        faceCtx.shadowColor = "rgba(0, 0, 0, 0.72)";
        faceCtx.shadowBlur = Math.max(8, Math.round(fontSize * 0.18));
        faceCtx.shadowOffsetX = Math.max(2, Math.round(fontSize * 0.03));
        faceCtx.shadowOffsetY = Math.max(3, Math.round(fontSize * 0.06));
        faceCtx.fillStyle = "#FFFFFF";
        faceCtx.fillText(inscription, 0, 0);
        faceCtx.restore();
      }

      // 2. Calcular los píxeles equivalentes a +5 cm en cada uno de los 4 lados
      const bleedPxX =
        bleedCm > 0 ? Math.round((bleedCm / faceWidthCm) * faceW) : 0;
      const bleedPxY =
        bleedCm > 0 ? Math.round((bleedCm / faceHeightCm) * faceH) : 0;

      const totalW = faceW + bleedPxX * 2;
      const totalH = faceH + bleedPxY * 2;

      const canvas = document.createElement("canvas");
      canvas.width = totalW;
      canvas.height = totalH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo inicializar el lienzo de exportación"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#FAF8F5";
      ctx.fillRect(0, 0, totalW, totalH);

      // Dibujar la imagen frontal íntegra en el centro
      ctx.drawImage(faceCanvas, bleedPxX, bleedPxY, faceW, faceH);

      if (bleedPxX > 0 && bleedPxY > 0) {
        const sampleW = Math.min(bleedPxX, faceW);
        const sampleH = Math.min(bleedPxY, faceH);

        // Borde Izquierdo (+5 cm): reflejo horizontal del borde izquierdo de la obra
        ctx.save();
        ctx.translate(bleedPxX, bleedPxY);
        ctx.scale(-1, 1);
        ctx.drawImage(
          faceCanvas,
          0,
          0,
          sampleW,
          faceH,
          0,
          0,
          bleedPxX,
          faceH,
        );
        ctx.restore();

        // Borde Derecho (+5 cm): reflejo horizontal del borde derecho de la obra
        ctx.save();
        ctx.translate(bleedPxX + faceW, bleedPxY);
        ctx.scale(-1, 1);
        ctx.drawImage(
          faceCanvas,
          faceW - sampleW,
          0,
          sampleW,
          faceH,
          -bleedPxX,
          0,
          bleedPxX,
          faceH,
        );
        ctx.restore();

        // Borde Superior (+5 cm): reflejo vertical del borde superior de la obra
        ctx.save();
        ctx.translate(bleedPxX, bleedPxY);
        ctx.scale(1, -1);
        ctx.drawImage(
          faceCanvas,
          0,
          0,
          faceW,
          sampleH,
          0,
          0,
          faceW,
          bleedPxY,
        );
        ctx.restore();

        // Borde Inferior (+5 cm): reflejo vertical del borde inferior de la obra
        ctx.save();
        ctx.translate(bleedPxX, bleedPxY + faceH);
        ctx.scale(1, -1);
        ctx.drawImage(
          faceCanvas,
          0,
          faceH - sampleH,
          faceW,
          sampleH,
          0,
          -bleedPxY,
          faceW,
          bleedPxY,
        );
        ctx.restore();

        // Esquina Superior Izquierda (5×5 cm)
        ctx.save();
        ctx.translate(bleedPxX, bleedPxY);
        ctx.scale(-1, -1);
        ctx.drawImage(
          faceCanvas,
          0,
          0,
          sampleW,
          sampleH,
          0,
          0,
          bleedPxX,
          bleedPxY,
        );
        ctx.restore();

        // Esquina Superior Derecha (5×5 cm)
        ctx.save();
        ctx.translate(bleedPxX + faceW, bleedPxY);
        ctx.scale(-1, -1);
        ctx.drawImage(
          faceCanvas,
          faceW - sampleW,
          0,
          sampleW,
          sampleH,
          -bleedPxX,
          0,
          bleedPxX,
          bleedPxY,
        );
        ctx.restore();

        // Esquina Inferior Izquierda (5×5 cm)
        ctx.save();
        ctx.translate(bleedPxX, bleedPxY + faceH);
        ctx.scale(-1, -1);
        ctx.drawImage(
          faceCanvas,
          0,
          faceH - sampleH,
          sampleW,
          sampleH,
          0,
          -bleedPxY,
          bleedPxX,
          bleedPxY,
        );
        ctx.restore();

        // Esquina Inferior Derecha (5×5 cm)
        ctx.save();
        ctx.translate(bleedPxX + faceW, bleedPxY + faceH);
        ctx.scale(-1, -1);
        ctx.drawImage(
          faceCanvas,
          faceW - sampleW,
          faceH - sampleH,
          sampleW,
          sampleH,
          -bleedPxX,
          -bleedPxY,
          bleedPxX,
          bleedPxY,
        );
        ctx.restore();

      }

      const totalCmLabel = `${faceWidthCm + bleedCm * 2} × ${faceHeightCm + bleedCm * 2} cm`;
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      canvas.toBlob(
        (blob) => {
          resolve({
            dataUrl,
            blob,
            widthPx: totalW,
            heightPx: totalH,
            faceWidthPx: faceW,
            faceHeightPx: faceH,
            bleedPxX,
            bleedPxY,
            totalCmLabel,
          });
        },
        "image/png",
        1.0,
      );
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
  petName?: string | null,
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

  const previewInscription = petName?.trim();
  if (previewInscription) {
    ctx.save();
    const length = previewInscription.length;
    const referenceFontSize =
      length > 16 ? 24 : length > 11 ? 30 : length > 6 ? 36 : 48;
    let fontSize = Math.max(24, Math.round(referenceFontSize * (targetH / 560)));
    ctx.font = `400 ${fontSize}px 'Kaushan Script', 'Caveat', 'Brush Script MT', cursive`;
    const maxTextWidth = targetW * 0.70;
    if (ctx.measureText(previewInscription).width > maxTextWidth) {
      fontSize = Math.max(16, Math.floor(fontSize * (maxTextWidth / ctx.measureText(previewInscription).width)));
      ctx.font = `400 ${fontSize}px 'Kaushan Script', 'Caveat', 'Brush Script MT', cursive`;
    }
    ctx.translate(targetW - Math.round(targetW * 0.014), targetH - Math.round(targetH * 0.085));
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
    ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.18));
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(previewInscription, 0, 0);
    ctx.restore();
  }

  // If the image already comes from the server preview generator, return without adding a duplicate watermark layer
  if (imageSrc.includes("/uploads/previews/")) {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    return { dataUrl, widthPx: targetW, heightPx: targetH };
  }

  // 2. Subtle diagonal repeating security watermark pattern across the image
  ctx.save();
  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate((-24 * Math.PI) / 180);

  const stepX = 330;
  const stepY = 230;
  ctx.font = "700 13px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = -targetH; y <= targetH; y += stepY) {
    for (let x = -targetW; x <= targetW; x += stepX) {
      ctx.fillStyle = "rgba(23, 75, 61, 0.16)";
      ctx.fillText("APOLENA · MUESTRA PROTEGIDA", x + 1, y + 1);
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fillText("APOLENA · MUESTRA PROTEGIDA", x, y);

      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = 0.14;
        const wmLogoW = 68;
        const wmLogoH = Math.round(
          (logoImg.naturalHeight / Math.max(1, logoImg.naturalWidth)) * wmLogoW,
        );
        ctx.drawImage(logoImg, x - wmLogoW / 2, y + 16, wmLogoW, wmLogoH);
        ctx.restore();
      }
    }
  }
  ctx.restore();

  // 3. Center-bottom translucent badge with official Apolena Logo on Primary #174B3D
  const footerHeight = 64;
  const grad = ctx.createLinearGradient(
    0,
    targetH - footerHeight * 1.8,
    0,
    targetH,
  );
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
    ctx.drawImage(logoImg, 18, targetH - logoDrawH - 10, logoDrawW, logoDrawH);
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
    `${themeName} · Impresión exclusiva 300 DPI en www.apolena.shop`,
    targetW - 18,
    targetH - 15,
  );
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { dataUrl, widthPx: targetW, heightPx: targetH };
}
