"use client";

import { useEffect, useRef } from "react";
import type { ControlState } from "@/lib/controlState";

// Kompromiss zwischen gefühlter Reaktionszeit und Last: die Steuerung wirkt
// spätestens nach zwei Sekunden.
const POLL_INTERVAL = 2000;

export interface RemoteControlHandlers {
  onViewMode: (mode: string) => void;
  onSlideDuration: (durationMs: number) => void;
  onPaused: (paused: boolean) => void;
  onJump: (index: number) => void;
  onStep: (direction: 1 | -1) => void;
  onMessage: (text: string) => void;
  onRadio: (radio: ControlState["radio"]) => void;
  onAlarmDemo: () => void;
}

/**
 * Holt Befehle von /api/controls ab und wendet sie auf die Anzeige an.
 *
 * Die Übertragung läuft absichtlich nur in eine Richtung: die Anzeige schreibt
 * nie zurück. Sonst würden sich Steuerung und Anzeige gegenseitig überschreiben.
 *
 * Dauerzustände (Modus, Tempo, Radio) werden bei jeder Änderung der Revision
 * angewandt, Einmalbefehle (Sprung, Schritt, Nachricht, Alarm-Demo) nur wenn ihr Zähler
 * gestiegen ist.
 */
export function useRemoteControl(handlers: RemoteControlHandlers): void {
  // Über eine Ref, damit wechselnde Callbacks den Abruf nicht neu starten.
  // Die Zuweisung gehört in einen Effect - während des Renderns wäre sie ein
  // Seiteneffekt und React beschwert sich zu Recht.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const lastRef = useRef<ControlState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch("/api/controls", { cache: "no-store" });
        const data = await response.json();
        if (cancelled || !data?.state) return;

        const state = data.state as ControlState;
        const previous = lastRef.current;

        // Erster Abruf: nur merken. Sonst würde beim Öffnen der Anzeige der
        // zuletzt gesetzte Zustand erneut ausgelöst.
        if (previous === null) {
          lastRef.current = state;
          return;
        }

        if (state.revision === previous.revision) return;
        lastRef.current = state;

        const on = handlersRef.current;

        if (state.viewMode !== previous.viewMode) on.onViewMode(state.viewMode);
        if (state.slideDurationMs !== previous.slideDurationMs) {
          on.onSlideDuration(state.slideDurationMs);
        }
        if (state.paused !== previous.paused) on.onPaused(state.paused);

        if (
          state.radio.stationId !== previous.radio.stationId ||
          state.radio.playing !== previous.radio.playing ||
          state.radio.volume !== previous.radio.volume
        ) {
          on.onRadio(state.radio);
        }

        if (state.jump && state.jump.nonce !== previous.jump?.nonce) {
          on.onJump(state.jump.index);
        }

        if (state.message && state.message.nonce !== previous.message?.nonce) {
          on.onMessage(state.message.text);
        }

        if (state.stepNonce !== previous.stepNonce) on.onStep(state.stepDirection);
        if (state.alarmDemoNonce !== previous.alarmDemoNonce) on.onAlarmDemo();
      } catch (error) {
        // Netzaussetzer dürfen die Anzeige nicht stören.
        console.warn("Fernsteuerung nicht erreichbar:", error);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
