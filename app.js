/* ============================================================
   APP CONTROLLER
   - p5 sketch (renders active usecase into one canvas)
   - tab switching, control binding, prompt interpretation,
     boot sequence, PNG export
   ============================================================ */

let activeTab = 'background';
let pgCanvas;          // the p5 canvas
let mx=0,my=0;         // cursor in canvas space

// ---------- p5 sketch ----------
function setup(){
  const host=document.getElementById('canvas-host');
  const cw = Math.min(900, host.clientWidth-2);
  const ch = Math.min(620, host.clientHeight-2);
  const c=createCanvas(cw,ch);
  c.parent('canvas-host');
  pgCanvas=c;
  pixelDensity(1);
  colorMode(RGB,255);
  frameRate(30);
  noiseDetail(3,0.5);
  entBuildCache(this);
}

function windowResized(){
  const host=document.getElementById('canvas-host');
  resizeCanvas(Math.min(900,host.clientWidth-2), Math.min(620,host.clientHeight-2));
  ENT_cache=null;
}

function draw(){
  const t=frameCount*0.01;
  if(activeTab==='background'){
    drawBackground(this,t);
  } else if(activeTab==='entity'){
    drawEntity(this, mx, my);
  } else {
    drawAudioViz(this,t);
  }
}

function mouseMoved(){ mx=mouseX; my=mouseY; }

// audio tab gets a reactive visualizer
function drawAudioViz(pg,t){
  pg.colorMode(RGB,255);
  pg.background(10,9,6);
  const W=pg.width,H=pg.height,cy=H/2;
  const lvl=AUD.running?audLevel():0.05;
  // concentric ring "signal"
  pg.noFill();
  for(let i=0;i<6;i++){
    const r=80+i*60+ (AUD.running?Math.sin(t*2+i)*20*lvl:0);
    pg.stroke(217,194,58, 120-i*15);
    pg.ellipse(W/2,cy,r,r*0.7);
  }
  // waveform
  pg.stroke(232,166,196); pg.strokeWeight(2); pg.noFill();
  pg.beginShape();
  for(let x=0;x<W;x+=4){
    const y=cy + Math.sin(x*0.02 + t*3)*40*lvl
             + Math.sin(x*0.05 + t*5)*20*lvl*AUD.wob*4
             + (Math.random()-0.5)*8*AUD.noise*4*(AUD.running?1:0);
    pg.vertex(x,y);
  }
  pg.endShape();
  pg.noStroke();
  // status text
  pg.fill(138,132,104); pg.textFont('monospace'); pg.textSize(14);
  pg.text(AUD.running? '● SIGNAL ACTIVE — '+AUD.preset : '○ signal idle', 20, H-22);
  applyGrain(pg,0.15);
}

// ============================================================
//  UI WIRING
// ============================================================
function $(s){return document.querySelector(s);}
function $all(s){return document.querySelectorAll(s);}

window.addEventListener('DOMContentLoaded',()=>{
  bootSequence();
  bindTabs();
  bindBackground();
  bindEntity();
  bindAudio();
  vuLoop();
});

// ---------- boot ----------
function bootSequence(){
  const log=$('#boot-log');
  const lines=[
    '> initializing render core ......... ok',
    '> loading p5.js v1.9 .............. ok',
    '> loading tone.js audio engine .... ok',
    '> mounting palette: dreamcore ..... ok',
    '> calibrating liminal space .......',
    '> WARNING: reality coherence low',
    '> ready.',
  ];
  let i=0;
  const iv=setInterval(()=>{
    log.textContent += lines[i] + '\n';
    i++;
    if(i>=lines.length){
      clearInterval(iv);
      $('#boot-enter').classList.add('show');
    }
  },360);
  $('#boot-enter').addEventListener('click',()=>{
    $('#boot-screen').classList.add('gone');
  });
}

// ---------- tabs ----------
function bindTabs(){
  $all('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $all('.tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      activeTab=tab.dataset.tab;
      $all('.panel-page').forEach(p=>p.classList.remove('active'));
      $(`.panel-page[data-panel="${activeTab}"]`).classList.add('active');
      const labels={background:'SIGNAL // BACKGROUND',entity:'SIGNAL // ENTITY',audio:'SIGNAL // AUDIO'};
      $('#stage-label').textContent=labels[activeTab];
      setStatus(activeTab+' module loaded.');
    });
  });
}

function setStatus(s){ $('#stage-status').textContent=s; }
function setSeed(v){ $('#stage-seed').textContent=String(v).padStart(4,'0').slice(-4); }

