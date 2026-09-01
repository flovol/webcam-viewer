/**
 * Kurzes Zweiklang-Signal für neue Alarmierungen.
 *
 * Synthetisiert statt Audiodatei: kein zusätzliches Asset, keine Ladezeit, und
 * die Lautstärke lässt sich exakt steuern. Browser blockieren Tonausgabe ohne
 * vorherige Nutzerinteraktion - deshalb muss unlockAlarmSound() aus einem Klick
 * heraus aufgerufen werden, sonst bleibt der Kontext stumm.
 */

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
