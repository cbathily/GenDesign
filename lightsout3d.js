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
                fog:0.020, spot:6, ambient:0x10131c };

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
  sc.add(new THREE.AmbientLight(0x2a3242, 0.32));   // low base → dark surroundings, bright torch pool = game-like contrast

  const wallTex=l3ConcreteTex('#4d4d47'); wallTex.repeat.set(1.7,1.9);
  const floorTex=l3ConcreteTex('#3a3832'); floorTex.repeat.set(HALF, HALF);
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

  sc.add(L3.cam);
  // FLASHLIGHT — a bright point light carried at the player's head lights the real 3D
  // surfaces all around (SpotLight refused to contribute in this setup); the directional
  // "beam" look is then painted as a radial cone mask in p5 over the blit (see l3Frame).
  const torch=new THREE.PointLight(0xfff0d4, 14.0, 38, 0.4); sc.add(torch); L3.nearLight=torch; L3.torchBase=14.0;
  // a second, tighter warm pool just ahead so the floor/wall the player faces reads brightest
  const fwdPool=new THREE.PointLight(0xfff3de, 7.0, 24, 0.5); sc.add(fwdPool); L3.fwdPool=fwdPool; L3.poolBase=7.0;

  l3BuildCeilingPanels(sc);
  l3BuildProps(sc); l3BuildItems(sc); l3BuildGraffiti(sc);
  l3BuildCodeMarks(sc); l3BuildStalker(sc);
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

// label wrap for the Almond Water bottle (cream ground, red script, gold ORIGINAL band)
function l3AlmondLabelTex(){
  return l3CanvasTex(x=>{
    x.fillStyle='#f1eccf'; x.fillRect(0,0,256,256);
    x.translate(128,128); x.scale(-1,1); x.translate(-128,-128);   // pre-mirror for the flipped projection
    x.textAlign='center';
    x.fillStyle='#9c4a2a'; x.font='bold 46px Georgia';       x.fillText('Almond', 128, 92);
    x.fillStyle='#9c4a2a'; x.font='italic bold 34px Georgia'; x.fillText('Water', 128, 134);
    x.fillStyle='#b59640'; x.fillRect(0,168,256,30);              // gold band
    x.fillStyle='#2e2410'; x.font='bold 18px monospace';     x.fillText('· ORIGINAL ·', 128, 190);
  }, false);
}
// iconic Almond Water bottle to match the lobby item: cream body, silver cap, script
// label + gold band. Faintly emissive so it still reads as a glowing collectible in the dark.
function l3AlmondBottle(){
  const g=new THREE.Group();
  const cream =new THREE.MeshStandardMaterial({color:0xeae3c0, emissive:0x2c2a18, emissiveIntensity:0.5, roughness:0.45});
  const silver=new THREE.MeshStandardMaterial({color:0xb9b9c0, emissive:0x1e1e22, emissiveIntensity:0.3, roughness:0.35, metalness:0.5});
  const label =new THREE.MeshStandardMaterial({map:l3AlmondLabelTex(), emissive:0x3a3622, emissiveIntensity:0.55, roughness:0.7});
  const body    =new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.115,0.30,18), cream);  body.position.y=0.15;
  const shoulder=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.11,0.08,18), cream);   shoulder.position.y=0.34;
  const neck    =new THREE.Mesh(new THREE.CylinderGeometry(0.042,0.05,0.06,16), cream);  neck.position.y=0.41;
  const cap     =new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.06,16), silver);  cap.position.y=0.46;
  const labelM  =new THREE.Mesh(new THREE.CylinderGeometry(0.118,0.122,0.17,22,1,true), label); labelM.position.y=0.15;
  g.add(body,shoulder,neck,cap,labelM);
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  return g;
}

