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
  const cw = Math.min(1400, host.clientWidth-2);
  const ch = Math.min(900, host.clientHeight-2);
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
  resizeCanvas(Math.min(1400,host.clientWidth-2), Math.min(900,host.clientHeight-2));
  ENT_cache=null;
}

function draw(){
  const t=frameCount*0.01;
  if(activeTab==='background'){
    if(EXPLORE.on && WALKABLE[BG.scene]){
      updateExplore();
      if(BG.scene==='lightsout' && typeof lightsout3dRender==='function' && lightsout3dRender(this)){ /* WebGL */ }
      else drawSceneWalk(this);
    }
    else drawBackground(this,t);
  } else if(activeTab==='entity'){
    if(ENT_VIEW!=='3d') drawEntity(this, mx, my);   // im 3D-Modus rendert entity3d.js sein eigenes Overlay-Canvas
  } else {
    drawAudioViz(this,t);
  }
}

function mouseMoved(){ mx=mouseX; my=mouseY; }

// Klick auf den Canvas startet das Spiel, wenn der HOW-TO-PLAY-Screen offen ist
function mousePressed(){
  if(EXPLORE.on && typeof WALK!=='undefined' && WALK.briefing &&
     mouseX>=0 && mouseX<=width && mouseY>=0 && mouseY<=height){
    startWalkGame();
  }
}

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
  bindEntity3D();
  bindAudio();
  vuLoop();
});

