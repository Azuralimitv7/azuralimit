/* Tiny synthesized sound engine — no audio files, pure Web Audio. */

let ctx: AudioContext | null = null;
let enabled = true;
try {
  if (typeof window !== "undefined") {
    enabled = localStorage.getItem("azura.sound") !== "0";
  }
} catch {
  /* ignore */
}

export const isSoundOn = () => enabled;

export function setSoundOn(v: boolean) {
  enabled = v;
  try {
    localStorage.setItem("azura.sound", v ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (v) prime();
}

function ac(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function prime() {
  ac();
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  slide?: number;
  delay?: number;
}

function tone(freq: number, dur: number, opts: ToneOpts = {}) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  try {
    const { type = "sine", gain = 0.12, slide, delay = 0 } = opts;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(30, freq), t0);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.06);
  } catch {
    /* ignore */
  }
}

function noise(dur: number, from: number, to: number, gain = 0.18, delay = 0) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.1;
    f.frequency.setValueAtTime(Math.max(40, from), t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  } catch {
    /* ignore */
  }
}

export const sfx = {
  prime,
  /** tiny UI tick (steppers, presets) */
  tick() {
    tone(1750, 0.045, { type: "square", gain: 0.035 });
  },
  /** soft hover */
  hover() {
    tone(1300, 0.035, { type: "sine", gain: 0.02 });
  },
  /** solid button click */
  click() {
    tone(330, 0.07, { type: "triangle", gain: 0.14, slide: 210 });
    tone(660, 0.05, { type: "sine", gain: 0.06, delay: 0.01 });
  },
  /** cell pop (varies with index for a cascading feel) */
  pop(i = 0) {
    tone(260 + (i % 6) * 45, 0.09, { type: "sine", gain: 0.1, slide: 540 });
  },
  /** the satisfying slice */
  slice() {
    noise(0.38, 2600, 280, 0.2);
    tone(95, 0.24, { type: "sine", gain: 0.22, slide: 52, delay: 0.03 });
    tone(1900, 0.16, { type: "sine", gain: 0.05, slide: 900, delay: 0.05 });
  },
  /** success chime */
  chime() {
    tone(660, 0.32, { gain: 0.11 });
    tone(990, 0.4, { gain: 0.09, delay: 0.11 });
    tone(1320, 0.5, { gain: 0.06, delay: 0.22 });
  },
  /** error buzz */
  buzz() {
    tone(130, 0.28, { type: "sawtooth", gain: 0.1, slide: 65 });
  },
  /** toggle snap */
  snap() {
    tone(520, 0.055, { type: "square", gain: 0.09, slide: 300 });
  },
  /** upload whoosh */
  whoosh() {
    noise(0.5, 350, 2800, 0.09);
    tone(220, 0.4, { type: "sine", gain: 0.05, slide: 440 });
  },
  /** drop zone received files */
  drop() {
    tone(392, 0.09, { type: "triangle", gain: 0.11 });
    tone(587, 0.12, { type: "triangle", gain: 0.1, delay: 0.07 });
  },
};
