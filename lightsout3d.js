/* ============================================================
   LEVEL 6 — LIGHTS OUT in Three.js (WebGL)
   Texturierter Beton, SpotLight-Taschenlampe mit Schatten,
   Tiefen-Nebel, 3D-Props. Wird in einen Offscreen-WebGL-Buffer
   gerendert und über das p5-Canvas geblittet (HUD/Grain bleiben p5).
   Reuse aus background.js: EXPLORE, FLASH, WALK, lightsoutWall(),
   updateWalkWorld(). Bei Fehler: false -> 2D-Fallback.
   ============================================================ */
const L3 = { renderer:null, scene:null, cam:null, spot:null, w:0,h:0,
             dirty:true, failed:false, itemMeshes:[], exitSign:null };
const L3CFG = { CS:2.7, CH:3.0, EYE:1.6, HALF:22, FOV:74,
                fog:0.035, spot:6, ambient:0x10131c };

function lightsout3dInvalidate(){ L3.dirty=true; }

function l3CanvasTex(draw, repeat){
  const c=document.createElement('canvas'); c.width=c.height=256;
  draw(c.getContext('2d'));
  const t=new THREE.CanvasTexture(c); if(repeat){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } t.anisotropy=4;
  return t;
}
function l3Canvas(draw){ return l3CanvasTex(draw, true); }

// graffiti / cult-symbol decal (pre-mirrored so it reads correctly under the flipped projection)
function l3GraffitiTex(kind){
  return l3CanvasTex(x=>{
    x.clearRect(0,0,256,256);
    x.translate(128,128); x.scale(-1,1); x.rotate((Math.random()-0.5)*0.25);
    if(typeof kind==='string'){
      x.fillStyle='rgba(150,22,18,0.94)'; x.font='bold 58px monospace';
      x.textAlign='center'; x.textBaseline='middle'; x.fillText(kind,0,0);
      x.strokeStyle='rgba(120,16,14,0.6)'; x.lineWidth=3;
      const w=x.measureText(kind).width;
      for(let i=0;i<7;i++){ const dx=(Math.random()-0.5)*w; x.beginPath(); x.moveTo(dx,20); x.lineTo(dx,20+Math.random()*70); x.stroke(); }
    } else {
      x.strokeStyle='rgba(150,24,20,0.9)'; x.lineWidth=4;
      x.beginPath(); x.arc(0,0,72,0,7); x.stroke();                       // ring
      x.beginPath();                                                       // pentagram
      for(let i=0;i<5;i++){ const a=-Math.PI/2 + i*4*Math.PI/5; const px=Math.cos(a)*70, py=Math.sin(a)*70; i?x.lineTo(px,py):x.moveTo(px,py); }
      x.closePath(); x.stroke();
      x.lineWidth=2; for(let i=0;i<5;i++){ const a=-Math.PI/2+i*2*Math.PI/5; x.beginPath(); x.moveTo(0,0); x.lineTo(Math.cos(a)*72,Math.sin(a)*72); x.stroke(); }
    }
  }, false);
}
function l3ConcreteTex(base){
  return l3Canvas(x=>{
    x.fillStyle=base; x.fillRect(0,0,256,256);
    for(let i=0;i<9000;i++){ const v=(36+Math.random()*46)|0; x.fillStyle=`rgba(${v},${v},${v+3},0.5)`; x.fillRect(Math.random()*256,Math.random()*256,1,1); }
    x.strokeStyle='rgba(18,18,20,0.55)'; x.lineWidth=1;
    for(let i=0;i<7;i++){ x.beginPath(); let px=Math.random()*256,py=Math.random()*256; x.moveTo(px,py);
      for(let k=0;k<6;k++){ px+=(Math.random()-0.5)*70; py+=(Math.random()-0.5)*70; x.lineTo(px,py); } x.stroke(); }
    for(let i=0;i<9;i++){ x.fillStyle='rgba(16,14,10,0.16)'; x.beginPath(); x.arc(Math.random()*256,Math.random()*256,10+Math.random()*34,0,7); x.fill(); }
  });
}

function l3Ensure(W,H){
  if(typeof THREE==='undefined') return false;
  if(!L3.renderer){
    const r=new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
    r.setPixelRatio(1); r.setSize(W,H);
    r.shadowMap.enabled=true; r.shadowMap.type=THREE.PCFSoftShadowMap;
    L3.renderer=r; L3.w=W; L3.h=H;
    L3.cam=new THREE.PerspectiveCamera(L3CFG.FOV, W/H, 0.05, 80);
  } else if(L3.w!==W || L3.h!==H){
    L3.renderer.setSize(W,H); L3.cam.aspect=W/H; L3.cam.updateProjectionMatrix(); L3.w=W; L3.h=H;
  }
  return true;
}

