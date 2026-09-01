"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ACTIVE, BUTTON, INACTIVE, Panel, QUIET } from "@/components/CockpitUi";
import type { OnyxDevice, OnyxProperty } from "@/lib/onyx";

/**
 * Jalousien und Lampen der ONYX-Anlage im Admin-Cockpit.
 *
 * Anders als der restliche Teil der Steuerung wirkt dieser Bereich nicht auf die
 * Anzeige unter /osttirol, sondern direkt auf die Geräte im Haus. Die Befehle
 * gehen deshalb nicht über den gemeinsamen Zustand, sondern über /api/onyx -
 * dort liegt das Zugriffstoken, das nie in den Browser gehört.
 */

/** Der Zustand ändert sich auch ohne unser Zutun: App, Wandtaster, Sonnenautomatik. */
const POLL_INTERVAL = 10000;

/**
 * Fahrende Geräte melden ihren neuen Stand nicht sofort zurück. Nach einem
 * Befehl lohnt sich deshalb ein zusätzlicher Abruf, sobald die Anlage ihn
 * verarbeitet hat.
 */
const REFRESH_AFTER_COMMAND = 1500;

const TYPE_LABELS: Record<string, string> = {
  rollershutter: "Rollladen",
  awning: "Markise",
  raffstore_90: "Raffstore",
  raffstore_180: "Raffstore",
  pergola: "Pergola",
  basic_light: "Licht",
  dimmable_light: "Licht, dimmbar",
};

interface NumericProperty extends OnyxProperty {
  value: number;
  minimum: number;
  maximum: number;
}

/** Liefert eine numerische Eigenschaft nur, wenn sie vollständig beschrieben ist. */
function numeric(device: OnyxDevice, name: string): NumericProperty | null {
  const property = device.properties?.[name];

  if (
    !property ||
    property.type !== "numeric" ||
    typeof property.value !== "number" ||
    typeof property.minimum !== "number" ||
    typeof property.maximum !== "number"
  ) {
    return null;
  }

  return property as NumericProperty;
}

// Die Einteilung folgt den Eigenschaften, nicht dem Gerätetyp: ONYX kennt
// mehrere Beschattungsarten und kann weitere ergänzen, aber alles was fährt hat
// target_position und alles was leuchtet hat target_brightness.
function isShading(device: OnyxDevice): boolean {
  return numeric(device, "target_position") !== null;
}

function isLight(device: OnyxDevice): boolean {
  return numeric(device, "target_brightness") !== null;
}

function typeLabel(device: OnyxDevice): string {
  return TYPE_LABELS[device.type] ?? device.type.replace(/_/g, " ");
}

interface CommandBody {
  action?: string;
  properties?: Record<string, number>;
  holdMinutes?: number;
}

/**
 * Wie lange ein Befehl die Automatik unterdrückt.
 *
 * ONYX lässt Befehle nach 15 Minuten verfallen, danach greifen Zeit- und
 * Sonnensteuerung wieder. Für "Jalousie bleibt den Nachmittag unten" ist das zu
 * kurz, deshalb die Auswahl. Die Position bleibt in jedem Fall stehen - was
 * abläuft, ist nur die Sperre gegen die Automatik.
 */
const HOLD_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 4 * 60, label: "4 h" },
  { minutes: 12 * 60, label: "12 h" },
  { minutes: 24 * 60, label: "24 h" },
];

