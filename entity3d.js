/* ============================================================
   ENTITY 3D — GLB model viewer (Three.js)
   Lädt die drei Modelle aus entites3d/ (Bacteria, Pennywise,
   Paper Mask) als 3D-Entities. Rendert in einen Offscreen-WebGL-
   Buffer und blittet das Bild auf das p5-Canvas (gleiches Muster
   wie lightsout3d.js), damit PNG-Export + Tab-System weiter passen.

   Anpassbare Parameter (aus ENT):
     mass      -> Modellgröße (Scale)
     bodyHue   -> Lichtfarbe / Farbstich
     bodyLight -> Helligkeit
   Maus ziehen -> drehen.  Modelle mit Animation laufen automatisch.
   Bei Fehler (z.B. file:// blockt das Laden): Hinweis im Canvas.
   ============================================================ */

const E3_FILES = {
  bacteria:  'entites3d/bacteria_-_kane_pixels_backrooms.glb',
  pennywise: 'entites3d/pennywise_animated_low_poly.glb',
  papermask: 'entites3d/the_paper_mask_the_backrooms_all_seeing.glb',
};

const E3 = {
  renderer:null, scene:null, cam:null, w:0, h:0, failed:false,
  pivot:null, ambient:null, hemi:null, key:null, fill:null,
  current:null,                 // model key currently in the scene
  models:{}, loaded:{}, loading:{}, error:{},
  mixers:{}, clock:null,
  yaw:0.4, autoSpin:true, dragging:false, lastMX:0,
};

function e3Ensure(W,H){
  if(typeof THREE==='undefined') return false;
  if(!E3.renderer){
    const r=new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    r.setPixelRatio(1); r.setSize(W,H); r.setClearColor(0x000000, 0);
    if('outputEncoding' in r) r.outputEncoding = THREE.sRGBEncoding;
    E3.renderer=r; E3.w=W; E3.h=H;
    E3.clock=new THREE.Clock();

    const sc=new THREE.Scene();
    E3.ambient=new THREE.AmbientLight(0xffffff, 0.55);
    E3.hemi   =new THREE.HemisphereLight(0xffffff, 0x202028, 0.55);
    E3.key    =new THREE.DirectionalLight(0xffffff, 1.05); E3.key.position.set(3,5,4);
    E3.fill   =new THREE.DirectionalLight(0x8899ff, 0.4);  E3.fill.position.set(-4,2,-3);
    sc.add(E3.ambient, E3.hemi, E3.key, E3.fill);

    E3.pivot=new THREE.Group(); sc.add(E3.pivot);
    E3.scene=sc;

    E3.cam=new THREE.PerspectiveCamera(45, W/H, 0.1, 100);
    E3.cam.position.set(0, 0.3, 5.2); E3.cam.lookAt(0,0,0);
  } else if(E3.w!==W || E3.h!==H){
    E3.renderer.setSize(W,H); E3.cam.aspect=W/H; E3.cam.updateProjectionMatrix(); E3.w=W; E3.h=H;
  }
  return true;
}

// load a GLB once, center + normalise it, store under its key
function e3Load(key){
  if(E3.loaded[key] || E3.loading[key] || E3.error[key]) return;
  if(typeof THREE.GLTFLoader==='undefined'){ E3.error[key]='GLTFLoader fehlt'; return; }
  E3.loading[key]=true;
  const loader=new THREE.GLTFLoader();
  if(typeof THREE.DRACOLoader!=='undefined'){
    const draco=new THREE.DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(draco);
  }
  loader.load(E3_FILES[key], (gltf)=>{
    const obj=gltf.scene || (gltf.scenes && gltf.scenes[0]);
    if(!obj){ E3.error[key]='kein Scene-Node'; E3.loading[key]=false; return; }
    // center at origin + normalise height to ~2.2 units
    const box=new THREE.Box3().setFromObject(obj);
    const size=new THREE.Vector3(); box.getSize(size);
    const center=new THREE.Vector3(); box.getCenter(center);
    obj.position.sub(center);
    const maxDim=Math.max(size.x,size.y,size.z)||1;
    obj.scale.setScalar(2.2/maxDim);
    obj.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; o.castShadow=o.receiveShadow=false; } });
    E3.models[key]=obj;
    // animation (e.g. Pennywise)
    if(gltf.animations && gltf.animations.length){
      const mixer=new THREE.AnimationMixer(obj);
      mixer.clipAction(gltf.animations[0]).play();
      E3.mixers[key]=mixer;
    }
    E3.loaded[key]=true; E3.loading[key]=false;
  }, undefined, (err)=>{
    console.error('Entity 3D load failed:', key, E3_FILES[key], err);
    E3.error[key] = (location.protocol==='file:')
      ? 'file:// blockt GLB-Laden — bitte über lokalen Server öffnen'
      : 'Laden fehlgeschlagen: '+E3_FILES[key]+' (Konsole prüfen)';
    E3.loading[key]=false;
  });
}

