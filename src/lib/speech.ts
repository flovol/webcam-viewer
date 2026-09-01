/**
 * Vorlesen über die im Browser eingebauten Stimmen.
 *
 * Kein Konto, kein Schlüssel, keine Kosten - dafür klingt es nach dem, was das
 * Betriebssystem hergibt. Die Auswahl bevorzugt österreichisches Deutsch, nimmt
 * sonst jede deutsche Stimme und fällt zur Not auf die Standardstimme zurück.
 *
 * Wer es besser klingen lassen will, tauscht später vorgefertigte Sprachdateien
 * ein; die Aufrufstelle bleibt dieselbe.
 */

const PREFERRED_LANGUAGES = ["de-at", "de-de", "de"];

/**
 * Manche Browser liefern die Stimmenliste erst nachträglich. Vor der ersten
 * Ansage muss deshalb gewartet werden - aber nicht ewig, denn das Ereignis
 * bleibt gelegentlich ganz aus.
 */
const VOICE_LOAD_TIMEOUT_MS = 1000;

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();

  for (const language of PREFERRED_LANGUAGES) {
    // Manche Systeme schreiben "de_AT" statt "de-AT".
    const match = voices.find((voice) =>
      voice.lang.replace("_", "-").toLowerCase().startsWith(language)
    );

    if (match) return match;
  }

  return null;
}

function whenVoicesReady(synth: SpeechSynthesis, callback: () => void): void {
  if (synth.getVoices().length > 0) {
    callback();
    return;
  }

  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    callback();
  };

  synth.addEventListener("voiceschanged", run, { once: true });
  window.setTimeout(run, VOICE_LOAD_TIMEOUT_MS);
}

export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Liest einen Text vor. Eine laufende Ansage wird abgebrochen - bei zwei
 * Nachrichten kurz hintereinander zählt die neuere.
 *
 * Wie bei jedem Ton gilt: ohne vorherige Interaktion mit der Seite bleiben
 * Browser stumm. Auf der Anzeige genügt ein Klick, siehe alarmSound.ts.
 */
export function speak(text: string): void {
  if (!isSpeechAvailable() || !text.trim()) return;

  const synth = window.speechSynthesis;

  whenVoicesReady(synth, () => {
    try {
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(synth);

      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? "de-DE";
      // Eine Spur langsamer als die Voreinstellung - quer durch den Raum
      // verständlicher.
      utterance.rate = 0.95;

      synth.speak(utterance);
    } catch {
      // Vorlesen ist Beiwerk; scheitert es, bleibt die Nachricht trotzdem stehen.
    }
  });
}
