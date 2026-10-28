import { Announcer, readVoiceVolume, VOICES } from './announcer.js';
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
    this.audio.volume = 0.90;
    this.context = null;
    this.voiceVolume = readVoiceVolume();
    this.announcer = null;
    this.analyser = null;
    this.data = null;
    this.channels = Object.fromEntries(Object.entries(CHANNELS).map(([id, definition]) => [id, {
      ...definition, value: 0, previous: 0, hitValue: 0, baseline: 0,
    }]));
    this.engineOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    // SFX-variabler
    this.sfxBuffers = {};
    this.thrustSource = null;
    this.thrustGain = null;
  }

  async play() {
    if (!this.context) {
      this.context = new AudioContext();
      this.announcer = new Announcer(this.context, this.voiceVolume);
      for(const id of Object.keys(VOICES))void this.announcer.load(id);
      const source = this.context.createMediaElementSource(this.audio);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0;
      this.data = new Float32Array(this.analyser.frequencyBinCount);
      source.connect(this.analyser);
      this.analyser.connect(this.context.destination);
   /* this.engineOsc = this.context.createOscillator();
      this.engineFilter = this.context.createBiquadFilter();
      this.engineGain = this.context.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineFilter.type = 'lowpass';
      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.context.destination);
      this.engineOsc.start();
      this.engineGain.gain.value = 0;*/
      await this.loadSfx();
    }

    await this.context.resume();
    await this.audio.play();
  }
  // Uppdaterar motorns tonhöjd och volym baserat på skeppets hastighet
  /*
  updateEngine(speed, isBoosting, isRacing) {
    if (!this.context || !this.engineOsc) return;
    const t = this.context.currentTime;
    
    if (!isRacing) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.1);
      return;
    }

    // Högre fart = Ljusare ton och mer öppet filter
    const freq = 30 + speed * 1.5;
    const cutoff = 200 + speed * 8 + (isBoosting ? 1500 : 0);
    const vol = isBoosting ? 0.25 : (speed > 20 ? 0.15 : 0.05);

    this.engineOsc.frequency.setTargetAtTime(freq, t, 0.1);
    this.engineFilter.frequency.setTargetAtTime(cutoff, t, 0.1);
    this.engineGain.gain.setTargetAtTime(vol, t, 0.1);
  }

  // Spelar upp engångsljud (Pew, Ding, Krasch)
  playSfx(type) {
    if (!this.context) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.context.destination);

    if (type === 'boost') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.3); // Snabbt stigande ton
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'checkpoint') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1108.73, t); // C#6 (Ljust pling)
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (type === 'crash') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + 0.2); // Låg, mörk duns
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }
*/
// Laddar in och avkodar ljudfilerna
  async loadSfx() {
    const files = {
      boost: '/audio/sfx/boost.wav',
      crash: '/audio/sfx/collision.wav',
      thrust: '/audio/sfx/thrust.wav',
      countdownThree: '/audio/voice/three-cyborg.wav',
      countdownTwo: '/audio/voice/two-cyborg.wav',
      countdownOne: '/audio/voice/one-cyborg.wav',
      countdownGo: '/audio/voice/go-cyborg.wav'
    };

    for (const [name, url] of Object.entries(files)) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.sfxBuffers[name] = await this.context.decodeAudioData(arrayBuffer);
      } catch (e) {
        console.warn(`Kunde inte ladda SFX: ${url}`, e);
      }
    }

    // Starta motorloopen när ljudet är laddat
    this.startThrustLoop();
  }

  // Sätter upp motorljudet (thrust.wav) med den exakta loopen
  startThrustLoop() {
    if (!this.sfxBuffers.thrust) return;

    this.thrustSource = this.context.createBufferSource();
    this.thrustSource.buffer = this.sfxBuffers.thrust;
    
    // Aktivera loop mellan sekund 1 och 2!
    this.thrustSource.loop = true;
    this.thrustSource.loopStart = 1.0; 
    this.thrustSource.loopEnd = 2.0;

    this.thrustGain = this.context.createGain();
    this.thrustGain.gain.value = 0;

    this.thrustSource.connect(this.thrustGain);
    this.thrustGain.connect(this.context.destination);
    this.thrustSource.start();
  }

  // Uppdaterar motorns pitch och volym
