export interface DeliveryPinLocation {
  lat: number;
  lng: number;
  label?: string | null;
  google_maps_url?: string;
}

const PIN_TAG_REGEX = /\s*\[PIN GPS:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/i;

function normalizeKey(value?: string | null): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Coordenadas centrales de los principales distritos de Lima Metropolitana, Callao y ciudades del Perú
 * para centrar automáticamente el mapa cuando el cliente escribe su distrito o departamento.
 */
const PERU_LOCATION_COORDS: Record<string, { lat: number; lng: number; zoom?: number }> = {
  // Lima Metropolitana & Callao
  miraflores: { lat: -12.1211, lng: -77.0297, zoom: 15 },
  "san isidro": { lat: -12.0972, lng: -77.0365, zoom: 15 },
  barranco: { lat: -12.1439, lng: -77.0201, zoom: 16 },
  surco: { lat: -12.1356, lng: -76.9922, zoom: 14 },
  "santiago de surco": { lat: -12.1356, lng: -76.9922, zoom: 14 },
  "la molina": { lat: -12.0782, lng: -76.9422, zoom: 14 },
  "san borja": { lat: -12.1008, lng: -76.9992, zoom: 15 },
  "san miguel": { lat: -12.0772, lng: -77.0906, zoom: 15 },
  magdalena: { lat: -12.0906, lng: -77.07, zoom: 15 },
  "magdalena del mar": { lat: -12.0906, lng: -77.07, zoom: 15 },
  "pueblo libre": { lat: -12.0758, lng: -77.0633, zoom: 15 },
  "jesus maria": { lat: -12.0775, lng: -77.0489, zoom: 15 },
  lince: { lat: -12.0853, lng: -77.0358, zoom: 15 },
  surquillo: { lat: -12.1142, lng: -77.0125, zoom: 15 },
  chorrillos: { lat: -12.1725, lng: -77.0189, zoom: 14 },
  brena: { lat: -12.0586, lng: -77.0522, zoom: 15 },
  "cercado de lima": { lat: -12.0464, lng: -77.0428, zoom: 14 },
  lima: { lat: -12.0972, lng: -77.0325, zoom: 13 },
  "la victoria": { lat: -12.0725, lng: -77.0181, zoom: 15 },
  "san luis": { lat: -12.0753, lng: -76.9967, zoom: 15 },
  "los olivos": { lat: -11.9775, lng: -77.0711, zoom: 14 },
  "san martin de porres": { lat: -12.0022, lng: -77.0839, zoom: 14 },
  independencia: { lat: -11.99, lng: -77.0542, zoom: 14 },
  comas: { lat: -11.9325, lng: -77.0528, zoom: 14 },
  "san juan de lurigancho": { lat: -11.9881, lng: -76.9983, zoom: 13 },
  "san juan de miraflores": { lat: -12.1628, lng: -76.9636, zoom: 14 },
  "villa maria del triunfo": { lat: -12.1628, lng: -76.9353, zoom: 14 },
  "villa el salvador": { lat: -12.2139, lng: -76.9372, zoom: 14 },
  ate: { lat: -12.0389, lng: -76.9261, zoom: 14 },
  "santa anita": { lat: -12.045, lng: -76.9711, zoom: 15 },
  "el agustino": { lat: -12.0442, lng: -77.0011, zoom: 15 },
  rimac: { lat: -12.0294, lng: -77.0325, zoom: 15 },
  callao: { lat: -12.0566, lng: -77.1181, zoom: 14 },
  bellavista: { lat: -12.0628, lng: -77.1125, zoom: 15 },
  "la perla": { lat: -12.0692, lng: -77.1181, zoom: 15 },
  "la punta": { lat: -12.0714, lng: -77.1636, zoom: 16 },
  ventanilla: { lat: -11.8767, lng: -77.1278, zoom: 14 },
  lurin: { lat: -12.2747, lng: -76.8692, zoom: 14 },
  pachacamac: { lat: -12.2286, lng: -76.8586, zoom: 14 },
  "puente piedra": { lat: -11.8669, lng: -77.0772, zoom: 14 },
  carabayllo: { lat: -11.8839, lng: -77.0267, zoom: 14 },
  chaclacayo: { lat: -11.9764, lng: -76.7681, zoom: 14 },
  cieneguilla: { lat: -12.1131, lng: -76.8153, zoom: 14 },

  // Principales Ciudades y Departamentos del Perú
  arequipa: { lat: -16.409, lng: -71.5375, zoom: 14 },
  cusco: { lat: -13.532, lng: -71.9675, zoom: 14 },
  trujillo: { lat: -8.116, lng: -79.03, zoom: 14 },
  "la libertad": { lat: -8.116, lng: -79.03, zoom: 13 },
  chiclayo: { lat: -6.7714, lng: -79.8409, zoom: 14 },
  lambayeque: { lat: -6.7714, lng: -79.8409, zoom: 13 },
  piura: { lat: -5.1945, lng: -80.6328, zoom: 14 },
  ica: { lat: -14.0678, lng: -75.7286, zoom: 14 },
  huancayo: { lat: -12.0651, lng: -75.2049, zoom: 14 },
  junin: { lat: -12.0651, lng: -75.2049, zoom: 13 },
  tacna: { lat: -18.0066, lng: -70.2463, zoom: 14 },
  puno: { lat: -15.8402, lng: -70.0219, zoom: 14 },
  iquitos: { lat: -3.7437, lng: -73.2516, zoom: 14 },
  loreto: { lat: -3.7437, lng: -73.2516, zoom: 13 },
  cajamarca: { lat: -7.1617, lng: -78.5128, zoom: 14 },
  ayacucho: { lat: -13.1631, lng: -74.2236, zoom: 14 },
  chimbote: { lat: -9.0745, lng: -78.5936, zoom: 14 },
  huaraz: { lat: -9.5261, lng: -77.5288, zoom: 14 },
  ancash: { lat: -9.5261, lng: -77.5288, zoom: 13 },
  tarapoto: { lat: -6.4878, lng: -76.3597, zoom: 14 },
  "san martin": { lat: -6.4878, lng: -76.3597, zoom: 13 },
  pucallpa: { lat: -8.3791, lng: -74.5539, zoom: 14 },
  ucayali: { lat: -8.3791, lng: -74.5539, zoom: 13 },
  tumbes: { lat: -3.5669, lng: -80.4515, zoom: 14 },
  moquegua: { lat: -17.1927, lng: -70.9328, zoom: 14 },
  huanuco: { lat: -9.9306, lng: -76.2422, zoom: 14 },
  abancay: { lat: -13.6339, lng: -72.8814, zoom: 14 },
  apurimac: { lat: -13.6339, lng: -72.8814, zoom: 13 },
  "puerto maldonado": { lat: -12.5933, lng: -69.1891, zoom: 14 },
  "madre de dios": { lat: -12.5933, lng: -69.1891, zoom: 13 },
};

export function resolveCoordinatesForLocation(
  district?: string | null,
  department?: string | null,
): { lat: number; lng: number; zoom: number } {
  const normDistrict = normalizeKey(district);
  if (normDistrict && PERU_LOCATION_COORDS[normDistrict]) {
    const match = PERU_LOCATION_COORDS[normDistrict];
    return { lat: match.lat, lng: match.lng, zoom: match.zoom || 15 };
  }

  for (const [key, coords] of Object.entries(PERU_LOCATION_COORDS)) {
    if (normDistrict && (normDistrict.includes(key) || key.includes(normDistrict))) {
      return { lat: coords.lat, lng: coords.lng, zoom: coords.zoom || 15 };
    }
  }

  const normDept = normalizeKey(department);
  if (normDept && PERU_LOCATION_COORDS[normDept]) {
    const match = PERU_LOCATION_COORDS[normDept];
    return { lat: match.lat, lng: match.lng, zoom: match.zoom || 13 };
  }

  // Por defecto: Miraflores, Lima
  return { lat: -12.1211, lng: -77.0297, zoom: 15 };
}

export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

export function stripPinTagFromReference(rawReference?: string | null): string {
  if (!rawReference) return "";
  return rawReference.replace(PIN_TAG_REGEX, "").trim();
}

export function formatReferenceWithPin(
  rawReference?: string | null,
  pin?: DeliveryPinLocation | null,
): string {
  const cleanRef = stripPinTagFromReference(rawReference);
  if (!pin || typeof pin.lat !== "number" || typeof pin.lng !== "number" || Number.isNaN(pin.lat) || Number.isNaN(pin.lng)) {
    return cleanRef;
  }
  const tag = `[PIN GPS: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}]`;
  return cleanRef ? `${cleanRef} ${tag}` : tag;
}

export function parseDeliveryPinFromOrder(
  rawReference?: string | null,
  customizationsLocation?: DeliveryPinLocation | null,
  shippingColumns?: {
    latitude?: number | null;
    longitude?: number | null;
    map_url?: string | null;
  } | null,
): {
  cleanReference: string;
  pin: {
    lat: number;
    lng: number;
    label?: string | null;
    googleMapsUrl: string;
  } | null;
} {
  const cleanReference = stripPinTagFromReference(rawReference);

  // 1. Prioridad máxima: Columnas relacionales de PostgreSQL (order_shippings.latitude / longitude)
  if (
    shippingColumns &&
    typeof shippingColumns.latitude === "number" &&
    typeof shippingColumns.longitude === "number" &&
    !Number.isNaN(shippingColumns.latitude) &&
    !Number.isNaN(shippingColumns.longitude)
  ) {
    return {
      cleanReference,
      pin: {
        lat: shippingColumns.latitude,
        lng: shippingColumns.longitude,
        label: customizationsLocation?.label || null,
        googleMapsUrl:
          shippingColumns.map_url ||
          customizationsLocation?.google_maps_url ||
          buildGoogleMapsUrl(
            shippingColumns.latitude,
            shippingColumns.longitude,
          ),
      },
    };
  }

  // 2. Fallback: Snapshot en customizations.delivery_location
  if (
    customizationsLocation &&
    typeof customizationsLocation.lat === "number" &&
    typeof customizationsLocation.lng === "number" &&
    !Number.isNaN(customizationsLocation.lat) &&
    !Number.isNaN(customizationsLocation.lng)
  ) {
    return {
      cleanReference,
      pin: {
        lat: customizationsLocation.lat,
        lng: customizationsLocation.lng,
        label: customizationsLocation.label || null,
        googleMapsUrl:
          customizationsLocation.google_maps_url ||
          buildGoogleMapsUrl(
            customizationsLocation.lat,
            customizationsLocation.lng,
          ),
      },
    };
  }

  // 3. Fallback: Etiqueta embebida en reference [PIN GPS: lat, lng]
  if (rawReference) {
    const match = rawReference.match(PIN_TAG_REGEX);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return {
          cleanReference,
          pin: {
            lat,
            lng,
            label: null,
            googleMapsUrl: buildGoogleMapsUrl(lat, lng),
          },
        };
      }
    }
  }

  return {
    cleanReference,
    pin: null,
  };
}
