import { NextRequest, NextResponse } from 'next/server';

// Terrarium-DEM-Kacheln (AWS Open Data Terrain Tiles). Die Quelle liefert keine
// CORS-Header, deshalb holen wir die Kacheln serverseitig und reichen sie
// same-origin weiter.
const TERRAIN_TILE_BASE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

// Ab z16 liefert die Quelle keine Daten mehr - darüber overzoomt MapLibre selbst.
const MAX_ZOOM = 15;

// Bei 78° Kameraneigung reicht der Blick weit über Osttirol hinaus - ohne
// Höhendaten stünden dort konturlose Flächen am Horizont. Die Box umfasst
// deshalb die Ostalpen, bleibt aber eng genug, dass die Route kein offener
// Tile-Proxy für beliebige Weltregionen ist.
const BOUNDS = { minLon: 9.0, maxLon: 15.5, minLat: 44.8, maxLat: 48.6 };

function tileToLonLat(z: number, x: number, y: number) {
  const n = 2 ** z;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return { lon, lat: (latRad * 180) / Math.PI };
}

function isInBounds(z: number, x: number, y: number): boolean {
  const topLeft = tileToLonLat(z, x, y);
  const bottomRight = tileToLonLat(z, x + 1, y + 1);

  return (
    bottomRight.lon >= BOUNDS.minLon &&
    topLeft.lon <= BOUNDS.maxLon &&
    bottomRight.lat <= BOUNDS.maxLat &&
    topLeft.lat >= BOUNDS.minLat
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
): Promise<NextResponse> {
  const { z: zRaw, x: xRaw, y: yRaw } = await params;

  const z = Number(zRaw);
  const x = Number(xRaw);
  const y = Number(yRaw.replace(/\.png$/, ''));

  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
  }

  if (z < 0 || z > MAX_ZOOM) {
    return NextResponse.json({ error: 'Zoom out of range' }, { status: 404 });
  }

  const max = 2 ** z;
  if (x < 0 || x >= max || y < 0 || y >= max) {
    return NextResponse.json({ error: 'Tile out of range' }, { status: 404 });
  }

  if (!isInBounds(z, x, y)) {
    return NextResponse.json({ error: 'Tile outside of Osttirol' }, { status: 404 });
  }

  try {
    const upstream = await fetch(`${TERRAIN_TILE_BASE}/${z}/${x}/${y}.png`, {
      // Höhendaten ändern sich praktisch nie - aggressiv im CDN cachen.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Tile not available' }, { status: upstream.status });
    }

    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Terrain tile proxy error:', error);
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}
