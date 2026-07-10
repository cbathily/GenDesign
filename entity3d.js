/* ============================================================
   ENTITY 3D VIEWER  (Mehr-Modell-System)
   Lädt ein GLB mit Three.js und macht es direkt editierbar.

   Aufbau-Prinzip "verbunden":
     figureRoot (Group)
       ├─ gltfRoot   (das geladene Modell, uniform auf baseScale)
       ├─ limbGroup  (prozedurale Arme/Beine)
       ├─ eyeGroup   (prozedurale Augen)
       ├─ mouthGroup (prozeduraler Mund)
       └─ extraGroup (spines/holes)
   Alle Zusätze sind GESCHWISTER des Modells im selben Container.
   Höhe/Breite skalieren figureRoot als Ganzes → Modell + Zusätze
   bleiben fest zusammen ("am Körper"). Arme/Augen werden an den
   echten Geometrie-Positionen der Körperteil-Nodes verankert.

   Gesteuert von app.js via window.init3D / window.apply3DParams /
   window.setModel3D.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer, scene, camera, orbitCtrl, animId, glowLight;
let figureRoot = null;   // Container: Modell + alle Zusätze
let gltfRoot   = null;
let mixer      = null;   // Animation des sichtbaren Modells
let _lastView  = (typeof performance!=='undefined'?performance.now():0);
let baseScale  = 1;
let namedNodes = {};
let realLimbs  = {};     // pro Modell extrahierte echte Arm/Bein-Geometrie (Templates)
let eyeMeshes  = [];
let eyeGroup   = null;
let mouthGroup = null;
let extraGroup = null;
let limbGroup  = null;
let initialized = false;

let currentModelKey = 'bacteria';
let currentCfg      = null;

// 3D-Body-Parameter — direkt am 3D-Objekt editierbar (von app.js gesetzt)
window.ENT3D = Object.assign({
  bodyHeight: 100,  // % Höhe
  bodyWidth:  100,  // % Breite
  addArms:    0,    // zusätzliche Arme
  addLegs:    0,    // zusätzliche Beine
  eyes:       0,    // Augen-Anzahl
  colorHue:   0,    // Körperfarbe 0-360
  colorSat:   0,    // Farb-Intensität 0-100
}, window.ENT3D || {});

// ---- Modell-Registry ----
const MODELS = {
  bacteria: {
    file:  'entities/bacteria_-_kane_pixels_backrooms.glb',
    label: 'BACTERIA — KANE PIXELS',
    legNames:    ['Legs','CableLeftLeg','CableRightLeg1','CableRightLeg2'],
    armNames:    ['LeftArm','RightArm'],
    fingerNames: ['LeftFinger1','RightFinger1','LeftFinger2',
                  'RightFinger2','LeftFinger3','RightFinger3'],
    // echte Nodes, an denen prozedurale Arme/Kopf verankert werden
    armAnchors:  ['RightArm','LeftArm'],
    headNode:    'Head',
  },
  papermask: {
    file:  'entities/the_paper_mask_the_backrooms_all_seeing.glb',
    label: 'PAPER MASK — ALL SEEING',
    legNames: [], armNames: [], fingerNames: [],
    // gerigtes Mesh: Joints ohne eigene Geometrie → Fallback auf BBox
    armAnchors: [], headNode: null,
  },
  pennywise: {
    file:  'entities/pennywise_animated_low_poly.glb',
    label: 'PENNYWISE — ANIMATED',
    legNames: [], armNames: [], fingerNames: [],
    armAnchors: [], headNode: null,   // gerigt + animiert (Mixamo)
    realLimbs: true,                  // echte Arm/Bein-Geometrie aus dem Skin extrahieren
  },
};

// ---- Haupt-Init (einmalig: Szene/Licht/Boden, dann Modell laden) ----
function init3D(canvasEl){
  if(initialized) return;
  initialized = true;

  const W = canvasEl.clientWidth  || canvasEl.offsetWidth  || 900;
  const H = canvasEl.clientHeight || canvasEl.offsetHeight || 620;

  renderer = new THREE.WebGLRenderer({canvas: canvasEl, antialias: true, alpha: false});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace  = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfae90);    // etwas dunkler → mehr Kontrast
  scene.fog = new THREE.FogExp2(0xbfae90, 0.025);  // kaum Nebel → klare Silhouette

  camera = new THREE.PerspectiveCamera(42, W/H, 0.01, 50);
  camera.position.set(0, 1.65, 3.8);

  orbitCtrl = new OrbitControls(camera, canvasEl);
  orbitCtrl.target.set(0, 0.9, 0);
  orbitCtrl.enableDamping  = true;
  orbitCtrl.dampingFactor  = 0.08;
  orbitCtrl.autoRotate     = true;
  orbitCtrl.autoRotateSpeed = 0.55;
  orbitCtrl.minDistance    = 0.6;
  orbitCtrl.maxDistance    = 9;
  orbitCtrl.update();

  scene.add(new THREE.AmbientLight(0xffe8c8, 0.85));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.1);
  key.position.set(-1.8, 5, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc8c0b0, 0.7);
  fill.position.set(3, 2, -2); scene.add(fill);
  // Rim/Backlight: hebt die Silhouette vom Hintergrund ab
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(0.5, 3, -4); scene.add(rim);

  glowLight = new THREE.PointLight(0xff5a3c, 0, 6, 2);
  glowLight.position.set(0, 1.2, 0);
  scene.add(glowLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({color:0x967856, roughness:0.88, metalness:0})
  );
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Container + Zusatz-Gruppen (einmalig) — alle Geschwister im figureRoot
  figureRoot = new THREE.Group();
  limbGroup  = new THREE.Group();
  eyeGroup   = new THREE.Group();
  mouthGroup = new THREE.Group();
  extraGroup = new THREE.Group();
  figureRoot.add(limbGroup, eyeGroup, mouthGroup, extraGroup);
  scene.add(figureRoot);

  loadModel(currentModelKey);

  function animate(){
    animId = requestAnimationFrame(animate);
    orbitCtrl.update();
    if(mixer){
      const now=performance.now(), dt=Math.min((now-_lastView)/1000, 0.1);
      _lastView=now; mixer.update(dt);
    }
    if((window.ENT?.track) && eyeMeshes.length){
      for(const g of eyeMeshes) g.lookAt(camera.position);
    }
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const el = canvasEl;
    const W2 = el.clientWidth || 900, H2 = el.clientHeight || 620;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
}

// ---- Modell laden / wechseln ----
function loadModel(key){
  const cfg = MODELS[key];
  if(!cfg || !scene) return;
  currentModelKey = key;
  currentCfg = cfg;

  // altes Modell + Prozedurales entfernen
  if(mixer){ mixer.stopAllAction(); mixer = null; }
  if(gltfRoot){ figureRoot.remove(gltfRoot); disposeObject(gltfRoot); gltfRoot = null; }
  namedNodes = {};
  clearGroup(eyeGroup); eyeMeshes = [];
  clearGroup(mouthGroup); clearGroup(extraGroup); clearGroup(limbGroup);

  const lbl = document.getElementById('ent-3d-label');
  if(lbl) lbl.textContent = cfg.label + ' · LÄDT…';

  new GLTFLoader().load(
    cfg.file,
    gltf => {
      gltfRoot = gltf.scene;
      gltfRoot.traverse(node => {
        if(node.isMesh){
          node.castShadow = true;
          node.receiveShadow = false;
          node.frustumCulled = false;
        }
        if(node.name) namedNodes[node.name] = node;
      });

      // uniform normieren + zentriert mit Füßen auf y=0 (Neutral-Raum)
      const box  = new THREE.Box3().setFromObject(gltfRoot);
      const size = box.getSize(new THREE.Vector3());
      baseScale  = 2.4 / Math.max(size.x, size.y, size.z);
      gltfRoot.scale.setScalar(baseScale);
      gltfRoot.updateMatrixWorld(true);
      const b2  = new THREE.Box3().setFromObject(gltfRoot);
      const ctr = b2.getCenter(new THREE.Vector3());
      gltfRoot.position.x -= ctr.x;
      gltfRoot.position.z -= ctr.z;
      gltfRoot.position.y -= b2.min.y;

      figureRoot.add(gltfRoot);
      // Animation (z.B. Pennywise / Mixamo) abspielen
      if(gltf.animations && gltf.animations.length){
        mixer = new THREE.AnimationMixer(gltfRoot);
        mixer.clipAction(gltf.animations[0]).play();
        _lastView = performance.now();
      }
      // echte Limbs extrahieren (für Modelle mit Rig, z.B. Pennywise)
      if(cfg.realLimbs){ try{ extractRealLimbs(key); }catch(e){ console.warn('[entity3d] limb extract:', e); } }
      apply3DParams();
      if(lbl) lbl.textContent = cfg.label + ' · EDITIERBAR';
    },
    null,
    err => {
      console.error('[entity3d] GLB load error:', err);
      if(lbl) lbl.textContent = cfg.label + ' · FEHLER BEIM LADEN';
    }
  );
}

function setModel3D(key){
  if(!MODELS[key]) return;
  if(!initialized){ currentModelKey = key; return; }
  loadModel(key);
}

function disposeObject(obj){
  obj.traverse(n => {
    if(n.geometry) n.geometry.dispose();
    if(n.material){
      (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => {
        for(const k in m){ const v = m[k]; if(v && v.isTexture) v.dispose(); }
        m.dispose();
      });
    }
  });
}

// ---- Params anwenden ----
function apply3DParams(){
  if(!gltfRoot || !figureRoot) return;
  const E   = window.ENT  || {};
  const E3  = window.ENT3D || {};
  const cfg = currentCfg || MODELS.bacteria;

  const limbLen = E.limbLen ?? 0.7;
  const limbs   = E.limbs   ?? 4;

  // ---- Limb-Längen + Sichtbarkeit (modellspezifisch, nur bacteria) ----
  const legY = 0.55 + limbLen * 1.4;
  for(const n of cfg.legNames){ const nd = namedNodes[n]; if(nd) nd.scale.y = legY; }
  const armY = 0.55 + limbLen * 1.2;
  for(const n of cfg.armNames){ const nd = namedNodes[n]; if(nd) nd.scale.y = armY; }
  const finY = 0.6 + limbLen * 0.9;
  for(const n of cfg.fingerNames){ const nd = namedNodes[n]; if(nd) nd.scale.y = finY; }
  const showArms = limbs >= 2;
  for(const n of cfg.armNames){ const nd = namedNodes[n]; if(nd) nd.visible = showArms; }
  const nFingers = Math.max(0, Math.min(cfg.fingerNames.length, limbs - 2));
  cfg.fingerNames.forEach((n,i) => { const nd = namedNodes[n]; if(nd) nd.visible = showArms && i < nFingers; });

  // ---- Neutral-Zustand: Container ohne Höhe/Breite, damit Zusätze
  //      im selben Maßstab wie das Modell gebaut werden ----
  figureRoot.scale.set(1,1,1);
  figureRoot.position.set(0,0,0);
  figureRoot.updateMatrixWorld(true);
  const nbox = new THREE.Box3().setFromObject(gltfRoot);  // neutrale Körper-BBox

  // ---- Körperfarbe + Glow ----
  const hue = E3.colorHue ?? 0;
  const sat = E3.colorSat ?? 0;
  const lit = 8 + sat * 0.26;
  const tintCol = new THREE.Color(`hsl(${hue},${sat}%,${lit}%)`);
  const isGlow  = (E.bodyExtra ?? 'none') === 'glow';
  gltfRoot.traverse(nd => {
    if(!nd.isMesh) return;
    (Array.isArray(nd.material) ? nd.material : [nd.material]).forEach(m => {
      if(!m.color) return;
      // Materialien deckend erzwingen — verhindert die durchsichtige Geister-Optik
      if(m.transparent !== false){ m.transparent = false; m.opacity = 1; m.depthWrite = true; }
      m.alphaTest = 0;
      m.side = THREE.FrontSide;
      m.roughness = Math.min(m.roughness ?? 1, 0.9);
      if(!m._origColor) m._origColor = m.color.clone();
      if(sat > 3) m.color.copy(m._origColor).lerp(tintCol, Math.min(sat/100, 0.82));
      else        m.color.copy(m._origColor);
      if(m.emissive){
        m.emissive.copy(isGlow ? tintCol : new THREE.Color(0x000000));
        m.emissiveIntensity = isGlow ? 0.9 : 0;
      }
      m.needsUpdate = true;
    });
  });
  if(glowLight){
    glowLight.color.copy(sat > 3 ? tintCol : new THREE.Color(0xff5a3c));
    glowLight.intensity = isGlow ? 2.4 : 0;
  }

  // ---- prozedurale Zusätze (im Neutral-Raum gebaut, am Körper verankert) ----
  if(realLimbs[currentModelKey])                                       // echte Modell-Limbs (Pennywise)
    updateRealLimbs3D(currentModelKey, E3.addArms ?? 0, E3.addLegs ?? 0, nbox);
  else
    updateLimbs3D(E3.addArms ?? 0, E3.addLegs ?? 0, tintCol, sat, nbox); // sonst prozedurale Zylinder
  updateEyes3D(E3.eyes ?? 0, E.eyeType ?? 'normal', nbox);
  updateMouth3D(E.mouthType ?? 'none', nbox);
  updateBodyExtra3D(E.bodyExtra ?? 'none', tintCol, sat, nbox);

  // ---- Höhe/Breite auf gesamte Figur (Modell + alle Zusätze zusammen) ----
  const bh = (E3.bodyHeight ?? 100) / 100;
  const bw = (E3.bodyWidth  ?? 100) / 100;
  figureRoot.scale.set(bw, bh, bw);
  figureRoot.updateMatrixWorld(true);
  const fbox = new THREE.Box3().setFromObject(figureRoot);
  if(isFinite(fbox.min.y)) figureRoot.position.y = -fbox.min.y;
}

// ---- Helpers ----
function clearGroup(g){
  if(!g) return;
  while(g.children.length){
    const c = g.children[0];
    c.traverse(o => { if(o.geometry) o.geometry.dispose(); });
    g.remove(c);
  }
}

// Geometrie-Position eines Körperteil-Nodes (robust auch bei baked transforms)
// → in figureRoot-lokalen Koordinaten (während Neutral-Aufbau = Weltkoord.)
function nodeAnchor(name){
  const nd = name && namedNodes[name];
  if(!nd) return null;
  const b = new THREE.Box3().setFromObject(nd);
  if(b.isEmpty()) return null;
  return figureRoot.worldToLocal(b.getCenter(new THREE.Vector3()));
}

// "Kopf"-Anker: echter Head-Node wenn vorhanden, sonst oberer BBox-Teil
function headAnchor(box){
  const cfg = currentCfg || {};
  const s = box.getSize(new THREE.Vector3());
  const head = nodeAnchor(cfg.headNode);
  if(head) return { center: head, radius: Math.max(s.x,s.z)*0.20, frontZ: head.z + s.z*0.4 };
  const c = box.getCenter(new THREE.Vector3());
  return { center: new THREE.Vector3(c.x, box.max.y - s.y*0.12, c.z),
           radius: Math.max(s.x,s.z)*0.22, frontZ: c.z + s.z*0.5 };
}

// Konischer Zylinder zwischen zwei Punkten
function cylBetween(p1, p2, r1, r2, mat){
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length() || 0.001;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 8), mat);
  mesh.castShadow = true;
  mesh.position.copy(p1).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
  return mesh;
}

// ---- Arme + Beine prozedural, am Körper verankert ----
function updateLimbs3D(nArms, nLegs, tintCol, sat, box){
  clearGroup(limbGroup);
  if(!gltfRoot || (nArms <= 0 && nLegs <= 0)) return;

  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  const cfg = currentCfg || {};
  const mat = new THREE.MeshStandardMaterial({
    color: sat > 3 ? tintCol.clone() : new THREE.Color(0x1a1714), roughness:0.85, metalness:0
  });
  const thick = Math.max(Math.max(s.x, s.z) * 0.045, 0.02);
  const V = (x,y,z)=>new THREE.Vector3(x,y,z);

  // --- ARME: erste an echten Arm-Nodes verankert, weitere an BBox-Seiten ---
  for(let i=0; i<nArms; i++){
    let side = (i%2===0) ? -1 : 1;
    const tier = Math.floor(i/2);
    const anchor = (i < cfg.armAnchors.length) ? nodeAnchor(cfg.armAnchors[i]) : null;
    let root;
    if(anchor){ root = anchor; side = (root.x >= c.x) ? 1 : -1; }
    else root = V(c.x + side*s.x*0.40, box.max.y - s.y*0.28 - tier*s.y*0.13, c.z);

    const len   = Math.max(s.x, s.y) * 0.55;
    const elbow = V(root.x + side*len*0.70, root.y - len*0.28, root.z + s.z*0.05);
    const hand  = V(elbow.x + side*len*0.22, elbow.y - len*0.72, elbow.z);
    limbGroup.add(cylBetween(root,  elbow, thick,     thick*0.8,  mat));
    limbGroup.add(cylBetween(elbow, hand,  thick*0.8, thick*0.45, mat));
    const j = new THREE.Mesh(new THREE.SphereGeometry(thick*0.9, 8, 8), mat);
    j.position.copy(elbow); limbGroup.add(j);
  }

  // --- BEINE: unten am Körper bis zum Boden ---
  for(let i=0; i<nLegs; i++){
    const side = (i%2===0) ? -1 : 1;
    const tier = Math.floor(i/2);
    const root = V(c.x + side*s.x*0.20*(1+tier*0.5), box.min.y + s.y*0.24, c.z + (tier?-s.z*0.18:0));
    const knee = V(root.x + side*s.x*0.14, box.min.y + s.y*0.11, root.z);
    const foot = V(knee.x + side*s.x*0.05, box.min.y, knee.z + s.z*0.10);
    limbGroup.add(cylBetween(root, knee, thick*1.15, thick*0.9, mat));
    limbGroup.add(cylBetween(knee, foot, thick*0.9,  thick*0.6, mat));
    const j = new THREE.Mesh(new THREE.SphereGeometry(thick, 8, 8), mat);
    j.position.copy(knee); limbGroup.add(j);
  }
}

/* ===== ECHTE Limbs aus dem Skinned-Mesh extrahieren (z.B. Pennywise) =====
   Wählt die Dreiecke, die an die Arm-/Bein-Knochen gewichtet sind, baut daraus
   ein statisches Mesh (Rest-Pose) und legt es als Template ab. */
