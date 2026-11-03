export interface FamousCharacter {
  id: string;
  name: string;
  characterTitle: string;
  universe: string;
  description: string;
  characterImageUrl: string;
  maskUrl: string;
  fusionSampleUrl: string;
  accentColor: string;
  tagColor: string;
  prompt: string;
  negativePrompt: string;
}

export const FAMOUS_CHARACTERS: FamousCharacter[] = [
  {
    id: "inca-empire",
    name: "Realeza del Imperio Inca",
    characterTitle: "Sapa Inca & Coya en Machu Picchu",
    universe: "Colección Andina",
    description:
      "Diadema solar de oro, collares reales con Chakana y turquesas, mantos tejidos tradicionales frente a Machu Picchu al atardecer.",
    characterImageUrl: "/characters/inca-empire.jpg",
    maskUrl: "/masks/default-mask.png",
    fusionSampleUrl: "/fusions/inca-empire-cats.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt:
      "Ultra-realistic cinematic photograph of the uploaded pet(s) dressed as Inca Empire royalty at Machu Picchu during golden hour sunset. Preserve 100% of each pet’s exact facial identity, fur color, tabby stripes or tuxedo patches, nose markings, and eye color from the uploaded pet photo(s). Dress them in ornate handwoven Andean royal textiles (crimson red and deep turquoise ponchos/mantles with intricate geometric Inca tokapu embroidery), wearing golden Inti Sun God headpieces/diadems with dangling gold and turquoise ear ornaments, and multi-strand gold bead necklaces with a central golden Chakana cross pendant inlaid with turquoise. Stone Inca terrace in foreground with cantuta flowers in a gold vase, majestic Huayna Picchu mountain peak and misty Andes in the warm sunset background, shallow depth of field, 85mm f/1.8 lens, photorealistic fur and gold textures, 8k masterpiece.",
    negativePrompt:
      "human face, human hands, cartoon, 3d render, illustration, anime, blurry, plastic, deformed eyes, bad anatomy, low resolution",
  },
  {
    id: "jack-sparrow",
    name: "Capitán del Caribe",
    characterTitle: "Época de Navegación",
    universe: "Colección Histórica",
    description:
      "Sombrero tricornio de cuero envejecido, pañuelo carmesí, abalorios de época y casaca de capitán en cubierta.",
    characterImageUrl: "/characters/jack-sparrow.webp",
    maskUrl: "/masks/jack-sparrow-mask.png",
    fusionSampleUrl: "/fusions/jack-sparrow-dog.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt:
      "Masterpiece photorealistic portrait of the uploaded pet(s) realistically fused as Captain Jack Sparrow from Pirates of the Caribbean. Preserve 100% of the pet’s authentic facial anatomy, exact fur color markings, expressive eyes, and muzzle from the reference pet photo. Wearing Jack Sparrow’s weathered leather tricorn hat, red bandana headband, braided dreadlocks with pirate beads and trinkets, ruffled linen pirate shirt, leather belts and weathered frock coat, dramatic Caribbean ship deck background at golden hour, ultra-detailed fur texture, 8k cinematic film still.",
    negativePrompt:
      "human face, uncanny valley, cartoon, anime, blurry, deformed eyes, low quality",
  },
  {
    id: "joker",
    name: "Arthur Fleck (Gala)",
    characterTitle: "Retrato Cinematográfico",
    universe: "Colección Cine",
    description:
      "Traje sastre rojo bermellón con chaleco mostaza, camisa clásica e iluminación cálida de estudio cinematográfico.",
    characterImageUrl: "/characters/joker.jpg",
    maskUrl: "/masks/joker-mask.png",
    fusionSampleUrl: "/fusions/joker-dog.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt:
      "Masterpiece photorealistic portrait of the uploaded pet(s) dressed as The Joker (Arthur Fleck) in his iconic crimson red tailored suit, mustard gold waistcoat, and green patterned shirt. Preserve 100% of the pet’s real facial structure, fur pattern, eyes, and muzzle from the reference photo, adding subtle artistic Joker face paint accents blended naturally into the fur and green-tinted hair tuft on top, moody Gotham city steps cinematic lighting, 8k resolution, realistic movie still.",
    negativePrompt:
      "human face, deformed mouth, cartoon, plastic, blurry, oversaturated, bad anatomy",
  },
  {
    id: "godfather",
    name: "Don Vito Corleone",
    characterTitle: "Sastrería Clásica Italiana",
    universe: "Colección Cine Clásico",
    description:
      "Esmoquin negro de gala, pajarita de seda, camisa blanca plisada y rosa roja en la solapa con luz de estudio.",
    characterImageUrl: "/characters/godfather.jpg",
    maskUrl: "/masks/godfather-mask.png",
    fusionSampleUrl: "/fusions/godfather-dog.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt:
      "Masterpiece photorealistic portrait of the uploaded pet(s) dressed as Don Vito Corleone from The Godfather. Preserve 100% of the pet’s authentic facial features, dignified gaze, eye color, and fur markings from the reference photo. Wearing a tailored black wool tuxedo with crisp white pleated shirt, black silk bow tie, and a fresh red rose boutonniere on the satin lapel. Dramatic chiaroscuro Rembrandt film noir lighting in a dark mahogany Italian study with warm venetian blind shadows, 8k photorealistic texture.",
    negativePrompt:
      "human skin, cartoon, blurry, distorted, cheap costume, low resolution",
  },
];

export function getCharacterById(id: string): FamousCharacter | undefined {
  return FAMOUS_CHARACTERS.find((c) => c.id === id);
}
