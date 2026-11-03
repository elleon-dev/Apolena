/**
 * Client-Side Photorealistic Fusion Engine
 * Fuses the pet's face directly onto the iconic character photograph
 * with facial geometry alignment, color grading, feathered blending,
 * and character-authentic makeup / accessories (Joker clown paint, Sparrow bandana shadow, Godfather chiaroscuro).
 */

export interface CharacterFusionConfig {
  faceX: number; // Center X percentage (0 - 1)
  faceY: number; // Center Y percentage (0 - 1)
  faceRadiusX: number; // Width radius percentage
  faceRadiusY: number; // Height radius percentage
  featherRatio: number;
  rotationDeg: number;
  tone: 'joker' | 'sparrow' | 'godfather';
}

export const CHARACTER_FUSION_CONFIGS: Record<string, CharacterFusionConfig> = {
  // Joaquin Phoenix in red suit (690x1024)
  'joker': {
    faceX: 0.543,
    faceY: 0.228,
    faceRadiusX: 0.24,
    faceRadiusY: 0.16,
    featherRatio: 0.35,
    rotationDeg: -2,
    tone: 'joker',
  },
  // Johnny Depp with pirate hat & dreadlocks (640x1024)
  'jack-sparrow': {
    faceX: 0.435,
    faceY: 0.345,
    faceRadiusX: 0.26,
    faceRadiusY: 0.19,
    featherRatio: 0.38,
    rotationDeg: 0,
    tone: 'sparrow',
  },
  // Marlon Brando with tuxedo & red rose (1024x1024)
  'godfather': {
    faceX: 0.518,
    faceY: 0.380,
    faceRadiusX: 0.28,
    faceRadiusY: 0.23,
    featherRatio: 0.40,
    rotationDeg: -2,
    tone: 'godfather',
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // NEVER set crossOrigin on data: or blob: or same-origin URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      if (typeof window !== 'undefined' && !src.startsWith(window.location.origin)) {
        img.crossOrigin = 'anonymous';
      }
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback attempt without crossOrigin
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = (e) => reject(e);
      fallback.src = src;
    };
    img.src = src;
  });
}

/**
 * Composites the pet's face seamlessly into the famous character photograph
 */