// make `key` the model shown in the pivot (load lazily)
function e3SetModel(key){
  if(!E3_FILES[key]) return;
  if(E3.current===key && E3.pivot.children.length) return;
  if(!E3.loaded[key]){ e3Load(key); }
  // swap pivot contents
  while(E3.pivot.children.length) E3.pivot.remove(E3.pivot.children[0]);
  if(E3.loaded[key] && E3.models[key]) E3.pivot.add(E3.models[key]);
  E3.current=key;
}

// 2D backdrop + status text (drawn on the p5 canvas under the 3D blit)
function e3Backdrop(p, msg){
  const W=p.width,H=p.height;
  p.push(); p.colorMode(RGB,255); p.noStroke();
  p.fill(214,198,170); p.rect(0,0,W,H*0.66);
  p.fill(150,120,95);  p.rect(0,H*0.66,W,H*0.34);
  p.fill(255,255,255,30);
  for(let y=20;y<H*0.66;y+=46) for(let x=20;x<W;x+=46) p.ellipse(x,y,6,6);
  if(msg){
    p.fill(40,34,28); p.textFont('monospace'); p.textSize(15); p.textAlign(CENTER,CENTER);
    p.text(msg, W/2, H/2);
    p.textAlign(LEFT,BASELINE);
  }
  p.pop();
}

// drag-to-rotate using p5 mouse state (canvas-space)
function e3Drag(p){
  const inside = p.mouseX>=0 && p.mouseX<=p.width && p.mouseY>=0 && p.mouseY<=p.height;
  if(p.mouseIsPressed && inside){
    if(!E3.dragging){ E3.dragging=true; E3.lastMX=p.mouseX; }
    const dx=p.mouseX-E3.lastMX; E3.lastMX=p.mouseX;
    E3.yaw += dx*0.01; E3.autoSpin=false;
  } else {
    E3.dragging=false;
  }
}

// main entry — returns true when it handled the frame
function entity3dRender(p){
  if(E3.failed || typeof THREE==='undefined'){ e3Backdrop(p,'WebGL / Three.js nicht verfügbar'); return true; }
  try{
    if(!e3Ensure(p.width,p.height)){ e3Backdrop(p,'WebGL nicht verfügbar'); return true; }
    const key=ENT.model3d || 'bacteria';

    // file:// can't XHR-load local .glb — tell the user straight away
    if(location.protocol==='file:'){
      e3Backdrop(p, 'Über lokalen Server öffnen — file:// blockt 3D-Laden');
      return true;
    }

    if(key!==E3.current || (E3.loaded[key] && !E3.pivot.children.length)) e3SetModel(key);

    // backdrop first (3D is blitted on top with transparency)
    e3Backdrop(p, null);

    if(E3.error[key]){ e3Backdrop(p, E3.error[key]); return true; }
    if(!E3.loaded[key]){ e3Backdrop(p, 'lade Modell …'); return true; }

    // ---- apply adjustable parameters ----
    const scale = 0.55 + (ENT.mass||0.5);                       // size
    E3.pivot.scale.setScalar(scale);
    e3Drag(p);
    if(E3.autoSpin) E3.yaw += 0.006;
    E3.pivot.rotation.y = E3.yaw;

    const lvl = (ENT.bodyLight!=null ? ENT.bodyLight : 30)/30;   // brightness (1 ≈ default)
    E3.ambient.intensity = 0.45*lvl;
    E3.hemi.intensity    = 0.5*lvl;
    E3.key.intensity     = 1.0*lvl;
    E3.fill.intensity    = 0.4*lvl;
    const h=((ENT.bodyHue!=null?ENT.bodyHue:240)%360)/360;
    E3.key.color.setHSL(h, 0.45, 0.62);                          // colour tint via key light

    // ---- animation ----
    const dt=E3.clock.getDelta();
    if(E3.mixers[key]) E3.mixers[key].update(dt);

    E3.renderer.render(E3.scene, E3.cam);
    p.push(); p.drawingContext.drawImage(E3.renderer.domElement, 0,0, p.width, p.height); p.pop();

    if(ENT.render==='photo-grain'){ applyGrain(p,0.35); applyVignette(p); }
    else applyVignette(p);
    return true;
  }catch(e){
    console.warn('Entity 3D failed:', e); E3.failed=true;
    e3Backdrop(p,'3D-Fehler — siehe Konsole'); return true;
  }
}
