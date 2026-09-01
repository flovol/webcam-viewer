/**
 * Ton an oder aus - eine Einstellung für alles Hörbare der Anzeige:
 * Signalhorn, Alarmansage und die Nachrichten aus dem Cockpit.
 *
 * Standard ist AN. Der Schalter in den Einstellungen ist damit nur noch ein
 * Ausschalter; wer nichts tut, bekommt Ton. Die Entscheidung bleibt im
 * Browser des Anzeigerechners gespeichert, überdauert also einen Neustart.
 */

const STORAGE_KEY = "osttirol-ton-aus";

/** Damit die Einstellung sofort greift und nicht erst beim nächsten Laden. */
const CHANGE_EVENT = "osttirol:ton-geaendert";

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Privater Modus - dann eben Ton an, das ist der Standard.
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    if (muted) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nicht speicherbar: die Einstellung gilt dann nur bis zum Neuladen.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeMuted(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
