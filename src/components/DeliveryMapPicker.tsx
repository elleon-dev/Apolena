"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Search,
  Layers,
  ExternalLink,
  X,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  DeliveryPinLocation,
  resolveCoordinatesForLocation,
} from "@/lib/delivery-location";

interface DeliveryMapPickerProps {
  address: string;
  district: string;
  department: string;
  value: DeliveryPinLocation | null;
  onChange: (pin: DeliveryPinLocation | null) => void;
  onSelectSuggestedAddress?: (suggestedAddress: string, suggestedDistrict?: string) => void;
}

export function DeliveryMapPicker({
  address,
  district,
  department,
  value,
  onChange,
  onSelectSuggestedAddress,
}: DeliveryMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const [mapMode, setMapMode] = useState<"hybrid" | "streets">("hybrid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detectedStreet, setDetectedStreet] = useState<string | null>(
    value?.label || null,
  );
  const [detectedSuburb, setDetectedSuburb] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Crea el icono SVG personalizado del Pin para evitar problemas de assets PNG en Next.js
  const createPinIcon = useCallback((L: any) => {
    return L.divIcon({
      className: "apolena-custom-map-pin",
      html: `
        <div style="position: relative; width: 38px; height: 46px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.45));">
          <svg viewBox="0 0 38 46" width="38" height="46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 0C8.50659 0 0 8.50659 0 19C0 32.25 16.6 44.5 18.1 45.6C18.63 45.99 19.37 45.99 19.9 45.6C21.4 44.5 38 32.25 38 19C38 8.50659 29.4934 0 19 0Z" fill="#174B3D"/>
            <path d="M19 2C9.61116 2 2 9.61116 2 19C2 31.1 17 42.5 19 44C21 42.5 36 31.1 36 19C36 9.61116 28.3888 2 19 2Z" stroke="#C6A26C" stroke-width="2"/>
            <circle cx="19" cy="18" r="7.5" fill="#FFFBF2" stroke="#C6A26C" stroke-width="2"/>
            <circle cx="19" cy="18" r="3.5" fill="#C95B3C"/>
          </svg>
        </div>
      `,
      iconSize: [38, 46],
      iconAnchor: [19, 45],
    });
  }, []);

  // Geocodificación inversa (Coordenadas -> Nombre de calle/número)
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "es",
            },
          },
        );
        if (!res.ok) throw new Error("No se pudo obtener la calle");
        const data = await res.json();
        const addr = data?.address || {};
        const road =
          addr.road ||
          addr.pedestrian ||
          addr.residential ||
          addr.suburb ||
          addr.neighbourhood ||
          "";
        const houseNumber = addr.house_number ? ` ${addr.house_number}` : "";
        const suburb =
          addr.suburb ||
          addr.city_district ||
          addr.town ||
          addr.city ||
          district ||
          "Lima";
        const postcode = addr.postcode ? ` ${addr.postcode}` : "";

        const primaryLabel = road
          ? `${road}${houseNumber}`
          : data?.display_name?.split(",")?.slice(0, 2)?.join(",") ||
            `Pin en ${district || "Mapa"}`;
        const secondaryLabel = `${suburb}${postcode}`;

        setDetectedStreet(primaryLabel);
        setDetectedSuburb(secondaryLabel);

        onChange({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          label: `${primaryLabel}, ${secondaryLabel}`,
          google_maps_url: buildGoogleMapsUrl(lat, lng),
        });
      } catch {
        const fallbackLabel = address
          ? `${address}, ${district || department}`
          : `Ubicación en ${district || department || "Lima"}`;
        setDetectedStreet(fallbackLabel);
        setDetectedSuburb(district || department || "Perú");
        onChange({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          label: fallbackLabel,
          google_maps_url: buildGoogleMapsUrl(lat, lng),
        });
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [address, department, district, onChange],
  );

  // Coloca o mueve el marcador en el mapa
  const placeOrUpdateMarker = useCallback(
    (lat: number, lng: number, shouldReverseGeocode = true, flyZoom?: number) => {
      const L = leafletRef.current;
      const map = mapInstanceRef.current;
      if (!L || !map) return;

      const icon = createPinIcon(L);

      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon,
        }).addTo(map);

        marker.on("dragend", (event: any) => {
          const pos = event.target.getLatLng();
          if (pos) {
            void reverseGeocode(pos.lat, pos.lng);
          }
        });

        markerInstanceRef.current = marker;
      }

      const targetZoom = flyZoom || Math.max(map.getZoom(), 17);
      map.flyTo([lat, lng], targetZoom, { duration: 0.65 });

      if (shouldReverseGeocode) {
        void reverseGeocode(lat, lng);
      }
    },
    [createPinIcon, reverseGeocode],
  );

  // Inicialización del mapa Leaflet
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      try {
        const leafletMod = await import("leaflet");
        const L = leafletMod.default || leafletMod;
        if (!isMounted || !mapContainerRef.current) return;

        leafletRef.current = L;

        const initialCenter =
          value &&
          typeof value.lat === "number" &&
          typeof value.lng === "number"
            ? { lat: value.lat, lng: value.lng, zoom: 17 }
            : resolveCoordinatesForLocation(district, department);

        const map = L.map(mapContainerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: initialCenter.zoom,
          zoomControl: true,
          attributionControl: false,
        });

        const tileUrl =
          mapMode === "hybrid"
            ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

        const layer = L.tileLayer(tileUrl, {
          maxZoom: 20,
        }).addTo(map);

        tileLayerRef.current = layer;
        mapInstanceRef.current = map;

        // Si ya había un valor guardado, dibujar el pin
        if (
          value &&
          typeof value.lat === "number" &&
          typeof value.lng === "number"
        ) {
          const icon = createPinIcon(L);
          const marker = L.marker([value.lat, value.lng], {
            draggable: true,
            icon,
          }).addTo(map);

          marker.on("dragend", (event: any) => {
            const pos = event.target.getLatLng();
            if (pos) {
              void reverseGeocode(pos.lat, pos.lng);
            }
          });

          markerInstanceRef.current = marker;
          if (value.label) {
            setDetectedStreet(value.label);
          }
        }

        // Al hacer clic en cualquier punto del mapa, colocar el pin
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          setStatusMessage(null);
          placeOrUpdateMarker(lat, lng, true, Math.max(map.getZoom(), 17));
        });
      } catch (err) {
        console.warn("No se pudo cargar el módulo de mapa Leaflet:", err);
        if (isMounted) {
          setStatusMessage(
            "No pudimos cargar el mapa interactivo en este momento. Puedes ingresar tu dirección escrita normalmente o recargar la página.",
          );
        }
      }
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambio entre vista Satélite Híbrida y Mapa de Calles
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      mapMode === "hybrid"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
    }).addTo(map);
  }, [mapMode]);

  // Si cambia el distrito o departamento y el usuario aún no ha fijado un pin, centrar el mapa en el distrito
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || value) return;

    const timer = setTimeout(() => {
      const target = resolveCoordinatesForLocation(district, department);
      map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.7 });
    }, 350);

    return () => clearTimeout(timer);
  }, [district, department, value]);

  // Buscar dirección por texto (del buscador o del campo dirección escrita)
  const handleGeocodeQuery = async (customQuery?: string) => {
    const rawQuery = (
      customQuery ??
      (searchQuery.trim() ||
        [address, district, department, "Perú"].filter(Boolean).join(", "))
    ).trim();

    if (!rawQuery) {
      setStatusMessage("Escribe una calle o dirección para buscarla en el mapa.");
      return;
    }

    setIsSearching(true);
    setStatusMessage(null);

    try {
      const qWithContext = rawQuery.toLowerCase().includes("peru") || rawQuery.toLowerCase().includes("perú")
        ? rawQuery
        : `${rawQuery}, ${district ? `${district}, ` : ""}${department || "Lima"}, Perú`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pe&limit=1&addressdetails=1&q=${encodeURIComponent(
          qWithContext,
        )}`,
        {
          headers: {
            "Accept-Language": "es",
          },
        },
      );
      const results = await res.json();

      if (Array.isArray(results) && results.length > 0) {
        const hit = results[0];
        const lat = parseFloat(hit.lat);
        const lng = parseFloat(hit.lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          placeOrUpdateMarker(lat, lng, true, 18);
          return;
        }
      }

      // Fallback a las coordenadas del distrito si la numeración exacta no figura en OSM
      const fallback = resolveCoordinatesForLocation(district, department);
      placeOrUpdateMarker(fallback.lat, fallback.lng, true, 16);
      setStatusMessage(
        "Acercamos el mapa a tu distrito. Haz clic o arrastra el pin hasta tu puerta exacta.",
      );
    } catch {
      const fallback = resolveCoordinatesForLocation(district, department);
      placeOrUpdateMarker(fallback.lat, fallback.lng, true, 16);
      setStatusMessage(
        "Haz clic o arrastra el pin sobre tu ubicación exacta en el mapa.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Usar ubicación GPS del navegador
  const handleUseCurrentGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatusMessage("Tu navegador no soporta geolocalización GPS.");
      return;
    }

    setIsLocatingGps(true);
    setStatusMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        placeOrUpdateMarker(
          pos.coords.latitude,
          pos.coords.longitude,
          true,
          18,
        );
      },
      () => {
        setIsLocatingGps(false);
        setStatusMessage(
          "No pudimos acceder a tu GPS. Puedes buscar tu calle o hacer clic directamente en el mapa.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleClearPin = () => {
    if (markerInstanceRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerInstanceRef.current);
      markerInstanceRef.current = null;
    }
    setDetectedStreet(null);
    setDetectedSuburb(null);
    onChange(null);
  };

  return (
    <div className="sm:col-span-2 space-y-2.5 pt-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="font-semibold text-stone-800 flex items-center gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Ubica un Pin en tu dirección exacta (Recomendado)</span>
          </label>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Haz clic en el mapa o arrastra el pin hasta tu puerta para evitar confusiones en la entrega.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {address.trim().length > 3 && (
            <button
              type="button"
              onClick={() =>
                void handleGeocodeQuery(
                  `${address}, ${district}, ${department}, Perú`,
                )
              }
              disabled={isSearching}
              className="px-2.5 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-stone-800 border border-cream-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSearching ? (
                <Loader2 className="w-3 h-3 animate-spin text-terracotta-500" />
              ) : (
                <Sparkles className="w-3 h-3 text-terracotta-500" />
              )}
              <span>Ubicar dirección escrita</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isLocatingGps}
            className="px-2.5 py-1.5 rounded-xl bg-[#174B3D]/10 hover:bg-[#174B3D]/15 text-[#174B3D] border border-[#174B3D]/20 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isLocatingGps ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3 text-[#174B3D]" />
            )}
            <span>Usar mi GPS actual</span>
          </button>
        </div>
      </div>

      {/* Buscador rápido de calle o referencia dentro del mapa */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleGeocodeQuery(searchQuery);
              }
            }}
            placeholder={`Buscar calle, av. o esquina en ${district || "tu distrito"}...`}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleGeocodeQuery(searchQuery)}
          disabled={isSearching}
          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>Buscar</span>
        </button>
      </div>

      {statusMessage && (
        <p className="text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200 px-3 py-1.5 rounded-xl">
          {statusMessage}
        </p>
      )}

      {/* Contenedor del Mapa Interactivo */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#c6a26c]/40 shadow-soft bg-stone-900">
        {/* Botón Superior Derecho: Cambiar entre Satélite Híbrido y Calles */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-[400] flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setMapMode((prev) => (prev === "hybrid" ? "streets" : "hybrid"))
            }
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-stone-900 border border-stone-200/80 shadow-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#174B3D] shrink-0" />
            <span className="sm:hidden">
              {mapMode === "hybrid" ? "Satélite" : "Calles"}
            </span>
            <span className="hidden sm:inline">
              {mapMode === "hybrid" ? "Vista: Satélite + Calles" : "Vista: Mapa de Calles"}
            </span>
          </button>
        </div>

        {/* Instrucción Flotante Superior si aún no hay Pin (solo en desktop/tablet para no chocar en pantallas pequeñas) */}
        {!value && (
          <div className="hidden sm:block absolute top-3 left-14 z-[400] max-w-xs pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-stone-900/85 text-white text-[11px] font-medium backdrop-blur-xs shadow-md flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#c6a26c] shrink-0" />
              <span>Toca el mapa para colocar el pin en tu puerta</span>
            </div>
          </div>
        )}

        {/* Lienzo Leaflet */}
        <div
          ref={mapContainerRef}
          className="w-full h-64 sm:h-80 cursor-crosshair z-10"
        />

        {/* Tarjeta Flotante en Desktop / Debajo del Mapa en Mobile */}
        {value && (
          <div className="sm:absolute sm:bottom-3 sm:right-3 sm:w-80 z-[400] bg-white sm:bg-white/95 backdrop-blur-md border-t sm:border border-stone-200 sm:rounded-2xl p-3 sm:shadow-lg animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#174B3D] text-[#c6a26c] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-stone-900 text-xs truncate">
                      {isReverseGeocoding
                        ? "Detectando calle..."
                        : detectedStreet || "Pin de entrega fijado"}
                    </p>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate">
                    {detectedSuburb || `${district || "Lima"}, ${department || "Perú"}`}
                  </p>
                  <p className="font-mono text-[11px] font-semibold text-[#174B3D] mt-0.5">
                    {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={buildGoogleMapsUrl(value.lat, value.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver punto exacto en Google Maps"
                  className="w-7 h-7 rounded-full bg-[#174B3D]/10 hover:bg-[#174B3D]/20 text-[#174B3D] flex items-center justify-center transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleClearPin}
                  title="Quitar pin"
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {onSelectSuggestedAddress &&
              detectedStreet &&
              !isReverseGeocoding &&
              !address.trim() && (
                <button
                  type="button"
                  onClick={() =>
                    onSelectSuggestedAddress(
                      detectedStreet,
                      detectedSuburb || undefined,
                    )
                  }
                  className="mt-2 w-full py-1.5 px-2.5 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3 text-sage-600" />
                  <span>Usar &ldquo;{detectedStreet}&rdquo; como dirección</span>
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
