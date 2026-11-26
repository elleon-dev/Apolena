/**
 * Generador de tarjetas editoriales compartibles para redes sociales (Apolena).
 * Produce piezas listas para Instagram Stories / TikTok / WhatsApp (9:16) y
 * publicaciones de Feed (4:5), con efecto "Antes y Después", marco de galería,
 * marca de agua protectora estética y llamado a la acción con el dominio activo.
 */

export type SocialCardFormat = "story" | "post";

export interface SocialShareCardOptions {
  artworkUrl: string;
  petImageUrl?: string | null;
  themeName: string;
  petName?: string | null;
  includeBeforeBadge?: boolean;
  format?: SocialCardFormat;
  siteHost?: string;
  fileSlug?: string;
}

export interface SocialShareCardResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  width: number;
  height: number;
}

async function loadImageForCanvas(src: string): Promise<HTMLImageElement> {
  const loadDirect = (url: string, withCors: boolean) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (withCors) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });

  const isExternal =
    (src.startsWith("http://") || src.startsWith("https://")) &&
    typeof window !== "undefined" &&
    !src.startsWith(window.location.origin);

  try {
    return await loadDirect(src, isExternal);
  } catch {
    if (!isExternal) {
      throw new Error(`No se pudo cargar la imagen local: ${src}`);
    }
    // Fallback vía fetch -> ObjectURL para evitar bloqueos de canvas tainted
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) {
      throw new Error(`No se pudo descargar la imagen remota (${res.status})`);
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await loadDirect(objectUrl, false);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  focalY: number = 0.35,
) {
  const imgW = img.naturalWidth || img.width || 1;
  const imgH = img.naturalHeight || img.height || 1;
  const targetRatio = w / h;
  const imgRatio = imgW / imgH;

  let sx = 0;
  let sy = 0;
  let sw = imgW;
  let sh = imgH;

  if (imgRatio > targetRatio) {
    sw = imgH * targetRatio;
    sx = (imgW - sw) / 2;
  } else {
    sh = imgW / targetRatio;
    sy = (imgH - sh) * focalY;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export async function generateSocialShareCard(
  options: SocialShareCardOptions,
): Promise<SocialShareCardResult> {
  const {
    artworkUrl,
    petImageUrl,
    themeName,
    petName,
    includeBeforeBadge = true,
    format = "story",
    siteHost,
    fileSlug = "retrato",
  } = options;

  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo inicializar el lienzo para compartir.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Cargar recursos en paralelo
  const [artImg, petImg, logoImg] = await Promise.all([
    loadImageForCanvas(artworkUrl),
    petImageUrl && includeBeforeBadge
      ? loadImageForCanvas(petImageUrl).catch(() => null)
      : Promise.resolve(null),
    loadImageForCanvas("/logo-light.png")
      .catch(() => loadImageForCanvas("/logo-gold.png"))
      .catch(() => null),
  ]);

  // 1. Fondo editorial verde botella profundo con halo dorado cálido
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#0D2B22");
  bgGrad.addColorStop(0.5, "#174B3D");
  bgGrad.addColorStop(1, "#0B241D");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Halo radial suave detrás del cuadro
  const glowY = isStory ? height * 0.49 : height * 0.47;
  const glowGrad = ctx.createRadialGradient(
    width / 2,
    glowY,
    80,
    width / 2,
    glowY,
    isStory ? 680 : 560,
  );
  glowGrad.addColorStop(0, "rgba(198, 162, 108, 0.26)");
  glowGrad.addColorStop(0.55, "rgba(198, 162, 108, 0.08)");
  glowGrad.addColorStop(1, "rgba(198, 162, 108, 0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  // Marco editorial sutil perimetral (doble línea fina dorada)
  const outerPad = 36;
  ctx.save();
  ctx.strokeStyle = "rgba(198, 162, 108, 0.34)";
  ctx.lineWidth = 2;
  drawRoundedRectPath(
    ctx,
    outerPad,
    outerPad,
    width - outerPad * 2,
    height - outerPad * 2,
    38,
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 251, 242, 0.14)";
  ctx.lineWidth = 1;
  drawRoundedRectPath(
    ctx,
    outerPad + 12,
    outerPad + 12,
    width - (outerPad + 12) * 2,
    height - (outerPad + 12) * 2,
    30,
  );
  ctx.stroke();
  ctx.restore();

  // 2. Cabecera Editorial (Logo + Título del Retrato)
  const topStart = isStory ? 96 : 64;
  if (logoImg) {
    const logoH = isStory ? 64 : 52;
    const logoW = Math.round(
      (logoImg.naturalWidth / Math.max(1, logoImg.naturalHeight)) * logoH,
    );
    ctx.drawImage(logoImg, (width - logoW) / 2, topStart, logoW, logoH);
  } else {
    ctx.fillStyle = "#FFFBF2";
    ctx.font = "700 44px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("APOLENA", width / 2, topStart + 30);
  }

  // Eyebrow dorado
  const eyebrowY = topStart + (isStory ? 98 : 76);
  ctx.fillStyle = "#DFC18D";
  ctx.font = `700 ${isStory ? 21 : 18}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ATELIER DE RETRATOS PARA MASCOTAS", width / 2, eyebrowY);

  // Título principal (Nombre de mascota + Estilo o solo Estilo)
  const cleanPetName = petName?.trim() || "";
  const cleanTheme = themeName?.trim() || "Retrato de Galería";
  const headlineText = cleanPetName
    ? `${cleanPetName} · ${cleanTheme}`
    : cleanTheme;

  const titleY = eyebrowY + (isStory ? 64 : 48);
  ctx.fillStyle = "#FFFBF2";
  let headlineSize = isStory ? 54 : 44;
  ctx.font = `600 ${headlineSize}px Georgia, "Times New Roman", serif`;
  const maxHeadlineWidth = width - 160;
  while (
    ctx.measureText(headlineText).width > maxHeadlineWidth &&
    headlineSize > 30
  ) {
    headlineSize -= 2;
    ctx.font = `600 ${headlineSize}px Georgia, "Times New Roman", serif`;
  }
  ctx.fillText(headlineText, width / 2, titleY);

  // 3. Cuadro Principal Enmarcado (Hero Artwork)
  const frameOuterW = isStory ? 820 : 660;
  const frameOuterH = isStory ? 1110 : 815;
  const frameX = Math.round((width - frameOuterW) / 2);
  const frameY = titleY + (isStory ? 62 : 42);

  // Sombra profunda de galería
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 54;
  ctx.shadowOffsetY = 26;
  drawRoundedRectPath(ctx, frameX, frameY, frameOuterW, frameOuterH, 22);
  const frameGrad = ctx.createLinearGradient(
    frameX,
    frameY,
    frameX + frameOuterW,
    frameY + frameOuterH,
  );
  frameGrad.addColorStop(0, "#E3C58E");
  frameGrad.addColorStop(0.45, "#B78F52");
  frameGrad.addColorStop(1, "#8D6832");
  ctx.fillStyle = frameGrad;
  ctx.fill();
  ctx.restore();

  // Passe-partout crema interior
  const goldBorder = 16;
  const matPad = 20;
  const matX = frameX + goldBorder;
  const matY = frameY + goldBorder;
  const matW = frameOuterW - goldBorder * 2;
  const matH = frameOuterH - goldBorder * 2;

  ctx.save();
  drawRoundedRectPath(ctx, matX, matY, matW, matH, 12);
  ctx.fillStyle = "#FFFBF2";
  ctx.fill();
  ctx.restore();

  // Área de la obra de arte
  const artX = matX + matPad;
  const artY = matY + matPad;
  const artW = matW - matPad * 2;
  const artH = matH - matPad * 2;

  ctx.save();
  drawRoundedRectPath(ctx, artX, artY, artW, artH, 8);
  ctx.clip();

  drawCoverImage(ctx, artImg, artX, artY, artW, artH, 0.25);

  // Inscripción brush del nombre de la mascota si existe
  if (cleanPetName) {
    ctx.save();
    let brushSize = Math.round(artH * 0.068);
    ctx.font = `400 ${brushSize}px 'Kaushan Script', 'Caveat', 'Brush Script MT', cursive`;
    const maxBrushW = artW * 0.65;
    while (ctx.measureText(cleanPetName).width > maxBrushW && brushSize > 24) {
      brushSize -= 2;
      ctx.font = `400 ${brushSize}px 'Kaushan Script', 'Caveat', 'Brush Script MT', cursive`;
    }
    ctx.translate(artX + artW - 28, artY + artH - 42);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.78)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(cleanPetName, 0, 0);
    ctx.restore();
  }

  // Marca de agua protectora estética (evita impresión no autorizada pero luce elegante)
  if (!artworkUrl.includes("/uploads/previews/")) {
    ctx.save();
    ctx.translate(artX + artW / 2, artY + artH / 2);
    ctx.rotate((-24 * Math.PI) / 180);
    ctx.font = "700 17px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const stepX = 320;
    const stepY = 230;
    for (let y = -artH; y <= artH; y += stepY) {
      for (let x = -artW; x <= artW; x += stepX) {
        ctx.fillStyle = "rgba(13, 43, 34, 0.16)";
        ctx.fillText("APOLENA · MUESTRA", x + 1, y + 1);
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.fillText("APOLENA · MUESTRA", x, y);
      }
    }
    ctx.restore();

    if (logoImg) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      const wmW = Math.round(artW * 0.28);
      const wmH = Math.round(
        (logoImg.naturalHeight / Math.max(1, logoImg.naturalWidth)) * wmW,
      );
      ctx.translate(artX + artW / 2, artY + artH / 2);
      ctx.rotate((-12 * Math.PI) / 180);
      ctx.drawImage(logoImg, -wmW / 2, -wmH / 2, wmW, wmH);
      ctx.restore();
    }
  }

  // Sombra interior sutil de profundidad del marco
  ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
  ctx.lineWidth = 4;
  drawRoundedRectPath(ctx, artX, artY, artW, artH, 8);
  ctx.stroke();
  ctx.restore();

  // 4. Medallón "ANTES" con la foto original de la mascota (gancho viral)
  if (petImg) {
    const badgeSize = isStory ? 236 : 190;
    const badgeX = frameX - (isStory ? 34 : 44);
    const badgeY = frameY + frameOuterH - badgeSize + (isStory ? 44 : 26);
    const cx = badgeX + badgeSize / 2;
    const cy = badgeY + badgeSize / 2;
    const radius = badgeSize / 2;

    // Sombra del medallón
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFBF2";
    ctx.fill();
    ctx.restore();

    // Foto circular de la mascota original
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
    ctx.clip();
    drawCoverImage(
      ctx,
      petImg,
      cx - (radius - 10),
      cy - (radius - 10),
      (radius - 10) * 2,
      (radius - 10) * 2,
      0.35,
    );
    ctx.restore();

    // Anillo dorado exterior fino
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#C6A26C";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Píldora "ANTES" debajo del círculo
    const pillW = isStory ? 124 : 108;
    const pillH = isStory ? 38 : 34;
    const pillX = cx - pillW / 2;
    const pillY = cy + radius - pillH * 0.62;

    ctx.save();
    drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = "#174B3D";
    ctx.fill();
    ctx.strokeStyle = "#DFC18D";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFBF2";
    ctx.font = `700 ${isStory ? 18 : 16}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ANTES", cx, pillY + pillH / 2 + 1);
    ctx.restore();
  }

  // 5. Pie Viral con Llamado a la Acción + Dominio
  const displayHost = (
    siteHost ||
    (typeof window !== "undefined" ? window.location.host : "apolena.pe")
  ).replace(/^www\./, "");

  const footerCenterY = isStory
    ? frameY + frameOuterH + (height - (frameY + frameOuterH) - outerPad) / 2 + 16
    : frameY + frameOuterH + (height - (frameY + frameOuterH) - outerPad) / 2 + 4;

  // Píldora CTA principal
  const ctaW = isStory ? 780 : 720;
  const ctaH = isStory ? 112 : 92;
  const ctaX = (width - ctaW) / 2;
  const ctaY = footerCenterY - ctaH / 2 - (isStory ? 22 : 14);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  drawRoundedRectPath(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fillStyle = "#FFFBF2";
  ctx.fill();
  ctx.strokeStyle = "#C6A26C";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#57534E";
  ctx.font = `600 ${isStory ? 22 : 19}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "Crea el retrato de tu mascota en",
    width / 2,
    ctaY + ctaH * 0.32,
  );

  ctx.fillStyle = "#174B3D";
  ctx.font = `700 ${isStory ? 34 : 29}px Georgia, "Times New Roman", serif`;
  ctx.fillText(displayHost, width / 2, ctaY + ctaH * 0.69);

  // Línea secundaria debajo de la píldora
  ctx.fillStyle = "rgba(255, 251, 242, 0.78)";
  ctx.font = `500 ${isStory ? 22 : 18}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillText(
    "Sube una foto y descubre su obra en segundos",
    width / 2,
    ctaY + ctaH + (isStory ? 44 : 32),
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("No se pudo generar el archivo de imagen."));
      },
      "image/jpeg",
      0.9,
    );
  });

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const safeSlug = fileSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const fileName = `Apolena-${safeSlug || "retrato"}-${format}.jpg`;
  const file = new File([blob], fileName, { type: "image/jpeg" });

  return { dataUrl, blob, file, width, height };
}
