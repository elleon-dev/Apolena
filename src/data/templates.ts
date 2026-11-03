export interface Template {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category:
    | "Formal & Elegante"
    | "Heroico & Servicio"
    | "Época & Realeza"
    | "Aventura & Sci-Fi"
    | "Profesiones"
    | "Futurista"
    | "Arte Clásico"
    | "Aventura & Western";
  species: "dog" | "cat" | "both";
  lighting: string;
  lightingDisplay: string;
  prompt: string;
  negativePrompt: string;
  strength: number;
  guidanceScale: number;
  badgeText: string;
  badgeColor: string;
  previewGradient: string;
  sampleResultUrl: string;
  maskUrl: string;
  templateUrl: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "executive-suit",
    name: "El Magnate Ejecutivo",
    subtitle: "Traje de Tres Piezas & Corbata de Seda",
    description:
      "Impecable corte italiano en azul marino profundo con chaleco, corbata bordó y pañuelo blanco. Ideal para mascotas con porte sereno y distinguido.",
    category: "Formal & Elegante",
    species: "both",
    lighting: "studio_soft",
    lightingDisplay: "Luz Estudio Suave (Frontal)",
    prompt:
      "a majestic regal pet wearing a bespoke navy blue three-piece executive suit with crimson silk tie and crisp white collared shirt, dignified studio lighting, 8k portrait photography, masterwork, sharp focus on fur texture, authentic lifelike eyes",
    negativePrompt: "human face, deformed neck, cartoon, blurry, low quality",
    strength: 0.91,
    guidanceScale: 3.5,
    badgeText: "Top Ventas",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    previewGradient: "from-blue-950 via-slate-900 to-amber-950/40",
    sampleResultUrl: "/samples/cat-suit.jpg",
    maskUrl: "/templates/executive-suit/mask.png",
    templateUrl: "/templates/executive-suit/template.svg",
  },
  {
    id: "police-officer",
    name: "Oficial de Policía K-9",
    subtitle: "Uniforme Táctico & Insignia de Servicio",
    description:
      "Uniforme azul policial con placa dorada brillante, parches de hombro, chaleco táctico y gorra de oficial. Diseñado para perros guardianes y gatos con carácter.",
    category: "Heroico & Servicio",
    species: "both",
    lighting: "dramatic_direct",
    lightingDisplay: "Luz Heroica Contraste",
    prompt:
      "a brave pet in a detailed dark blue police officer uniform with golden badge, tactical utility vest, embroidered patches and police service cap, professional studio hero portrait, rich fur texture, realistic lifelike eyes",
    negativePrompt: "human head, low resolution, blurry, distorted, cartoon",
    strength: 0.9,
    guidanceScale: 3.6,
    badgeText: "Popular",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    previewGradient: "from-slate-950 via-blue-950 to-indigo-950",
    sampleResultUrl: "/samples/cat-suit.jpg", // can fallback or use police
    maskUrl: "/templates/police-officer/mask.png",
    templateUrl: "/templates/police-officer/template.svg",
  },
  {
    id: "victorian-royal",
    name: "Lord / Lady Victoriano",
    subtitle: "Terciopelo Carmesí & Encaje de Oro",
    description:
      "Atuendo de la nobleza del siglo XIX con cuello gorguera, medallas de la corona y capa de terciopelo real. El clásico retrato de linaje aristocrático.",
    category: "Época & Realeza",
    species: "both",
    lighting: "chiaroscuro_side",
    lightingDisplay: "Claroscuro Lateral (Estilo Óleo)",
    prompt:
      "a royal aristocratic pet dressed in an ornate Victorian velvet coat with gold embroidery, lace jabot collar, royal medal of honor, Rembrandt lighting, dark oil painting textured background, hyper-detailed fur",
    negativePrompt: "modern clothes, cartoon, blur, extra limbs, human face",
    strength: 0.92,
    guidanceScale: 3.8,
    badgeText: "Clásico Real",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    previewGradient: "from-rose-950 via-purple-950 to-amber-950",
    sampleResultUrl: "/samples/cat-suit.jpg",
    maskUrl: "/templates/victorian-royal/mask.png",
    templateUrl: "/templates/victorian-royal/template.svg",
  },
  {
    id: "cosmic-astronaut",
    name: "Comandante Astronauta",
    subtitle: "Escafandra de Misión Espacial NASA",
    description:
      "Traje presurizado con anillo metálico para casco, parches de la misión orbital y reflejos de nebulosas y la Tierra. Para mascotas exploradoras.",
    category: "Aventura & Sci-Fi",
    species: "both",
    lighting: "visor_reflection_cool",
    lightingDisplay: "Luz Estelar Azul Frío",
    prompt:
      "an intrepid pet astronaut wearing a detailed NASA space exploration suit with mission patches, helmet collar ring, subtle reflection of stars and Earth, cinematic lighting, ultra-realistic fur",
    negativePrompt:
      "helmet covering face completely, blurry, anime, distorted ears",
    strength: 0.91,
    guidanceScale: 3.5,
    badgeText: "Sci-Fi",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    previewGradient: "from-cyan-950 via-sky-950 to-slate-950",
    sampleResultUrl: "/samples/cat-suit.jpg",
    maskUrl: "/templates/cosmic-astronaut/mask.png",
    templateUrl: "/templates/cosmic-astronaut/template.svg",
  },
  {
    id: "master-chef",
    name: "Chef de Alta Cocina",
    subtitle: "Filipina Francesa & Gorro Blanche",
    description:
      "Chaqueta de cocina con doble hilera de botones de presión, pañuelo doblado y toque blanche. Perfecto para los reyes del sabor y pedigüeños culinarios.",
    category: "Profesiones",
    species: "both",
    lighting: "warm_kitchen",
    lightingDisplay: "Luz Cálida de Cocina Gourmet",
    prompt:
      "a proud culinary master pet wearing a white double-breasted chef jacket with black piping, neatly folded neckerchief, chef hat, warm restaurant ambient light, crisp depth of field, adorable expression",
    negativePrompt: "human hands, dirty, low-res, blur",
    strength: 0.89,
    guidanceScale: 3.4,
    badgeText: "Divertido",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    previewGradient: "from-amber-950/80 via-stone-900 to-amber-950/50",
    sampleResultUrl: "/samples/cat-suit.jpg",
    maskUrl: "/templates/master-chef/mask.png",
    templateUrl: "/templates/master-chef/template.svg",
  },
  {
    id: "cyberpunk-rebel",
    name: "Hacker Cyberpunk 2077",
    subtitle: "Bomber de Neón & Reflejos Lluviosos",
    description:
      "Chaqueta futurista con bordados electroluminiscentes cian y magenta, cuello alto y ambiente nocturno de metrópolis lluviosa con luces de neón.",
    category: "Futurista",
    species: "both",
    lighting: "neon_rim_cyan_magenta",
    lightingDisplay: "Neón Bicolor (Cian / Magenta)",
    prompt:
      "a cybernetic pet in a futuristic high-collar leather bomber jacket with glowing neon circuit embroidery, futuristic city rain reflections, cinematic blade runner aesthetic, sharp photorealistic fur",
    negativePrompt: "deformed, blurry, watermark, human ears",
    strength: 0.92,
    guidanceScale: 3.7,
    badgeText: "Edición Neón",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    previewGradient: "from-fuchsia-950 via-purple-950 to-cyan-950",
    sampleResultUrl: "/samples/cat-suit.jpg",
    maskUrl: "/templates/cyberpunk-rebel/mask.png",
    templateUrl: "/templates/cyberpunk-rebel/template.svg",
  },
  {
    id: "renaissance-duke",
    name: "Duque del Renacimiento",
    subtitle: "Jubón de Brocado & Gorguera Flamenca",
    description:
      "Inspirado en las obras maestras de Rembrandt y Velázquez, con cuello de lechuguilla plisado blanco, terciopelo bordado con hilos de oro y fondo pictórico de museo.",
    category: "Arte Clásico",
    species: "both",
    lighting: "rembrandt_soft",
    lightingDisplay: "Luz Rembrandt Clásica",
    prompt:
      "a noble renaissance pet portrait painted by a Dutch master, wearing a ruffled white ruff collar, embroidered brocade doublet with pearls and gemstones, museum canvas texture, exquisite lighting",
    negativePrompt: "photorealistic modern, lowres, weird eyes, distorted",
    strength: 0.93,
    guidanceScale: 3.9,
    badgeText: "Museo",
    badgeColor: "bg-amber-600/20 text-amber-200 border-amber-600/30",
    previewGradient: "from-yellow-950 via-amber-950 to-stone-950",
    sampleResultUrl: "/samples/cat-suit.jpg",
    maskUrl: "/templates/renaissance-duke/mask.png",
    templateUrl: "/templates/renaissance-duke/template.svg",
  },
  {
    id: "wild-west-sheriff",
    name: "Sheriff del Lejano Oeste",
    subtitle: "Chaleco de Cuero & Estrella de Plata",
    description:
      "Atuendo vaquero con chaleco desgastado por el sol, estrella de comisario en el pecho, pañuelo bandolero rojo y luz dorada del atardecer del cañón.",
    category: "Aventura & Western",
    species: "dog",
    lighting: "golden_hour_dusty",
    lightingDisplay: "Hora Dorada del Desierto",
    prompt:
      "a rugged frontier pet wearing a brown leather cowboy vest, vintage silver star sheriff badge, red bandana neckerchief and stetson hat, warm sunset golden hour lighting, cinematic film grain",
    negativePrompt: "modern, bad anatomy, blurry, cartoon",
    strength: 0.91,
    guidanceScale: 3.5,
    badgeText: "Western",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    previewGradient: "from-amber-950 via-orange-950 to-stone-950",
    sampleResultUrl: "/samples/cat-suit.jpg",
    maskUrl: "/templates/wild-west-sheriff/mask.png",
    templateUrl: "/templates/wild-west-sheriff/template.svg",
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
