/* ============================================================
   AUDIO GENERATOR  (Tone.js)
   - Drone-Oszillatoren + Wobble-LFO
   - 60Hz-Summen / Buzz
   - gefiltertes Rauschen
   - großer Reverb
   - schimmernder Pad-Akkord
   - prozedurale Melodie: Creepy ↔ Dreamcore
   ============================================================ */

const AUD = {
  pitch:60, hum:0.5, noise:0.25, verb:0.7, wob:0.2, pad:0.3,
  melody:0.45, mood:0.25, speed:0.4,
  preset:'backrooms', running:false,
};

const AUD_PRESETS = {
  backrooms: {pitch:60,  hum:0.6, noise:0.3,  verb:0.7,  wob:0.15, pad:0.2,  melody:0.3,  mood:0.1,  speed:0.3},
  dream:     {pitch:110, hum:0.2, noise:0.15, verb:0.85, wob:0.35, pad:0.6,  melody:0.75, mood:0.9,  speed:0.55},
  dread:     {pitch:38,  hum:0.5, noise:0.2,  verb:0.9,  wob:0.1,  pad:0.15, melody:0.5,  mood:0.0,  speed:0.2},
  pool:      {pitch:90,  hum:0.25,noise:0.45, verb:0.95, wob:0.25, pad:0.4,  melody:0.55, mood:0.5,  speed:0.45},
};

// Semitone offsets above root — 3 Stimmungsstufen
const _MEL_SCALES = [
  [0, 1, 3, 6, 8, 10],         // creepy:  Phrygisch + Tritonus-Spannung
  [0, 2, 3, 5, 7, 8, 10],      // liminal: natürliches Moll
  [0, 2, 4, 7, 9, 12, 14],     // dreamcore: Dur-Pentatonik + Oktaverweiterung
];

let _A = null;

function audApplyPreset(name){
  const p = AUD_PRESETS[name]; if(!p) return;
  Object.assign(AUD, p, {preset:name});
  if(AUD.running) audUpdate();
}

function _melNotes(){
  const root = AUD.pitch * 2;
  const tier = AUD.mood < 0.35 ? 0 : AUD.mood < 0.65 ? 1 : 2;
  return _MEL_SCALES[tier].map(s => root * Math.pow(2, s / 12));
}

function _melInterval(){
  const steps = ['2m','1m','2n.','2n','4n','8n'];
  return steps[Math.round((1 - AUD.speed) * (steps.length - 1))];
}

function _melDur(){
  return AUD.mood < 0.35 ? '16n' : AUD.mood < 0.65 ? '8n' : '4n';
}