function l3Build(){
  const CS=L3CFG.CS, CH=L3CFG.CH, HALF=L3CFG.HALF;
  const sc=new THREE.Scene();
  sc.background=new THREE.Color(0x000000);
  sc.fog=new THREE.FogExp2(0x000000, L3CFG.fog);
  sc.add(new THREE.AmbientLight(L3CFG.ambient, 0.7));

  const wallTex=l3ConcreteTex('#43433f'); wallTex.repeat.set(1.7,1.9);
  const floorTex=l3ConcreteTex('#2d2c29'); floorTex.repeat.set(HALF, HALF);
  const ceilTex=l3ConcreteTex('#36363a'); ceilTex.repeat.set(HALF*0.6, HALF*0.6);

  const wallMat=new THREE.MeshStandardMaterial({ map:wallTex, roughness:0.96, metalness:0.0 });
  const floorMat=new THREE.MeshStandardMaterial({ map:floorTex, roughness:1.0 });
  const ceilMat=new THREE.MeshStandardMaterial({ map:ceilTex, roughness:1.0 });

  // walls as instanced boxes from the floorplan grid
  const cells=[];
  for(let i=-HALF;i<=HALF;i++) for(let j=-HALF;j<=HALF;j++){ if(lightsoutWall(i,j)) cells.push([i*CS,j*CS]); }
  const inst=new THREE.InstancedMesh(new THREE.BoxGeometry(CS,CH,CS), wallMat, cells.length);
  inst.castShadow=true; inst.receiveShadow=true;
  const m=new THREE.Matrix4();
  cells.forEach((p,k)=>{ m.makeTranslation(p[0],CH/2,p[1]); inst.setMatrixAt(k,m); });
  inst.instanceMatrix.needsUpdate=true; sc.add(inst);

  const span=(HALF*2+1)*CS;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(span,span), floorMat);
  floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; sc.add(floor);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(span,span), ceilMat);
  ceil.rotation.x=Math.PI/2; ceil.position.y=CH; ceil.receiveShadow=true; sc.add(ceil);

  // base illumination — kept dim so the fluorescent panels read as the light source
  sc.add(new THREE.HemisphereLight(0xb9bccb, 0x2a2820, 0.5));
  const dir=new THREE.DirectionalLight(0xfff2d8, 0.18); dir.position.set(6,14,4); sc.add(dir);
  sc.add(L3.cam);

  l3BuildCeilingPanels(sc);
  l3BuildProps(sc); l3BuildItems(sc); l3BuildGraffiti(sc);
  // the horizontally-flipped projection (see l3Frame) reverses winding AND
  // corrupts Three's frustum test -> render double-sided + disable culling.
  sc.traverse(o=>{
    o.frustumCulled=false;
    if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(mm=>mm.side=THREE.DoubleSide); }
  });
  L3.scene=sc;
}

function l3BuildProps(sc){
  const matWood=new THREE.MeshStandardMaterial({color:0x6e4d2a,roughness:0.92});
  const matBox =new THREE.MeshStandardMaterial({color:0xb0905f,roughness:0.95});
  const matMet =new THREE.MeshStandardMaterial({color:0x4a4d52,roughness:0.55,metalness:0.45});
  const matShf =new THREE.MeshStandardMaterial({color:0x5b5d63,roughness:0.9});
  const matCone=new THREE.MeshStandardMaterial({color:0xe06a16,emissive:0x3a1400,roughness:0.7});
  for(const p of (WALK.props||[])){
    let mesh=null;
    if(p.type==='crate'){ mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),matWood); mesh.position.set(p.x,0.5,p.z); }
    else if(p.type==='boxes'){ mesh=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.8,1.1),matBox); mesh.position.set(p.x,0.4,p.z); }
    else if(p.type==='stack'){ mesh=new THREE.Group();
      const a=new THREE.Mesh(new THREE.BoxGeometry(1,0.9,1),matWood); a.position.y=0.45;
      const b=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.7,0.8),matWood); b.position.set(0.12,1.25,0.1);
      a.castShadow=b.castShadow=a.receiveShadow=b.receiveShadow=true; mesh.add(a,b); mesh.position.set(p.x,0,p.z); }
    else if(p.type==='barrel'){ mesh=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,1.1,16),matMet); mesh.position.set(p.x,0.55,p.z); }
    else if(p.type==='shelf'){ mesh=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.0,0.5),matShf); mesh.position.set(p.x,1.0,p.z); mesh.rotation.y=(p.x*0.4)%3; }
    else if(p.type==='cone'){ mesh=new THREE.Mesh(new THREE.ConeGeometry(0.28,0.6,16),matCone); mesh.position.set(p.x,0.3,p.z); }
    if(mesh){ mesh.castShadow=true; mesh.receiveShadow=true;
      if(mesh.children) mesh.children.forEach(o=>{o.castShadow=true;o.receiveShadow=true;});
      sc.add(mesh); }
  }
}

