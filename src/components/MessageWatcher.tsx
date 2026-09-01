"use client";

import { useEffect, useRef, useState } from "react";
import { MESSAGE_EVENT, messageAudio, messageEmoji, type MessageDetail } from "@/lib/messages";
import { say } from "@/lib/speech";

/**
 * Zeigt die Kurznachrichten aus dem Cockpit auf der Anzeige.
 *
 * Bewusst anders als das Alarm-Popup: kein Blaulicht, kein Ton, keine
 * Dringlichkeit - eine freundliche Karte, groß genug, um sie quer durch den
 * Raum zu lesen. Sie sitzt unten mittig und damit weit weg vom Alarmstapel am
 * rechten Rand, damit sich beide nie überdecken.
 */

/** Lang genug, dass die Nachricht auch bemerkt wird, wenn gerade niemand hinsieht. */
const DURATION_MS = 60_000;
const LEAVE_ANIMATION_MS = 400;

interface ShownMessage extends MessageDetail {
  /** Wechselt bei jedem Auslösen, damit dieselbe Nachricht erneut anläuft. */
  key: number;
  /** Blendet gerade aus. Steckt im Zustand der Nachricht, damit eine neue ihn
   *  von sich aus zurücksetzt - ein Rücksetzen im Effekt würde nur eine
   *  zusätzliche Renderrunde auslösen. */
  leaving: boolean;
}

interface MessageWatcherProps {
  /** Waehrend der Nachtruhe bleibt alles aus - kein Einblenden, keine Ansage. */
  nightMode: boolean;
}

export default function MessageWatcher({ nightMode }: MessageWatcherProps) {
  const [message, setMessage] = useState<ShownMessage | null>(null);

  // Ueber eine Ref, damit der Umschaltvorgang nicht den Ereignisempfaenger
  // neu aufsetzt.
  const nightRef = useRef(nightMode);
  useEffect(() => {
    nightRef.current = nightMode;
  });

  useEffect(() => {
    const show = (event: Event) => {
      const detail = (event as CustomEvent<MessageDetail>).detail;
      if (!detail?.text || nightRef.current) return;

      // Eine neue Nachricht ersetzt die vorherige, statt sich daneben zu
      // stellen - zwei gleichzeitige Zurufe gibt es im Alltag nicht.
      setMessage({ ...detail, key: Date.now(), leaving: false });
    };

    window.addEventListener(MESSAGE_EVENT, show);
    return () => window.removeEventListener(MESSAGE_EVENT, show);
  }, []);

  // Direktaufruf per ?nachricht=... in der Adresszeile, wie ?alarmdemo=1 beim
  // Probe-Alarm. Praktisch zum Ansehen, ohne das Cockpit zu bemühen.
  useEffect(() => {
    const text = new URLSearchParams(window.location.search).get("nachricht");
    if (!text || nightRef.current) return;

    const timer = setTimeout(
      () =>
        setMessage({
          text,
          emoji: messageEmoji(text),
          audio: messageAudio(text),
          key: Date.now(),
          leaving: false,
        }),
      800
    );

    return () => clearTimeout(timer);
  }, []);

  const key = message?.key;
  const text = message?.text;
  const audio = message?.audio;
  const leaving = message?.leaving ?? false;

  // Vorlesen, sobald eine Nachricht erscheint - egal ob sie aus dem Cockpit
  // kam oder aus der Adresszeile. Beim Ausblenden nicht noch einmal.
  useEffect(() => {
    if (key === undefined || leaving || !text) return;

    say(text, audio);
  }, [key, leaving, text, audio]);

  // Standzeit abwarten, dann wegblenden.
  useEffect(() => {
    if (key === undefined || leaving) return;

    const hide = setTimeout(() => {
      setMessage((current) => (current?.key === key ? { ...current, leaving: true } : current));
    }, DURATION_MS);

    return () => clearTimeout(hide);
  }, [key, leaving]);

  // Erst nach der Ausblendung ausbauen - auch wenn jemand das Kreuz drückt.
  useEffect(() => {
    if (key === undefined || !leaving) return;

    const remove = setTimeout(() => {
      setMessage((current) => (current?.key === key ? null : current));
    }, LEAVE_ANIMATION_MS);

    return () => clearTimeout(remove);
  }, [key, leaving]);

  if (!message) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center px-4">
      <div
        key={message.key}
        role="status"
        className={`message-popup ${leaving ? "message-popup--leaving" : ""} pointer-events-auto relative flex max-w-[min(92vw,44rem)] items-center gap-5 rounded-3xl border border-white/15 bg-black/70 py-5 pl-6 pr-14 backdrop-blur-md`}
      >
        <span className="text-5xl leading-none" aria-hidden="true">
          {message.emoji}
        </span>
        <span className="text-2xl font-semibold leading-snug text-white md:text-3xl">
          {message.text}
        </span>

        <button
          onClick={() => setMessage((current) => (current ? { ...current, leaving: true } : current))}
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-xl leading-none text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          aria-label="Schließen"
        >
          ×
        </button>
      </div>
    </div>
  );
}