async function audStart(){
  await Tone.start();
  if(_A) return;

  const reverb  = new Tone.Reverb({decay:8, wet:AUD.verb}).toDestination();
  const master  = new Tone.Gain(0.0).connect(reverb);

  // --- drone ---
  const d1 = new Tone.Oscillator(AUD.pitch, 'sine').start();
  const d2 = new Tone.Oscillator(AUD.pitch * 1.005, 'triangle').start();
  const droneGain = new Tone.Gain(0.5).connect(master);
  d1.connect(droneGain); d2.connect(droneGain);

  // --- hum/buzz ---
  const hum     = new Tone.Oscillator(AUD.pitch, 'square').start();
  const humFilt = new Tone.Filter(200, 'lowpass');
  const humGain = new Tone.Gain(AUD.hum * 0.12).connect(master);
  hum.connect(humFilt); humFilt.connect(humGain);

  // --- noise floor ---
  const noise = new Tone.Noise('brown').start();
  const nFilt = new Tone.Filter(800, 'lowpass');
  const nGain = new Tone.Gain(AUD.noise * 0.18).connect(master);
  noise.connect(nFilt); nFilt.connect(nGain);

  // --- pad shimmer ---
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator:{type:'fatsine'},
    envelope:{attack:4, decay:2, sustain:0.8, release:6}
  });
  const padGain = new Tone.Gain(AUD.pad * 0.08).connect(reverb);
  pad.connect(padGain);
  const padLoop = new Tone.Loop(time => {
    const root = AUD.pitch * 2;
    pad.triggerAttackRelease([root, root * 1.2, root * 1.5], '2m', time);
  }, '2m').start(0);

  // --- wobble LFO ---
  const lfo = new Tone.LFO({frequency:0.08, min:-15, max:15}).start();
  lfo.connect(d2.detune);

  // --- MELODIE ---
  // Filtert dunkel (creepy) → hell (dreamcore)
  const melFilt = new Tone.Filter(600, 'lowpass').connect(master);
  // Ping-Pong-Delay für Dreamcore-Shimmer (wet=0 bei creepy)
  const melDelay = new Tone.PingPongDelay({
    delayTime:'8n.', feedback:0.32, wet:0
  }).connect(melFilt);
  const melGain  = new Tone.Gain(AUD.melody * 0.18).connect(melDelay);
  const melSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator:{type:'triangle'},
    envelope:{attack:0.05, decay:0.4, sustain:0.3, release:1.5}
  });
  melSynth.connect(melGain);

  const melLoop = new Tone.Loop(time => {
    // creepy → sehr sparsame Noten (oft Stille)
    if(AUD.mood < 0.3 && Math.random() > 0.35) return;
    const notes = _melNotes();
    const pick  = () => notes[Math.floor(Math.random() * notes.length)];
    melSynth.triggerAttackRelease(pick(), _melDur(), time);
    // dreamcore → gelegentlich zweite Note für Harmonik
    if(AUD.mood > 0.6 && Math.random() > 0.5){
      const offset = Tone.Time('32n').toSeconds();
      melSynth.triggerAttackRelease(pick(), _melDur(), time + offset);
    }
  }, _melInterval()).start('+1m');

  Tone.Transport.start();
  master.gain.rampTo(0.5, 2);

  _A = {
    reverb, master,
    d1, d2, droneGain,
    hum, humFilt, humGain,
    noise, nFilt, nGain,
    pad, padGain, padLoop,
    lfo,
    melSynth, melGain, melDelay, melFilt, melLoop,
  };
  AUD.running = true;
  audUpdate();
}

function audStop(){
  if(!_A) return;
  _A.master.gain.rampTo(0, 1.2);
  setTimeout(() => {
    try{
      _A.d1.stop(); _A.d2.stop(); _A.hum.stop(); _A.noise.stop();
      _A.lfo.stop(); _A.padLoop.stop(); _A.melLoop.stop();
      Tone.Transport.stop();
      _A.reverb.dispose(); _A.master.dispose();
      _A.melDelay.dispose(); _A.melFilt.dispose();
    }catch(e){}
    _A = null; AUD.running = false;
  }, 1300);
}

function audUpdate(){
  if(!_A) return;

  // Atmosphäre
  _A.d1.frequency.rampTo(AUD.pitch, 0.3);
  _A.d2.frequency.rampTo(AUD.pitch * 1.005, 0.3);
  _A.hum.frequency.rampTo(AUD.pitch, 0.3);
  _A.humGain.gain.rampTo(AUD.hum   * 0.12, 0.2);
  _A.nGain.gain.rampTo(AUD.noise   * 0.18, 0.2);
  _A.padGain.gain.rampTo(AUD.pad   * 0.08, 0.3);
  _A.reverb.wet.rampTo(AUD.verb, 0.4);
  _A.lfo.frequency.rampTo(0.05 + AUD.wob * 0.6, 0.3);
  _A.lfo.min = -AUD.wob * 40; _A.lfo.max = AUD.wob * 40;

  // Melodie — morpht mit mood
  const m = AUD.mood;
  _A.melGain.gain.rampTo(AUD.melody * 0.18, 0.3);
  // Filter: dunkel+dumpf (creepy) → offen+hell (dreamcore)
  _A.melFilt.frequency.rampTo(300 + m * 5500, 0.5);
  // Ping-Pong-Delay nur bei dreamcore
  _A.melDelay.wet.rampTo(m * 0.48, 0.5);
  // Tempo
  _A.melLoop.interval = _melInterval();
  // Envelope: kurze Stabs (creepy) → lange schwebende Noten (dreamcore)
  _A.melSynth.set({
    envelope:{
      attack:  0.02 + m * 2.8,
      decay:   0.3  + m * 0.6,
      sustain: 0.1  + m * 0.7,
      release: 0.6  + m * 5.5,
    }
  });
}

function audLevel(){
  if(!_A) return 0;
  const base = (AUD.hum * 0.3 + AUD.noise * 0.3 + AUD.melody * 0.3 + 0.3);
  return Math.min(1, base * (0.7 + Math.random() * 0.4));
}