updateEngine(speed, isBoosting, isRacing) {
    if (!this.context || !this.thrustSource || !this.thrustGain) return;
    const t = this.context.currentTime;
    
    if (!isRacing) {
      this.thrustGain.gain.setTargetAtTime(0, t, 0.1);
      return;
    }

    // Modulera pitch (playbackRate) och volym baserat på hastighet
    // En playbackRate på 1.0 är originalljudet. Vi pitchar upp när du kör snabbare.
    const rate = 0.6 + (speed / 100) * 0.8 + (isBoosting ? 0.4 : 0);
    const vol = isBoosting ? 0.8 : (speed > 20 ? 0.5 : 0.0);

    this.thrustSource.playbackRate.setTargetAtTime(rate, t, 0.1);
    this.thrustGain.gain.setTargetAtTime(vol, t, 0.1);
  }

 shipPlayerUpdateSfx( ship )
 {
    if (!this.context || !this.thrustSource || !this.thrustGain) return;
    const rate = 0.6 + (speed / 100) * 0.8 + (isBoosting ? 0.4 : 0);
    const vol = isBoosting ? 0.8 : (speed > 20 ? 0.5 : 0.0);
  	this.thrustGain.gain.value = THREE.MathUtils.clamp(vol, 0, 0.6);
	  this.thrustSource.playbackRate.value = 0.5 + rate * 1.25;
 }

  // Spelar upp engångsljud (boost och kollision)
  playSfx(type) {
    if (!this.context) return;
    
    // Använd wav-filerna för boost och krasch
    if (this.sfxBuffers[type]) {
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      
      source.buffer = this.sfxBuffers[type];
      
      // Justera volymen för effekterna lite om det behövs
      gain.gain.value = type === 'crash' ? 0.8 : 0.6;
      const countdown=type.startsWith('countdown');
      if(countdown){gain.gain.value=1;this.announcer.countdown(source.buffer.duration);}
      
      source.connect(gain);
      gain.connect(countdown?this.announcer.gain:this.context.destination);
      source.start();
    } 
    // Behåll det syntetiska ljudet för checkpoints tills du laddar ner en fil för det
    else if (type === 'checkpoint') {
      const t = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1108.73, t); // C#6 pling
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    }
  }

  playCombatAlert(type) {
    if(!this.context || this.context.state!=='running')return;
    const t=this.context.currentTime, osc=this.context.createOscillator(),gain=this.context.createGain();
    const frequency={incoming:1000,targeted:520,deflected:760,flare:260,pickup:880}[type]??520;
    osc.type='sine';osc.frequency.setValueAtTime(frequency,t);
    osc.frequency.exponentialRampToValueAtTime(['deflected','pickup'].includes(type)?1200:type==='flare'?90:frequency*0.65,t+0.18);
    gain.gain.setValueAtTime(0.0001,t);gain.gain.exponentialRampToValueAtTime(0.10,t+0.015);gain.gain.exponentialRampToValueAtTime(0.001,t+0.22);
    osc.connect(gain);gain.connect(this.context.destination);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+0.23);
  }

  playWeapon(type, volume = 1) {
    if (!this.context || this.context.state !== 'running') return;
    const t=this.context.currentTime, duration=type==='minigun'?0.055:0.18;
    const oscillator=this.context.createOscillator(), gain=this.context.createGain();
    oscillator.type=type==='minigun'?'triangle':'sawtooth';
    oscillator.frequency.setValueAtTime(type==='homing'?680:type==='minigun'?320:210,t);
    oscillator.frequency.exponentialRampToValueAtTime(55,t+duration);
    gain.gain.setValueAtTime(0.065*volume,t);gain.gain.exponentialRampToValueAtTime(0.001,t+duration);
    oscillator.connect(gain);gain.connect(this.context.destination);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    oscillator.start(t);oscillator.stop(t+duration);
  }

  announce(id) { return this.announcer?.say(id); }
  setVoiceVolume(value) { this.voiceVolume=value;this.announcer?.setVolume(value); }

  stop() {
    this.announcer?.clear();
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


