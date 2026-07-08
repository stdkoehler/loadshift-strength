let audioCtx: AudioContext | null = null;
let keepAliveEl: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

/**
 * A near-inaudible looping tone, not pure digital silence. Mobile Chrome's
 * page-freezing heuristics treat an actively-playing audio element as a
 * signal to keep the tab alive in the background, which is what lets our
 * rest-timer alarm still fire after switching to another app.
 */
function keepAliveDataUri(durationSec = 1, sampleRate = 8000): string {
  const numSamples = durationSec * sampleRate;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const amplitude = 300; // ~1% of full scale
  const freq = 200;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.round(amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate));
    view.setInt16(44 + i * 2, sample, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function startBackgroundKeepAlive() {
  if (keepAliveEl) return;
  const el = new Audio(keepAliveDataUri());
  el.loop = true;
  el.volume = 0.02;
  el.play().catch(() => {});
  keepAliveEl = el;
}

export function stopBackgroundKeepAlive() {
  keepAliveEl?.pause();
  keepAliveEl = null;
}

export function playAlarm() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  [0, 0.3, 0.6].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.3);
  });
}

export function vibrate() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

let alarmLoopInterval: ReturnType<typeof setInterval> | null = null;

/** Repeats the beep + vibration every few seconds until stopAlarmLoop() is called. */
export function startAlarmLoop() {
  if (alarmLoopInterval) return;
  playAlarm();
  vibrate();
  alarmLoopInterval = setInterval(() => {
    playAlarm();
    vibrate();
  }, 2500);
}

export function stopAlarmLoop() {
  if (alarmLoopInterval) clearInterval(alarmLoopInterval);
  alarmLoopInterval = null;
}

export async function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      // ignore
    }
  }
}

export function notifyRestOver(body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification('Pause vorbei', { body, icon: '/icon', tag: 'rest-timer' });
  } catch {
    // ignore
  }
}
