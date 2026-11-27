// WebAudio bleeps and fanfares, made with oscillators. Silent until unlock() runs inside a user gesture.
import { SOUND, SOUND_WAVE, SOUND_GAIN, SOUND_SILENT } from '../../shared/constants.js';

export function createSound() {
  let audio = null;
  return {
    unlock() {
      if (!audio) audio = new AudioContext();
      audio.resume();
    },
    /** name: a key of SOUND. */
    play(name) {
      if (!audio) return;
      const t0 = audio.currentTime;
      for (const [freq, start, length] of SOUND[name]) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = SOUND_WAVE;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(SOUND_GAIN, t0 + start);
        gain.gain.exponentialRampToValueAtTime(SOUND_SILENT, t0 + start + length);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(t0 + start);
        osc.stop(t0 + start + length);
      }
    },
  };
}
