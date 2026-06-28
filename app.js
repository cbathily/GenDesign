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
    if(EXPLORE.on && WALKABLE[BG.scene]){ updateExplore(); drawSceneWalk(this); }
    else drawBackground(this,t);
  } else if(activeTab==='entity'){
    drawEntity(this, mx, my);
  } else {
    drawAudioViz(this,t);
  }
}

function mouseMoved(){ mx=mouseX; my=mouseY; }

// audio tab — reactive visualizer
function drawAudioViz(pg,t){
  pg.colorMode(RGB,255);
  pg.background(10,9,6);
  const W=pg.width,H=pg.height,cx=W/2,cy=H/2;

  // count active (and audibly playing) layers
  let active=0;
  if(typeof AUDIO_STATE!=='undefined' && AUDIO_STATE.layers){
    active=AUDIO_STATE.layers.filter((l,i)=>l && !AUDIO_STATE.muted[i]).length;
  }
  const lvl = active>0 ? 0.25 + active*0.18 + Math.random()*0.15 : 0.06;

  // ---- glow core ----
  const coreR = 70 + Math.sin(t*2)*8*lvl + active*10;
  const g = pg.drawingContext;
  g.save();
  const grad = g.createRadialGradient(cx,cy,0,cx,cy,coreR*2.4);
  grad.addColorStop(0, `rgba(244,227,107,${0.18+lvl*0.4})`);
  grad.addColorStop(0.5, `rgba(232,166,196,${0.08+lvl*0.18})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle=grad;
  g.fillRect(cx-coreR*2.4, cy-coreR*2.4, coreR*4.8, coreR*4.8);
  g.restore();

  // ---- concentric pulsing rings ----
  pg.noFill();
  for(let i=0;i<7;i++){
    const phase = t*1.6 + i*0.7;
    const r = 60 + i*48 + (active>0 ? Math.sin(phase)*18*lvl : Math.sin(phase)*3);
    const a = (130 - i*16) * (active>0 ? 1 : 0.5);
    // alternate ring colors yellow / pink
    if(i%2===0) pg.stroke(217,194,58, a);
    else        pg.stroke(232,166,196, a*0.8);
    pg.strokeWeight(i===0?2:1);
    pg.ellipse(cx,cy,r,r*0.78);
  }

  // ---- dual waveform (mirrored) ----
  for(let s=0;s<2;s++){
    pg.stroke(s===0?232:217, s===0?166:194, s===0?196:58, 200);
    pg.strokeWeight(2); pg.noFill();
    pg.beginShape();
    for(let x=0;x<=W;x+=4){
      const env = Math.sin((x/W)*Math.PI); // fade at edges
      const y = cy + (s===0?1:-1)*(
        Math.sin(x*0.018 + t*3)*40*lvl +
        Math.sin(x*0.052 + t*5)*18*lvl +
        (Math.random()-0.5)*8*lvl
      )*env;
      pg.vertex(x,y);
    }
    pg.endShape();
  }
  pg.noStroke();

  // ---- status text ----
  pg.fill(active>0?217:90, active>0?194:84, active>0?58:66);
  pg.textFont('monospace'); pg.textSize(15);
  const status = active>0 ? `● SIGNAL ACTIVE — ${active} layer(s)` : '○ signal idle';
  pg.text(status, 22, H-24);

  applyGrain(pg,0.12);
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
  bindChips('bg-scenes',name=>{
    exitExplore();
    bgApplyScene(name);
    syncBgUI();
    showSceneInfo(name);
    const s=BG_SCENES[name];
    if(s) setStatus('scene: LEVEL '+s.level+' — '+s.title);
    BG.seed=Math.floor(Math.random()*99999); noiseSeed(BG.seed); setSeed(BG.seed);
  });

  $('#bg-regen').addEventListener('click',()=>{
    BG.seed=Math.floor(Math.random()*99999); noiseSeed(BG.seed); setSeed(BG.seed);
    setStatus('regenerated.');
  });
  $('#bg-apply').addEventListener('click',()=>{
    interpretBgPrompt($('#bg-prompt').value);
  });
  $('#bg-save').addEventListener('click',()=>saveCanvasPNG('background'));

  const walkBtn=$('#bg-walk');
  if(walkBtn){
    walkBtn.addEventListener('click',()=>toggleExplore());
    bindExploreKeys();
  }
}

// ---------- LOBBY WALK MODE ----------
function setWalkBtn(){
  const b=$('#bg-walk'); if(!b) return;
  b.textContent = EXPLORE.on ? '■ EXIT WALK' : '▶ ENTER LEVEL · WALK';
  b.classList.toggle('walking', EXPLORE.on);
}
const WALKABLE = { lobby:1, habitable:1, lightsout:1 };
function toggleExplore(){
  if(!WALKABLE[BG.scene]){ setStatus('walk mode: Lobby, Habitable & Lights Out.'); return; }
  EXPLORE.on=!EXPLORE.on;
  if(EXPLORE.on){
    // habitable has a column on the (0,0) cell — start in an aisle
    EXPLORE.x = (BG.scene==='habitable') ? LOBBY_CS : 0;
    EXPLORE.z=0; EXPLORE.yaw=0; EXPLORE.keys={};
    FLASH.batt=1.0;
    generateWalkWorld();
    setStatus('▶ EXPLORE — find 3 Almond Water, then the EXIT');
  } else { EXPLORE.keys={}; setStatus('exited walk mode.'); }
  setWalkBtn();
}
function exitExplore(){ if(EXPLORE.on){ EXPLORE.on=false; EXPLORE.keys={}; setWalkBtn(); setStatus('exited walk mode.'); } }
function bindExploreKeys(){
  const nav=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
  window.addEventListener('keydown',e=>{
    if(!EXPLORE.on) return;
    if(e.code==='Escape'){ exitExplore(); return; }
    EXPLORE.keys[e.code]=true;
    if(nav.includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup',e=>{ EXPLORE.keys[e.code]=false; });
}

// crude but effective prompt -> parameter mapping
function interpretBgPrompt(txt){
  const t=txt.toLowerCase();
  // pick a scene from the prompt
  if(t.match(/ocean|deep ?water|abyss|thalasso|sea|underwater|drown/)) bgApplyScene('thalasso');
  else if(t.match(/pool|water|aquatic|flood|tile/))      bgApplyScene('pool');
  else if(t.match(/cave|rock|cavern|stalact|underground/)) bgApplyScene('cave');
  else if(t.match(/dark|black|lights ?out|flashlight|pitch/)) bgApplyScene('lightsout');
  else if(t.match(/hotel|door|carpet|corridor room|terror/)) bgApplyScene('hotel');
  else if(t.match(/office|cubicle|desk|work|monitor/))   bgApplyScene('office');
  else if(t.match(/electric|substation|transformer|spark|cable|power/)) bgApplyScene('substation');
  else if(t.match(/play|ball ?pit|kid|child|tube|rainbow/)) bgApplyScene('playplace');
  else if(t.match(/suburb|street|house|neighbo|outdoor|night/)) bgApplyScene('suburb');
  else if(t.match(/pipe|rust|machine|boiler|hot|steam/))  bgApplyScene('pipes');
  else if(t.match(/concrete|industrial|stair|habitable|grey|gray/)) bgApplyScene('habitable');
  else if(t.match(/pink|dream|pastel|rosa|nostalg/))      bgApplyScene('dreamcore');
  else                                                     bgApplyScene('lobby');

  // manual geometry override
  if(t.match(/pillar|column|säul/)) BG.geo='pillars';
  else if(t.match(/void|empty|leer/)) BG.geo='void';

  // mood tweaks layered on top of the scene defaults
  if(t.match(/fog|haze|mist|nebel/)) BG.fog=0.6;
  if(t.match(/dark|dim|deep|dunkel/)) BG.light=0.25;
  if(t.match(/bright|glow|hell/)) BG.light=0.85;
  if(t.match(/grain|vhs|old|retro/)) BG.grain=0.7;

  showSceneInfo(BG.scene);
  syncBgUI(); setStatus('interpreted: "'+txt.slice(0,28)+'"');
  BG.seed=Math.floor(Math.random()*99999); noiseSeed(BG.seed); setSeed(BG.seed);
}
// update the LEVEL plate + description for a scene
function showSceneInfo(name){
  const s=BG_SCENES[name]; if(!s) return;
  $('#bg-scene-level').innerHTML='<span class="lvl-tag">LEVEL '+s.level+'</span> '+s.title;
  $('#bg-scene-desc').textContent=s.desc;
}
function syncBgUI(){
  $('#bg-hue').value=BG.hue; $('#bg-hue-v').textContent=Math.round(BG.hue);
  $('#bg-light').value=BG.light*100; $('#bg-light-v').textContent=BG.light.toFixed(2);
  $('#bg-grain').value=BG.grain*100; $('#bg-grain-v').textContent=BG.grain.toFixed(2);
  $('#bg-fog').value=BG.fog*100; $('#bg-fog-v').textContent=BG.fog.toFixed(2);
  $('#bg-depth').value=BG.depth; $('#bg-depth-v').textContent=BG.depth;
  // sync segs + scene chips
  $('#bg-geo').querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===BG.geo));
  $('#bg-scenes').querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.preset===BG.scene));
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
//  AUDIO CONTROLS (Local Horror Atmosphere Mixer)
// ============================================================

function bindAudio(){
  // Audio initialization is handled by audio.js
  setStatus('horror mixer ready.');
}

// ============================================================
//  EXPORT
// ============================================================
function saveCanvasPNG(name){
  const ts=Date.now().toString().slice(-6);
  saveCanvas(pgCanvas, `liminal_${name}_${ts}`, 'png');
  setStatus('saved PNG.');
}
