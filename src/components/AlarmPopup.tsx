"use client";

import { useEffect, useState } from "react";
import type { Alarm } from "@/app/api/alarms/route";

interface AlarmPopupProps {
  alarm: Alarm;
  /** Wie lange das Popup stehen bleibt, bevor es sich wegblendet. */
  durationMs: number;
  onDismiss: () => void;
}

const LEAVE_ANIMATION_MS = 400;

export default function AlarmPopup({ alarm, durationMs, onDismiss }: AlarmPopupProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), durationMs);
    const remove = setTimeout(onDismiss, durationMs + LEAVE_ANIMATION_MS);

    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [durationMs, onDismiss]);

  return (
    <div
      role="alert"
      className={`alarm-popup ${leaving ? "alarm-popup--leaving" : ""} pointer-events-auto relative w-[min(88vw,23rem)] overflow-hidden rounded-2xl border border-blue-400/50 bg-black/75 backdrop-blur-md`}
    >
      {/* Lichtband, das kurz über die Karte streicht */}
      <span className="alarm-popup__sweep" aria-hidden="true" />

      <div className="relative flex items-center gap-3 border-b border-white/10 bg-blue-600/25 px-4 py-3">
        <span className="warnbalken" aria-hidden="true">
          <span className="kennleuchte kennleuchte--links">
            <span className="kennleuchte__beam" />
            <span className="kennleuchte__dome" />
          </span>
          <span className="kennleuchte kennleuchte--rechts">
            <span className="kennleuchte__beam" />
            <span className="kennleuchte__dome" />
          </span>
        </span>

        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-200/80">
            Neue Alarmierung
          </div>
          <div className="truncate text-lg font-bold leading-tight text-white">{alarm.type}</div>
        </div>
      </div>

      <div className="relative px-4 py-3">
        <div className="text-lg font-semibold leading-tight text-white">{alarm.place}</div>
        <div className="mt-0.5 text-sm text-white/70">{alarm.brigade}</div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
          <span>{alarm.postalCode ? `PLZ ${alarm.postalCode}` : "Osttirol"}</span>
          <span>{alarm.date}</span>
        </div>
      </div>

      <button
        onClick={() => setLeaving(true)}
        className="absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-lg leading-none text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
        aria-label="Schließen"
      >
        ×
      </button>
    </div>
  );
}
