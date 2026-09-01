import { NextRequest, NextResponse } from 'next/server';
import { cancelOnyxCommand, isOnyxConfigured, OnyxError, sendOnyxCommand } from '@/lib/onyx';
import { rejectCrossSite, requireJsonContentType } from '@/lib/requestGuard';

export const dynamic = 'force-dynamic';

/**
 * Was von hier aus geschaltet werden darf.
 *
 * ONYX kennt mehr Eigenschaften und Aktionen, als die Steuerung braucht. Die
 * Route reicht deshalb nicht beliebige Inhalte weiter, sondern nur das, was die
 * Oberfläche tatsächlich bedient - ein Tippfehler oder ein manipulierter Aufruf
 * kann so keine unerwarteten Zustände an der Anlage erzeugen.
 */
const ALLOWED_ACTIONS = new Set(['open', 'close', 'stop', 'wink', 'light_on', 'light_off']);
const ALLOWED_PROPERTIES = new Set([
  'target_position',
  'target_angle',
  'target_brightness',
  'dim_duration',
]);

// Gerätekennungen sind UUIDs. Die Prüfung verhindert, dass über den Pfad andere
// Endpunkte der Anlage angesprochen werden.
const DEVICE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Obergrenze für die Haltedauer: eine Woche.
 *
 * ONYX selbst nennt keine, aber ein Vertipper darf ein Gerät nicht auf Monate
 * hinaus aus der Automatik nehmen. Wer länger will, schaltet die Automatik in
 * der ONYX-App ab - das ist der ehrlichere Weg als ein endlos laufender Befehl.
 */
const MAX_HOLD_MINUTES = 7 * 24 * 60;

interface CommandBody {
  action?: unknown;
  properties?: unknown;
  /** Wie lange der Befehl die Automatik unterdrücken soll. Ohne Angabe: 15 Minuten. */
  holdMinutes?: unknown;
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const blocked = rejectCrossSite(request) ?? requireJsonContentType(request);
  if (blocked) return blocked;

  const { id } = await params;
  if (!DEVICE_ID.test(id)) return badRequest('Unbekannte Gerätekennung');

  if (!isOnyxConfigured()) {
    return NextResponse.json({ error: 'ONYX ist nicht eingerichtet' }, { status: 503 });
  }

  let body: CommandBody;
  try {
    body = (await request.json()) as CommandBody;
  } catch {
    return badRequest('Befehl nicht lesbar');
  }

  const action = typeof body.action === 'string' ? body.action : undefined;
  if (action && !ALLOWED_ACTIONS.has(action)) return badRequest(`Aktion ${action} ist nicht erlaubt`);

  let properties: Record<string, number> | undefined;
  if (body.properties && typeof body.properties === 'object') {
    properties = {};
    for (const [key, value] of Object.entries(body.properties as Record<string, unknown>)) {
      if (!ALLOWED_PROPERTIES.has(key)) return badRequest(`Eigenschaft ${key} ist nicht erlaubt`);
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return badRequest(`Wert für ${key} ist keine Zahl`);
      }
      properties[key] = Math.round(value);
    }
  }

  // Ein Befehl setzt Eigenschaften oder führt eine Aktion aus - nie beides.
  if (action && properties) return badRequest('Aktion und Eigenschaften schließen sich aus');
  if (!action && (!properties || Object.keys(properties).length === 0)) {
    return badRequest('Befehl ohne Inhalt');
  }

  // Der Ablaufzeitpunkt wird hier gerechnet, nicht im Browser: ONYX vergleicht
  // ihn mit seiner eigenen Uhr, und eine falsch gestellte Uhr am Steuergerät
  // würde den Befehl sonst sofort verfallen lassen oder ewig gelten lassen.
  let bestBefore: number | undefined;
  if (body.holdMinutes !== undefined) {
    const minutes = body.holdMinutes;

    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
      return badRequest('Haltedauer ist keine gültige Minutenzahl');
    }
    if (minutes > MAX_HOLD_MINUTES) {
      return badRequest(`Haltedauer ist auf ${MAX_HOLD_MINUTES / (24 * 60)} Tage begrenzt`);
    }

    bestBefore = Math.floor(Date.now() / 1000) + Math.round(minutes) * 60;
  }

  try {
    const result = await sendOnyxCommand(id, {
      ...(action ? { action } : { properties }),
      ...(bestBefore ? { best_before: bestBefore } : {}),
    });

    return NextResponse.json({ command: result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('ONYX-Befehl fehlgeschlagen:', error);
    const status = error instanceof OnyxError ? error.status : 502;
    const message = error instanceof OnyxError ? error.message : 'ONYX nicht erreichbar';

    return NextResponse.json({ error: message }, { status });
  }
}

/** Nimmt den zuletzt gesendeten Befehl zurück und gibt das Gerät der Automatik zurück. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const { id } = await params;
  if (!DEVICE_ID.test(id)) return badRequest('Unbekannte Gerätekennung');

  if (!isOnyxConfigured()) {
    return NextResponse.json({ error: 'ONYX ist nicht eingerichtet' }, { status: 503 });
  }

  try {
    await cancelOnyxCommand(id);

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('ONYX-Befehl nicht stornierbar:', error);
    const status = error instanceof OnyxError ? error.status : 502;
    const message = error instanceof OnyxError ? error.message : 'ONYX nicht erreichbar';

    return NextResponse.json({ error: message }, { status });
  }
}