export async function createPhotorealisticFusion(
  petImageUrl: string,
  characterImageUrl: string,
  characterId: string
): Promise<string> {
  try {
    const [charImg, petImg] = await Promise.all([
      loadImage(characterImageUrl),
      loadImage(petImageUrl),
    ]);

    const width = charImg.naturalWidth || charImg.width || 1024;
    const height = charImg.naturalHeight || charImg.height || 1024;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return characterImageUrl;

    // 1. Draw base character photo
    ctx.drawImage(charImg, 0, 0, width, height);

    // 2. Calculate facial placement
    const config = CHARACTER_FUSION_CONFIGS[characterId] || CHARACTER_FUSION_CONFIGS['joker'];
    const cx = width * config.faceX;
    const cy = height * config.faceY;
    const rx = width * config.faceRadiusX;
    const ry = height * config.faceRadiusY;

    // 3. Extract the pet's face area (centered crop)
    const petW = petImg.naturalWidth || petImg.width;
    const petH = petImg.naturalHeight || petImg.height;
    
    // Most user pet photos have the head in the top-center
    const cropSize = Math.min(petW, petH) * 0.85;
    const cropX = (petW - cropSize) / 2;
    const cropY = petH > petW ? (petH - cropSize) * 0.25 : (petH - cropSize) / 2;

    // 4. Create feathered pet face badge on isolated canvas
    const badgeW = Math.round(rx * 2.2);
    const badgeH = Math.round(ry * 2.2);
    const petCanvas = document.createElement('canvas');
    petCanvas.width = badgeW;
    petCanvas.height = badgeH;
    const pCtx = petCanvas.getContext('2d');
    if (!pCtx) return characterImageUrl;

    // Apply color grading to pet face
    if (config.tone === 'joker') {
      pCtx.filter = 'contrast(1.1) brightness(1.02) saturate(1.15)';
    } else if (config.tone === 'godfather') {
      pCtx.filter = 'contrast(1.22) brightness(0.92) sepia(0.28)';
    } else if (config.tone === 'sparrow') {
      pCtx.filter = 'contrast(1.18) brightness(0.88) saturate(0.85)';
    }

    // Draw pet cropped face filling the badge
    pCtx.drawImage(petImg, cropX, cropY, cropSize, cropSize, 0, 0, badgeW, badgeH);

    // 5. Apply feathered elliptical transparency mask
    pCtx.filter = 'none';
    pCtx.globalCompositeOperation = 'destination-in';
    const halfW = badgeW / 2;
    const halfH = badgeH / 2;
    const maskGrad = pCtx.createRadialGradient(
      halfW, halfH, Math.min(halfW, halfH) * (1 - config.featherRatio),
      halfW, halfH, Math.min(halfW, halfH)
    );
    maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    maskGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.95)');
    maskGrad.addColorStop(0.9, 'rgba(0, 0, 0, 0.45)');
    maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    pCtx.fillStyle = maskGrad;
    pCtx.beginPath();
    pCtx.ellipse(halfW, halfH, halfW, halfH, 0, 0, Math.PI * 2);
    pCtx.fill();

    // 6. Composite the feathered pet onto the character face
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((config.rotationDeg * Math.PI) / 180);

    // Subtle edge darkener for anatomical depth
    ctx.drawImage(petCanvas, -halfW, -halfH, badgeW, badgeH);

    // 7. Apply Character-Specific Realistic Integration Touches
    if (config.tone === 'joker') {
      // Joker Clown Makeup blended into the pet fur:
      ctx.save();
      // a) Soft white face powder glow on muzzle
      const whiteGlow = ctx.createRadialGradient(0, ry * 0.1, 10, 0, ry * 0.1, rx * 0.7);
      whiteGlow.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      whiteGlow.addColorStop(0.7, 'rgba(255, 255, 255, 0.20)');
      whiteGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = whiteGlow;
      ctx.beginPath();
      ctx.ellipse(0, ry * 0.15, rx * 0.65, ry * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // b) Subtle crimson smile wash
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.75)';
      ctx.lineWidth = rx * 0.12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, ry * 0.32, rx * 0.45, 0.22 * Math.PI, 0.78 * Math.PI);
      ctx.stroke();

      // c) Soft crimson nose tip
      ctx.fillStyle = 'rgba(220, 38, 38, 0.75)';
      ctx.beginPath();
      ctx.ellipse(0, ry * 0.08, rx * 0.14, ry * 0.10, 0, 0, Math.PI * 2);
      ctx.fill();

      // d) Soft cyan diamonds over eyes
      ctx.fillStyle = 'rgba(2, 132, 199, 0.65)';
      ctx.beginPath();
      ctx.moveTo(-rx * 0.38, -ry * 0.38);
      ctx.lineTo(-rx * 0.30, -ry * 0.20);
      ctx.lineTo(-rx * 0.38, -ry * 0.05);
      ctx.lineTo(-rx * 0.46, -ry * 0.20);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(rx * 0.38, -ry * 0.38);
      ctx.lineTo(rx * 0.46, -ry * 0.20);
      ctx.lineTo(rx * 0.38, -ry * 0.05);
      ctx.lineTo(rx * 0.30, -ry * 0.20);
      ctx.closePath();
      ctx.fill();

      // e) Green hair tint top
      const greenTint = ctx.createLinearGradient(0, -halfH, 0, -ry * 0.25);
      greenTint.addColorStop(0, 'rgba(22, 163, 74, 0.5)');
      greenTint.addColorStop(1, 'rgba(22, 163, 74, 0)');
      ctx.fillStyle = greenTint;
      ctx.beginPath();
      ctx.ellipse(0, -ry * 0.6, rx * 0.85, ry * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else if (config.tone === 'sparrow') {
      // Jack Sparrow touches:
      // a) Kohl black eyeliner shadow around pet eyes
      ctx.fillStyle = 'rgba(12, 10, 9, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-rx * 0.38, -ry * 0.05, rx * 0.25, ry * 0.18, 0, 0, Math.PI * 2);
      ctx.ellipse(rx * 0.38, -ry * 0.05, rx * 0.25, ry * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // b) Red bandana shadow across brow
      const bandanaShadow = ctx.createLinearGradient(0, -halfH, 0, -ry * 0.25);
      bandanaShadow.addColorStop(0, 'rgba(15, 10, 5, 0.8)');
      bandanaShadow.addColorStop(0.7, 'rgba(127, 29, 29, 0.2)');
      bandanaShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bandanaShadow;
      ctx.beginPath();
      ctx.ellipse(0, -ry * 0.6, rx * 0.9, ry * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // c) Dangling beard beads under chin
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-rx * 0.05, ry * 0.72, rx * 0.06, 0, Math.PI * 2);
      ctx.arc(rx * 0.05, ry * 0.85, rx * 0.06, 0, Math.PI * 2);
      ctx.fill();

    } else if (config.tone === 'godfather') {
      // Don Vito Corleone touches:
      // a) Dramatic chiaroscuro shadow across right side of pet face
      const sideShadow = ctx.createLinearGradient(-halfW, 0, halfW, 0);
      sideShadow.addColorStop(0, 'rgba(255, 240, 220, 0.08)');
      sideShadow.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
      sideShadow.addColorStop(0.7, 'rgba(0, 0, 0, 0.35)');
      sideShadow.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
      ctx.fillStyle = sideShadow;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();

      // b) Deep eye socket shadows
      ctx.fillStyle = 'rgba(20, 10, 5, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-rx * 0.35, -ry * 0.15, rx * 0.22, ry * 0.18, 0, 0, Math.PI * 2);
      ctx.ellipse(rx * 0.35, -ry * 0.15, rx * 0.22, ry * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // c) Sleek dark hair shadow on forehead
      const hairShadow = ctx.createLinearGradient(0, -halfH, 0, -ry * 0.3);
      hairShadow.addColorStop(0, 'rgba(10, 8, 6, 0.8)');
      hairShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hairShadow;
      ctx.beginPath();
      ctx.ellipse(0, -ry * 0.65, rx * 0.85, ry * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (err) {
    console.error('Error generating photorealistic fusion:', err);
    return characterImageUrl;
  }
}
