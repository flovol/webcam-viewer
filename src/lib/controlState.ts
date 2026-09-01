/**
 * Gemeinsamer Zustand zwischen /controls und /osttirol.
 *
 * Die Steuerung läuft auf einem anderen Gerät als die Anzeige, beide brauchen
 * also einen gemeinsamen Ablageort auf dem Server. Auf Vercel ist das KV
 * (Upstash Redis) - angesprochen über dessen REST-Schnittstelle, damit keine
 * zusätzliche Abhängigkeit nötig ist. Ohne konfiguriertes KV wird der Zustand im
 * Arbeitsspeicher gehalten; das reicht lokal, aber NICHT auf Vercel, wo mehrere
 * Instanzen nebeneinander laufen können.
 */

export interface ControlState {
  /** Steigt bei jeder Änderung - die Anzeige erkennt daran neue Befehle. */
  revision: number;
  viewMode: "slideshow" | "flight";
  slideDurationMs: number;
  paused: boolean;
  radio: {
    stationId: string | null;
    playing: boolean;
    volume: number;
  };
  /** Einmalbefehl: Sprung zu einer Kamera. Der Zähler macht Wiederholungen wirksam. */
  jump: { index: number; nonce: number } | null;
  /** Einmalbefehle: Zähler hochzählen löst aus. */
  stepNonce: number;
  stepDirection: 1 | -1;
  alarmDemoNonce: number;
  updatedAt: number;
}

export const DEFAULT_CONTROL_STATE: ControlState = {
  revision: 0,
  viewMode: "slideshow",
  slideDurationMs: 5000,
  paused: false,
  radio: { stationId: null, playing: false, volume: 0.7 },
  jump: null,
  stepNonce: 0,
  stepDirection: 1,
  alarmDemoNonce: 0,
  updatedAt: 0,
};

const KEY = "osttirol:controls";

/**
 * Zugangsdaten für den Redis-Speicher.
 *
 * Die Variablennamen hängen davon ab, wie der Speicher angelegt wurde:
 * die Upstash-Integration im Vercel-Marketplace setzt je nach Produkt
 * UPSTASH_KV_REST_API_* oder UPSTASH_REDIS_REST_*, ältere Projekte aus der Zeit
 * von "Vercel KV" haben KV_REST_API_*. Alle drei werden akzeptiert, damit es
 * nicht am Namen scheitert.
 *
 * Nicht verwendet wird UPSTASH_KV_REST_API_READ_ONLY_TOKEN - die Steuerung muss
 * schreiben können.
 */
function kvConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_KV_REST_API_URL ??
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL;

  const token =
    process.env.UPSTASH_KV_REST_API_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN;

  return url && token ? { url, token } : null;
}

// Über globalThis, damit der Zustand beim Hot Reload nicht verloren geht.
const memory = globalThis as unknown as { __osttirolControls?: ControlState };

async function kvCommand(command: unknown[]): Promise<unknown> {
  const config = kvConfig();
  if (!config) return null;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`KV antwortete mit ${response.status}`);

  return (await response.json())?.result ?? null;
}

export function isSharedStoreConfigured(): boolean {
  return kvConfig() !== null;
}

export async function readControlState(): Promise<ControlState> {
  if (!isSharedStoreConfigured()) {
    return memory.__osttirolControls ?? DEFAULT_CONTROL_STATE;
  }

  const raw = await kvCommand(["GET", KEY]);
  if (typeof raw !== "string") return DEFAULT_CONTROL_STATE;

  try {
    return { ...DEFAULT_CONTROL_STATE, ...(JSON.parse(raw) as Partial<ControlState>) };
  } catch {
    return DEFAULT_CONTROL_STATE;
  }
}

export async function writeControlState(patch: Partial<ControlState>): Promise<ControlState> {
  const current = await readControlState();

  const next: ControlState = {
    ...current,
    ...patch,
    // Verschachtelte Felder dürfen nicht komplett überschrieben werden.
    radio: { ...current.radio, ...(patch.radio ?? {}) },
    revision: current.revision + 1,
    updatedAt: Date.now(),
  };

  if (isSharedStoreConfigured()) {
    await kvCommand(["SET", KEY, JSON.stringify(next)]);
  } else {
    memory.__osttirolControls = next;
  }

  return next;
}
