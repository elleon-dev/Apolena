"use client";

import React, { useEffect, useRef } from "react";

interface ProtectedArtworkCanvasProps {
  src: string;
  alt?: string;
  className?: string;
  maxHeightPx?: number;
}

/**
 * Renders the artwork inside an HTML5 <canvas> element instead of an <img> tag,
 * compositing a live watermark grid on the same pixel buffer and disabling
 * right-click ("Save Image As..."), drag-and-drop, and touch callouts.
 */
export function ProtectedArtworkCanvas({
  src,
  alt = "Retrato Protegido Apolena",
  className = "",
  maxHeightPx = 560,
}: ProtectedArtworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    const artImg = new Image();
    if (
      (src.startsWith("http://") || src.startsWith("https://")) &&
      typeof window !== "undefined" &&
      !src.startsWith(window.location.origin)
    ) {
      artImg.crossOrigin = "anonymous";
    }

    const logoImg = new Image();
    logoImg.src = "/logo-light.png";

    const renderToCanvas = () => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const natW = artImg.naturalWidth || 800;
      const natH = artImg.naturalHeight || 1100;

      const scale = Math.min(860 / natW, 860 / natH, 1);
      const w = Math.max(300, Math.round(natW * scale));
      const h = Math.max(300, Math.round(natH * scale));

      canvas.width = w;
      canvas.height = h;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(artImg, 0, 0, w, h);

      // Subtle additional canvas-level diagonal security grid so even if source is a local sample,
      // the pixel buffer in the DOM is watermarked
      if (!src.startsWith("data:image/jpeg")) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((-26 * Math.PI) / 180);
        ctx.font = "700 13px Georgia, serif";
        ctx.textAlign = "center";

        for (let y = -h; y <= h; y += 150) {
          for (let x = -w; x <= w; x += 230) {
            ctx.fillStyle = "rgba(23, 75, 61, 0.26)";
            ctx.fillText("APOLENA · MUESTRA PROTEGIDA", x + 1, y + 1);
            ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
            ctx.fillText("APOLENA · MUESTRA PROTEGIDA", x, y);

            if (logoImg.complete && logoImg.naturalWidth > 0) {
              ctx.save();
              ctx.globalAlpha = 0.22;
              const lw = 76;
              const lh = Math.round(
                (logoImg.naturalHeight / logoImg.naturalWidth) * lw,
              );
              ctx.drawImage(logoImg, x - lw / 2, y - lh - 10, lw, lh);
              ctx.restore();
            }
          }
        }
        ctx.restore();
      }
    };

    artImg.onload = () => {
      if (logoImg.complete) {
        renderToCanvas();
      } else {
        logoImg.onload = renderToCanvas;
        logoImg.onerror = renderToCanvas;
      }
    };

    artImg.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      role="img"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        maxHeight: `${maxHeightPx}px`,
        WebkitTouchCallout: "none",
        userSelect: "none",
      }}
      className={`w-auto h-auto max-w-full object-contain block select-none pointer-events-none ${className}`}
    />
  );
}

export default ProtectedArtworkCanvas;

