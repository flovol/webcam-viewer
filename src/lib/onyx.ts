/**
 * Anbindung an die ONYX-Anlage (Jalousien, Raffstores, Markisen, Lampen).
 *
 * ONYX ist die Haussteuerung von HELLA Sonnen- und Wetterschutztechnik. Die
 * Schnittstelle ist unter https://github.com/hella-info/onyx_api beschrieben.
 * Angesprochen wird entweder der Relay-Server von HELLA (api.hella.link) oder
 * eine ONYX.CENTER im lokalen Netz - der Pfad hinter der Basis-URL ist in
 * beiden Fällen derselbe.
 *
 * Das Zugriffstoken darf den Server nie verlassen, deshalb laufen alle Aufrufe
 * über die Routen unter /api/onyx und nicht direkt aus dem Browser.
 */

/** Neueste dokumentierte Fassung. Ältere Anlagen brauchen ggf. v3 oder v1. */
const DEFAULT_API_VERSION = "v5";

const RELAY_HOST = "https://api.hella.link";

/** Die Anlage antwortet in der Regel in Millisekunden - hängt sie, warten wir nicht ewig. */
const REQUEST_TIMEOUT_MS = 8000;

export interface OnyxProperty {
  type: "numeric" | "enumeration";
  readonly: boolean;
  value: number | string;
  /** Nur bei numerischen Eigenschaften. */
  minimum?: number;
  maximum?: number;
  /** Nur bei Aufzählungen. */
  values?: string[];
}

export interface OnyxDevice {
  id: string;
  /** Name aus der ONYX-App, z.B. "Jalousie Besprechung". */
  name: string;
  /** z.B. "raffstore_90", "rollershutter", "awning", "basic_light", "dimmable_light". */
  type: string;
  actions: string[];
  properties: Record<string, OnyxProperty>;
}

/** Ein Befehl setzt entweder Eigenschaften oder führt eine Aktion aus. */
export interface OnyxCommand {
  action?: string;
  properties?: Record<string, number>;
  /**
   * Ab wann und bis wann der Befehl gilt, als UNIX-Zeitstempel in Sekunden.
   *
   * Ohne Angabe gilt er ab sofort und läuft nach 15 Minuten ab. Solange er
   * gilt, unterdrückt er Zeit- und Sonnenautomatik; danach übernimmt die
   * Automatik wieder, die eingestellte Position bleibt aber stehen.
   */
  valid_from?: number;
  best_before?: number;
}

export class OnyxError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "OnyxError";
  }
}

interface OnyxConfig {
  baseUrl: string;
  token: string;
}

interface OnyxCredentials {
  token?: string;
  fingerprint?: string;
  host?: string;
}

/**
 * Liest die Sammelvariable ONYX.
 *
 * /authorize gibt Fingerabdruck und Token als JSON zurück, deshalb darf genau
 * dieses JSON hier hinterlegt werden. Ebenso akzeptiert werden
 * "fingerabdruck:token" und - wenn Fingerabdruck oder Hostname separat gesetzt
 * sind - das nackte Token.
 */
function parseOnyxVariable(raw: string): OnyxCredentials {
  const value = raw.trim();
  if (!value) return {};

  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      const pick = (key: string) =>
        typeof parsed[key] === "string" ? (parsed[key] as string) : undefined;

      return { token: pick("token"), fingerprint: pick("fingerprint"), host: pick("host") };
    } catch {
      return {};
    }
  }

  const separator = value.indexOf(":");
  if (separator > 0) {
    return { fingerprint: value.slice(0, separator), token: value.slice(separator + 1) };
  }

  return { token: value };
}

/**
 * Zugangsdaten aus der Umgebung.
 *
 * Ein Token ist immer nötig. Für den Weg über den HELLA-Server kommt der
 * Fingerabdruck der Anlage dazu, für den lokalen Weg stattdessen deren
 * Hostname. Ist beides gesetzt, gewinnt der lokale Weg - er ist schneller und
 * funktioniert ohne Internet.
 *
 * Die Werte dürfen einzeln als ONYX_TOKEN, ONYX_FINGERPRINT und ONYX_HOST
 * gesetzt sein oder gebündelt in der Variable ONYX; einzelne Variablen haben
 * Vorrang.
 */
