"use client";

import { useEffect, useState } from "react";
import { isAlarmSoundReady, unlockAlarmSound } from "@/lib/alarmSound";
import { triggerAlarmDemo } from "@/lib/alarmDemo";

/**
 * Schaltet Ton und Systemmeldungen für Feuerwehr-Alarmierungen frei.
 *
 * Browser geben beides nur nach echter Nutzerinteraktion frei - deshalb braucht
 * es diesen Klick, sonst bliebe der Alarm stumm. Das Popup selbst erscheint auch
 * ohne Freischaltung.
 */
export default function AlarmAlertsSetting() {
  const [ready, setReady] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    const refresh = () => {
      setReady(isAlarmSoundReady());
      setPermission(
        typeof Notification === "undefined" ? "unsupported" : Notification.permission
      );
    };

    refresh();
    const interval = setInterval(refresh, 2000);

    return () => clearInterval(interval);
  }, []);

  const enable = async () => {
    setReady(unlockAlarmSound());
    // Probe-Popup samt Ton, damit gleich sichtbar ist, wie ein Alarm aussieht.
    triggerAlarmDemo();

    if (typeof Notification !== "undefined") {
      setPermission(await Notification.requestPermission());
    }
  };

  const active = ready && permission === "granted";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/90 text-xs md:text-sm">Einsatz-Alarm</span>

      {active ? (
        <span className="flex items-center gap-1.5 text-xs md:text-sm text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          aktiv
        </span>
      ) : (
        <button
          onClick={enable}
          className="rounded-lg border border-white/20 bg-white/10 px-2.5 md:px-3 py-1.5 text-xs md:text-sm text-white transition-colors hover:bg-white/20"
        >
          {permission === "denied" ? "Ton aktivieren" : "Aktivieren"}
        </button>
      )}
    </div>
  );
}
