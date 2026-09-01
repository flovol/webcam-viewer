import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

/**
 * Vergleicht zwei Strings ohne frühen Abbruch.
 *
 * Ein normaler === bricht beim ersten falschen Zeichen ab; aus der Antwortzeit
 * ließe sich das Passwort zeichenweise erraten. Hier ist die Laufzeit unabhängig
 * davon, an welcher Stelle die Werte auseinandergehen.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse('Zugang nur mit Passwort.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Osttirol Webcams", charset="UTF-8"',
      // Nichts von geschützten Seiten in Zwischenspeichern ablegen.
      'Cache-Control': 'no-store',
    },
  });
}

export default function middleware(req: NextRequest) {
  // Namen wie in den Vercel-Umgebungsvariablen hinterlegt. Fachlich wäre
  // BASIC_AUTH_* richtig (HTTP Basic Auth), die Variablen lassen sich dort aber
  // nicht mehr umbenennen - der Code richtet sich deshalb danach.
  const user = process.env.BASE_AUTH_USER;
  const password = process.env.BASE_AUTH_PASS;

  // Ohne gesetzte Zugangsdaten bleibt der Schutz aus - sonst wäre lokale
  // Entwicklung nicht möglich. ACHTUNG: fehlen die Variablen in der Produktion,
  // ist die Seite offen. Siehe README.
  if (user && password) {
    const expected = `Basic ${btoa(`${user}:${password}`)}`;
    const provided = req.headers.get('authorization');

    if (!provided || !safeEqual(provided, expected)) {
      return unauthorized();
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/', '/(de|en)/:path*', '/((?!api|_next|_vercel|.*\..*).*)']
};