// ---------- boot ----------
function bootSequence(){
  $('#boot-enter').classList.add('show');
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
      syncEnt3DCanvas();   // 3D-Overlay nur im Entity-Tab (und nur im 3D-Modus) zeigen
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
  // Szenen-Chips: zwei Grids (SPIELBAR + ALLE BACKGROUNDS), active-State synchron
  const applyScene=name=>{
    exitExplore();
    bgApplyScene(name);
    syncBgUI();
    showSceneInfo(name);
    syncSceneChips();
    const s=BG_SCENES[name];
    if(s) setStatus('scene: LEVEL '+s.level+' — '+s.title);
    BG.seed=Math.floor(Math.random()*99999); noiseSeed(BG.seed); setSeed(BG.seed);
  };
  $all('#bg-scenes .chip, #bg-scenes-all .chip').forEach(b=>{
    b.addEventListener('click',()=>applyScene(b.dataset.preset));
  });

  // RANDOMIZE: zufällige Szene + alle Regler + Raumstruktur durchmischen
  $('#bg-regen').addEventListener('click',()=>{
    exitExplore();
    const names=Object.keys(BG_SCENES);
    bgApplyScene(names[(Math.random()*names.length)|0]);
    BG.hue=(Math.random()*360)|0;
    BG.depth=2+((Math.random()*13)|0);
    BG.light=0.15+Math.random()*0.75;
    BG.grain=Math.random()*0.8;
    BG.fog=Math.random()*0.7;
    const geos=['corridor','pillars','void','outdoor'];
    BG.geo=geos[(Math.random()*geos.length)|0];
    BG.seed=Math.floor(Math.random()*99999); noiseSeed(BG.seed); setSeed(BG.seed);
    syncBgUI(); showSceneInfo(BG.scene); syncSceneChips();
    setStatus('randomized background.');
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
    // start in an open cell (avoid spawning inside a wall/column)
    if(BG.scene==='habitable'){ EXPLORE.x=LOBBY_CS; EXPLORE.z=0; }
    else if(BG.scene==='lightsout'){ EXPLORE.x=2*LOBBY_CS; EXPLORE.z=2*LOBBY_CS; }   // room interior
    else { EXPLORE.x=0; EXPLORE.z=0; }
    EXPLORE.yaw=0; EXPLORE.keys={};
    FLASH.batt=1.0;
    generateWalkWorld();
    if(typeof monsterSpawn==='function') monsterSpawn();      // gespeichertes Monster ins Level setzen
    if(typeof lightsout3dInvalidate==='function') lightsout3dInvalidate();
    WALK.briefing=true;                                       // erst HOW TO PLAY lesen, dann START
    setStatus(BG.scene==='lightsout'
      ? '▶ LIGHTS OUT — find 3 keys in the dark. Batteries keep your light alive. Shine it at the thing hunting you.'
      : (SAVED_MONSTER ? '▶ EXPLORE — dein Monster ist im Level …' : '▶ EXPLORE — find 3 keys, then the EXIT'));
  } else { EXPLORE.keys={}; setStatus('exited walk mode.'); }
  setWalkBtn();
}
function exitExplore(){ if(EXPLORE.on){ EXPLORE.on=false; EXPLORE.keys={}; setWalkBtn(); setStatus('exited walk mode.'); } }
function bindExploreKeys(){
  const nav=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
  window.addEventListener('keydown',e=>{
    if(!EXPLORE.on) return;
    if(e.code==='Escape'){ exitExplore(); return; }
    // HOW-TO-PLAY-Screen: ENTER oder SPACE startet das Spiel
    if(WALK.briefing && (e.code==='Enter'||e.code==='Space')){ startWalkGame(); e.preventDefault(); return; }
    // Game Over (alle Szenen): R startet das Level neu
    if(WALK.dead && e.code==='KeyR'){ if(typeof restartWalk==='function') restartWalk(); e.preventDefault(); return; }
    EXPLORE.keys[e.code]=true;
    if(nav.includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup',e=>{ EXPLORE.keys[e.code]=false; });
}

// update the LEVEL plate + description for a scene
function showSceneInfo(name){ /* Beschreibungs-Panel entfernt — Name/Nummer stehen auf den Karten */ }
function syncBgUI(){
  $('#bg-hue').value=BG.hue; $('#bg-hue-v').textContent=Math.round(BG.hue);
  $('#bg-light').value=BG.light*100; $('#bg-light-v').textContent=BG.light.toFixed(2);
  $('#bg-grain').value=BG.grain*100; $('#bg-grain-v').textContent=BG.grain.toFixed(2);
  $('#bg-fog').value=BG.fog*100; $('#bg-fog-v').textContent=BG.fog.toFixed(2);
  $('#bg-depth').value=BG.depth; $('#bg-depth-v').textContent=BG.depth;
  // sync segs + scene chips
  $('#bg-geo').querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===BG.geo));
  syncSceneChips();
}
// active-Markierung in BEIDEN Szenen-Grids (SPIELBAR + ALLE BACKGROUNDS)
function syncSceneChips(){
  $all('#bg-scenes .chip, #bg-scenes-all .chip').forEach(b=>b.classList.toggle('active',b.dataset.preset===BG.scene));
}

// ============================================================
//  ENTITY CONTROLS
// ============================================================
// slider id -> {key, scale, fmt}
const ENT_SLIDERS = {
  'ent-size':  {key:'size',      scale:true,  fmt:v=>v.toFixed(2)},
  'ent-eyes':  {key:'eyes',      scale:false, fmt:v=>v|0},
  'ent-arms':  {key:'arms',      scale:false, fmt:v=>v|0},
  'ent-hue':   {key:'bodyHue',   scale:false, fmt:v=>Math.round(v)},
  'ent-light': {key:'bodyLight', scale:false, fmt:v=>Math.round(v)},
};

function bindEntity(){
  const dirty=()=>{ ENT.preset='custom'; };
  // range sliders
  for(const id in ENT_SLIDERS){
    const cfg=ENT_SLIDERS[id], el=$('#'+id), out=$('#'+id+'-v');
    if(!el) continue;
    el.addEventListener('input',()=>{
      let v=+el.value; if(cfg.scale) v=v/100;
      ENT[cfg.key]=v; if(out) out.textContent=cfg.fmt?cfg.fmt(v):v; dirty();
    });
  }
  // category dropdowns (data-key on each <select>)
  $all('.ent-sel').forEach(sel=>{
    sel.addEventListener('change',()=>{ ENT[sel.dataset.key]=sel.value; dirty(); setStatus(sel.dataset.key+': '+sel.value); });
  });
  // checkbox toggles (data-key on each input)
  ['ent-symmetry','ent-spikes','ent-parasites','ent-chains'].forEach(id=>{
    const el=$('#'+id); if(!el) return;
    el.addEventListener('change',()=>{ ENT[el.dataset.key]=el.checked; dirty(); });
  });
  // segmented controls
  bindSeg('ent-track',v=>{ENT.track=+v; $('#ent-track-v').textContent=v==='1'?'on':'off';});
  bindSeg('ent-render',v=>{ENT.render=v; setStatus('render: '+v);});

  bindChips('ent-presets',name=>{ entApplyPreset(name); syncEntUI(); setStatus('preset: '+name); });

  $('#ent-reset').addEventListener('click',()=>{
    entReset(); syncEntUI(); setStatus('entity geleert — bau sie neu auf.');
  });
  $('#ent-random').addEventListener('click',()=>{
    entRandomize(); syncEntUI(); setSeed(ENT.seed); setStatus('randomized entity.');
  });
  $('#ent-regen').addEventListener('click',()=>{
    ENT.seed=Math.floor(Math.random()*99999); setSeed(ENT.seed); setStatus('regenerated.');
  });
  $('#ent-save').addEventListener('click',()=>saveCanvasPNG('entity'));
  $('#ent-save-monster').addEventListener('click',saveMonster);

  syncEntUI();   // align controls with ENT defaults on load
}

// Button-Feedback: zeigt kurz "✓ GESPEICHERT", damit klar ist, dass es geklappt hat
function flashSavedBtn(sel){
  const b=$(sel); if(!b) return;
  if(b._savedTimer) clearTimeout(b._savedTimer);
  if(!b._origLabel) b._origLabel=b.textContent;
  b.textContent='SAVED';
  b.classList.add('saved');
  b._savedTimer=setTimeout(()=>{ b.textContent=b._origLabel; b.classList.remove('saved'); b._savedTimer=null; }, 2800);
}

// render the current entity to a transparent sprite + register it as the
// monster that appears in walk mode (background.js: SAVED_MONSTER / monsterSpawn)
let _monsterGfx = null;
function saveMonster(){
  if(typeof entIsEmpty==='function' && entIsEmpty()){ setStatus('leer — erst eine Entity bauen.'); return; }
  const SW=480, SH=660;
  const buf=createGraphics(SW,SH);
  buf.pixelDensity(1); buf.clear();
  drawEntity(buf, SW/2, SH*0.4, true);                 // spriteMode -> transparent, no FX
  // tight bounding box of the non-transparent pixels
  buf.loadPixels();
  const px=buf.pixels; let minX=SW,minY=SH,maxX=0,maxY=0,found=false;
  for(let y=0;y<SH;y++) for(let x=0;x<SW;x++){
    if(px[(y*SW+x)*4+3]>16){ found=true;
      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  }
  if(!found){ setStatus('nichts gezeichnet — Monster nicht gespeichert.'); buf.remove(); return; }
  if(_monsterGfx) _monsterGfx.remove();                // alten Sprite-Buffer freigeben
  _monsterGfx=buf;
  SAVED_MONSTER={ img:buf.canvas, box:{minX,minY,w:maxX-minX+1,h:maxY-minY+1} };
  if(EXPLORE.on && typeof monsterSpawn==='function') monsterSpawn();   // sofort sichtbar, falls schon im Walk
  flashSavedBtn('#ent-save-monster');
  setStatus('Monster gespeichert — erscheint im Walk-Modus (Background-Tab → ENTER LEVEL).');
}

// ============================================================
//  ENTITY 3D — vorgefertigte GLB-Modelle (entity3d.js, Katharina)
//  Umschalter EIGENBAU / 3D-MODELLE im Entity-Tab.
// ============================================================
let ENT_VIEW = 'build';        // 'build' = eigener Baukasten, '3d' = GLB-Viewer
let ENT3D_MODEL = 'bacteria';  // aktuell gewähltes Modell

// slider id -> ENT3D key (window.ENT3D wird von entity3d.js gelesen)
const E3_SLIDERS = {
  'e3-height': 'bodyHeight',
  'e3-width':  'bodyWidth',
  'e3-arms':   'addArms',
  'e3-legs':   'addLegs',
  'e3-eyes':   'eyes',
  'e3-hue':    'colorHue',
  'e3-sat':    'colorSat',
};

function syncEnt3DCanvas(){
  const c3=$('#ent3d-canvas'); if(!c3) return;
  c3.style.display = (activeTab==='entity' && ENT_VIEW==='3d') ? 'block' : 'none';
}

function setEntView(v){
  ENT_VIEW=v;
  $('#ent-build-controls').style.display = v==='3d' ? 'none' : '';
  $('#ent-3d-controls').style.display    = v==='3d' ? '' : 'none';
  syncEnt3DCanvas();
  if(v==='3d'){
    const c3=$('#ent3d-canvas');
    if(window.init3D){
      window.init3D(c3);                 // einmalig — init3D ignoriert weitere Aufrufe
      window.setModel3D(ENT3D_MODEL);
      setStatus('3D-Modell-Viewer — ziehen zum Drehen.');
    } else {
      setStatus('3D-Modul lädt noch … gleich nochmal klicken.');
    }
  } else {
    setStatus('Eigenbau-Modus — bau deine Entity.');
  }
}

function bindEntity3D(){
  bindSeg('ent-view', setEntView);

  // Modell-Chips (eigenes data-model-Attribut, daher nicht über bindChips)
  $all('#ent3d-models .chip').forEach(ch=>{
    ch.addEventListener('click',()=>{
      $all('#ent3d-models .chip').forEach(c=>c.classList.remove('active'));
      ch.classList.add('active');
      ENT3D_MODEL=ch.dataset.model;
      if(window.setModel3D) window.setModel3D(ENT3D_MODEL);
    });
  });

  // Parameter-Slider -> window.ENT3D + live anwenden
  for(const id in E3_SLIDERS){
    const el=$('#'+id), out=$('#'+id+'-v');
    if(!el) continue;
    el.addEventListener('input',()=>{
      window.ENT3D = window.ENT3D || {};
      window.ENT3D[E3_SLIDERS[id]] = +el.value;
      if(out) out.textContent=el.value;
      if(window.apply3DParams) window.apply3DParams();
    });
  }

  $('#ent3d-save-monster').addEventListener('click',save3DMonster);
}

// 3D-Modell als transparenten Sprite rendern und als Spiel-Monster
// registrieren (gleiches SAVED_MONSTER-System wie der Eigenbau).
function save3DMonster(){
  if(!window.getModelSpriteCanvas){ setStatus('3D-Modul lädt noch …'); return; }
  const src=window.getModelSpriteCanvas(ENT3D_MODEL);
  if(!src){ setStatus('Modell lädt noch — gleich nochmal versuchen.'); return; }
  // Snapshot (das Live-Canvas wird weiterverwendet)
  const snap=document.createElement('canvas');
  snap.width=src.width; snap.height=src.height;
  const g=snap.getContext('2d'); g.drawImage(src,0,0);
  // Bounding-Box der nicht-transparenten Pixel
  const d=g.getImageData(0,0,snap.width,snap.height).data;
  let minX=snap.width,minY=snap.height,maxX=0,maxY=0,found=false;
  for(let y=0;y<snap.height;y++) for(let x=0;x<snap.width;x++){
    if(d[(y*snap.width+x)*4+3]>16){ found=true;
      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  }
  if(!found){ setStatus('Sprite leer — Monster nicht gespeichert.'); return; }
  SAVED_MONSTER={ img:snap, box:{minX,minY,w:maxX-minX+1,h:maxY-minY+1} };
  if(EXPLORE.on && typeof monsterSpawn==='function') monsterSpawn();
  flashSavedBtn('#ent3d-save-monster');
  setStatus('3D-Monster gespeichert — erscheint im Walk-Mode (Background-Tab → ENTER LEVEL).');
}


function syncEntUI(){
  // sliders
  for(const id in ENT_SLIDERS){
    const cfg=ENT_SLIDERS[id], el=$('#'+id), out=$('#'+id+'-v'); if(!el) continue;
    const raw = cfg.scale ? ENT[cfg.key]*100 : ENT[cfg.key];
    el.value=raw; if(out) out.textContent=cfg.fmt?cfg.fmt(ENT[cfg.key]):ENT[cfg.key];
  }
  // dropdowns
  $all('.ent-sel').forEach(sel=>{ if(ENT[sel.dataset.key]!=null) sel.value=ENT[sel.dataset.key]; });
  // toggles
  ['ent-symmetry','ent-spikes','ent-parasites','ent-chains'].forEach(id=>{
    const el=$('#'+id); if(el) el.checked=!!ENT[el.dataset.key];
  });
  // segmented
  $('#ent-track').querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===String(ENT.track)));
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