// segmented helper
function bindSeg(id, cb){
  $(`#${id}`).querySelectorAll('.seg-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      $(`#${id}`).querySelectorAll('.seg-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); cb(b.dataset.v);
    });
  });
}
function bindChips(id, cb){
  $(`#${id}`).querySelectorAll('.chip').forEach(b=>{
    b.addEventListener('click',()=>{
      $(`#${id}`).querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); cb(b.dataset.preset);
    });
  });
}

// ============================================================
//  BACKGROUND CONTROLS
// ============================================================
function bindBackground(){
  const bind=(id,key,fmt)=>{
    const el=$('#'+id), out=$('#'+id+'-v');
    el.addEventListener('input',()=>{
      let v=+el.value;
      if(key==='light'||key==='grain'||key==='fog') v=v/100;
      BG[key]=v; out.textContent=fmt?fmt(v):v;
    });
  };
  bind('bg-hue','hue');
  bind('bg-depth','depth');
  bind('bg-light','light',v=>v.toFixed(2));
  bind('bg-grain','grain',v=>v.toFixed(2));
  bind('bg-fog','fog',v=>v.toFixed(2));

  bindSeg('bg-geo',v=>{BG.geo=v; setStatus('geometry: '+v);});
  bindChips('bg-presets',name=>{
    bgApplyPalette(name);
    $('#bg-hue').value=BG.hue; $('#bg-hue-v').textContent=BG.hue;
    setStatus('palette: '+name);
  });

  $('#bg-regen').addEventListener('click',()=>{
    BG.seed=Math.floor(Math.random()*99999); noiseSeed(BG.seed); setSeed(BG.seed);
    setStatus('regenerated.');
  });
  $('#bg-apply').addEventListener('click',()=>{
    interpretBgPrompt($('#bg-prompt').value);
  });
  $('#bg-save').addEventListener('click',()=>saveCanvasPNG('background'));
}

// crude but effective prompt -> parameter mapping
function interpretBgPrompt(txt){
  const t=txt.toLowerCase();
  if(t.match(/pink|balloon|ball ?room|rosa/)){ bgApplyPalette('ballroom'); }
  else if(t.match(/pool|water|blue|flood/)){ bgApplyPalette('poolrooms'); }
  else if(t.match(/rainbow|color|play|kid|child/)){ bgApplyPalette('rainbow'); }
  else { bgApplyPalette('backrooms'); }

  if(t.match(/pillar|column|maze|säul/)) BG.geo='pillars';
  else if(t.match(/void|empty|hall|room|leer/)) BG.geo='void';
  else BG.geo='corridor';

  if(t.match(/fog|haze|mist|nebel/)) BG.fog=0.6;
  if(t.match(/dark|dim|deep|dunkel/)) BG.light=0.25;
  if(t.match(/bright|glow|hell/)) BG.light=0.85;
  if(t.match(/grain|vhs|old|retro/)) BG.grain=0.7;

  syncBgUI(); setStatus('interpreted: "'+txt.slice(0,28)+'"');
  BG.seed=Math.floor(Math.random()*99999); noiseSeed(BG.seed); setSeed(BG.seed);
}
function syncBgUI(){
  $('#bg-hue').value=BG.hue; $('#bg-hue-v').textContent=Math.round(BG.hue);
  $('#bg-light').value=BG.light*100; $('#bg-light-v').textContent=BG.light.toFixed(2);
  $('#bg-grain').value=BG.grain*100; $('#bg-grain-v').textContent=BG.grain.toFixed(2);
  $('#bg-fog').value=BG.fog*100; $('#bg-fog-v').textContent=BG.fog.toFixed(2);
  // sync segs
  $('#bg-geo').querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===BG.geo));
  $('#bg-presets').querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.preset===BG.palette));
}

// ============================================================
//  ENTITY CONTROLS
// ============================================================
function bindEntity(){
  const rebuild=()=>{ENT_cache=null;};
  const bind=(id,key,fmt,scale)=>{
    const el=$('#'+id), out=$('#'+id+'-v');
    el.addEventListener('input',()=>{
      let v=+el.value; if(scale) v=v/100;
      ENT[key]=v; out.textContent=fmt?fmt(v):v; rebuild();
    });
  };
  bind('ent-mass','mass',v=>v.toFixed(2),true);
  bind('ent-limbs','limbs');
  bind('ent-limblen','limbLen',v=>v.toFixed(2),true);
  bind('ent-eyes','eyes');

  bindSeg('ent-track',v=>{ENT.track=+v; $('#ent-track-v').textContent=v==='1'?'on':'off';});
  bindSeg('ent-shape',v=>{ENT.shape=v; rebuild(); setStatus('silhouette: '+v);});
  bindSeg('ent-render',v=>{ENT.render=v; setStatus('render: '+v);});

  bindChips('ent-presets',name=>{
    entApplyPreset(name); syncEntUI(); rebuild(); setStatus('preset: '+name);
  });

  $('#ent-regen').addEventListener('click',()=>{
    ENT.seed=Math.floor(Math.random()*99999); rebuild(); setSeed(ENT.seed); setStatus('regenerated.');
  });
  $('#ent-apply').addEventListener('click',()=>interpretEntPrompt($('#ent-prompt').value));
  $('#ent-save').addEventListener('click',()=>saveCanvasPNG('entity'));
}