function l3BuildItems(sc){
  L3.itemMeshes=[]; L3.exitSign=null;
  for(const it of WALK.items){
    let mesh=null;
    if(it.type==='almond'){
      mesh=l3AlmondBottle(); mesh.position.set(it.x,0,it.z);
    } else if(it.type==='battery'){
      const mat=new THREE.MeshStandardMaterial({color:0x3a9a5c,emissive:0x126a30,emissiveIntensity:0.9,roughness:0.5});
      mesh=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.36,0.18),mat); mesh.position.set(it.x,0.25,it.z);
    } else if(it.type==='exit'){
      mesh=new THREE.Group();
      const frame=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.5,0.18), new THREE.MeshStandardMaterial({color:0x1a1a1d,roughness:0.8}));
      frame.position.y=1.25;
      const door=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.25,0.12), new THREE.MeshStandardMaterial({color:0x0c0c0e,roughness:0.85}));
      door.position.set(0,1.13,0.05); door.castShadow=true;
      // big EXIT sign above the door (red, turns green when unlocked) + white EXIT lettering
      const sgnMat=new THREE.MeshStandardMaterial({color:0xd03c30,emissive:0xd03c30,emissiveIntensity:1.2});
      const sgn=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,0.08),sgnMat); sgn.position.set(0,2.62,0.12);
      const txt=new THREE.Mesh(new THREE.PlaneGeometry(1.36,0.42),
        new THREE.MeshStandardMaterial({map:l3ExitTextTex(), emissive:0xffffff, emissiveIntensity:1.2, transparent:true, depthWrite:false}));
      txt.position.set(0,2.62,0.17);
      // a second big EXIT painted across the door itself
      const door2=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.5),
        new THREE.MeshStandardMaterial({map:l3ExitTextTex(), emissive:0xe8e2c8, emissiveIntensity:0.5, transparent:true, depthWrite:false}));
      door2.position.set(0,1.5,0.12);
      // keypad box on the door frame (glows; pulses when you're near; green when unlocked)
      const kpMat=new THREE.MeshStandardMaterial({color:0x16201a,emissive:0xffcc33,emissiveIntensity:0.6});
      const kp=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.42,0.08),kpMat); kp.position.set(1.0,1.2,0.16);
      mesh.add(frame,door,sgn,txt,door2,kp); mesh.position.set(it.x,0,it.z); L3.exitSign=sgnMat; L3.keypadMat=kpMat;
    } else continue;
    sc.add(mesh); L3.itemMeshes.push({it,mesh});
  }
}