function extractRealLimbs(key){
  if(realLimbs[key] || !gltfRoot) return;
  let skel=null;
  gltfRoot.traverse(n=>{ if(n.isSkinnedMesh && !skel) skel=n.skeleton; });
  if(!skel) return;

  // Neutral-Raum sicherstellen, damit gebackene Koords zu figureRoot passen
  figureRoot.scale.set(1,1,1); figureRoot.position.set(0,0,0); figureRoot.updateMatrixWorld(true);

  const idxSet=(re)=>{ const s=new Set(); skel.bones.forEach((b,i)=>{ if(re.test(b.name)) s.add(i); }); return s; };
  const armSet=idxSet(/Right(Arm|ForeArm|Hand)/i);     // rechter Arm als Spender
  const legSet=idxSet(/Right(UpLeg|Leg|Foot|Toe)/i);   // rechtes Bein als Spender
  const armBone=skel.bones.find(b=>/RightArm/i.test(b.name));
  const legBone=skel.bones.find(b=>/RightUpLeg/i.test(b.name));
  const armAnchor=armBone?armBone.getWorldPosition(new THREE.Vector3()):new THREE.Vector3();
  const legAnchor=legBone?legBone.getWorldPosition(new THREE.Vector3()):new THREE.Vector3();

  realLimbs[key]={ arm: buildLimbTemplate(armSet, armAnchor), leg: buildLimbTemplate(legSet, legAnchor) };
}