function interpretEntPrompt(txt){
  const t=txt.toLowerCase();
  if(t.match(/tall|long|watcher|thin|lang/)) ENT.shape='tall';
  else if(t.match(/blob|round|mass|fat/)) ENT.shape='blob';
  else if(t.match(/human|person|player|avatar|figur/)) ENT.shape='humanoid';

  const eyeM=t.match(/(\d+)\s*eye/); if(eyeM) ENT.eyes=Math.min(24,+eyeM[1]);
  else if(t.match(/many eye|eyed|augen|covered/)) ENT.eyes=14;
  else if(t.match(/one eye|single/)) ENT.eyes=1;

  if(t.match(/leg|limb|crawl|spider|arm/)) ENT.limbs=6;
  if(t.match(/thin|long limb|dünn/)) ENT.limbLen=0.95;
  if(t.match(/pixel|gameboy|1.?bit|dither/)) ENT.render='dither';
  else if(t.match(/photo|grain|polaroid|vhs/)) ENT.render='photo-grain';

  syncEntUI(); ENT_cache=null;
  ENT.seed=Math.floor(Math.random()*99999); setSeed(ENT.seed);
  setStatus('interpreted: "'+txt.slice(0,28)+'"');
}
function syncEntUI(){
  $('#ent-mass').value=ENT.mass*100; $('#ent-mass-v').textContent=ENT.mass.toFixed(2);
  $('#ent-limbs').value=ENT.limbs; $('#ent-limbs-v').textContent=ENT.limbs;
  $('#ent-limblen').value=ENT.limbLen*100; $('#ent-limblen-v').textContent=ENT.limbLen.toFixed(2);
  $('#ent-eyes').value=ENT.eyes; $('#ent-eyes-v').textContent=ENT.eyes;
  $('#ent-shape').querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===ENT.shape));
  $('#ent-render').querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===ENT.render));
  $('#ent-presets').querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.preset===ENT.preset));
}

// ============================================================
//  AUDIO CONTROLS
// ============================================================
function bindAudio(){
  const bind=(id,key,fmt)=>{
    const el=$('#'+id), out=$('#'+id+'-v');
    el.addEventListener('input',()=>{
      let v=+el.value;
      if(key!=='pitch') v=v/100;
      AUD[key]=v; out.textContent=fmt?fmt(v):v;
      audUpdate();
    });
  };
  bind('aud-pitch','pitch');
  bind('aud-hum','hum',v=>v.toFixed(2));
  bind('aud-noise','noise',v=>v.toFixed(2));
  bind('aud-verb','verb',v=>v.toFixed(2));
  bind('aud-wob','wob',v=>v.toFixed(2));
  bind('aud-pad','pad',v=>v.toFixed(2));

  bindChips('aud-presets',name=>{audApplyPreset(name); syncAudUI(); setStatus('audio preset: '+name);});

  $('#aud-toggle').addEventListener('click',async()=>{
    const btn=$('#aud-toggle');
    if(!AUD.running){
      btn.textContent='■ STOP SIGNAL'; btn.classList.add('playing');
      setStatus('audio engine starting...');
      await audStart();
      setStatus('● signal active.');
    } else {
      btn.textContent='▶ START SIGNAL'; btn.classList.remove('playing');
      audStop(); setStatus('signal stopped.');
    }
  });
}
function syncAudUI(){
  const m={pitch:'aud-pitch',hum:'aud-hum',noise:'aud-noise',verb:'aud-verb',wob:'aud-wob',pad:'aud-pad'};
  for(const k in m){
    const el=$('#'+m[k]); const out=$('#'+m[k]+'-v');
    if(k==='pitch'){el.value=AUD[k]; out.textContent=AUD[k];}
    else {el.value=AUD[k]*100; out.textContent=AUD[k].toFixed(2);}
  }
  $('#aud-presets').querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.preset===AUD.preset));
}

function vuLoop(){
  const bar=$('#aud-vu');
  setInterval(()=>{ bar.style.width=(audLevel()*100)+'%'; },80);
}

// ============================================================
//  EXPORT
// ============================================================
function saveCanvasPNG(name){
  const ts=Date.now().toString().slice(-6);
  saveCanvas(pgCanvas, `liminal_${name}_${ts}`, 'png');
  setStatus('saved PNG.');
}
