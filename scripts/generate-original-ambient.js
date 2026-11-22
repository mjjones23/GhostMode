/**
 * Generates short ORIGINAL ambient WAV loops for Ghost Mode Music Hub.
 * These files are project-owned synthetic tones — not third-party music.
 * Run: node scripts/generate-original-ambient.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'audio', 'ambient');
const SAMPLE_RATE = 22050;
const DURATION_SEC = 6;

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(clamped * 32000), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function fade(samples) {
  const fadeLen = Math.floor(SAMPLE_RATE * 0.35);
  for (let i = 0; i < fadeLen; i += 1) {
    const g = i / fadeLen;
    samples[i] *= g;
    samples[samples.length - 1 - i] *= g;
  }
  return samples;
}

function tone(freq, amp = 0.18) {
  const n = Math.floor(SAMPLE_RATE * DURATION_SEC);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] =
      Math.sin(2 * Math.PI * freq * t) * amp +
      Math.sin(2 * Math.PI * (freq * 1.5) * t) * (amp * 0.25);
  }
  return fade(samples);
}

function noise(amp = 0.12, filter = 0.92) {
  const n = Math.floor(SAMPLE_RATE * DURATION_SEC);
  const samples = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i += 1) {
    const white = Math.random() * 2 - 1;
    last = filter * last + (1 - filter) * white;
    samples[i] = last * amp;
  }
  return fade(samples);
}

function ocean() {
  const n = Math.floor(SAMPLE_RATE * DURATION_SEC);
  const samples = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / SAMPLE_RATE;
    const swell = (Math.sin(2 * Math.PI * 0.18 * t) + 1) * 0.5;
    const white = Math.random() * 2 - 1;
    last = 0.97 * last + 0.03 * white;
    samples[i] = last * 0.22 * (0.35 + swell * 0.65);
  }
  return fade(samples);
}

function rain() {
  const n = Math.floor(SAMPLE_RATE * DURATION_SEC);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const drop = Math.random() < 0.08 ? (Math.random() * 2 - 1) * 0.35 : 0;
    const hush = (Math.random() * 2 - 1) * 0.04;
    samples[i] = drop + hush;
  }
  // Soft low-pass
  for (let i = 1; i < n; i += 1) {
    samples[i] = samples[i] * 0.35 + samples[i - 1] * 0.65;
  }
  return fade(samples);
}

function mix(a, b, bAmp = 0.4) {
  const n = Math.min(a.length, b.length);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) out[i] = a[i] + b[i] * bAmp;
  return fade(out);
}

fs.mkdirSync(OUT, { recursive: true });

const tracks = {
  'relaxation-soft-pad.wav': mix(tone(174.61, 0.14), tone(220, 0.08), 1),
  'sleep-deep-drone.wav': tone(65.41, 0.16),
  'rain-soft-patter.wav': rain(),
  'ocean-gentle-swell.wav': ocean(),
  'motivation-lift.wav': mix(tone(261.63, 0.12), tone(329.63, 0.08), 1),
  'focus-steady-pulse.wav': mix(tone(196, 0.1), noise(0.05, 0.88), 1),
};

for (const [name, samples] of Object.entries(tracks)) {
  const filePath = path.join(OUT, name);
  writeWav(filePath, samples);
  console.log('wrote', path.relative(process.cwd(), filePath));
}

console.log('generate-original-ambient: ok');
