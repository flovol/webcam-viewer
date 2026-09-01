"use client";

import { useCallback, useEffect, useState } from "react";
import { ACTIVE, BUTTON, Chip, Divider, INACTIVE, Panel } from "@/components/CockpitUi";
import OnyxControls from "@/components/OnyxControls";
import { COCKPIT_MESSAGES } from "@/lib/messages";
import { cameraLocations, RADIO_STATIONS, WEBCAM_URLS } from "@/lib/webcams";
import type { ControlState } from "@/lib/controlState";

const DURATIONS = [3, 5, 10, 20, 30];

export default function ControlsPage() {
  const [state, setState] = useState<ControlState | null>(null);
  const [shared, setShared] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/controls", { cache: "no-store" });
      const data = await response.json();
      setState(data.state);
      setShared(data.shared);
      setError(null);
    } catch {
      setError("Verbindung zum Server verloren");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const send = useCallback(async (patch: Partial<ControlState>) => {
    setBusy(true);
    try {
      const response = await fetch("/api/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      setState(data.state);
      setError(null);
    } catch {
      setError("Befehl konnte nicht gesendet werden");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white/60">
        {error ?? "Lade Steuerung…"}
      </div>
    );
  }

  const currentStation = RADIO_STATIONS.find((station) => station.id === state.radio.stationId);

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      {/* Ein weicher Lichtkegel von oben nimmt der großen dunklen Fläche am
          Monitor die Leere. Ohne Zeigerereignisse, damit er nichts abfängt. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(255,255,255,0.09),transparent_60%)]" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cockpit</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/45">
              Anzeige, Webcams und Radio wirken auf /osttirol, spätestens nach zwei Sekunden.
              Jalousien und Licht wirken direkt auf die ONYX-Anlage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={state.nightMode ? "neutral" : state.paused ? "warn" : "ok"}>
              {state.nightMode
                ? "Nachtruhe"
                : state.paused
                  ? "Pausiert"
                  : state.viewMode === "flight"
                    ? "3D-Flug"
                    : "Diashow"}
            </Chip>
            <Chip tone={state.radio.playing ? "ok" : "neutral"}>
              {state.radio.playing ? (currentStation?.name ?? "Radio läuft") : "Radio aus"}
            </Chip>
            <Chip tone={shared === false ? "warn" : "ok"}>
              {shared === false ? "Kein gemeinsamer Speicher" : "Speicher verbunden"}
            </Chip>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        {shared === false && (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
            Kein gemeinsamer Speicher eingerichtet. Lokal funktioniert das, auf Vercel muss dafür KV
            verbunden sein - sonst erreichen die Befehle das Display nicht.
          </div>
        )}

        {/* items-start: sonst streckt das Raster alle drei Flaechen auf die Hoehe
            der Kameraliste und unter den kuerzeren steht eine tote Flaeche. */}
        <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Panel title="Anzeige" meta={state.nightMode ? "Nachtruhe" : undefined}>
            <div className="space-y-3">
              {/* Die zwei Knoepfe des Tages: einer beim Kommen, einer beim Gehen.
                  Feierabend nimmt das Radio gleich mit - nachts soll nichts
                  laufen, auch nichts Hoerbares. */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={busy}
                  onClick={() => send({ nightMode: false })}
                  className={BUTTON + " " + (state.nightMode ? INACTIVE : ACTIVE) + " py-3"}
                >
                  Guten Morgen
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    send({ nightMode: true, radio: { ...state.radio, playing: false } })
                  }
                  className={BUTTON + " " + (state.nightMode ? ACTIVE : INACTIVE) + " py-3"}
                >
                  Feierabend
                </button>
              </div>

              <Divider label="Ansicht" />

              <div className="grid grid-cols-2 gap-2">
                {(["slideshow", "flight"] as const).map((mode) => (
                  <button
                    key={mode}
                    disabled={busy}
                    onClick={() => send({ viewMode: mode })}
                    className={`${BUTTON} ${state.viewMode === mode ? ACTIVE : INACTIVE}`}
                  >
                    {mode === "slideshow" ? "Diashow" : "3D-Flug"}
                  </button>
                ))}
              </div>

              <div>
                <span className="text-xs text-white/45">Bilddauer</span>
                <div className="mt-1.5 grid grid-cols-5 gap-2">
                  {DURATIONS.map((seconds) => (
                    <button
                      key={seconds}
                      disabled={busy}
                      onClick={() => send({ slideDurationMs: seconds * 1000 })}
                      className={`${BUTTON} px-0 ${
                        state.slideDurationMs === seconds * 1000 ? ACTIVE : INACTIVE
                      }`}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>

              <Divider label="Wiedergabe" />

              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={busy}
                  onClick={() => send({ stepNonce: state.stepNonce + 1, stepDirection: -1 })}
                  className={`${BUTTON} ${INACTIVE}`}
                >
                  Zurück
                </button>
                <button
                  disabled={busy}
                  onClick={() => send({ paused: !state.paused })}
                  className={`${BUTTON} ${state.paused ? ACTIVE : INACTIVE}`}
                >
                  {state.paused ? "Weiter" : "Pause"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => send({ stepNonce: state.stepNonce + 1, stepDirection: 1 })}
                  className={`${BUTTON} ${INACTIVE}`}
                >
                  Vor
                </button>
              </div>

              <Divider label="Nachricht an die Anzeige" />

              <div className="space-y-2">
                {COCKPIT_MESSAGES.map((message) => (
                  <button
                    key={message.id}
                    disabled={busy}
                    onClick={() =>
                      send({
                        message: {
                          text: message.text,
                          nonce: (state.message?.nonce ?? 0) + 1,
                        },
                      })
                    }
                    className={`${BUTTON} ${INACTIVE} flex w-full items-center gap-2.5 text-left`}
                  >
                    <span aria-hidden="true">{message.emoji}</span>
                    <span className="min-w-0 truncate">{message.text}</span>
                  </button>
                ))}
              </div>

              <Divider label="Test" />

              <button
                disabled={busy}
                onClick={() => send({ alarmDemoNonce: state.alarmDemoNonce + 1 })}
                className={`${BUTTON} w-full border border-blue-400/40 bg-blue-600/25 text-white hover:bg-blue-600/40`}
              >
                Blaulicht-Popup auslösen
              </button>
            </div>
          </Panel>

          <Panel title="Webcam wählen" meta={`${WEBCAM_URLS.length} Kameras`}>
            {/* Feste Höhe statt mitwachsender Liste: sonst zieht die Kameraliste
                die Spalte auf und die Nachbarflächen stehen halb leer. */}
            <div className="max-h-[22rem] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-1.5">
              <div className="grid gap-1 sm:grid-cols-2">
                {WEBCAM_URLS.map((camera, index) => (
                  <button
                    key={camera.index}
                    disabled={busy}
                    onClick={() => send({ jump: { index, nonce: (state.jump?.nonce ?? 0) + 1 } })}
                    className="min-w-0 truncate rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    {cameraLocations[camera.locationId]?.name ?? camera.locationId}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Radio" meta={currentStation?.name}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {RADIO_STATIONS.map((station) => (
                  <button
                    key={station.id}
                    disabled={busy}
                    onClick={() => send({ radio: { ...state.radio, stationId: station.id } })}
                    className={`${BUTTON} min-w-0 truncate ${
                      state.radio.stationId === station.id ? ACTIVE : INACTIVE
                    }`}
                  >
                    {station.name}
                  </button>
                ))}
              </div>

              <button
                disabled={busy}
                onClick={() => send({ radio: { ...state.radio, playing: !state.radio.playing } })}
                className={`${BUTTON} w-full ${state.radio.playing ? ACTIVE : INACTIVE}`}
              >
                {state.radio.playing ? "Radio stoppen" : "Radio starten"}
              </button>

              <label className="block">
                <span className="text-xs text-white/45">
                  Lautstärke {Math.round(state.radio.volume * 100)} %
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={state.radio.volume}
                  onChange={(event) =>
                    send({ radio: { ...state.radio, volume: parseFloat(event.target.value) } })
                  }
                  className="mt-1.5 w-full accent-white"
                />
              </label>
            </div>
          </Panel>
        </div>

        <div className="mt-4">
          <OnyxControls />
        </div>
      </div>
    </div>
  );
}