// Baut aus allen Skinned-Meshes die zum Knochenset gehörenden Dreiecke,
// zentriert am Anker (Schulter/Hüfte), als Group (eine Submesh je Quell-Material).
function buildLimbTemplate(boneSet, anchor){
  const group=new THREE.Group();
  const tv=new THREE.Vector3(), tn=new THREE.Vector3();
  gltfRoot.traverse(mesh=>{
    if(!mesh.isSkinnedMesh) return;
    const g=mesh.geometry, pos=g.attributes.position, nor=g.attributes.normal, uv=g.attributes.uv;
    const si=g.attributes.skinIndex, sw=g.attributes.skinWeight;
    if(!pos||!si||!sw) return;
    const idx=g.index?g.index.array:null;
    const triCount=idx?idx.length/3:pos.count/3;
    const mw=mesh.matrixWorld, nm=new THREE.Matrix3().getNormalMatrix(mw);
    const wsum=(v)=>{ let s=0;
      const bx=[si.getX(v),si.getY(v),si.getZ(v),si.getW(v)];
      const wx=[sw.getX(v),sw.getY(v),sw.getZ(v),sw.getW(v)];
      for(let k=0;k<4;k++) if(boneSet.has(bx[k])) s+=wx[k];
      return s; };
    const P=[],N=[],U=[];
    const push=(v)=>{
      tv.fromBufferAttribute(pos,v).applyMatrix4(mw).sub(anchor); P.push(tv.x,tv.y,tv.z);
      if(nor){ tn.fromBufferAttribute(nor,v).applyMatrix3(nm).normalize(); N.push(tn.x,tn.y,tn.z); }
      if(uv) U.push(uv.getX(v), uv.getY(v));
    };
    for(let t=0;t<triCount;t++){
      const a=idx?idx[t*3]:t*3, b=idx?idx[t*3+1]:t*3+1, c=idx?idx[t*3+2]:t*3+2;
      if(((wsum(a)>0.5)+(wsum(b)>0.5)+(wsum(c)>0.5))>=2){ push(a); push(b); push(c); }
    }
    if(!P.length) return;
    const ng=new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.Float32BufferAttribute(P,3));
    if(N.length) ng.setAttribute('normal', new THREE.Float32BufferAttribute(N,3));
    if(U.length) ng.setAttribute('uv', new THREE.Float32BufferAttribute(U,2));
    if(!N.length) ng.computeVertexNormals();
    const mat=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
    const sub=new THREE.Mesh(ng, mat); sub.castShadow=true; sub.frustumCulled=false;
    group.add(sub);
  });
  return group;
}

