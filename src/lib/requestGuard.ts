import { NextRequest, NextResponse } from 'next/server';

/**
 * Schutz der schreibenden Routen gegen Befehle von fremden Seiten (CSRF).
 *
 * Der Passwortschutz allein reicht dafür nicht: Bei HTTP Basic Auth hängt der
 * Browser die Zugangsdaten von sich aus an jede Anfrage an diese Herkunft an -
 * auch an eine, die eine fremde Seite im Hintergrund abschickt. Eine solche
 * Anfrage kann die Antwort zwar nicht lesen, die Wirkung tritt aber ein. Für
 * /api/onyx heißt das: fremde Seite fährt die Jalousien.
 *
 * Zwei Riegel, die sich ergänzen:
 *
 * 1. Sec-Fetch-Site setzt der Browser selbst, Seiteninhalte können den Wert
 *    nicht fälschen. Alles außer "same-origin" (und "none" für direkt
 *    eingegebene Adressen) wird abgewiesen.
 * 2. Content-Type: application/json. Damit ist die Anfrage keine "einfache"
 *    mehr, der Browser fragt vorher per OPTIONS um Erlaubnis - und weil wir
 *    keine CORS-Freigabe erteilen, kommt sie nie an.
 *
 * Aufrufe ohne diese Kopfzeilen, etwa aus curl oder einem Skript, bleiben
 * möglich; die gehen ohnehin durch den Passwortschutz aus src/proxy.ts.
 */

function forbidden(reason: string): NextResponse {
  return NextResponse.json({ error: reason }, { status: 403 });
}

export function rejectCrossSite(request: NextRequest): NextResponse | null {
  const site = request.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin' && site !== 'none') {
    return forbidden('Befehle von fremden Seiten sind nicht erlaubt');
  }

  const origin = request.headers.get('origin');
  if (origin !== null) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return forbidden('Unlesbare Herkunft');
    }

    if (originHost !== request.nextUrl.host) {
      return forbidden('Befehle von fremden Seiten sind nicht erlaubt');
    }
  }

  return null;
}

/** Verlangt application/json - siehe Riegel 2 oben. */
export function requireJsonContentType(request: NextRequest): NextResponse | null {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();

  if (type !== 'application/json') {
    return NextResponse.json(
      { error: 'Content-Type application/json erwartet' },
      { status: 415 }
    );
  }

  return null;
}
