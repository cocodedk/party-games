// WebAudio bleeps and fanfares, made with oscillators. The context is made at load, so sound is on from
// the start where the browser allows it without a gesture (a TV, a trusted site, an autoplay flag);
// elsewhere it stays silent until unlock() runs inside a user gesture.
import { SOUND, SOUND_WAVE, SOUND_GAIN, SOUND_SILENT } from '../../shared/constants.js';

const RUNNING = 'running';

/** onStart(): called when sound starts playing, with or without a gesture. */
export function createSound(onStart) {
  const audio = new AudioContext();
  audio.onstatechange = () => audio.state === RUNNING && onStart();
  return {
    unlock() {
      audio.resume();
    },
    /** name: a key of SOUND. Skipped while silent, so blocked sounds never pile up for later. */
    play(name) {
      if (audio.state !== RUNNING) return;
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
