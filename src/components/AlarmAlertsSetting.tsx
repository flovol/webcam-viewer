"use client";

import { useCallback, useEffect, useState } from "react";
import { isAlarmSoundReady, playAlarmSound, unlockAlarmSound } from "@/lib/alarmSound";
import { isMuted, setMuted, subscribeMuted } from "@/lib/soundPreference";

/**
 * Ausschalter für alles Hörbare: Signalhorn, Alarmansage, Nachrichten.
 *
 * Standard ist AN - wer nichts tut, bekommt Ton. Früher war es umgekehrt und
 * man musste erst hier klicken; die Freischaltung passiert jetzt beim Laden
 * der Anzeige, spätestens beim ersten Klick irgendwo auf der Seite.
 *
 * Bleibt der Browser trotzdem stumm (er verlangt Interaktion und es hat noch
 * keine gegeben), sagt der Schalter das und der Klick darauf holt es nach.
 */
export default function AlarmAlertsSetting() {
  const [muted, setMutedState] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setMutedState(isMuted());
      setBlocked(!isAlarmSoundReady());
    };

    refresh();
    const interval = setInterval(refresh, 2000);
    const unsubscribe = subscribeMuted(refresh);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);

    if (next) return;

    // Einschalten ist zugleich die Nutzerinteraktion, auf die der Browser
    // wartet - und ein kurzer Ton zeigt, dass es wirklich klappt.
    setBlocked(!unlockAlarmSound());
    window.setTimeout(() => {
      setBlocked(!isAlarmSoundReady());
      playAlarmSound(0.15);
    }, 120);
  }, []);

  const label = muted ? "aus" : blocked ? "wartet auf Klick" : "an";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/90 text-xs md:text-sm">Ton</span>

      <button
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 md:px-3 py-1.5 text-xs md:text-sm text-white transition-colors hover:bg-white/20"
        aria-pressed={!muted}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            muted ? "bg-white/30" : blocked ? "bg-amber-400" : "bg-green-400"
          }`}
        />
        {label}
      </button>
    </div>
  );
}
