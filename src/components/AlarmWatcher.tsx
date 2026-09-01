"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Alarm } from "@/app/api/alarms/route";
import AlarmPopup from "./AlarmPopup";
import { playAlarmSound } from "@/lib/alarmSound";
import { ALARM_DEMO_EVENT } from "@/lib/alarmDemo";

/**
 * Beobachtet die Osttiroler Alarmierungen und meldet sich nur, wenn ein Einsatz
 * dazukommt - dann per Blaulicht-Popup, Ton und Systembenachrichtigung. Ohne
 * neuen Einsatz ist die Komponente unsichtbar.
 *
 * Der Abgleich läuft im Browser: die Seite hängt im Dauerbetrieb offen, kennt
 * also den vorherigen Stand. Dafür braucht es weder Datenbank noch Cron.
 */

// Die Route cached serverseitig ebenfalls 60 Sekunden - egal wie viele Anzeigen
// laufen, die Quelle wird höchstens einmal pro Minute abgerufen.
const POLL_INTERVAL = 60_000;
/**
 * Standzeit eines Popups. Eine Minute - lang genug, dass es auch bemerkt wird,
 * wenn gerade niemand vor dem Schirm steht. Wer nicht warten will, schließt es
 * über das Kreuz.
 */
const POPUP_DURATION_MS = 60_000;
// Mehr gleichzeitige Popups würden den Bildschirm zustellen.
const MAX_POPUPS = 3;
const MAX_NOTIFICATIONS_AT_ONCE = 3;
const STORAGE_KEY = "osttirol-alarms-seen";
const STORAGE_LIMIT = 200;

/**
 * Der Feed enthält denselben Eintrag mehrfach, wenn mehrere Kräfte alarmiert
 * werden. Der Zähler macht solche Wiederholungen unterscheidbar, sonst würde ein
 * zweiter gleicher Einsatz nie als neu erkannt.
 */
function buildKeys(alarms: Alarm[]): string[] {
  const seen = new Map<string, number>();

  return alarms.map((alarm) => {
    const base = `${alarm.date}|${alarm.type}|${alarm.location}|${alarm.brigade}`;
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);

    return `${base}#${occurrence}`;
  });
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persistSeen(seen: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen].slice(-STORAGE_LIMIT)));
  } catch {
    // Privater Modus oder volle Quota - dann eben nur im Arbeitsspeicher.
  }
}

function notify(alarms: Alarm[]): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  if (alarms.length > MAX_NOTIFICATIONS_AT_ONCE) {
    new Notification(`${alarms.length} neue Einsätze in Osttirol`, {
      body: alarms.map((alarm) => `${alarm.type} · ${alarm.place}`).join("\n"),
      tag: "osttirol-alarm-sammel",
    });
    return;
  }

  for (const alarm of alarms) {
    new Notification(`Einsatz: ${alarm.type}`, {
      body: `${alarm.place}\n${alarm.brigade}`,
      // Verhindert Doppelmeldungen desselben Einsatzes.
      tag: `${alarm.date}-${alarm.location}-${alarm.brigade}-${alarm.type}`,
    });
  }
}

export default function AlarmWatcher() {
  const [popups, setPopups] = useState<{ key: string; alarm: Alarm }[]>([]);
  // Zählt hoch, damit der Lichtschein bei jedem neuen Einsatz neu anläuft.
  const [flash, setFlash] = useState(0);
  const seenRef = useRef<Set<string> | null>(null);

  const dismissPopup = useCallback((key: string) => {
    setPopups((current) => current.filter((entry) => entry.key !== key));
  }, []);

  // Probe-Popup: zeigt einmal, wie eine Alarmierung aussieht und klingt.
  const showDemo = useCallback(() => {
    setPopups((existing) =>
      [
        ...existing,
        {
          // Zähler im Schlüssel, damit mehrfaches Auslösen jedes Mal wirkt.
          key: `demo-${Date.now()}`,
          alarm: {
            type: "Brand im Freien",
            location: "9971 Matrei in Osttirol",
            postalCode: "9971",
            place: "Matrei in Osttirol",
            brigade: "FW Matrei/Osttirol",
            date: new Date().toLocaleDateString("de-AT"),
          },
        },
      ].slice(-MAX_POPUPS)
    );

    playAlarmSound();
    setFlash((count) => count + 1);
  }, []);

  // Ausgelöst vom Aktivieren-Knopf im Einstellungsmenü.
  useEffect(() => {
    window.addEventListener(ALARM_DEMO_EVENT, showDemo);
    return () => window.removeEventListener(ALARM_DEMO_EVENT, showDemo);
  }, [showDemo]);

  // Zusätzlich per ?alarmdemo=1 in der Adresszeile.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("alarmdemo")) return;

    const timer = setTimeout(showDemo, 800);
    return () => clearTimeout(timer);
  }, [showDemo]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/alarms");
        const data = await response.json();
        if (cancelled || !Array.isArray(data.alarms)) return;

        const current: Alarm[] = data.alarms;
        const currentKeys = buildKeys(current);

        // Erster Durchlauf: gespeicherten Stand laden. War noch keiner da, gilt
        // die vorhandene Liste als bekannt - sonst käme beim ersten Start für
        // jeden Altbestand ein Popup.
        let seeding = false;
        if (seenRef.current === null) {
          seenRef.current = loadSeen();
          seeding = seenRef.current.size === 0;
        }

        const seen = seenRef.current;
        const freshKeys = currentKeys.filter((key) => !seen.has(key));
        const fresh = current.filter((_, index) => !seen.has(currentKeys[index]));

        for (const key of currentKeys) seen.add(key);
        persistSeen(seen);

        if (seeding || fresh.length === 0) return;

        notify(fresh);
        playAlarmSound();
        setFlash((count) => count + 1);

        setPopups((existing) =>
          [
            ...existing,
            ...fresh.map((alarm, index) => ({ key: freshKeys[index], alarm })),
          ].slice(-MAX_POPUPS)
        );
      } catch (error) {
        // Ausfall der Quelle darf die Anzeige nicht stören.
        console.warn("Alarmierungen nicht abrufbar:", error);
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (popups.length === 0) return null;

  return (
    <>
      {/* Blauer Lichtschein über den ganzen Schirm, klingt von selbst ab */}
      <span key={flash} className="alarm-raumlicht" aria-hidden="true" />

      <div className="pointer-events-none absolute right-2 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3 md:right-6">
        {popups.map((entry) => (
          <AlarmPopup
            key={entry.key}
            alarm={entry.alarm}
            durationMs={POPUP_DURATION_MS}
            onDismiss={() => dismissPopup(entry.key)}
          />
        ))}
      </div>
    </>
  );
}