function l3BuildItems(sc){
  L3.itemMeshes=[]; L3.exitSign=null;
  for(const it of WALK.items){
    let mesh=null;
    if(it.type==='almond'){
      const mat=new THREE.MeshStandardMaterial({color:0xeae4c8,emissive:0x6a6038,emissiveIntensity:0.7,roughness:0.5});
      mesh=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.5,12),mat); mesh.position.set(it.x,0.4,it.z);
    } else if(it.type==='battery'){
      const mat=new THREE.MeshStandardMaterial({color:0x3a9a5c,emissive:0x126a30,emissiveIntensity:0.9,roughness:0.5});
      mesh=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.36,0.18),mat); mesh.position.set(it.x,0.25,it.z);
    } else if(it.type==='exit'){
      mesh=new THREE.Group();
      const door=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.2,0.16), new THREE.MeshStandardMaterial({color:0x101012,roughness:0.85}));
      door.position.y=1.1; door.castShadow=true;
      const sgnMat=new THREE.MeshStandardMaterial({color:0xd03c30,emissive:0xd03c30,emissiveIntensity:1.3});
      const sgn=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.3,0.06),sgnMat); sgn.position.set(0,2.1,0.12);
      mesh.add(door,sgn); mesh.position.set(it.x,0,it.z); L3.exitSign=sgnMat;
    } else continue;
    sc.add(mesh); L3.itemMeshes.push({it,mesh});
  }
}

// Backrooms fluorescent ceiling panels — grid of flat glowing fixtures, some flicker
function l3BuildCeilingPanels(sc){
  const CS=L3CFG.CS, CH=L3CFG.CH, R=16;
  const panelMat=new THREE.MeshStandardMaterial({color:0xfff6d8, emissive:0xfff2cf, emissiveIntensity:1.0});
  const geo=new THREE.BoxGeometry(1.5,0.06,0.55);
  const cells=[];
  for(let i=-R;i<=R;i+=2) for(let j=-R;j<=R;j+=2){ if(!lightsoutWall(i,j)) cells.push([i*CS,j*CS]); }
  // pick a few to flicker (own material + point light)
  L3.flickerPanels=[];
  const flickIdx=new Set(); const flickN=Math.min(5, cells.length);
  while(flickIdx.size<flickN) flickIdx.add((Math.random()*cells.length)|0);
  const steady=[];
  cells.forEach((c,idx)=>{
    if(flickIdx.has(idx)){
      const m=panelMat.clone(); const mesh=new THREE.Mesh(geo,m);
      mesh.position.set(c[0],CH-0.05,c[1]); sc.add(mesh);
      const pl=new THREE.PointLight(0xfff0cf, 0.8, 9, 1.2); pl.position.set(c[0],CH-0.4,c[1]); sc.add(pl);
      L3.flickerPanels.push({m,pl});
    } else steady.push(c);
  });
  // the rest as one cheap instanced mesh
  const inst=new THREE.InstancedMesh(geo, panelMat, steady.length);
  const mtx=new THREE.Matrix4();
  steady.forEach((c,k)=>{ mtx.makeTranslation(c[0],CH-0.05,c[1]); inst.setMatrixAt(k,mtx); });
  inst.instanceMatrix.needsUpdate=true; sc.add(inst);
  // a few steady point lights so the panels pool light on the floor
  for(let k=0;k<Math.min(5,steady.length);k++){ const c=steady[(k*7)%steady.length];
    sc.add(new THREE.PointLight(0xfff0cf, 0.5, 9, 1.3).translateX(c[0]).translateY(CH-0.4).translateZ(c[1])); }
}