// ceiling fixtures — mostly DEAD (dark), a few dying lamps flicker faintly in the distance
function l3BuildCeilingPanels(sc){
  const CS=L3CFG.CS, CH=L3CFG.CH, R=16;
  const deadMat=new THREE.MeshStandardMaterial({color:0x2a2a2e, emissive:0x000000, roughness:0.9});
  const geo=new THREE.BoxGeometry(1.5,0.06,0.55);
  const cells=[];
  for(let i=-R;i<=R;i+=2) for(let j=-R;j<=R;j+=2){ if(!lightsoutWall(i,j)) cells.push([i*CS,j*CS]); }
  // a few dying lamps that flicker (own material + weak local light)
  L3.flickerPanels=[];
  const flickIdx=new Set(); const flickN=Math.min(4, cells.length);
  while(flickIdx.size<flickN) flickIdx.add((Math.random()*cells.length)|0);
  const steady=[];
  cells.forEach((c,idx)=>{
    if(flickIdx.has(idx)){
      const m=new THREE.MeshStandardMaterial({color:0xfff6d8, emissive:0xfff2cf, emissiveIntensity:0.9});
      const mesh=new THREE.Mesh(geo,m); mesh.position.set(c[0],CH-0.05,c[1]); sc.add(mesh);
      const pl=new THREE.PointLight(0xfff0cf, 0.5, 7, 1.4); pl.position.set(c[0],CH-0.4,c[1]); sc.add(pl);
      L3.flickerPanels.push({m,pl});
    } else steady.push(c);
  });
  // the rest as one cheap instanced mesh of dead fixtures (revealed by the flashlight)
  const inst=new THREE.InstancedMesh(geo, deadMat, steady.length);
  const mtx=new THREE.Matrix4();
  steady.forEach((c,k)=>{ mtx.makeTranslation(c[0],CH-0.05,c[1]); inst.setMatrixAt(k,mtx); });
  inst.instanceMatrix.needsUpdate=true; sc.add(inst);
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

// big white "EXIT" lettering (wide canvas so it isn't squished); pre-mirrored for the flip
function l3ExitTextTex(){
  const c=document.createElement('canvas'); c.width=512; c.height=160;
  const x=c.getContext('2d');
  x.clearRect(0,0,512,160);
  x.translate(256,80); x.scale(-1,1); x.translate(-256,-80);
  x.fillStyle='#ffffff'; x.textAlign='center'; x.textBaseline='middle';
  x.font='bold 120px "Arial Black", Arial, sans-serif';
  x.fillText('EXIT', 256, 90);
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t;
}
// glowing amber code plate: shows its slot (#1..#4) and the digit to enter at the door
function l3CodeTex(pos, digit){
  return l3CanvasTex(x=>{
    x.clearRect(0,0,256,256);
    x.translate(128,128); x.scale(-1,1); x.translate(-128,-128);   // pre-mirror for flipped projection
    x.fillStyle='rgba(14,10,4,0.82)'; x.fillRect(28,28,200,200);
    x.strokeStyle='rgba(255,196,86,0.95)'; x.lineWidth=5; x.strokeRect(28,28,200,200);
    x.fillStyle='rgba(255,205,110,0.98)'; x.textAlign='center'; x.textBaseline='middle';
    x.font='bold 150px monospace'; x.fillText(digit, 128, 150);
    x.font='bold 30px monospace'; x.fillText('CODE #'+pos, 128, 60);
  }, false);
}
function l3BuildCodeMarks(sc){
  const CS=L3CFG.CS, off=CS/2+0.05, y=1.5;
  for(const m of (WALK.codeMarks||[])){
    const mat=new THREE.MeshStandardMaterial({map:l3CodeTex(m.pos,m.digit), emissive:0xffb347, emissiveIntensity:0.7,
                                              transparent:true, roughness:1.0, side:THREE.DoubleSide, depthWrite:false});
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1), mat);
    const X=m.i*CS, Z=m.j*CS;
    if(m.dir==='-x'){ pl.position.set(X-off,y,Z); pl.rotation.y=-Math.PI/2; }
    else if(m.dir==='+x'){ pl.position.set(X+off,y,Z); pl.rotation.y=Math.PI/2; }
    else if(m.dir==='-z'){ pl.position.set(X,y,Z-off); pl.rotation.y=Math.PI; }
    else { pl.position.set(X,y,Z+off); pl.rotation.y=0; }
    sc.add(pl);
  }
}

// glowing directional cones on the floor — a breadcrumb trail toward the exit
function l3BuildPath(sc){
  const mat=new THREE.MeshStandardMaterial({color:0x1a3a24, emissive:0x33ff88, emissiveIntensity:0.9, roughness:0.6});
  const up=new THREE.Vector3(0,1,0);
  for(const m of (WALK.pathMarks||[])){
    const cone=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.42,12), mat);
    // lay the cone flat with its tip aimed toward the next path cell (horizontal direction)
    const dir=new THREE.Vector3(Math.sin(m.yaw),0,Math.cos(m.yaw));
    cone.quaternion.setFromUnitVectors(up, dir);
    cone.position.set(m.x, 0.22, m.z);
    sc.add(cone);
  }
}

