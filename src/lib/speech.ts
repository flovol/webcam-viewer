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

/**
 * Bewertung der gefundenen Stimmen.
 *
 * Die erstbeste deutsche Stimme zu nehmen war ein Fehler: Windows liefert
 * neben brauchbaren auch die alten SAPI-Stimmen, und die klingen blechern und
 * schleppend. Deshalb wird bewertet statt gegriffen - je höher, desto lieber.
 *
 * "Natural" und "Online" kennzeichnen bei Microsoft die neuronalen Stimmen,
 * Google liefert seine deutschen Stimmen über das Netz; beide sind den lokal
 * gerechneten deutlich überlegen.
 */
const VOICE_BONUS: { muster: RegExp; punkte: number }[] = [
  { muster: /natural|neural/i, punkte: 6 },
  { muster: /online/i, punkte: 4 },
  { muster: /google/i, punkte: 3 },
  // Die Altlasten, die nach Sprachcomputer klingen.
  { muster: /hedda|stefan|espeak|festival/i, punkte: -8 },
];

const LANGUAGE_BONUS: { praefix: string; punkte: number }[] = [
  { praefix: "de-at", punkte: 3 },
  { praefix: "de-de", punkte: 2 },
  { praefix: "de", punkte: 1 },
];

/**
 * Manche Browser liefern die Stimmenliste erst nachträglich. Vor der ersten
 * Ansage muss deshalb gewartet werden - aber nicht ewig, denn das Ereignis
 * bleibt gelegentlich ganz aus.
 */
const VOICE_LOAD_TIMEOUT_MS = 1000;

function scoreVoice(voice: SpeechSynthesisVoice): number {
  // Manche Systeme schreiben "de_AT" statt "de-AT".
  const lang = voice.lang.replace("_", "-").toLowerCase();
  const language = LANGUAGE_BONUS.find((entry) => lang.startsWith(entry.praefix));

  // Nichtdeutsche Stimmen kommen nicht in Frage - eine englische Stimme, die
  // deutschen Text vorliest, ist schlimmer als gar keine.
  if (!language) return Number.NEGATIVE_INFINITY;

  let score = language.punkte;

  for (const { muster, punkte } of VOICE_BONUS) {
    if (muster.test(voice.name)) score += punkte;
  }

  // Über das Netz gerechnete Stimmen klingen fast immer besser als die lokal
  // erzeugten. Fällt das Netz aus, greift der Browser selbst auf eine lokale
  // zurück.
  if (!voice.localService) score += 2;

  return score;
}

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const voice of synth.getVoices()) {
    const score = scoreVoice(voice);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }

  return bestScore === Number.NEGATIVE_INFINITY ? null : best;
}

/**
 * Welche Stimmen der Anzeigerechner anbietet und welche gewählt wurde.
 *
 * Die Auswahl hängt vom Rechner ab, auf dem die Anzeige läuft - was hier
 * vorhanden ist, sagt nichts über die dortige Ausstattung. Deshalb einmal in
 * die Konsole, damit man im Zweifel nachsehen kann.
 */
function reportVoices(synth: SpeechSynthesis, chosen: SpeechSynthesisVoice | null): void {
  if (reported) return;
  reported = true;

  console.info(
    "Sprachausgabe - gewählt:",
    chosen ? `${chosen.name} (${chosen.lang})` : "Standardstimme",
    "| vorhanden:",
    synth.getVoices().map((voice) => `${voice.name} [${voice.lang}]`)
  );
}

let reported = false;

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

/** Läuft gerade eine Ansage, wird sie von der nächsten abgelöst. */
let current: HTMLAudioElement | null = null;

/**
 * Spielt eine vorgefertigte Ansage ab.
 *
 * Gibt zurück, ob es geklappt hat - schlägt es fehl (Datei fehlt, Tonausgabe
 * gesperrt), kann die Aufrufstelle auf die Browserstimme ausweichen.
 */
async function playFile(source: string): Promise<boolean> {
  try {
    current?.pause();

    const audio = new Audio(source);
    current = audio;

    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/**
 * Sagt einen Text an: bevorzugt mit der mitgelieferten Aufnahme, sonst mit der
 * Stimme des Browsers.
 *
 * Die Aufnahmen klingen auf jedem Rechner gleich; die Browserstimmen sind eine
 * Lotterie und auf mancher Windows-Installation kaum anhörbar. Deshalb diese
 * Reihenfolge und nicht umgekehrt.
 */
export function say(text: string, audio?: string | null): void {
  if (!audio) {
    speak(text);
    return;
  }

  void playFile(audio).then((ok) => {
    if (!ok) speak(text);
  });
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

      reportVoices(synth, voice);

      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? "de-DE";

      synth.speak(utterance);
    } catch {
      // Vorlesen ist Beiwerk; scheitert es, bleibt die Nachricht trotzdem stehen.
    }
  });
}
