"use client";

import { useCallback, useEffect, useState } from "react";
import { cameraLocations, RADIO_STATIONS, WEBCAM_URLS } from "@/lib/webcams";
import type { ControlState } from "@/lib/controlState";

const DURATIONS = [3, 5, 10, 20, 30];

const BUTTON = "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50";
const ACTIVE = "bg-white text-neutral-900";
const INACTIVE = "bg-white/10 text-white hover:bg-white/20";

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

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-5 text-white">
      <div className="mx-auto max-w-lg space-y-5 pb-10">
        <header>
          <h1 className="text-2xl font-bold">Steuerung</h1>
          <p className="text-sm text-white/50">
            Wirkt auf die Anzeige unter /osttirol, spätestens nach zwei Sekunden.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {shared === false && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Kein gemeinsamer Speicher eingerichtet. Lokal funktioniert das, auf Vercel muss dafür
            KV verbunden sein - sonst erreichen die Befehle das Display nicht.
          </div>
        )}

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Ansicht</h2>
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

          <div className="grid grid-cols-5 gap-2">
            {DURATIONS.map((seconds) => (
              <button
                key={seconds}
                disabled={busy}
                onClick={() => send({ slideDurationMs: seconds * 1000 })}
                className={`${BUTTON} ${state.slideDurationMs === seconds * 1000 ? ACTIVE : INACTIVE}`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Wiedergabe
          </h2>
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
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Webcam wählen
          </h2>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-1">
            {WEBCAM_URLS.map((camera, index) => (
              <button
                key={camera.index}
                disabled={busy}
                onClick={() => send({ jump: { index, nonce: (state.jump?.nonce ?? 0) + 1 } })}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {cameraLocations[camera.locationId]?.name ?? camera.locationId}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Radio</h2>
          <div className="grid grid-cols-2 gap-2">
            {RADIO_STATIONS.map((station) => (
              <button
                key={station.id}
                disabled={busy}
                onClick={() => send({ radio: { ...state.radio, stationId: station.id } })}
                className={`${BUTTON} ${state.radio.stationId === station.id ? ACTIVE : INACTIVE}`}
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

          <label className="block pt-1">
            <span className="text-xs text-white/50">
              Lautstärke {Math.round(state.radio.volume * 100)}%
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
              className="mt-1 w-full accent-white"
            />
          </label>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Test</h2>
          <button
            disabled={busy}
            onClick={() => send({ alarmDemoNonce: state.alarmDemoNonce + 1 })}
            className={`${BUTTON} w-full border border-blue-400/40 bg-blue-600/25 text-white hover:bg-blue-600/40`}
          >
            Blaulicht-Popup auslösen
          </button>
        </section>
      </div>
    </div>
  );
}
