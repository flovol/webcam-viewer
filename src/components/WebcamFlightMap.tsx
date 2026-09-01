"use client";

import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { bearingDeg, bearingDelta, destinationPoint } from "@/lib/geo";
import { sampleElevations } from "@/lib/elevation";

export interface FlightStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface WebcamFlightMapProps {
  /** Alle Standorte - werden als Punkte auf der Karte angezeigt. */
  stops: FlightStop[];
  /** Standort, zu dem geflogen wird. */
  target: FlightStop;
  /** Standort, von dem aus geflogen wird (bestimmt den Kamerakurs). */
  origin: FlightStop | null;
  /** Mindestdauer des Fluges in Millisekunden. Große Kurswechsel dehnen sie. */
  flightDuration: number;
  /** Meldet die Landung - erst danach blendet das Webcam-Bild ein. */
  onFlightEnd: () => void;
}

// Orthofoto von basemap.at (Verwaltung Österreich) - deckt Osttirol in 30cm ab.
const ORTHO_TILES =
  "https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg";

// Außerhalb Österreichs liefert basemap.at keine 404, sondern eine fast leere
// weiße Kachel. Ohne diese Grenze würde sie am Horizont alles überdecken.
const AUSTRIA_BOUNDS: [number, number, number, number] = [9.4, 46.3, 17.2, 49.1];

// Für alles jenseits der Grenze - sonst stünden dort konturlose Flächen.
const WORLD_IMAGERY_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// MapLibre sucht seinen Worker sonst relativ zum Turbopack-Chunk und bekommt dort
// Next.js' 404-HTML. Ohne Worker werden raster-dem-Kacheln nicht dekodiert - die
// Karte bliebe flach. Die Dateien legt scripts/copy-maplibre-worker.mjs ab.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const CAMERA_SOURCE = "webcam-stops";
const ARRIVAL_ZOOM = 12.9;
// Flach genug für Bergsilhouetten gegen den Himmel, steil genug, dass die Kamera
// sicher über den Gipfeln bleibt. Bei 78 Grad stand sie nur rund 18 km zurück und
// 3,8 km über dem Ziel - der überhöhte Großglockner reichte ihr dann bis auf gut
// 150 m, und die Kamera flog durch den Berg. Bei 68 Grad sind es über 4 km Luft.
const ARRIVAL_PITCH = 68;
// Die Route hat bewusst kurze Etappen; ohne erzwungenen Scheitelpunkt würde
// flyTo dabei kaum herauszoomen und der Überflug fiele flach aus.
// Nicht zu weit heraus: darüber wird das DEM grob und der Flug wirkt wieder flach.
const FLIGHT_PEAK_ZOOM = 12.4;
// Überhöhung skaliert die Berge, nicht die Kamerabahn - 2.0 hob den Großglockner
// auf rechnerische 7596 m und damit auf Kamerahöhe. 1.4 bleibt plastisch und sicher.
const TERRAIN_EXAGGERATION = 1.4;

// Bei ARRIVAL_PITCH steht die Kamera rund 18 km hinter dem Ziel. Die Strecke
// wird etwas darüber hinaus abgetastet, damit auch der Standort der Kamera
// selbst mit geprüft wird.
const SIGHT_DISTANCE_KM = 20;
const SIGHT_SAMPLES = 20;
const BEARING_STEP = 20;
// Straf-Grad pro Grad Abweichung von der Flugrichtung. Klein genug, dass echte
// Verdeckung immer gewinnt, groß genug, dass bei freier Sicht die natürliche
// Flugrichtung bevorzugt wird.
const TRAVEL_BEARING_WEIGHT = 0.02;
// Luft über dem höchsten Grat auf der Sichtlinie.
const PITCH_MARGIN_DEG = 4;
// Flacher als das wird nicht gestellt - sonst kippt die Ansicht in Draufsicht.
// In Kals steigt der Glockner überhöht mit rund 35 Grad an, dafür muss die
// Kamera notfalls deutlich steiler stehen dürfen.
const MIN_PITCH = 40;
// flyTo dreht die Kamera linear über die Flugdauer. Statt den Kurs zu
// beschränken - dann bliebe die Kamera hinter Bergen stehen - bekommt der Flug
// so viel Zeit, wie er zum ruhigen Eindrehen braucht.
const MAX_TURN_RATE_DEG_PER_SEC = 45;

interface CameraAngles {
  bearing: number;
  pitch: number;
}

