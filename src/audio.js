const CHANNELS = {
  kick: { low: 40, high: 160, sensitivity: 2.4, hit: true },
  bass: { low: 45, high: 250, sensitivity: 1.8 },
  mid: { low: 250, high: 2200, sensitivity: 1 },
  high: { low: 2200, high: 8000, sensitivity: 1 },
  hihat: { low: 6000, high: 14000, sensitivity: 1.4, hit: true },
};

export class RaceAudio {
  constructor(url) {
    this.audio = new Audio(url);
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = 0.35;
    this.context = null;
    this.analyser = null;
    this.data = null;
    this.channels = Object.fromEntries(Object.entries(CHANNELS).map(([id, definition]) => [id, {
      ...definition, value: 0, previous: 0, hitValue: 0, baseline: 0,
    }]));
  }

  async play() {
    if (!this.context) {
      this.context = new AudioContext();
      const source = this.context.createMediaElementSource(this.audio);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0;
      this.data = new Float32Array(this.analyser.frequencyBinCount);
      source.connect(this.analyser);
      this.analyser.connect(this.context.destination);
    }
    await this.context.resume();
    await this.audio.play();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    for (const channel of Object.values(this.channels)) {
      channel.value = channel.previous = channel.hitValue = channel.baseline = 0;
    }
  }

  update(delta) {
    if (!this.analyser || this.audio.paused) {
      for (const channel of Object.values(this.channels)) {
        channel.value *= Math.exp(-delta / 0.15);
        channel.hitValue *= Math.exp(-delta / 0.07);
      }
      return this.channels;
    }
    this.analyser.getFloatFrequencyData(this.data);
    const binWidth = this.context.sampleRate / this.analyser.fftSize;
    for (const channel of Object.values(this.channels)) {
      const first = Math.max(1, Math.ceil(channel.low / binWidth));
      const last = Math.min(this.data.length - 1, Math.floor(channel.high / binWidth));
      let total = 0;
      for (let bin = first; bin <= last; bin++) {
        const amplitude = 10 ** (this.data[bin] / 20);
        total += amplitude * amplitude;
      }
      const energy = Math.sqrt(total / Math.max(1, last - first + 1));
      const target = Math.min(1, energy * channel.sensitivity * 9);
      const response = target > channel.value ? 1 - Math.exp(-delta / 0.035) : 1 - Math.exp(-delta / 0.11);
      channel.value += (target - channel.value) * response;
      const attack = Math.max(0, target - channel.previous);
      channel.previous = target;
      channel.baseline += (target - channel.baseline) * (1 - Math.exp(-delta / 0.32));
      if (channel.hit && attack > Math.max(0.06, channel.baseline * 0.3)) {
        channel.hitValue = Math.min(1, channel.hitValue + attack * 4.5);
      }
      channel.hitValue *= Math.exp(-delta / 0.13);
    }
    return this.channels;
  }
}

export const RACE_TRACK_AUDIO = '/audio/tracks/track_002.mp3';
