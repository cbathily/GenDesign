/* ============================================================
   AUDIO GENERATOR  (Tone.js)
   Prozedurale Dreamcore/Backrooms-Atmosphäre:
   - Drone-Oszillatoren (base pitch)
   - 60Hz-ähnliches Summen / Buzz
   - gefiltertes Rauschen (noise floor)
   - großer Reverb (leerer Raum)
   - langsames Detune-Wobble
   - schimmernder Pad-Akkord
   ============================================================ */

const AUD = {
  pitch:60, hum:0.5, noise:0.25, verb:0.7, wob:0.2, pad:0.3,
  preset:'backrooms', running:false,
};

const AUD_PRESETS = {
  backrooms: {pitch:60,  hum:0.6, noise:0.3,  verb:0.7, wob:0.15, pad:0.2},
  dream:     {pitch:110, hum:0.2, noise:0.15, verb:0.85,wob:0.35, pad:0.6},
  dread:     {pitch:38,  hum:0.5, noise:0.2,  verb:0.9, wob:0.1,  pad:0.15},
  pool:      {pitch:90,  hum:0.25,noise:0.45, verb:0.95,wob:0.25, pad:0.4},
};

let _A = null; // node graph

function audApplyPreset(name){
  const p=AUD_PRESETS[name]; if(!p) return;
  Object.assign(AUD,p,{preset:name});
  if(AUD.running) audUpdate();
}

async function audStart(){
  await Tone.start();
  if(_A) return;

  const reverb = new Tone.Reverb({decay:8, wet:AUD.verb}).toDestination();
  const master = new Tone.Gain(0.0).connect(reverb);

  // --- drone: two detuned saw/sine oscillators ---
  const d1 = new Tone.Oscillator(AUD.pitch, 'sine').start();
  const d2 = new Tone.Oscillator(AUD.pitch*1.005, 'triangle').start();
  const droneGain = new Tone.Gain(0.5).connect(master);
  d1.connect(droneGain); d2.connect(droneGain);

  // --- hum/buzz: 60hz square through lowpass ---
  const hum = new Tone.Oscillator(AUD.pitch, 'square').start();
  const humFilt = new Tone.Filter(200,'lowpass');
  const humGain = new Tone.Gain(AUD.hum*0.12).connect(master);
  hum.connect(humFilt); humFilt.connect(humGain);

  // --- noise floor: brown noise, filtered ---
  const noise = new Tone.Noise('brown').start();
  const nFilt = new Tone.Filter(800,'lowpass');
  const nGain = new Tone.Gain(AUD.noise*0.18).connect(master);
  noise.connect(nFilt); nFilt.connect(nGain);

  // --- pad shimmer: chord via PolySynth, slow ---
  const pad = new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:'fatsine'},
    envelope:{attack:4, decay:2, sustain:0.8, release:6}
  });
  const padGain = new Tone.Gain(AUD.pad*0.08).connect(reverb);
  pad.connect(padGain);
  const padLoop = new Tone.Loop(time=>{
    const root=AUD.pitch*2;
    pad.triggerAttackRelease([root, root*1.2, root*1.5],'2m',time);
  }, '2m').start(0);

  // --- wobble LFO on drone detune ---
  const lfo = new Tone.LFO({frequency:0.08, min:-15, max:15}).start();
  lfo.connect(d2.detune);

  Tone.Transport.start();

  // fade master in
  master.gain.rampTo(0.5, 2);

  _A = {reverb,master,d1,d2,droneGain,hum,humFilt,humGain,
        noise,nFilt,nGain,pad,padGain,padLoop,lfo};
  AUD.running=true;
  audUpdate();
}

function audStop(){
  if(!_A) return;
  _A.master.gain.rampTo(0,1.2);
  setTimeout(()=>{
    try{
      _A.d1.stop();_A.d2.stop();_A.hum.stop();_A.noise.stop();
      _A.lfo.stop();_A.padLoop.stop();
      Tone.Transport.stop();
      _A.reverb.dispose();_A.master.dispose();
    }catch(e){}
    _A=null; AUD.running=false;
  },1300);
}

function audUpdate(){
  if(!_A) return;
  _A.d1.frequency.rampTo(AUD.pitch,0.3);
  _A.d2.frequency.rampTo(AUD.pitch*1.005,0.3);
  _A.hum.frequency.rampTo(AUD.pitch,0.3);
  _A.humGain.gain.rampTo(AUD.hum*0.12,0.2);
  _A.nGain.gain.rampTo(AUD.noise*0.18,0.2);
  _A.padGain.gain.rampTo(AUD.pad*0.08,0.3);
  _A.reverb.wet.rampTo(AUD.verb,0.4);
  _A.lfo.frequency.rampTo(0.05+AUD.wob*0.6,0.3);
  _A.lfo.min=-AUD.wob*40; _A.lfo.max=AUD.wob*40;
}

// drive the VU meter
function audLevel(){
  if(!_A) return 0;
  // rough proxy: combine gains + a little jitter
  const base=(AUD.hum*0.4+AUD.noise*0.4+0.4);
  return Math.min(1, base*(0.7+Math.random()*0.4));
}
