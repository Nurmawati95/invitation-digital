/**
 * Sintesis musik latar undangan (ambient piano/pad) langsung ke file WAV.
 * Dijalankan sekali: node scripts/generate-music.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SR = 32000;
const OUT = resolve("public/music/wedding-theme.wav");

// --- helper: nada MIDI -> frekuensi -------------------------------------
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Progresi akor lembut: Am - F - C - G  (nada dasar MIDI)
const PROGRESSION = [
  { name: "Am", root: 45, chord: [45, 57, 60, 64], arp: [69, 72, 76, 72] },
  { name: "F",  root: 41, chord: [41, 53, 57, 60], arp: [65, 69, 72, 69] },
  { name: "C",  root: 36, chord: [48, 55, 60, 64], arp: [72, 76, 79, 76] },
  { name: "G",  root: 43, chord: [43, 55, 59, 62], arp: [71, 74, 78, 74] },
];
const BAR = 6;             // detik per akor
const REPEAT = 2;          // jumlah putaran progresi
const TOTAL = BAR * PROGRESSION.length * REPEAT;

// --- sintesis satu suara sine + harmonik halus ---------------------------
function tone(freq, t, dur, gain, harmonics = [1, 0.28, 0.1]) {
  let s = 0;
  for (let h = 0; h < harmonics.length; h++) {
    const amp = harmonics[h] / (h + 1);
    s += amp * Math.sin(2 * Math.PI * freq * (h + 1) * t);
  }
  // envelope: attack lembut, sustain, release panjang
  const atk = Math.min(1.6, dur * 0.3);
  const rel = Math.min(2.6, dur * 0.45);
  let env;
  if (t < atk) env = t / atk;
  else if (t > dur - rel) env = Math.max(0, (dur - t) / rel);
  else env = 1;
  env = env * env * (3 - 2 * env); // smoothstep
  return s * gain * env;
}

// bel kecil: harmonik kaya + decay eksponensial
function bell(freq, t, dur, gain) {
  const harm = [1, 0.5, 0.25, 0.12, 0.06];
  let s = 0;
  for (let h = 0; h < harm.length; h++) {
    s += harm[h] * Math.sin(2 * Math.PI * freq * (h + 1) * t) * Math.exp(-3.2 * t);
  }
  const atk = 0.012;
  const env = t < atk ? t / atk : Math.exp(-1.9 * (t - atk));
  return s * gain * env;
}

const n = Math.floor(SR * TOTAL);
const buf = new Float32Array(n);

let chordIndex = 0;
for (let rep = 0; rep < REPEAT; rep++) {
  for (const step of PROGRESSION) {
    const start = (chordIndex % PROGRESSION.length) * BAR + Math.floor(chordIndex / PROGRESSION.length) * (BAR * PROGRESSION.length);
    const offset = Math.floor(start * SR);
    const chordDur = BAR + 2.2;

    // pad akor (tiga nada, detune tipis agar hangat)
    for (let i = 0; i < step.chord.length; i++) {
      const f = midi(step.chord[i]);
      for (let k = 0; k < n - offset; k++) {
        const t = k / SR;
        if (t > chordDur) break;
        const detune = 1 + (i % 2 === 0 ? 0.0012 : -0.0012);
        buf[offset + k] += tone(f * detune, t, chordDur, 0.13);
      }
    }

    // bass lembut
    const bf = midi(step.root - 12);
    for (let k = 0; k < n - offset; k++) {
      const t = k / SR;
      if (t > chordDur) break;
      buf[offset + k] += tone(bf, t, chordDur, 0.1);
    }

    // arpeggio bel: 4 ketuk per akor
    for (let a = 0; a < step.arp.length; a++) {
      const at = 0.9 + a * 1.25;
      const off2 = offset + Math.floor(at * SR);
      if (off2 >= n) break;
      const f = midi(step.arp[a]);
      const d = 2.4;
      for (let k = 0; k < Math.min(n - off2, Math.floor(d * SR)); k++) {
        const t = k / SR;
        buf[off2 + k] += bell(f, t, d, 0.075);
      }
    }
    chordIndex++;
  }
}

// --- normalisasi + fade in/out -------------------------------------------
let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
const norm = peak > 0 ? 0.86 / peak : 0;
const fadeIn = Math.floor(SR * 1.8);
const fadeOut = Math.floor(SR * 3.2);
for (let i = 0; i < n; i++) {
  let v = buf[i] * norm;
  if (i < fadeIn) v *= i / fadeIn;
  if (i > n - fadeOut) v *= (n - i) / fadeOut;
  buf[i] = v;
}

// --- tulis WAV 16-bit mono ----------------------------------------------
const dataBytes = n * 2;
const buffer = Buffer.alloc(44 + dataBytes);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataBytes, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);          // PCM
buffer.writeUInt16LE(1, 22);          // mono
buffer.writeUInt32LE(SR, 24);
buffer.writeUInt32LE(SR * 2, 28);     // byte rate
buffer.writeUInt16LE(2, 32);          // block align
buffer.writeUInt16LE(16, 34);         // bits per sample
buffer.write("data", 36);
for (let i = 0; i < n; i++) {
  buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(buf[i] * 32767))), 44 + i * 2);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, buffer);
console.log(`WAV written: ${OUT} (${(buffer.length / 1e6).toFixed(2)} MB, ${TOTAL.toFixed(1)}s, ${SR}Hz mono)`);
