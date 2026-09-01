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
}

export const COCKPIT_MESSAGES: CockpitMessage[] = [
  { id: "kaffee", text: "Gehen wir einen Kaffee trinken?", emoji: "☕" },
  { id: "essen", text: "Gehen wir essen", emoji: "🍽️" },
  { id: "morgen-gerald", text: "Guten Morgen Gerald", emoji: "👋" },
];

/**
 * Wie beim Probe-Alarm verbindet ein Fensterereignis die Stellen im Baum, die
 * sonst nichts voneinander wissen - siehe alarmDemo.ts.
 */
export const MESSAGE_EVENT = "osttirol:message";

export interface MessageDetail {
  text: string;
  emoji: string;
}

export function triggerMessage(detail: MessageDetail): void {
  window.dispatchEvent(new CustomEvent<MessageDetail>(MESSAGE_EVENT, { detail }));
}

/** Fällt auf ein neutrales Zeichen zurück, falls ein unbekannter Text ankommt. */
export function messageEmoji(text: string): string {
  return COCKPIT_MESSAGES.find((message) => message.text === text)?.emoji ?? "💬";
}
