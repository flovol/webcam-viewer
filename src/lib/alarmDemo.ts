/**
 * Auslöser für ein Probe-Popup.
 *
 * Das Einstellungsmenü und die Popup-Anzeige hängen an verschiedenen Stellen im
 * Baum. Ein Fensterereignis verbindet sie, ohne den Zustand durch mehrere Ebenen
 * durchreichen zu müssen.
 */
export const ALARM_DEMO_EVENT = "osttirol:alarm-demo";

export function triggerAlarmDemo(): void {
  window.dispatchEvent(new Event(ALARM_DEMO_EVENT));
}