// Echte Limb-Klone als Extra-Arme/-Beine platzieren (statt Zylinder)
function updateRealLimbs3D(key, nArms, nLegs, box){
  clearGroup(limbGroup);
  const rl=realLimbs[key]; if(!rl) return;
  const c=box.getCenter(new THREE.Vector3()), s=box.getSize(new THREE.Vector3());

  for(let i=0;i<nArms;i++){
    if(!rl.arm.children.length) break;
    const side=(i%2===0)?-1:1, tier=Math.floor(i/2);
    const g=rl.arm.clone(true);
    g.position.set(c.x+side*s.x*0.26, box.max.y - s.y*0.30 - tier*s.y*0.13, c.z);
    g.rotation.z = -side*(0.6+tier*0.35);          // nach außen fächern
    g.rotation.y = side<0?Math.PI:0;
    limbGroup.add(g);
  }
  for(let i=0;i<nLegs;i++){
    if(!rl.leg.children.length) break;
    const side=(i%2===0)?-1:1, tier=Math.floor(i/2);
    const g=rl.leg.clone(true);
    g.position.set(c.x+side*s.x*0.16*(1+tier*0.6), box.min.y + s.y*0.30, c.z);
    g.rotation.z = -side*(0.15+tier*0.2);
    g.rotation.y = side<0?Math.PI:0;
    limbGroup.add(g);
  }
}

