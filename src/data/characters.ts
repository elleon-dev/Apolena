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
  isAvailable?: boolean;
}

export const FAMOUS_CHARACTERS: FamousCharacter[] = [
  {
    id: "jack-sparrow",
    name: "Capitán Jack Sparrow",
    characterTitle: "Legendario Capitán de la Perla Negra",
    universe: "Colección Piratas & Aventuras",
    description:
      "El personaje luce su icónico sombrero tricornio de cuero desgastado sobre una bandana roja, con una melena de rastas adornada con abalorios y cuentas. Viste una casaca de época con correajes de cuero, múltiples pistolas de chispa y sostiene una espada, todo bajo una atmósfera sombría con chispas flotantes e iluminación dramática.",
    characterImageUrl: "/characters/jack-sparrow.webp",
    maskUrl: "/masks/jack-sparrow-mask.png",
    fusionSampleUrl: "/fusions/jack-sparrow-dog.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt: "",
    negativePrompt:
      "human face, human hands, deformed anatomy, blurry, cartoon, 3d render, watermark, extra limbs, low quality",
    isAvailable: true,
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
    prompt: "",
    negativePrompt:
      "human face, deformed mouth, cartoon, plastic, blurry, oversaturated, bad anatomy",
    isAvailable: true,
  },
  {
    id: "sapa-inca-imperial",
    name: "Sapa Inca Imperial",
    characterTitle: "Soberano del Tahuantinsuyo",
    universe: "Imperio Inca · Machu Picchu",
    description:
      "Un retrato majestuoso que captura la esencia divina del Sapa Inca, ataviado con un unku de fina lana de alpaca en tonos carmesí y oro. El soberano luce una corona solar de oro puro y pectorales ceremoniales con incrustaciones de turquesa, evocando la grandeza eterna de la civilización andina.",
    characterImageUrl:
      "https://nxpiqaaaezshkpqmyicn.supabase.co/storage/v1/object/public/apolena-media/characters/ad8621f8d8c8633a264c.jpg",
    maskUrl: "/masks/default-mask.png",
    fusionSampleUrl:
      "https://nxpiqaaaezshkpqmyicn.supabase.co/storage/v1/object/public/apolena-media/characters/ad8621f8d8c8633a264c.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt: "",
    negativePrompt:
      "human face, human hands, deformed anatomy, blurry, cartoon, 3d render, watermark, extra limbs, low quality",
    isAvailable: true,
  },
  {
    id: "faraon-de-las-arenas-eternas",
    name: "Faraón de las Arenas Eternas",
    characterTitle: "Soberano Divino del Antiguo Egipto",
    universe: "Antiguo Egipto · Dinastía de los Dioses",
    description:
      "Un retrato majestuoso donde tu mascota aparece ataviado con el nemes real de oro y lapislázuli, adornado con un pectoral sagrado que porta el ankh de la vida eterna. La atmósfera evoca la gloria de las pirámides bajo un atardecer dorado, donde la realeza es venerada como una deidad.",
    characterImageUrl:
      "https://nxpiqaaaezshkpqmyicn.supabase.co/storage/v1/object/public/apolena-media/characters/38b029432101609dcec0.jpg",
    maskUrl: "/masks/default-mask.png",
    fusionSampleUrl:
      "https://nxpiqaaaezshkpqmyicn.supabase.co/storage/v1/object/public/apolena-media/characters/38b029432101609dcec0.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt: "",
    negativePrompt:
      "human face, human hands, deformed anatomy, blurry, cartoon, 3d render, watermark, extra limbs, low quality",
    isAvailable: true,
  },
  {
    id: "sapa-inca-imperial-1",
    name: "Sapa Inca Imperial",
    characterTitle: "Soberano del Tahuantinsuyo",
    universe: "Imperio Inca · Machu Picchu",
    description:
      "Una majestuosa representación del monarca andino, adornado con una corona solar de oro puro y un pectoral ceremonial incrustado con turquesas. Viste un unku de fina lana de alpaca con intrincados patrones tocapus, evocando la grandeza eterna de los Andes bajo la luz del atardecer.",
    characterImageUrl:
      "https://nxpiqaaaezshkpqmyicn.supabase.co/storage/v1/object/public/apolena-media/characters/79d1289a07b0248dc918.jpg",
    maskUrl: "/masks/default-mask.png",
    fusionSampleUrl:
      "https://nxpiqaaaezshkpqmyicn.supabase.co/storage/v1/object/public/apolena-media/characters/79d1289a07b0248dc918.jpg",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    prompt: "",
    negativePrompt:
      "human face, human hands, deformed anatomy, blurry, cartoon, 3d render, watermark, extra limbs, low quality",
    isAvailable: true,
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
    prompt: "",
    negativePrompt:
      "human skin, cartoon, blurry, distorted, cheap costume, low resolution",
    isAvailable: false,
  },
];

export function getCharacterById(id: string): FamousCharacter | undefined {
  return FAMOUS_CHARACTERS.find((c) => c.id === id);
}
