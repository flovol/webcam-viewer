/**
 * Kurzes Zweiklang-Signal für neue Alarmierungen.
 *
 * Synthetisiert statt Audiodatei: kein zusätzliches Asset, keine Ladezeit, und
 * die Lautstärke lässt sich exakt steuern. Browser blockieren Tonausgabe ohne
 * vorherige Nutzerinteraktion - deshalb muss unlockAlarmSound() aus einem Klick
 * heraus aufgerufen werden, sonst bleibt der Kontext stumm.
 */

import { isMuted } from "./soundPreference";

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

function getContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;

  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext ??
    null
  );
}

/** Aus einem Klick heraus aufrufen - schaltet die Tonausgabe frei. */
export function unlockAlarmSound(): boolean {
  const Constructor = getContextConstructor();
  if (!Constructor) return false;

  try {
    context ??= new Constructor();
    void context.resume();
    return true;
  } catch {
    return false;
  }
}

/**
 * Versucht die Tonausgabe ohne Zutun freizuschalten, sobald die Seite lädt.
 *
 * Ob das gelingt, entscheidet der Browser: Ohne vorherige Interaktion bleibt
 * ein frisch erzeugter Audiokontext normalerweise "suspended". Zwei Fälle, in
 * denen es trotzdem sofort klappt:
 *
 * - Der Anzeigerechner startet Chrome mit --autoplay-policy=no-user-gesture-required
 *   (der übliche Weg im Kioskbetrieb, siehe README).
 * - Der Browser hat der Seite die Tonwiedergabe dauerhaft erlaubt.
 *
 * Klappt es nicht, wird beim allerersten Klick, Tastendruck oder Tippen
 * nachgeholt - egal wo auf der Seite. Niemand muss dafür ein Menü suchen.
 */
export function ensureAlarmSound(): void {
  if (!unlockAlarmSound()) return;

  if (isAlarmSoundReady()) return;

  const nachholen = () => {
    void context?.resume();
  };

  for (const ereignis of ["pointerdown", "keydown", "touchstart"]) {
    window.addEventListener(ereignis, nachholen, { once: true, capture: true });
  }
}

export function isAlarmSoundReady(): boolean {
  return context !== null && context.state === "running";
}

const TONE_LENGTH = 0.34;
const PATTERN = [440, 588, 440, 588];

/**
 * Wie lange das Signal dauert.
 *
 * Wird gebraucht, um eine gesprochene Ansage danach anzusetzen statt darüber -
 * gleichzeitig versteht man weder das eine noch das andere.
 */
export const ALARM_SOUND_DURATION_MS = Math.round(TONE_LENGTH * PATTERN.length * 1000);

/** Vier abwechselnde Töne, angelehnt an ein Signalhorn. */
export function playAlarmSound(volume = 0.25): void {
  if (isMuted()) return;
  if (!context || context.state !== "running") return;

  const pattern = PATTERN;

  pattern.forEach((frequency, index) => {
    const start = context!.currentTime + index * TONE_LENGTH;
    const end = start + TONE_LENGTH * 0.92;

    const oscillator = context!.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;

    // Weiche Flanken - ohne Hüllkurve knackt es bei jedem Tonwechsel.
    const gain = context!.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.02);
    gain.gain.setValueAtTime(volume, end - 0.03);
    gain.gain.linearRampToValueAtTime(0, end);

    oscillator.connect(gain).connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  });
}