// ---- Augen am Kopf-Anker ----
function updateEyes3D(count, eyeType, box){
  clearGroup(eyeGroup); eyeMeshes = [];
  if(!gltfRoot || count === 0) return;

  const ha = headAnchor(box);
  const wp = ha.center, hr = ha.radius;

  const scleraCol = eyeType==='void'     ? 0x050505
                  : eyeType==='compound' ? 0x90cc90
                  :                        0xddd5c0;
  const scleraMat = new THREE.MeshStandardMaterial({color:scleraCol, roughness:0.4, metalness:0});
  const pupilMat  = new THREE.MeshStandardMaterial({color:0x050505, roughness:0.2, metalness:0});
  const bleedMat  = new THREE.MeshStandardMaterial({color:0x8b0000, roughness:0.6, transparent:true, opacity:0.85});

  for(let i=0; i<count; i++){
    const a   = (i/count) * Math.PI * 2 + 0.3;
    const rr  = hr * (0.55 + (i%3)*0.18);
    const ey  = wp.y + (((i*37)%100)/100 - 0.5) * hr;   // deterministisch

    const grp = new THREE.Group();
    const r   = Math.max(0.012, hr*0.18);
    const sc  = new THREE.Mesh(new THREE.SphereGeometry(r,12,12), scleraMat.clone());
    const pu  = new THREE.Mesh(new THREE.SphereGeometry(r*0.5,8,8), pupilMat);
    pu.position.z = r * 0.6;
    grp.add(sc); grp.add(pu);

    if(eyeType==='compound'){
      for(let f=0; f<6; f++){
        const fa = f/6*Math.PI*2;
        const fac = new THREE.Mesh(new THREE.SphereGeometry(r*0.4,6,6), scleraMat.clone());
        fac.position.set(Math.cos(fa)*r*0.7, Math.sin(fa)*r*0.7, r*0.3);
        grp.add(fac);
      }
    }
    if(eyeType==='bleeding'){
      const dr = new THREE.Mesh(new THREE.CylinderGeometry(r*0.12, r*0.04, r*3, 5), bleedMat);
      dr.position.set(0, -r*2.0, r*0.3);
      grp.add(dr);
    }

    grp.position.set(wp.x + Math.cos(a)*rr, ey, wp.z + Math.sin(a)*rr + hr*0.6);
    grp.lookAt(wp.x + Math.cos(a)*rr*2, ey, wp.z + Math.sin(a)*rr*2 + hr);
    eyeGroup.add(grp);
    eyeMeshes.push(grp);
  }
}