// the stalker — a pale, gaunt, hunched "bacteria"-style creature: elongated torso,
// very long dangling arms, lowered head with faint glowing eyes. Built once, moved each frame.
function l3BuildStalker(sc){
  L3.stalker=null;
  const g=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xcfc8ba, roughness:1.0, emissive:0x16140f, emissiveIntensity:0.4});
  const dark=new THREE.MeshStandardMaterial({color:0x241f19, roughness:0.9});
  // long thin legs
  const legL=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,1.05,8), skin); legL.position.set(-0.12,0.52,0); legL.rotation.z=0.05;
  const legR=legL.clone(); legR.position.x=0.12; legR.rotation.z=-0.05;
  // elongated, slightly hunched torso + ribcage rings
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.14,0.95,10), skin); torso.position.set(0,1.45,0.04); torso.rotation.x=-0.12;
  for(const ry of [1.25,1.45,1.63]){ const r=new THREE.Mesh(new THREE.TorusGeometry(0.115,0.012,6,16), skin); r.rotation.x=Math.PI/2; r.position.set(0,ry,0.04); g.add(r); }
  // craned neck + small lowered head
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,0.2,8), skin); neck.position.set(0,1.95,0.07); neck.rotation.x=0.45;
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.14,14,12), skin); head.position.set(0,2.04,0.18); head.scale.set(0.9,1.15,1.0);
  // very long dangling arms reaching toward the floor
  const armL=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.035,1.25,8), skin); armL.position.set(-0.18,1.18,0.06); armL.rotation.z=0.12;
  const armR=armL.clone(); armR.position.x=0.18; armR.rotation.z=-0.12;
  const handL=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.2,6), skin); handL.position.set(-0.215,0.56,0.06); handL.rotation.x=Math.PI;
  const handR=handL.clone(); handR.position.x=0.215;
  // hollow sockets + faint glowing eyes
  const sockL=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8), dark); sockL.position.set(-0.05,2.05,0.23);
  const sockR=sockL.clone(); sockR.position.x=0.05;
  const eyeMat=new THREE.MeshStandardMaterial({color:0xff5a4a, emissive:0xff1810, emissiveIntensity:1.6});
  const eyeL=new THREE.Mesh(new THREE.SphereGeometry(0.028,8,8), eyeMat); eyeL.position.set(-0.05,2.05,0.28);
  const eyeR=eyeL.clone(); eyeR.position.x=0.05;
  g.add(legL,legR,torso,neck,head,armL,armR,handL,handR,sockL,sockR,eyeL,eyeR);
  g.visible=false; sc.add(g);
  L3.stalker={ grp:g, eyeMat };
}

function l3Frame(p){
  // camera follows EXPLORE (movement/collision handled by updateExplore)
  L3.cam.position.set(EXPLORE.x, L3CFG.EYE, EXPLORE.z);
  L3.cam.lookAt(EXPLORE.x+Math.sin(EXPLORE.yaw), L3CFG.EYE, EXPLORE.z+Math.cos(EXPLORE.yaw));
  // flip projection X so screen-right == world-right (fix mirrored turn/strafe)
  L3.cam.updateProjectionMatrix();
  L3.cam.projectionMatrix.elements[0] *= -1;

  // ---- battery drain + flicker → effective beam strength (shared with the 2D fallback) ----
  if(!WALK.won) FLASH.batt=Math.max(0, FLASH.batt-FLASH.drain);
  let flick=1;
  if(FLASH.batt<0.28){ flick=0.55+Math.random()*0.45; if(Math.random()<0.05) flick=0.12; }
  const beam=(0.08 + 0.92*FLASH.batt)*flick;   // 0..1, never fully zero (faint dying glow)
  FLASH.beam=beam;

  // torch point lights follow the player: one at the head (lights all around) + one
  // pushed ahead and down so the surface the player faces gets the brightest pool.
  // Intensity tracks the battery so the world darkens & flickers as power runs out.
  const fwx=Math.sin(EXPLORE.yaw), fwz=Math.cos(EXPLORE.yaw);
  const ex=EXPLORE.x, ez=EXPLORE.z, ey=L3CFG.EYE;
  // head light keeps a floor of reach (you can always orient); forward pool tracks the
  // battery fully so the directional beam visibly dims/flickers as power runs out.
  if(L3.nearLight){ L3.nearLight.position.set(ex, ey, ez); L3.nearLight.intensity=L3.torchBase*(0.5+0.5*beam); }
  if(L3.fwdPool){   L3.fwdPool.position.set(ex+fwx*3.0, ey-0.6, ez+fwz*3.0); L3.fwdPool.intensity=L3.poolBase*beam; }

  // items: hide collected, recolor exit when unlocked, bob+spin the almond bottles
  for(const o of L3.itemMeshes){
    if(o.it.type==='almond'||o.it.type==='battery') o.mesh.visible=!o.it.taken;
    if(o.it.type==='almond' && !o.it.taken){
      o.mesh.rotation.y += 0.012;
      o.mesh.position.y = Math.sin(frameCount*0.05 + o.it.x)*0.04;   // gentle float, like the lobby bob
    }
  }
  if(L3.exitSign){ const on=WALK.unlocked;
    L3.exitSign.color.setHex(on?0x36e07a:0xd03c30); L3.exitSign.emissive.setHex(on?0x36e07a:0xd03c30); }
  if(L3.keypadMat){ const on=WALK.unlocked;
    L3.keypadMat.emissive.setHex(on?0x33cc66:0xffcc33);
    L3.keypadMat.emissiveIntensity = WALK.atDoor && !on ? (0.7+0.5*Math.sin(frameCount*0.25)) : 0.6; }

  // the stalker: move toward its world pos, face the player, flare eyes when hunting
  if(L3.stalker){
    const st=L3.stalker;
    if(STALKER.active && !WALK.won){
      st.grp.visible=true;
      st.grp.position.set(STALKER.x, 0, STALKER.z);
      st.grp.rotation.y = Math.atan2(EXPLORE.x-STALKER.x, EXPLORE.z-STALKER.z);
      const g = STALKER.lit ? 0.4 : 1.5;
      st.eyeMat.emissiveIntensity = g*(0.7+0.3*Math.sin(frameCount*0.3+STALKER.seed));
    } else st.grp.visible=false;
  }

  // flickering fluorescent panels (buzz)
  if(L3.flickerPanels) for(const f of L3.flickerPanels){
    let lvl=1; if(Math.random()<0.06) lvl=Math.random()*0.5;
    f.m.emissiveIntensity=lvl; f.pl.intensity=0.8*lvl;
  }

  L3.renderer.render(L3.scene, L3.cam);
  // blit onto the p5 canvas, then p5 post-FX + HUD on top
  p.push(); p.drawingContext.drawImage(L3.renderer.domElement, 0,0, p.width, p.height); p.pop();
  l3TorchMask(p);   // directional flashlight cone: crush everything except the centre beam
  applyGrain(p, BG.grain*0.55);
  applyVignette(p);
  drawWalkHUD(p, p.width/2, p.height/2);
  drawBatteryHUD(p);   // flashlight power meter (turns red + 'DEAD' as it drains)
  l3FoundFootage(p);
}