function l3BuildGraffiti(sc){
  const CS=L3CFG.CS, HALF=L3CFG.HALF, off=CS/2+0.04, y=1.35;
  const words=['GET OUT','RUN','HELP','NO EXIT','TURN BACK','LEAVE','WHY'];
  let placed=0, tries=0;
  while(placed<11 && tries<500){
    tries++;
    const i=((Math.random()*(HALF*2-2))|0)-(HALF-1), j=((Math.random()*(HALF*2-2))|0)-(HALF-1);
    if(!lightsoutWall(i,j)) continue;
    const dirs=[];
    if(!lightsoutWall(i-1,j)) dirs.push('-x'); if(!lightsoutWall(i+1,j)) dirs.push('+x');
    if(!lightsoutWall(i,j-1)) dirs.push('-z'); if(!lightsoutWall(i,j+1)) dirs.push('+z');
    if(!dirs.length) continue;
    const dir=dirs[(Math.random()*dirs.length)|0];
    const tex=l3GraffitiTex(Math.random()<0.68 ? words[(Math.random()*words.length)|0] : 0);
    const mat=new THREE.MeshStandardMaterial({map:tex, transparent:true, roughness:1.0, side:THREE.DoubleSide, depthWrite:false});
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.0,1.5), mat);
    const X=i*CS, Z=j*CS;
    if(dir==='-x'){ pl.position.set(X-off,y,Z); pl.rotation.y=-Math.PI/2; }
    else if(dir==='+x'){ pl.position.set(X+off,y,Z); pl.rotation.y=Math.PI/2; }
    else if(dir==='-z'){ pl.position.set(X,y,Z-off); pl.rotation.y=Math.PI; }
    else { pl.position.set(X,y,Z+off); pl.rotation.y=0; }
    sc.add(pl); placed++;
  }
}

function l3Frame(p){
  // camera follows EXPLORE (movement/collision handled by updateExplore)
  L3.cam.position.set(EXPLORE.x, L3CFG.EYE, EXPLORE.z);
  L3.cam.lookAt(EXPLORE.x+Math.sin(EXPLORE.yaw), L3CFG.EYE, EXPLORE.z+Math.cos(EXPLORE.yaw));
  // flip projection X so screen-right == world-right (fix mirrored turn/strafe)
  L3.cam.updateProjectionMatrix();
  L3.cam.projectionMatrix.elements[0] *= -1;

  // items: hide collected, recolor exit when unlocked
  for(const o of L3.itemMeshes){
    if(o.it.type==='almond'||o.it.type==='battery') o.mesh.visible=!o.it.taken;
  }
  if(L3.exitSign){ const on=WALK.collected>=WALK.need;
    L3.exitSign.color.setHex(on?0x36e07a:0xd03c30); L3.exitSign.emissive.setHex(on?0x36e07a:0xd03c30); }

  // flickering fluorescent panels (buzz)
  if(L3.flickerPanels) for(const f of L3.flickerPanels){
    let lvl=1; if(Math.random()<0.06) lvl=Math.random()*0.5;
    f.m.emissiveIntensity=lvl; f.pl.intensity=0.8*lvl;
  }

  L3.renderer.render(L3.scene, L3.cam);
  // blit onto the p5 canvas, then p5 post-FX + HUD on top
  p.push(); p.drawingContext.drawImage(L3.renderer.domElement, 0,0, p.width, p.height); p.pop();
  applyGrain(p, BG.grain*0.55);
  applyVignette(p);
  drawWalkHUD(p, p.width/2, p.height/2);
  l3FoundFootage(p);
}

// VHS / found-footage overlay (PLAY, timestamp, date)
function l3FoundFootage(p){
  const W=p.width,H=p.height;
  p.push(); p.textFont('monospace');
  // scanline tint
  p.noStroke();
  // PLAY + REC
  p.fill(235,235,228); p.textSize(13); p.textAlign(LEFT,TOP);
  p.text('▶ PLAY', 18, 14);
  const blink=(Math.floor(frameCount/18)%2)===0;
  if(blink){ p.fill(210,40,36); p.ellipse(W-150,22,9,9); p.fill(220,210,205); p.textSize(11); p.textAlign(LEFT,CENTER); p.text('REC', W-140,22); }
  // timestamp bottom-left
  const tot=Math.floor(frameCount/30), mm=String(Math.floor(tot/60)%60).padStart(2,'0'), ss=String(tot%60).padStart(2,'0');
  p.fill(225,225,218); p.textSize(13); p.textAlign(LEFT,BOTTOM);
  p.text('PM 00:'+mm+':'+ss, 18, H-30);
  p.fill(180,178,170); p.textSize(11);
  p.text('MAR.07 1975', 18, H-14);
  p.pop();
}

function lightsout3dRender(p){
  if(L3.failed || typeof THREE==='undefined') return false;
  try{
    if(!l3Ensure(p.width,p.height)) return false;
    if(L3.dirty){ l3Build(); L3.dirty=false; }
    updateWalkWorld();
    l3Frame(p);
    return true;
  }catch(e){ console.warn('Lights Out 3D failed -> 2D fallback:', e); L3.failed=true; return false; }
}
