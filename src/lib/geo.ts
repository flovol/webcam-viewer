export interface GeoPoint {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Luftlinie zwischen zwei Punkten in Kilometern (Haversine). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Kompasskurs von `from` nach `to` in Grad (0 = Norden). */
export function bearingDeg(from: GeoPoint, to: GeoPoint): number {
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Ordnet die Punkte zu einer Rundreise mit kurzen Sprüngen (Nearest Neighbour).
 * Zufällige Reihenfolge würde bedeuten, dass der Flug ständig quer durch ganz
 * Osttirol geht - so bleiben die Etappen kurz und die Kamerafahrt ruhig.
 *
 * @returns Indizes von `points` in Flugreihenfolge
 */
export function buildFlightRoute(points: GeoPoint[], startIndex = 0): number[] {
  if (points.length === 0) return [];

  const remaining = new Set(points.map((_, i) => i));
  const start = remaining.has(startIndex) ? startIndex : 0;

  const route = [start];
  remaining.delete(start);

  let current = start;
  while (remaining.size > 0) {
    let nearest = -1;
    let nearestDistance = Infinity;

    for (const candidate of remaining) {
      const d = distanceKm(points[current], points[candidate]);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = candidate;
      }
    }

    route.push(nearest);
    remaining.delete(nearest);
    current = nearest;
  }

  return route;
}

/** Punkt in `distanceKm` Entfernung unter dem Kurs `bearing` von `from` aus. */
export function destinationPoint(from: GeoPoint, bearing: number, distanceKm: number): GeoPoint {
  const angular = distanceKm / EARTH_RADIUS_KM;
  const br = toRad(bearing);
  const lat1 = toRad(from.lat);
  const lon1 = toRad(from.lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(br)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(br) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );

  return { lat: toDeg(lat2), lon: ((toDeg(lon2) + 540) % 360) - 180 };
}

/** Kleinster Winkel zwischen zwei Kursen, 0-180 Grad. */
export function bearingDelta(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}