// directional flashlight cone painted over the (point-lit) 3D blit: darkness everywhere
// except a soft warm pool in the centre of the view, with a gentle vertical bob.
function l3TorchMask(p){
  const W=p.width, H=p.height, cx=W/2, cy=H*0.5;
  const beam=(typeof FLASH!=='undefined') ? FLASH.beam : 1;   // battery-driven cone size/strength
  const bob=Math.sin(frameCount*0.10)*H*0.010;
  const aimX=cx, aimY=cy+H*0.04+bob;          // a touch low → the pool sits on the floor ahead
  const reach=W*(0.46 + 0.18*beam), inner=W*0.11;   // bright defined pool; shrinks as power drains
  const g=p.drawingContext;
  g.save();
  // 1) crush surroundings to near-black for high game-like contrast (bright pool / dark room)
  const m=g.createRadialGradient(aimX,aimY,inner, aimX,aimY,reach);
  m.addColorStop(0,'rgba(0,0,0,0)');
  m.addColorStop(0.55,'rgba(0,0,0,0.30)');
  m.addColorStop(1,'rgba(0,0,2,0.93)');
  g.fillStyle=m; g.fillRect(0,0,W,H);
  // 2) warm tint in the core so it reads as a torch beam, not just a hole (fades with battery)
  g.globalCompositeOperation='lighter';
  const wl=g.createRadialGradient(aimX,aimY,0, aimX,aimY,reach*0.55);
  wl.addColorStop(0,`rgba(255,242,210,${0.24*beam})`); wl.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=wl; g.fillRect(0,0,W,H);
  g.restore();
}

// VHS / found-footage overlay (REC blinker only — PLAY + timestamp removed)
function l3FoundFootage(p){
  const W=p.width;
  p.push(); p.textFont('monospace'); p.noStroke();
  const blink=(Math.floor(frameCount/18)%2)===0;
  if(blink){ p.fill(210,40,36); p.ellipse(W-150,22,9,9); p.fill(220,210,205); p.textSize(11); p.textAlign(LEFT,CENTER); p.text('REC', W-140,22); }
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