/**
 * Wählt Kurs und Neigung so, dass der Standort frei sichtbar bleibt.
 *
 * Die Kamera liegt auf einem Strahl, der unter (90 - pitch) Grad über dem Ziel
 * ansteigt, und zwar entgegengesetzt zur Blickrichtung. Steigt das Gelände auf
 * dieser Strecke steiler an, verdeckt es den Standort - und am Ende der Strecke
 * steckt die Kamera im Berg. Beides ist derselbe Test.
 *
 * Deshalb: pro Kandidatenkurs den steilsten Anstieg über dem Ziel bestimmen, den
 * flachsten Kurs nehmen und, falls der immer noch steiler ist als die Neigung
 * zulässt, die Kamera flacher stellen bis sie darüber liegt.
 *
 * Die Höhen kommen aus @/lib/elevation und nicht aus queryTerrainElevation: vor
 * dem Abflug hat die Karte für das Zielgebiet noch nichts geladen, die Prüfung
 * würde sonst leer laufen und die Kamera in den Berg schicken.
 */
async function pickCameraAngles(
  target: FlightStop,
  preferred: number
): Promise<CameraAngles> {
  const bearings: number[] = [];
  for (let bearing = 0; bearing < 360; bearing += BEARING_STEP) bearings.push(bearing);

  // Zielpunkt zuerst, danach je Kurs die Strecke hinter dem Ziel.
  const points = [{ lat: target.lat, lon: target.lon }];
  for (const bearing of bearings) {
    const cameraSide = (bearing + 180) % 360;

    for (let step = 1; step <= SIGHT_SAMPLES; step++) {
      const distanceKm = (SIGHT_DISTANCE_KM * step) / SIGHT_SAMPLES;
      points.push(destinationPoint(target, cameraSide, distanceKm));
    }
  }

  const raw = await sampleElevations(points);

  // Gerechnet wird mit der überhöhten Geometrie - die wird ja auch gerendert.
  const elevations = raw.map((value) => (value === null ? null : value * TERRAIN_EXAGGERATION));

  const targetElevation = elevations[0];
  if (targetElevation === null) return { bearing: preferred, pitch: ARRIVAL_PITCH };

  let bestBearing = preferred;
  let bestScore = Infinity;
  let bestRise = -90;
  let evaluated = 0;

  bearings.forEach((bearing, index) => {
    const offset = 1 + index * SIGHT_SAMPLES;
    let steepestRise = -90;
    let samples = 0;

    for (let step = 1; step <= SIGHT_SAMPLES; step++) {
      const elevation = elevations[offset + step - 1];
      if (elevation === null) continue;

      samples++;
      const distanceKm = (SIGHT_DISTANCE_KM * step) / SIGHT_SAMPLES;
      const angle =
        (Math.atan2(elevation - targetElevation, distanceKm * 1000) * 180) / Math.PI;
      if (angle > steepestRise) steepestRise = angle;
    }

    // Zu wenig Daten auf dieser Achse - Kurs nicht bewerten.
    if (samples < SIGHT_SAMPLES / 2) return;
    evaluated++;

    const score = steepestRise + TRAVEL_BEARING_WEIGHT * bearingDelta(bearing, preferred);
    if (score < bestScore) {
      bestScore = score;
      bestBearing = bearing;
      bestRise = steepestRise;
    }
  });

  if (evaluated === 0) return { bearing: preferred, pitch: ARRIVAL_PITCH };

  // Neigung so weit zurücknehmen, dass die Kamera über den Grat steigt.
  const required = 90 - (bestRise + PITCH_MARGIN_DEG);
  const pitch = Math.max(MIN_PITCH, Math.min(ARRIVAL_PITCH, required));

  return { bearing: bestBearing, pitch };
}

function buildStyle(terrainTiles: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      world: {
        type: "raster",
        tiles: [WORLD_IMAGERY_TILES],
        tileSize: 256,
        maxzoom: 17,
        attribution: "Satellitenbild: Esri, Maxar, Earthstar Geographics",
      },
      ortho: {
        type: "raster",
        tiles: [ORTHO_TILES],
        tileSize: 256,
        maxzoom: 19,
        bounds: AUSTRIA_BOUNDS,
        attribution:
          'Orthofoto: <a href="https://www.basemap.at" target="_blank" rel="noreferrer">basemap.at</a> (CC BY 4.0)',
      },
      terrain: {
        type: "raster-dem",
        tiles: [terrainTiles],
        tileSize: 256,
        maxzoom: 15,
        encoding: "terrarium",
        attribution: "Höhendaten: AWS Terrain Tiles",
      },
    },
    layers: [
      // Dunstfarbe statt Dunkelblau: noch nicht geladene Geländekacheln fallen so
      // deutlich weniger auf als schwarze Flächen.
      { id: "background", type: "background", paint: { "background-color": "#b9cfe4" } },
      { id: "world", type: "raster", source: "world", paint: { "raster-fade-duration": 300 } },
      // Liegt über dem Weltbild und ersetzt es dort, wo es die feineren Daten gibt.
      { id: "ortho", type: "raster", source: "ortho", paint: { "raster-fade-duration": 300 } },
    ],
    sky: {
      "sky-color": "#0a1a3c",
      "horizon-color": "#8fb8e8",
      "fog-color": "#d7e6f7",
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.55,
      "fog-ground-blend": 0.15,
    },
  };
}

