import type { GeoPoint } from "./geo";

/**
 * Höhenabfrage unabhängig vom Renderzustand der Karte.
 *
 * MapLibres queryTerrainElevation kennt nur, was gerade als Terrain-Kachel
 * geladen ist - beim Anflug auf ein neues Gebiet also nichts. Für die Wahl des
 * Blickwinkels brauchen wir die Höhen aber vor dem Flug. Deshalb holen wir die
 * Terrarium-Kacheln über dieselbe Proxy-Route und dekodieren sie selbst.
 */

// Rund 38 m pro Pixel auf Osttiroler Breite - fein genug für Grate, grob genug,
// dass wenige Kacheln eine große Fläche abdecken.
const TILE_ZOOM = 12;
const TILE_SIZE = 256;

const tileCache = new Map<string, Promise<Float32Array | null>>();

function decodeTerrarium(data: Uint8ClampedArray, size: number): Float32Array {
  const out = new Float32Array(size * size);

  for (let i = 0; i < out.length; i++) {
    const o = i * 4;
    // Terrarium-Kodierung: Höhe in Metern über NN.
    out[i] = data[o] * 256 + data[o + 1] + data[o + 2] / 256 - 32768;
  }

  return out;
}

async function loadTile(x: number, y: number): Promise<Float32Array | null> {
  try {
    const response = await fetch(`/api/terrain/${TILE_ZOOM}/${x}/${y}.png`);
    if (!response.ok) return null;

    const bitmap = await createImageBitmap(await response.blob());
    const size = bitmap.width;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    return decodeTerrarium(context.getImageData(0, 0, size, size).data, size);
  } catch {
    // Randkacheln außerhalb der Proxy-Box fehlen erwartungsgemäß.
    return null;
  }
}

function tile(x: number, y: number): Promise<Float32Array | null> {
  const key = `${x}/${y}`;
  let pending = tileCache.get(key);

  if (!pending) {
    pending = loadTile(x, y);
    tileCache.set(key, pending);
  }

  return pending;
}

/** Kachel- und Pixelkoordinate eines Punktes auf TILE_ZOOM. */
function locate(point: GeoPoint) {
  const n = 2 ** TILE_ZOOM;
  const latRad = (point.lat * Math.PI) / 180;

  const fx = ((point.lon + 180) / 360) * n;
  const fy =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const x = Math.floor(fx);
  const y = Math.floor(fy);

  return {
    x,
    y,
    px: Math.min(TILE_SIZE - 1, Math.floor((fx - x) * TILE_SIZE)),
    py: Math.min(TILE_SIZE - 1, Math.floor((fy - y) * TILE_SIZE)),
  };
}

/**
 * Höhen mehrerer Punkte in Metern über NN, `null` wo keine Daten vorliegen.
 * Kacheln werden einmal geholt und für die Sitzung behalten - die Route hat
 * kurze Etappen, benachbarte Stationen teilen sich also fast alle Kacheln.
 */
export async function sampleElevations(points: GeoPoint[]): Promise<(number | null)[]> {
  const located = points.map(locate);

  const needed = new Map<string, { x: number; y: number }>();
  for (const spot of located) {
    needed.set(`${spot.x}/${spot.y}`, { x: spot.x, y: spot.y });
  }

  const loaded = new Map<string, Float32Array | null>();
  await Promise.all(
    [...needed.entries()].map(async ([key, spot]) => {
      loaded.set(key, await tile(spot.x, spot.y));
    })
  );

  return located.map((spot) => {
    const data = loaded.get(`${spot.x}/${spot.y}`);
    if (!data) return null;

    return data[spot.py * TILE_SIZE + spot.px];
  });
}
