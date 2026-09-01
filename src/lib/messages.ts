/**
 * Kurznachrichten, die das Cockpit auf der Anzeige einblendet.
 *
 * Gedacht für den Zuruf durch den Raum, wenn die Anzeige an der Wand hängt und
 * nicht alle am selben Platz sitzen. Neue Nachricht hinzufügen heißt: eine Zeile
 * in COCKPIT_MESSAGES ergänzen - der Knopf im Cockpit entsteht daraus von selbst.
 */

export interface CockpitMessage {
  id: string;
  /** Steht so auf dem Knopf und so auf der Anzeige. */
  text: string;
  emoji: string;
  /**
   * Vorgefertigte Ansage unter public/sprache/.
   *
   * Erzeugt mit Piper und der deutschen Stimme "Thorsten" - siehe README. Die
   * Browserstimmen klingen je nach Rechner unterschiedlich bis grauenhaft; eine
   * mitgelieferte Datei klingt überall gleich und braucht kein Netz.
   */
  audio: string;
}

export const COCKPIT_MESSAGES: CockpitMessage[] = [
  {
    id: "kaffee",
    text: "Gehen wir einen Kaffee trinken?",
    emoji: "☕",
    audio: "/sprache/kaffee.wav",
  },
  { id: "essen", text: "Gehen wir essen", emoji: "🍽️", audio: "/sprache/essen.wav" },
  {
    id: "morgen-gerald",
    text: "Guten Morgen Gerald",
    emoji: "👋",
    audio: "/sprache/morgen-gerald.wav",
  },
];

/**
 * Wie beim Probe-Alarm verbindet ein Fensterereignis die Stellen im Baum, die
 * sonst nichts voneinander wissen - siehe alarmDemo.ts.
 */
export const MESSAGE_EVENT = "osttirol:message";

export interface MessageDetail {
  text: string;
  emoji: string;
  /** Fehlt bei unbekannten Texten - dann liest die Browserstimme vor. */
  audio?: string | null;
}

export function triggerMessage(detail: MessageDetail): void {
  window.dispatchEvent(new CustomEvent<MessageDetail>(MESSAGE_EVENT, { detail }));
}

/** Fällt auf ein neutrales Zeichen zurück, falls ein unbekannter Text ankommt. */
export function messageEmoji(text: string): string {
  return COCKPIT_MESSAGES.find((message) => message.text === text)?.emoji ?? "💬";
}

/** Null bei Texten, für die keine Ansage vorliegt. */
export function messageAudio(text: string): string | null {
  return COCKPIT_MESSAGES.find((message) => message.text === text)?.audio ?? null;
}