// ---- prozeduraler Mund am Kopf-Anker ----
function updateMouth3D(type, box){
  clearGroup(mouthGroup);
  if(type === 'none' || !gltfRoot) return;

  const ha = headAnchor(box);
  const c = ha.center, hr = ha.radius;
  const frontZ = ha.frontZ;
  const my = c.y - hr*0.35;

  const dark = new THREE.MeshStandardMaterial({color:0x040404, roughness:0.9});
  const teethMat = new THREE.MeshStandardMaterial({color:0xd8d2c6, roughness:0.5});

  if(type === 'gape'){
    const m = new THREE.Mesh(new THREE.SphereGeometry(hr*0.5, 16, 12), dark);
    m.scale.set(1, 1.4, 0.5);
    m.position.set(c.x, my, frontZ);
    mouthGroup.add(m);
  } else if(type === 'teeth'){
    const slot = new THREE.Mesh(new THREE.BoxGeometry(hr*1.0, hr*0.34, hr*0.3), dark);
    slot.position.set(c.x, my, frontZ);
    mouthGroup.add(slot);
    const nt = 7;
    for(let i=0;i<nt;i++){
      const tx = c.x - hr*0.42 + i*(hr*0.84/(nt-1));
      const up = i%2===0;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(hr*0.07, hr*0.26, 5), teethMat);
      tooth.position.set(tx, my + (up? hr*0.10 : -hr*0.10), frontZ + hr*0.05);
      tooth.rotation.x = up ? Math.PI : 0;
      mouthGroup.add(tooth);
    }
  } else if(type === 'multi'){
    for(let i=0;i<4;i++){
      const a = i/4*Math.PI*2;
      const m = new THREE.Mesh(new THREE.SphereGeometry(hr*0.22, 10, 8), dark);
      m.scale.set(1.3, 0.7, 0.4);
      m.position.set(c.x + Math.cos(a)*hr*0.5, c.y + Math.sin(a)*hr*0.4, frontZ);
      mouthGroup.add(m);
    }
  }
}

