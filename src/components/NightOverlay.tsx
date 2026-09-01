"use client";

/**
 * Nachtruhe für die Anzeige: schwarz und still bis zum nächsten Morgen.
 *
 * Liegt über allem, auch über den Popups (Ebene 30) - sonst bliebe eine
 * Nachricht sichtbar, die kurz vor Feierabend eingeblendet wurde. Alarmierungen
 * und Nachrichten werden währenddessen gar nicht erst angezeigt, das erledigen
 * AlarmWatcher und MessageWatcher selbst.
 *
 * Was das spart: die Diashow steht still, es werden keine Webcambilder mehr
 * geladen, und ein schwarzes Bild schont OLED-Schirme. Der Monitor selbst
 * schaltet dabei NICHT ab - das kann eine Webseite nicht, dafür braucht es die
 * Energieeinstellungen des Betriebssystems.
 */
export default function NightOverlay() {
  return <div className="absolute inset-0 z-40 bg-black" aria-hidden="true" />;
}
