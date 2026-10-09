export type AmbientTrack = 'rain' | 'picking' | 'strings' | 'pads';
export type SleepChoice = '15' | '30' | '45' | '60' | 'chapter' | null;

type EngineListener = () => void;

class AmbienceEngine {
  narrationVolume = 1;
  ambientVolume = 0.28;
  track: AmbientTrack | null = null;
  sleepChoice: SleepChoice = null;
  sleeping = false;
  private context: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private narrationElements = new Set<HTMLAudioElement>();
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<EngineListener>();

  subscribe(listener: EngineListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  registerNarration(element: HTMLAudioElement | null) {
    if (!element) return () => undefined;
    this.narrationElements.add(element);
    element.volume = this.narrationVolume;
    return () => {
      this.narrationElements.delete(element);
    };
  }

  private ensureContext() {
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!this.context) this.context = new Ctx();
    if (this.context.state === 'suspended') this.context.resume().catch(() => undefined);
    return this.context;
  }

  setNarrationVolume(value: number) {
    this.narrationVolume = Math.min(1, Math.max(0, value));
    this.narrationElements.forEach((element) => {
      element.volume = this.narrationVolume;
    });
    this.emit();
  }

  setAmbientVolume(value: number) {
    this.ambientVolume = Math.min(1, Math.max(0, value));
    if (this.ambientGain) this.ambientGain.gain.value = this.track ? this.ambientVolume : 0;
    this.emit();
  }

  async setTrack(track: AmbientTrack | null) {
    this.stopAmbient();
    this.track = track;
    if (!track) {
      this.emit();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = this.ambientVolume;
    gain.connect(ctx.destination);
    this.ambientGain = gain;
    if (track === 'rain') this.startRain(ctx, gain);
    if (track === 'pads') this.startPads(ctx, gain);
    if (track === 'strings') this.startStrings(ctx, gain);
    if (track === 'picking') this.startPicking(ctx, gain);
    this.emit();
  }

  armSleep(choice: SleepChoice, onDone?: () => void) {
    this.clearSleep();
    this.sleepChoice = choice;
    if (!choice || choice === 'chapter') {
      this.emit();
      return;
    }
    const minutes = parseInt(choice, 10);
    const fadeMs = 20000;
    const wait = Math.max(0, minutes * 60 * 1000 - fadeMs);
    this.sleepTimer = setTimeout(() => this.fadeOut(fadeMs, onDone), wait);
    this.emit();
  }

  notifyChapterEnded(onDone?: () => void) {
    if (this.sleepChoice !== 'chapter') return;
    this.fadeOut(12000, onDone);
  }

  cancelSleep() {
    this.clearSleep();
    this.sleepChoice = null;
    this.sleeping = false;
    this.emit();
  }

  private fadeOut(durationMs: number, onDone?: () => void) {
    this.sleeping = true;
    const startNarration = this.narrationVolume;
    const startAmbient = this.ambientVolume;
    const started = Date.now();
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / durationMs);
      this.setNarrationVolume(startNarration * (1 - progress));
      this.setAmbientVolume(startAmbient * (1 - progress));
      if (progress >= 1) {
        this.narrationElements.forEach((element) => element.pause());
        this.stopAmbient();
        this.track = null;
        this.sleeping = false;
        this.sleepChoice = null;
        if (this.fadeTimer) clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        onDone?.();
        this.emit();
      }
    }, 200);
  }

  private clearSleep() {
    if (this.sleepTimer) clearTimeout(this.sleepTimer);
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.sleepTimer = null;
    this.fadeTimer = null;
  }

  private stopAmbient() {
    this.nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Already disconnected.
      }
    });
    this.nodes = [];
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    this.ambientGain = null;
  }

  private startRain(ctx: AudioContext, destination: AudioNode) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    source.connect(filter);
    filter.connect(destination);
    source.start();
    this.nodes.push(source, filter);
  }

  private startPads(ctx: AudioContext, destination: AudioNode) {
    [196, 247, 294].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = 0.08 / (index + 1);
      osc.connect(gain);
      gain.connect(destination);
      osc.start();
      this.nodes.push(osc, gain);
    });
  }

  private startStrings(ctx: AudioContext, destination: AudioNode) {
    [220, 277, 330].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 640;
      const gain = ctx.createGain();
      gain.gain.value = 0.015;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      osc.start();
      this.nodes.push(osc, filter, gain);
    });
  }

  private startPicking(ctx: AudioContext, destination: AudioNode) {
    const notes = [196, 247, 294, 330];
    notes.forEach((freq, index) => {
      const play = () => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
        osc.connect(gain);
        gain.connect(destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      };
      const timer = window.setInterval(play, 1800);
      play();
      const fakeNode = { disconnect: () => window.clearInterval(timer) } as unknown as AudioNode;
      this.nodes.push(fakeNode);
      void index;
    });
  }
}

export const ambienceEngine = new AmbienceEngine();
