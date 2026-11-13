// Synthesized Web Audio API sound effects — zero external audio file dependencies

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('nexus-trivia-muted');
      this.muted = saved === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(val: boolean): void {
    this.muted = val;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nexus-trivia-muted', String(val));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.14,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playTick() {
    this.playTone(680, 0.04, 'triangle', 0.08, 0, 320);
  }

  public playSpinStart() {
    this.playTone(220, 0.18, 'sawtooth', 0.08, 0, 520);
  }

  public playSelect() {
    this.playTone(520, 0.06, 'sine', 0.09, 0, 660);
  }

  public playCorrect() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 0.16, 'triangle', 0.13, i * 0.075);
    });
  }

  public playWrong() {
    this.playTone(210, 0.18, 'sawtooth', 0.1, 0, 145);
    this.playTone(155, 0.25, 'sawtooth', 0.09, 0.14, 105);
  }

  public playCrown() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, i) => {
      this.playTone(n, 0.24, 'square', 0.08, i * 0.09);
    });
  }

  public playTimerWarn() {
    this.playTone(880, 0.07, 'sine', 0.06);
  }

  public playCardFlip() {
    this.playTone(340, 0.09, 'sine', 0.08, 0, 580);
  }
}

export const soundEngine = new SoundEngine();