// ---- Body Extras: spines / holes ----
function updateBodyExtra3D(type, tintCol, sat, box){
  clearGroup(extraGroup);
  if(type !== 'spines' && type !== 'holes') return;

  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  const radius = Math.max(s.x, s.z) * 0.42;

  if(type === 'spines'){
    const mat = new THREE.MeshStandardMaterial({
      color: sat > 3 ? tintCol : new THREE.Color(0x1a1714), roughness:0.8
    });
    for(let i=0;i<26;i++){
      const a = (i/26)*Math.PI*2;
      const y = c.y + (((i*53)%100)/100 - 0.5)*s.y*0.8;
      const len = radius*(0.45 + ((i*29)%100)/100*0.4);
      const sp = new THREE.Mesh(new THREE.ConeGeometry(radius*0.06, len, 5), mat);
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      sp.position.set(c.x+dir.x*radius, y, c.z+dir.z*radius);
      sp.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
      extraGroup.add(sp);
    }
  } else { // holes
    const mat = new THREE.MeshStandardMaterial({color:0x050505, roughness:1});
    for(let i=0;i<12;i++){
      const a = (i/12)*Math.PI*2 + 0.4;
      const y = c.y + (((i*61)%100)/100 - 0.5)*s.y*0.8;
      const hr = radius*(0.10 + ((i*43)%100)/100*0.10);
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const h = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 8), mat);
      h.position.set(c.x+dir.x*radius*0.96, y, c.z+dir.z*radius*0.96);
      extraGroup.add(h);
    }
  }
}

/* ============================================================
   OFFSCREEN-SPRITE-RENDERER (für die Lobby)
   Rendert das GLB transparent in ein Canvas, das die p5-Lobby
   als Billboard zeichnen kann. Eigener Renderer/Szene/Kamera,
   unabhängig vom sichtbaren 3D-Viewer.
   ============================================================ */
let spR=null, spScene=null, spCam=null;
let spModels={}, spMixers={}, spCurrent=null, spLoading={};
let _lastSprite=(typeof performance!=='undefined'?performance.now():0);
const SP_W=320, SP_H=460;