function stopsToGeoJSON(stops: FlightStop[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: stops.map((stop) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [stop.lon, stop.lat] },
      properties: { id: stop.id, name: stop.name },
    })),
  };
}

export default function WebcamFlightMap({
  stops,
  target,
  origin,
  flightDuration,
  onFlightEnd,
}: WebcamFlightMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const styleReadyRef = useRef(false);

  // Startwerte für den Init-Effekt, damit er nicht an den Props hängt.
  const initialRef = useRef({ target, stops });

  // Karte einmalig aufbauen.
  useEffect(() => {
    if (!containerRef.current) return;

    const { target: initialTarget, stops: initialStops } = initialRef.current;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildStyle(`${window.location.origin}/api/terrain/{z}/{x}/{y}.png`),
      center: [initialTarget.lon, initialTarget.lat],
      zoom: ARRIVAL_ZOOM,
      pitch: ARRIVAL_PITCH,
      bearing: 0,
      maxPitch: 85,
      attributionControl: { compact: true },
      // Reiner Anzeigemodus - die Kamera wird ausschließlich vom Flug gesteuert.
      interactive: false,
    });

    mapRef.current = map;

    const markerElement = document.createElement("div");
    markerElement.className = "webcam-flight-marker";
    markerElement.innerHTML =
      '<span class="webcam-flight-marker__pulse"></span><span class="webcam-flight-marker__dot"></span>';

    markerRef.current = new Marker({ element: markerElement, anchor: "center" })
      .setLngLat([initialTarget.lon, initialTarget.lat])
      .addTo(map);

    map.on("load", () => {
      styleReadyRef.current = true;

      // Ohne Höhendaten bleibt die Karte flach, aber funktionsfähig.
      try {
        map.setTerrain({ source: "terrain", exaggeration: TERRAIN_EXAGGERATION });
      } catch (error) {
        console.error("Gelände konnte nicht aktiviert werden:", error);
      }

      map.addSource(CAMERA_SOURCE, { type: "geojson", data: stopsToGeoJSON(initialStops) });

      map.addLayer({
        id: "stop-halo",
        type: "circle",
        source: CAMERA_SOURCE,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 14, 7],
          "circle-color": "#000000",
          "circle-opacity": 0.35,
          "circle-blur": 0.4,
        },
      });

      map.addLayer({
        id: "stop-dot",
        type: "circle",
        source: CAMERA_SOURCE,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 1.6, 14, 3.5],
          "circle-color": "#ffffff",
          "circle-opacity": 0.8,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(0,0,0,0.4)",
        },
      });
    });

    map.on("error", (event) => {
      // Fehlende Kacheln am Rand sind normal, ein defekter Worker nicht - deshalb
      // sichtbar loggen statt in console.debug zu verschwinden.
      console.warn("MapLibre:", event.error?.message);
    });

    return () => {
      styleReadyRef.current = false;
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Standorte nachladen, falls sich die Liste ändert.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;

    const source = map.getSource(CAMERA_SOURCE) as GeoJSONSource | undefined;
    source?.setData(stopsToGeoJSON(stops));
  }, [stops]);

  // Der eigentliche Flug zum neuen Standort.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.setLngLat([target.lon, target.lat]);

    // Beim ersten Standort steht die Kamera schon richtig - kein Flug nötig.
    if (!origin) {
      onFlightEnd();
      return;
    }

    let cancelled = false;
    let landed: ReturnType<typeof setTimeout> | undefined;

    // Der Blickwinkel braucht Höhendaten und damit einen Netzzugriff. Die
    // Kacheln sind nach der ersten Etappe im Cache, danach ist das sofort da.
    void (async () => {
      const { bearing, pitch } = await pickCameraAngles(target, bearingDeg(origin, target));
      if (cancelled) return;

      const turn = bearingDelta(bearing, map.getBearing());
      const duration = Math.max(flightDuration, (turn / MAX_TURN_RATE_DEG_PER_SEC) * 1000);

      map.flyTo({
        center: [target.lon, target.lat],
        zoom: ARRIVAL_ZOOM,
        // Flugrichtung und Standardneigung als Wunsch - beides weicht zurück,
        // wenn sonst ein Berg zwischen Kamera und Standort stünde.
        bearing,
        pitch,
        duration,
        // Scheitelpunkt des Flugbogens - zoomt heraus und wieder hinein.
        minZoom: FLIGHT_PEAK_ZOOM,
        essential: true,
      });

      landed = setTimeout(onFlightEnd, duration);
    })();

    return () => {
      cancelled = true;
      if (landed) clearTimeout(landed);
    };
  }, [target, origin, flightDuration, onFlightEnd]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