function onyxConfig(): OnyxConfig | null {
  const bundled = parseOnyxVariable(process.env.ONYX ?? "");

  const token = process.env.ONYX_TOKEN ?? bundled.token;
  if (!token) return null;

  const version = process.env.ONYX_API_VERSION ?? DEFAULT_API_VERSION;
  const host = process.env.ONYX_HOST ?? bundled.host;
  const fingerprint = process.env.ONYX_FINGERPRINT ?? bundled.fingerprint;

  if (host) {
    // Hostname darf mit oder ohne Schema hinterlegt sein.
    const origin = /^https?:\/\//.test(host) ? host : `https://${host}`;
    return { baseUrl: `${origin.replace(/\/+$/, "")}/api/${version}`, token };
  }

  if (fingerprint) {
    return { baseUrl: `${RELAY_HOST}/box/${fingerprint}/api/${version}`, token };
  }

  return null;
}

export function isOnyxConfigured(): boolean {
  return onyxConfig() !== null;
}

/**
 * Was zur Einrichtung noch fehlt - für die Meldung in der Oberfläche.
 *
 * Der häufigste Fall ist ein hinterlegtes Token ohne Fingerabdruck: damit ist
 * zwar der Zugang bekannt, aber nicht, welche Anlage gemeint ist.
 */
export function onyxSetupHint(): string | null {
  if (onyxConfig()) return null;

  const bundled = parseOnyxVariable(process.env.ONYX ?? "");

  if (!(process.env.ONYX_TOKEN ?? bundled.token)) {
    return "Es fehlt das ONYX-Token. Zu hinterlegen in ONYX oder ONYX_TOKEN.";
  }

  return (
    "Das ONYX-Token ist hinterlegt, aber nicht die Anlage: dazu braucht es den Fingerabdruck " +
    "in ONYX_FINGERPRINT (Zugriff über api.hella.link) oder den Hostnamen in ONYX_HOST (lokal)."
  );
}

async function onyxFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const config = onyxConfig();
  if (!config) throw new OnyxError("ONYX ist nicht eingerichtet", 503);

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // Zeitüberschreitung, DNS, TLS - für die Oberfläche ist das alles dasselbe:
    // die Anlage ist gerade nicht erreichbar.
    throw new OnyxError(
      `ONYX nicht erreichbar: ${error instanceof Error ? error.message : "unbekannter Fehler"}`,
      504
    );
  }

  if (!response.ok) {
    throw new OnyxError(
      response.status === 401
        ? "ONYX weist das Token zurück"
        : `ONYX antwortete mit ${response.status}`,
      response.status
    );
  }

  // Das Stornieren eines Befehls beantwortet ONYX mit 200 und leerem Rumpf -
  // ein blindes response.json() würde daran scheitern.
  const text = await response.text();
  if (!text.trim()) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new OnyxError("ONYX antwortete unlesbar", 502);
  }
}

type DeviceListEntry = { name: string; type: string };
type DeviceDetails = { name: string; type: string; actions?: string[]; properties?: Record<string, OnyxProperty> };

/**
 * Alle Geräte samt Eigenschaften.
 *
 * /devices liefert nur Name und Typ, die Eigenschaften stehen erst in den
 * Detailabrufen - die laufen deshalb parallel. Fällt ein einzelnes Gerät aus,
 * bleibt der Rest der Liste nutzbar; ein defektes Gerät soll nicht die ganze
 * Steuerung blockieren.
 */
export async function fetchOnyxDevices(): Promise<OnyxDevice[]> {
  const list = await onyxFetch<Record<string, DeviceListEntry>>("/devices");

  const devices = await Promise.all(
    Object.entries(list).map(async ([id, entry]): Promise<OnyxDevice> => {
      try {
        const details = await onyxFetch<DeviceDetails>(`/devices/${id}`);
        return {
          id,
          name: details.name ?? entry.name,
          type: details.type ?? entry.type,
          actions: details.actions ?? [],
          properties: details.properties ?? {},
        };
      } catch {
        return { id, name: entry.name, type: entry.type, actions: [], properties: {} };
      }
    })
  );

  return devices.sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export async function sendOnyxCommand(deviceId: string, command: OnyxCommand): Promise<unknown> {
  return onyxFetch(`/devices/${deviceId}/command`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}

/**
 * Nimmt den zuletzt gesendeten Befehl zurück.
 *
 * Befehle über die Schnittstelle haben die Priorität "interactive" und
 * unterdrücken damit Automatiken wie Sonnen- oder Zeitsteuerung, bis sie
 * ablaufen. Wer die Automatik sofort wieder übernehmen lassen will, storniert
 * den Befehl.
 */
export async function cancelOnyxCommand(deviceId: string): Promise<void> {
  await onyxFetch(`/devices/${deviceId}/command`, { method: "DELETE" });
}