export default function OnyxControls() {
  const [devices, setDevices] = useState<OnyxDevice[] | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdMinutes, setHoldMinutes] = useState(HOLD_OPTIONS[0].minutes);

  /**
   * Werte, die gerade am Regler eingestellt werden, je Gerät und Eigenschaft.
   *
   * Ohne diesen Zwischenspeicher würde der Regler bei jedem Abruf auf den vom
   * Gerät gemeldeten Wert zurückspringen, während man ihn noch zieht.
   */
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const previousRef = useRef<Map<string, OnyxDevice>>(new Map());

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/onyx/devices", { cache: "no-store" });
      const data = await response.json();

      setConfigured(data.configured);
      setHint(data.hint ?? null);

      if (data.error) {
        setError(data.error);
        return;
      }

      const next = (data.devices ?? []) as OnyxDevice[];

      // Wurde ein Gerät von außen verstellt - über die ONYX-App, einen Taster
      // oder die Automatik - gewinnt dieser Wert und der eigene Entwurf fällt weg.
      setDrafts((current) => {
        const kept = { ...current };
        let changed = false;

        for (const device of next) {
          const previous = previousRef.current.get(device.id);
          if (!previous) continue;

          for (const property of ["target_position", "target_angle", "target_brightness"]) {
            const key = `${device.id}:${property}`;
            if (!(key in kept)) continue;

            if (device.properties?.[property]?.value !== previous.properties?.[property]?.value) {
              delete kept[key];
              changed = true;
            }
          }
        }

        return changed ? kept : current;
      });

      previousRef.current = new Map(next.map((device) => [device.id, device]));
      setDevices(next);
      setError(null);
    } catch {
      setError("ONYX nicht erreichbar");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const send = useCallback(
    async (deviceIds: string[], body: CommandBody) => {
      setBusy(true);

      try {
        const responses = await Promise.all(
          deviceIds.map((id) =>
            fetch(`/api/onyx/devices/${id}/command`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ holdMinutes, ...body }),
            })
          )
        );

        const failed = responses.find((response) => !response.ok);
        if (failed) {
          const data = await failed.json().catch(() => null);
          setError(data?.error ?? "Befehl wurde von ONYX abgelehnt");
        } else {
          setError(null);
        }
      } catch {
        setError("Befehl konnte nicht gesendet werden");
      } finally {
        setBusy(false);
        setTimeout(refresh, REFRESH_AFTER_COMMAND);
      }
    },
    [refresh, holdMinutes]
  );

  /**
   * Nimmt den zuletzt gesendeten Befehl zurück.
   *
   * Befehle über die Schnittstelle unterdrücken Zeit- und Sonnenautomatik, bis
   * sie nach 15 Minuten ablaufen. Wer die Automatik früher zurückhaben will,
   * storniert den Befehl - deshalb der Knopf an jedem Gerät.
   */
  const cancel = useCallback(
    async (deviceId: string) => {
      setBusy(true);

      try {
        const response = await fetch(`/api/onyx/devices/${deviceId}/command`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.error ?? "Befehl konnte nicht zurückgenommen werden");
        } else {
          setError(null);
        }
      } catch {
        setError("Befehl konnte nicht zurückgenommen werden");
      } finally {
        setBusy(false);
        setTimeout(refresh, REFRESH_AFTER_COMMAND);
      }
    },
    [refresh]
  );

  /** Setzt einen Regler-Entwurf, ohne ihn schon an die Anlage zu schicken. */
  const setDraft = useCallback((deviceId: string, property: string, value: number) => {
    setDrafts((current) => ({ ...current, [`${deviceId}:${property}`]: value }));
  }, []);

  const draftValue = useCallback(
    (deviceId: string, property: string, fallback: number) =>
      drafts[`${deviceId}:${property}`] ?? fallback,
    [drafts]
  );

  if (configured === false) {
    return (
      <Panel title="Jalousien & Licht">
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {hint ?? "ONYX ist nicht eingerichtet."} Siehe README.
        </div>
      </Panel>
    );
  }

  const shading = devices?.filter(isShading) ?? [];
  const lights = devices?.filter(isLight) ?? [];
  const shadingIds = shading.map((device) => device.id);
  const lightIds = lights.map((device) => device.id);
  const total = shading.length + lights.length;

  return (
    <Panel
      title="Jalousien & Licht"
      meta={
        devices === null
          ? undefined
          : `${shading.length} Beschattung · ${lights.length} Licht`
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {devices === null && !error && <p className="text-sm text-white/50">Lade Geräte…</p>}

        {devices !== null && total === 0 && !error && (
          <p className="text-sm text-white/50">Keine steuerbaren Geräte gefunden.</p>
        )}

        {total > 0 && (
          <>
            {/* Sammelbefehle und Haltedauer stehen nebeneinander, weil sie
                zusammen einen Befehl ergeben: was passiert, und wie lange es
                gegen die Automatik hält. */}
            <div className="grid gap-3 xl:grid-cols-2">
              <div className="space-y-1.5">
                <span className="text-xs text-white/45">Alle Geräte</span>
                <div className="flex flex-wrap gap-2">
                  {shading.length > 0 && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => send(shadingIds, { action: "open" })}
                        className={`${BUTTON} flex-1 ${INACTIVE}`}
                      >
                        Alle auf
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => send(shadingIds, { action: "stop" })}
                        className={`${BUTTON} flex-1 ${INACTIVE}`}
                      >
                        Stopp
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => send(shadingIds, { action: "close" })}
                        className={`${BUTTON} flex-1 ${INACTIVE}`}
                      >
                        Alle zu
                      </button>
                    </>
                  )}
                  {lights.length > 0 && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => send(lightIds, { action: "light_on" })}
                        className={`${BUTTON} flex-1 ${INACTIVE}`}
                      >
                        Licht an
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => send(lightIds, { action: "light_off" })}
                        className={`${BUTTON} flex-1 ${INACTIVE}`}
                      >
                        Licht aus
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-white/45">
                  Haltedauer - danach übernimmt wieder die Automatik
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {HOLD_OPTIONS.map((option) => (
                    <button
                      key={option.minutes}
                      onClick={() => setHoldMinutes(option.minutes)}
                      className={`${BUTTON} px-0 ${
                        holdMinutes === option.minutes ? ACTIVE : INACTIVE
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shading.map((device) => (
                <ShadingCard
                  key={device.id}
                  device={device}
                  busy={busy}
                  draftValue={draftValue}
                  setDraft={setDraft}
                  send={send}
                  cancel={cancel}
                />
              ))}

              {lights.map((device) => (
                <LightCard
                  key={device.id}
                  device={device}
                  busy={busy}
                  draftValue={draftValue}
                  setDraft={setDraft}
                  send={send}
                  cancel={cancel}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

interface CardProps {
  device: OnyxDevice;
  busy: boolean;
  draftValue: (deviceId: string, property: string, fallback: number) => number;
  setDraft: (deviceId: string, property: string, value: number) => void;
  send: (deviceIds: string[], body: CommandBody) => void;
  cancel: (deviceId: string) => void;
}

function DeviceHeader({
  device,
  status,
  glyph,
}: {
  device: OnyxDevice;
  status: string;
  glyph: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {glyph}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{device.name}</p>
        <p className="truncate text-xs text-white/40">{typeLabel(device)}</p>
      </div>
      <span className="shrink-0 text-sm tabular-nums text-white/70">{status}</span>
    </div>
  );
}

/**
 * Fensterbild einer Beschattung: der Behang fährt von oben ins Bild.
 *
 * Eine Zahl allein sagt beim Überfliegen wenig - an sechs Kacheln nebeneinander
 * sieht man so auf einen Blick, was offen und was zu ist.
 */
function ShadeGlyph({ position }: { position: number }) {
  return (
    <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md border border-white/20 bg-gradient-to-b from-sky-400/30 to-sky-200/5">
      <div
        className="absolute inset-x-0 top-0 bg-white/75 transition-[height] duration-700 ease-out"
        style={{
          height: `${Math.max(0, Math.min(100, position))}%`,
          // Lamellen andeuten, damit es nicht nur ein Balken ist.
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.9) 0 2px, rgba(120,140,160,0.55) 2px 4px)",
        }}
      />
    </div>
  );
}

/** Lampe, deren Schein mit der eingestellten Helligkeit zunimmt. */
function LightGlyph({ percent }: { percent: number }) {
  const strength = Math.max(0, Math.min(100, percent)) / 100;

  return (
    <div className="relative flex h-10 w-8 shrink-0 items-center justify-center">
      <div
        className="absolute h-8 w-8 rounded-full blur-lg transition-opacity duration-500"
        style={{ background: "rgb(253,224,71)", opacity: strength * 0.85 }}
      />
      <svg viewBox="0 0 24 24" className="relative h-6 w-6" aria-hidden="true">
        <path
          d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8.9.9 1.5l.1.6h5l.1-.6c.1-.6.4-1.1.9-1.5A6 6 0 0 0 12 3Z"
          fill={`rgba(253,224,71,${0.15 + strength * 0.85})`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
        />
        <path d="M10 19h4M10.5 21h3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" fill="none" />
      </svg>
    </div>
  );
}

function ShadingCard({ device, busy, draftValue, setDraft, send, cancel }: CardProps) {
  const target = numeric(device, "target_position");
  if (!target) return null;

  const actual = numeric(device, "actual_position");
  const targetAngle = numeric(device, "target_angle");
  const actualAngle = numeric(device, "actual_angle");

  const position = draftValue(device.id, "target_position", target.value);
  const angle = targetAngle ? draftValue(device.id, "target_angle", targetAngle.value) : 0;
  const systemState = device.properties?.system_state?.value;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20">
      <DeviceHeader
        device={device}
        status={`${Math.round(actual?.value ?? target.value)} %`}
        glyph={<ShadeGlyph position={actual?.value ?? target.value} />}
      />

      {typeof systemState === "string" && systemState !== "ok" && (
        <p className="text-xs text-amber-300/80">
          {systemState === "not_calibrated"
            ? "Nicht kalibriert"
            : systemState.startsWith("collision")
              ? "Hindernis erkannt"
              : systemState.replace(/_/g, " ")}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(["open", "stop", "close"] as const).map((action) => (
          <button
            key={action}
            // Die Aktionsliste ist bei einem fehlgeschlagenen Detailabruf leer -
            // dann lieber die Knöpfe anbieten, als das Gerät unbedienbar machen.
            disabled={busy || (device.actions.length > 0 && !device.actions.includes(action))}
            onClick={() => send([device.id], { action })}
            className={`${BUTTON} ${INACTIVE}`}
          >
            {action === "open" ? "Auf" : action === "stop" ? "Stopp" : "Zu"}
          </button>
        ))}
      </div>

      {!target.readonly && (
        <Slider
          label={`Position ${Math.round(position)} % - 0 offen, 100 geschlossen`}
          value={position}
          min={target.minimum}
          max={target.maximum}
          disabled={busy}
          onChange={(value) => setDraft(device.id, "target_position", value)}
          onCommit={(value) => send([device.id], { properties: { target_position: value } })}
        />
      )}

      {targetAngle && !targetAngle.readonly && targetAngle.maximum > targetAngle.minimum && (
        <Slider
          label={`Winkel ${Math.round(angle)}°, aktuell ${Math.round(
            actualAngle?.value ?? targetAngle.value
          )}°`}
          value={angle}
          min={targetAngle.minimum}
          max={targetAngle.maximum}
          disabled={busy}
          onChange={(value) => setDraft(device.id, "target_angle", value)}
          onCommit={(value) => send([device.id], { properties: { target_angle: value } })}
        />
      )}

      <AutomationButton device={device} busy={busy} cancel={cancel} />
    </div>
  );
}

/**
 * Gibt das Gerät der Automatik zurück, ohne die Haltedauer abzuwarten.
 *
 * Das Gerät bleibt stehen, wo es steht - es folgt nur wieder der Zeit- und
 * Sonnensteuerung, statt bis zum Ablauf des Befehls gesperrt zu bleiben.
 */
function AutomationButton({
  device,
  busy,
  cancel,
}: {
  device: OnyxDevice;
  busy: boolean;
  cancel: (deviceId: string) => void;
}) {
  return (
    <button
      disabled={busy}
      onClick={() => cancel(device.id)}
      className={`${QUIET} mt-auto w-full`}
    >
      Automatik übernehmen lassen
    </button>
  );
}

function LightCard({ device, busy, draftValue, setDraft, send, cancel }: CardProps) {
  const target = numeric(device, "target_brightness");
  if (!target) return null;

  const actual = numeric(device, "actual_brightness");
  const brightness = draftValue(device.id, "target_brightness", target.value);
  const on = (actual?.value ?? target.value) > 0;

  // Basislichter kennen nur an und aus, ein Regler wäre dort irreführend.
  const dimmable = device.type !== "basic_light" && !target.readonly;
  const percent = (value: number) => Math.round((value / target.maximum) * 100);

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20">
      <DeviceHeader
        device={device}
        status={dimmable ? `${percent(actual?.value ?? target.value)} %` : on ? "an" : "aus"}
        glyph={<LightGlyph percent={percent(actual?.value ?? target.value)} />}
      />

      <button
        disabled={busy}
        onClick={() => send([device.id], { action: on ? "light_off" : "light_on" })}
        className={`${BUTTON} w-full ${on ? ACTIVE : INACTIVE}`}
      >
        {on ? "Ausschalten" : "Einschalten"}
      </button>

      {dimmable && (
        <Slider
          label={`Helligkeit ${percent(brightness)} %`}
          value={brightness}
          min={target.minimum}
          max={target.maximum}
          // Ein Prozentschritt - die volle Auflösung von 65535 Stufen braucht niemand.
          step={Math.max(1, Math.round((target.maximum - target.minimum) / 100))}
          disabled={busy}
          onChange={(value) => setDraft(device.id, "target_brightness", value)}
          onCommit={(value) => send([device.id], { properties: { target_brightness: value } })}
        />
      )}

      <AutomationButton device={device} busy={busy} cancel={cancel} />
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled: boolean;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
}

/**
 * Regler, der erst beim Loslassen sendet.
 *
 * Ein Befehl je Zwischenschritt würde die Anlage mit Funkverkehr fluten und die
 * Motoren zwischen den Zielwerten hin und her rucken lassen.
 */
function Slider({ label, value, min, max, step = 1, disabled, onChange, onCommit }: SliderProps) {
  return (
    <label className="block">
      <span className="text-xs text-white/50">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={(event) => onCommit(Number(event.currentTarget.value))}
        onKeyUp={(event) => onCommit(Number(event.currentTarget.value))}
        className="mt-1 w-full accent-white"
      />
    </label>
  );
}