function spInit(){
  if(spR) return;
  spR = new THREE.WebGLRenderer({alpha:true, antialias:true});
  spR.setPixelRatio(1);
  spR.setSize(SP_W, SP_H);
  spR.outputColorSpace   = THREE.SRGBColorSpace;
  spR.toneMapping        = THREE.ACESFilmicToneMapping;
  spR.toneMappingExposure = 1.05;
  spScene = new THREE.Scene();                          // kein Hintergrund → transparent
  spScene.add(new THREE.AmbientLight(0xffe8c8, 0.9));
  const k=new THREE.DirectionalLight(0xfff0d8, 2.0); k.position.set(-1.5,4,3); spScene.add(k);
  const r=new THREE.DirectionalLight(0xffffff, 1.0); r.position.set(0.5,3,-4); spScene.add(r);
  spCam = new THREE.PerspectiveCamera(40, SP_W/SP_H, 0.01, 50);
}

function spEnsureModel(key){
  if(spModels[key] || spLoading[key]) return;
  spLoading[key]=true;
  new GLTFLoader().load(MODELS[key].file, gltf=>{
    const m=gltf.scene;
    m.traverse(n=>{
      if(!n.isMesh) return;
      n.frustumCulled=false;
      (Array.isArray(n.material)?n.material:[n.material]).forEach(mt=>{
        if(mt && mt.transparent!==false){ mt.transparent=false; mt.opacity=1; mt.depthWrite=true; }
      });
    });
    // normieren: Höhe 1.8, horizontal zentriert, Füße auf y=0
    const box=new THREE.Box3().setFromObject(m), size=box.getSize(new THREE.Vector3());
    m.scale.setScalar(1.8/Math.max(size.y,0.001));
    m.updateMatrixWorld(true);
    const b2=new THREE.Box3().setFromObject(m), c=b2.getCenter(new THREE.Vector3());
    m.position.x-=c.x; m.position.z-=c.z; m.position.y-=b2.min.y;
    m.visible=false;
    spScene.add(m); spModels[key]=m; spLoading[key]=false;
    // Animation (Pennywise) auch im Sprite abspielen
    if(gltf.animations && gltf.animations.length){
      const mx=new THREE.AnimationMixer(m);
      mx.clipAction(gltf.animations[0]).play();
      spMixers[key]=mx;
    }
  }, null, err=>{ console.error('[sprite] load error:', err); spLoading[key]=false; });
}

function spApplyColor(m){
  const E3=window.ENT3D||{}, hue=E3.colorHue||0, sat=E3.colorSat||0;
  const tint=new THREE.Color(`hsl(${hue},${sat}%,${8+sat*0.26}%)`);
  m.traverse(n=>{
    if(!n.isMesh) return;
    (Array.isArray(n.material)?n.material:[n.material]).forEach(mt=>{
      if(!mt.color) return;
      if(!mt._origColorS) mt._origColorS=mt.color.clone();
      if(sat>3) mt.color.copy(mt._origColorS).lerp(tint, Math.min(sat/100,0.82));
      else      mt.color.copy(mt._origColorS);
    });
  });
}

// Rendert das Modell <key> und gibt das Canvas zurück (oder null während es lädt)
function getModelSpriteCanvas(key){
  if(!MODELS[key]) return null;
  spInit(); spEnsureModel(key);
  const m=spModels[key]; if(!m) return null;            // lädt noch
  if(spCurrent && spCurrent!==m) spCurrent.visible=false;
  m.visible=true; spCurrent=m;
  spApplyColor(m);
  // Animation aktualisieren (falls vorhanden)
  if(spMixers[key]){
    const now=performance.now(), dt=Math.min((now-_lastSprite)/1000, 0.1);
    spMixers[key].update(dt);
  }
  _lastSprite=performance.now();
  // Kamera so, dass das Modell (Höhe 1.8) die Canvas-Höhe füllt: Füße unten, Kopf oben
  const midY=0.9, D=midY/Math.tan((spCam.fov*Math.PI/180)/2);
  spCam.position.set(0, midY, D); spCam.lookAt(0, midY, 0);
  spR.render(spScene, spCam);
  return spR.domElement;
}

// ---- Globale API ----
window.init3D             = init3D;
window.apply3DParams      = apply3DParams;
window.setModel3D         = setModel3D;
window.getModelSpriteCanvas = getModelSpriteCanvas;
