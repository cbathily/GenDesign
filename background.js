/* ============================================================
   BACKGROUND GENERATOR
   Prozedurale liminale Räume als wählbare SZENEN / LEVELS.
   Jede Szene hat eigene Palette, Geometrie + Signature-Details.
   Ein-Punkt-Perspektive + noise Wände + Fog + Grain.
   ============================================================ */

const BG = {
  hue: 50, depth: 7, light: 0.6, grain: 0.42, fog: 0.30,
  geo: 'corridor',
  scene: 'lobby',
  palette: 'lobby',   // kept for back-compat / UI sync
  seed: 1234,
};

/* ----------------------------------------------------------------
   SCENES — der Kern des Background-Generators.
   pal: base colors [r,g,b]   geo: renderer   detail: overlay key
   hue/light/fog/grain: empfohlene defaults beim Szenenwechsel
---------------------------------------------------------------- */
const BG_SCENES = {
  lobby: {
    label: 'Lobby', level: '0', title: 'The Lobby',
    desc:  'Endloses gelbes Tapetenlabyrinth, summende Leuchtstoffröhren, fleckiger Teppich.',
    pal: { wall:[168,152,58], floor:[150,132,66], ceil:[142,128,52], light:[255,248,188] },
    geo:'corridor', detail:'', hue:50, light:0.62, fog:0.34, grain:0.46,
  },
  habitable: {
    label: 'Habitable Zone', level: '1', title: 'The Habitable Zone',
    desc:  'Industrieller Beton, flackernde Lichter, Rohre und Treppenhäuser.',
    pal: { wall:[120,122,120], floor:[92,93,90], ceil:[104,106,104], light:[225,232,240] },
    geo:'corridor', detail:'pipes_v', hue:210, light:0.42, fog:0.26, grain:0.40,
  },
  pipes: {
    label: 'Pipe Dreams', level: '2', title: 'Pipe Dreams',
    desc:  'Heißer, dunkler Tunnel aus kilometerlangen rostigen Rohren und Maschinerie.',
    pal: { wall:[78,58,46], floor:[52,40,32], ceil:[44,34,28], light:[255,156,86] },
    geo:'corridor', detail:'pipes_h', hue:24, light:0.30, fog:0.46, grain:0.52,
  },
  substation: {
    label: 'Substation', level: '3', title: 'Electrical Substation',
    desc:  'Dunkle Betonhallen voller Transformatoren, Kabel und sirrender Hochspannung.',
    pal: { wall:[80,82,86], floor:[52,54,58], ceil:[40,42,46], light:[255,236,140] },
    geo:'corridor', detail:'substation', hue:48, light:0.34, fog:0.34, grain:0.48,
  },
  office: {
    label: 'Office', level: '4', title: 'The Abandoned Office',
    desc:  'Verlassenes Großraumbüro: Kabinen, Rasterdecke, totes Neonlicht.',
    pal: { wall:[178,170,150], floor:[120,112,96], ceil:[202,198,186], light:[246,248,236] },
    geo:'corridor', detail:'office', hue:46, light:0.55, fog:0.26, grain:0.40,
  },
  hotel: {
    label: 'Terror Hotel', level: '5', title: 'Terror Hotel',
    desc:  'Endloser Hotelflur, gemusterter Teppich, nummerierte Türen, blutrote Tapete.',
    pal: { wall:[122,42,44], floor:[74,32,36], ceil:[60,28,30], light:[242,184,124] },
    geo:'corridor', detail:'hotel', hue:354, light:0.40, fog:0.34, grain:0.44,
  },
  lightsout: {
    label: 'Lights Out', level: '6', title: 'Lights Out',
    desc:  'Vollkommene Dunkelheit. Nur der Strahl deiner Lampe — und etwas, das wartet.',
    pal: { wall:[30,30,32], floor:[18,18,20], ceil:[12,12,14], light:[210,222,255] },
    geo:'corridor', detail:'lightsout', hue:220, light:0.50, fog:0.18, grain:0.52,
  },
  thalasso: {
    label: 'Thalassophobia', level: '7', title: 'Thalassophobia',
    desc:  'Endloses tiefes Wasser. Lichtstrahlen von oben, schwarzer Abgrund darunter.',
    pal: { wall:[20,60,90], floor:[6,20,40], ceil:[60,120,160], light:[160,220,255] },
    geo:'open', detail:'thalasso', hue:205, light:0.50, fog:0.40, grain:0.30,
  },
  cave: {
    label: 'Cave System', level: '8', title: 'Cave System',
    desc:  'Feuchtes Höhlensystem aus Fels, Stalaktiten und tropfender Finsternis.',
    pal: { wall:[62,56,50], floor:[34,30,26], ceil:[26,22,20], light:[255,200,130] },
    geo:'open', detail:'cave', hue:30, light:0.32, fog:0.42, grain:0.46,
  },
  pool: {
    label: 'Poolrooms', level: '37', title: 'The Poolrooms',
    desc:  'Verlassene, gekachelte Wasserwelten in sanft beleuchtetem, klarem Wasser.',
    pal: { wall:[124,196,210], floor:[80,166,200], ceil:[150,206,216], light:[236,252,255] },
    geo:'corridor', detail:'pool', hue:190, light:0.72, fog:0.30, grain:0.28,
  },
  playplace: {
    label: 'Playplace', level: 'Fun', title: 'Level Fun =)',
    desc:  'Regenbogen-Spielzone: Bällebad, Plastikröhren, falsche Fröhlichkeit.',
    pal: { wall:[150,162,170], floor:[120,152,96], ceil:[172,176,188], light:[255,242,212] },
    geo:'void', detail:'playplace', hue:140, light:0.78, fog:0.18, grain:0.34,
  },
  suburb: {
    label: 'Suburbs', level: '9', title: 'The Suburbs',
    desc:  'Endlos sich wiederholende nächtliche Vorstadt unter rotem Straßenlicht.',
    pal: { wall:[44,48,58], floor:[26,28,36], ceil:[18,22,40], light:[255,96,72] },
    geo:'outdoor', detail:'suburb', hue:8, light:0.36, fog:0.40, grain:0.42,
  },
  dreamcore: {
    label: 'Dreamcore Void', level: '∞', title: 'Dreamcore',
    desc:  'Weicher rosa Nebelraum, Nostalgie und Unbehagen, kaum greifbare Wände.',
    pal: { wall:[212,152,182], floor:[182,150,172], ceil:[202,170,202], light:[255,212,236] },
    geo:'void', detail:'dream', hue:320, light:0.70, fog:0.46, grain:0.30,
  },
};

// applied when a scene chip is chosen — pushes recommended look into BG
function bgApplyScene(name){
  const s = BG_SCENES[name]; if(!s) return;
  BG.scene = name; BG.palette = name;
  BG.geo = s.geo;
  BG.hue = s.hue; BG.light = s.light; BG.fog = s.fog; BG.grain = s.grain;
}
// back-compat alias (old code / prompt interpreter call this)
function bgApplyPalette(name){ bgApplyScene(BG_SCENES[name] ? name : 'lobby'); }

// shift an [r,g,b] toward a target hue by amount (0..1)
function hueShift(rgb, targetHue, amt){
  const c = color(rgb[0],rgb[1],rgb[2]);
  let h = hue(c), s = saturation(c), b = brightness(c);
  let nh = lerp(h, targetHue, amt);
  return color('hsb('+Math.round(nh)+','+Math.round(s)+'%,'+Math.round(b)+'%)');
}

function drawBackground(pg, t){
  const S = BG_SCENES[BG.scene] || BG_SCENES.lobby;
  const P = S.pal;
  const W = pg.width, H = pg.height;
  const cx = W/2, cy = H*0.46;             // vanishing point
  const amt = 0.4;                          // hue blend strength from slider
  pg.push();
  pg.colorMode(RGB,255);
  pg.noStroke();

  const wall  = hueShift(P.wall,  BG.hue, amt);
  const floor = hueShift(P.floor, BG.hue, amt);
  const ceil  = hueShift(P.ceil,  BG.hue, amt);
  const lite  = hueShift(P.light, BG.hue, amt);

  // ---- base fill (ceiling + floor split) ----
  pg.fill(ceil);  pg.rect(0,0,W,cy);
  pg.fill(floor); pg.rect(0,cy,W,H-cy);

  if (BG.scene === 'lobby'){
    drawLobby(pg,cx,cy,wall,floor,ceil,lite);
  } else if (BG.geo === 'void'){
    drawVoidRoom(pg,cx,cy,wall,floor,ceil,lite);
  } else if (BG.geo === 'outdoor'){
    drawOutdoor(pg,cx,cy,wall,floor,ceil,lite,t);
  } else if (BG.geo === 'open'){
    /* fully painted by the scene detail overlay (e.g. ocean, cave) */
  } else if (BG.geo === 'pillars'){
    drawCorridor(pg,cx,cy,wall,floor,ceil,lite,true);
  } else {
    drawCorridor(pg,cx,cy,wall,floor,ceil,lite,false);
  }

  // ---- scene-specific signature detail overlay ----
  bgDrawDetail(pg, S.detail, cx, cy, wall, floor, ceil, lite, t);

  // ---- light bloom at vanishing point (skip where the far end is meant to be dark) ----
  const noBloom = {lobby:1, lightsout:1, thalasso:1, cave:1};
  if (!noBloom[BG.scene]){
    const lightR = lerp(40,180,BG.light);
    for(let i=8;i>0;i--){
      pg.fill(red(lite),green(lite),blue(lite), 9*BG.light);
      pg.ellipse(cx,cy, lightR*i*0.5, lightR*i*0.32);
    }
  }

  // ---- fog / haze ----
  if(BG.fog>0){
    for(let i=0;i<5;i++){
      const a = BG.fog*22*(1-i/6);
      pg.fill(red(lite),green(lite),blue(lite),a);
      pg.rect(0, cy-20 + i*4, W, 60);
    }
    pg.fill(red(ceil),green(ceil),blue(ceil), BG.fog*120);
    pg.ellipse(cx,cy, W*0.5, H*0.4);
  }

  pg.pop();

  // ---- grain + vignette: shared post FX ----
  applyGrain(pg, BG.grain);
  applyVignette(pg);
}

// One-point-perspective corridor. Receding rectangular "frames".
function drawCorridor(pg,cx,cy,wall,floor,ceil,lite,pillars){
  const W=pg.width,H=pg.height;
  const layers = BG.depth;
  for(let i=layers;i>=1;i--){
    const f = i/layers;                  // 1 = near, ->0 far
    const w = lerp(W*0.12, W*1.05, f);
    const h = lerp(H*0.10, H*1.05, f);
    const x = cx - w/2, y = cy - h*0.5;
    const shade = lerp(0.55,1.0,f) * lerp(0.7,1.15,noise(i*0.5, BG.seed*0.01));
    pg.fill(red(wall)*shade, green(wall)*shade, blue(wall)*shade);
    pg.beginShape();
      pg.vertex(0, y); pg.vertex(x, y);
      pg.vertex(x, y+h); pg.vertex(0, y+h);
    pg.endShape(CLOSE);
    pg.beginShape();
      pg.vertex(W, y); pg.vertex(x+w, y);
      pg.vertex(x+w, y+h); pg.vertex(W, y+h);
    pg.endShape(CLOSE);
    pg.fill(red(ceil)*shade, green(ceil)*shade, blue(ceil)*shade);
    pg.beginShape();
      pg.vertex(0,0); pg.vertex(W,0); pg.vertex(x+w,y); pg.vertex(x,y);
    pg.endShape(CLOSE);
    pg.fill(red(floor)*shade*0.92, green(floor)*shade*0.92, blue(floor)*shade*0.92);
    pg.beginShape();
      pg.vertex(0,H); pg.vertex(W,H); pg.vertex(x+w,y+h); pg.vertex(x,y+h);
    pg.endShape(CLOSE);

    if(i%2===0){
      const ly = lerp(cy, y, 0.5);
      pg.fill(red(lite),green(lite),blue(lite), 200*shade);
      pg.rect(cx-w*0.06, y+ (h*0.02), w*0.12, h*0.015);
    }

    if(pillars && i<layers && i>1){
      const pw = w*0.09;
      const sh2 = shade*0.85;
      pg.fill(red(wall)*sh2, green(wall)*sh2, blue(wall)*sh2);
      pg.rect(x+w*0.16, y+h*0.12, pw, h*0.76);
      pg.rect(x+w*0.75, y+h*0.12, pw, h*0.76);
    }
  }
  const dw=W*0.07, dh=H*0.12;
  pg.fill(8,7,5);
  pg.rect(cx-dw/2, cy-dh*0.55, dw, dh);
}

/* ============================================================
   LEVEL 0 — THE LOBBY
   Echte Ein-Punkt-Perspektive: offener Raum, Decken-Raster mit
   Leuchtpanelen, freistehende Wandblöcke die in die Tiefe ziehen.
   Pinhole-Projektion proj(X,Y,Z): X seitlich, Y vertikal, Z Tiefe.
   ============================================================ */
function drawLobby(pg,cx,cy,wall,floor,ceil,lite){
  const W=pg.width,H=pg.height;
  const f = W*0.95;                       // focal length
  const CY = -1.15, FY = 1.0;             // ceiling / floor plane height (eye at 0)
  const proj=(X,Y,Z)=>({x:cx + f*X/Z, y:cy + f*Y/Z});
  const farZ = lerp(11, 24, (BG.depth-2)/12);

  // darken floor + ceiling toward the far end for depth
  pg.fill(red(floor)*0.95,green(floor)*0.95,blue(floor)*0.95); pg.rect(0,cy,W,H-cy);

  // ===== ceiling tile grid =====
  pg.stroke(red(ceil)*0.6,green(ceil)*0.6,blue(ceil)*0.6,150); pg.strokeWeight(1);
  for(let z=1; z<=farZ; z+=1){ const a=proj(-16,CY,z), b=proj(16,CY,z); pg.line(a.x,a.y,b.x,b.y); }
  for(let x=-16; x<=16; x+=1){ const a=proj(x,CY,1), b=proj(x,CY,farZ); pg.line(a.x,a.y,b.x,b.y); }
  pg.noStroke();

  // ===== recessed fluorescent panels + floor light pools =====
  const gctx=pg.drawingContext;
  for(let z=2; z<farZ; z+=2){
    const inten = constrain(map(z,2,farZ,1,0.18),0.18,1);
    for(let xc=-13.5; xc<=13.5; xc+=3){
      const p1=proj(xc-0.5,CY,z-0.45), p2=proj(xc+0.5,CY,z-0.45),
            p3=proj(xc+0.5,CY,z+0.45), p4=proj(xc-0.5,CY,z+0.45);
      // panel frame
      pg.fill(red(ceil)*0.5,green(ceil)*0.5,blue(ceil)*0.5);
      pg.quad(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y,p4.x,p4.y);
      // glowing panel
      const q1=proj(xc-0.4,CY,z-0.35), q2=proj(xc+0.4,CY,z-0.35),
            q3=proj(xc+0.4,CY,z+0.35), q4=proj(xc-0.4,CY,z+0.35);
      pg.fill(red(lite),green(lite),blue(lite), 245*inten);
      pg.quad(q1.x,q1.y,q2.x,q2.y,q3.x,q3.y,q4.x,q4.y);
      // soft pool of light on the floor below
      const fp=proj(xc,FY,z); const r=Math.max(8, f*1.1/z);
      gctx.save();
      const grad=gctx.createRadialGradient(fp.x,fp.y,0,fp.x,fp.y,r);
      grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.12*inten})`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      gctx.fillStyle=grad; gctx.fillRect(fp.x-r,fp.y-r,r*2,r*2); gctx.restore();
    }
  }

  // ===== freestanding wall blocks (the iconic backrooms pillars) =====
  const boxes=[];
  for(let z=3.2; z<farZ-0.5; z+=2.1){
    for(let lane=-2; lane<=2; lane++){
      if(lane===0) continue;                                  // keep a loose centre path
      if(noise(z*0.42, lane*3.1, BG.seed*0.013) < 0.45) continue;
      const X = lane*2.7 + (noise(z*0.7,lane*1.7)-0.5)*1.2;
      const w = 1.0 + noise(z,lane)*1.4;
      boxes.push({X, Z:z, w, d:0.85});
    }
  }
  boxes.sort((a,b)=>b.Z-a.Z);                                 // far → near (painter's)
  for(const b of boxes) drawLobbyBox(pg,proj,b,CY,FY,wall,lite,farZ);

  // ===== far darkness — the unknown openings down the hall =====
  gctx.save();
  const dk=gctx.createRadialGradient(cx,cy,0,cx,cy,W*0.30);
  dk.addColorStop(0,'rgba(8,7,4,0.6)');
  dk.addColorStop(1,'rgba(8,7,4,0)');
  gctx.fillStyle=dk; gctx.fillRect(cx-W*0.32,cy-W*0.32,W*0.64,W*0.64);
  gctx.restore();
}

function drawLobbyBox(pg,proj,b,CY,FY,wall,lite,farZ){
  const zN=b.Z-b.d/2, zF=b.Z+b.d/2;
  const xL=b.X-b.w/2, xR=b.X+b.w/2;
  const ftl=proj(xL,CY,zN), ftr=proj(xR,CY,zN), fbr=proj(xR,FY,zN), fbl=proj(xL,FY,zN);
  const shade=constrain(map(b.Z,3,farZ,1.08,0.42),0.42,1.08);
  const lp=(a,c,t)=>({x:a.x+(c.x-a.x)*t, y:a.y+(c.y-a.y)*t});

  // contact shadow on the floor
  pg.fill(0,0,0,60);
  const s1=proj(xL-0.15,FY,zN), s2=proj(xR+0.15,FY,zN),
        s3=proj(xR+0.5,FY,zF+0.4), s4=proj(xL-0.5,FY,zF+0.4);
  pg.quad(s1.x,s1.y,s2.x,s2.y,s3.x,s3.y,s4.x,s4.y);

  // visible side face (the one turned toward the camera centre)
  pg.fill(red(wall)*shade*0.58,green(wall)*shade*0.58,blue(wall)*shade*0.58);
  if(b.X>=0){
    const stl=proj(xL,CY,zF), sbl=proj(xL,FY,zF);
    pg.quad(ftl.x,ftl.y, stl.x,stl.y, sbl.x,sbl.y, fbl.x,fbl.y);
  } else {
    const str=proj(xR,CY,zF), sbr=proj(xR,FY,zF);
    pg.quad(ftr.x,ftr.y, str.x,str.y, sbr.x,sbr.y, fbr.x,fbr.y);
  }

  // front face
  pg.fill(red(wall)*shade,green(wall)*shade,blue(wall)*shade);
  pg.quad(ftl.x,ftl.y, ftr.x,ftr.y, fbr.x,fbr.y, fbl.x,fbl.y);
  // soft top-down light wash (brighter near ceiling)
  const mL=lp(ftl,fbl,0.45), mR=lp(ftr,fbr,0.45);
  pg.fill(red(lite),green(lite),blue(lite), 30*shade);
  pg.quad(ftl.x,ftl.y, ftr.x,ftr.y, mR.x,mR.y, mL.x,mL.y);
  // faint wallpaper seams
  pg.stroke(red(wall)*shade*0.78,green(wall)*shade*0.78,blue(wall)*shade*0.78,55); pg.strokeWeight(1);
  for(let k=1;k<5;k++){ const tt=k/5; const a=lp(ftl,ftr,tt), c=lp(fbl,fbr,tt); pg.line(a.x,a.y,c.x,c.y); }
  pg.noStroke();
}

/* ============================================================
   LOBBY — WALK MODE (first-person prototype)
   Bewegliche Kamera (x,z,yaw), WASD + Pfeile, Kollision gegen
   Blöcke. Welt ist ein unendliches deterministisches Raster:
   jede Zelle (i,j) trägt evtl. einen Wandblock (per noise).
   ============================================================ */
const EXPLORE = { on:false, x:0, z:0, yaw:0, speed:0.11, turn:0.045, keys:{} };
const LOBBY_CS = 2.7;            // grid cell size (block spacing)
const LOBBY_CY = -1.15, LOBBY_FY = 1.0;

// deterministic block for grid cell (i,j) — or null if the cell is open
function lobbyBlock(i,j){
  if(noise(i*0.35+500, j*0.35+500) < 0.55) return null;
  const jx=(noise(i*0.9, j*0.9)-0.5)*1.0;
  const jz=(noise(i*0.9+9, j*0.9+9)-0.5)*1.0;
  const w=0.9 + noise(i,j)*1.4;
  const d=0.8 + noise(i+3,j+3)*0.7;
  return { X:i*LOBBY_CS+jx, Z:j*LOBBY_CS+jz, w, d };
}
// is world point (x,z) inside any block (inflated by player radius)?
function lobbyBlocked(x,z){
  const r=0.42, ci=Math.round(x/LOBBY_CS), cj=Math.round(z/LOBBY_CS);
  for(let i=ci-1;i<=ci+1;i++) for(let j=cj-1;j<=cj+1;j++){
    const b=lobbyBlock(i,j); if(!b) continue;
    if(x>b.X-b.w/2-r && x<b.X+b.w/2+r && z>b.Z-b.d/2-r && z<b.Z+b.d/2+r) return true;
  }
  return false;
}
// read keys, move the camera with per-axis collision (so you slide along walls)
function updateExplore(){
  const k=EXPLORE.keys;
  if(k['ArrowLeft'])  EXPLORE.yaw-=EXPLORE.turn;
  if(k['ArrowRight']) EXPLORE.yaw+=EXPLORE.turn;
  let mvF=0, mvR=0;
  if(k['KeyW']||k['ArrowUp'])   mvF+=1;
  if(k['KeyS']||k['ArrowDown']) mvF-=1;
  if(k['KeyA']) mvR-=1;
  if(k['KeyD']) mvR+=1;
  if(!mvF && !mvR) return;
  const s=Math.sin(EXPLORE.yaw), c=Math.cos(EXPLORE.yaw), sp=EXPLORE.speed;
  const nx=EXPLORE.x + (s*mvF + c*mvR)*sp;   // forward=(s,c), right=(c,-s)
  const nz=EXPLORE.z + (c*mvF - s*mvR)*sp;
  if(!lobbyBlocked(nx, EXPLORE.z)) EXPLORE.x=nx;
  if(!lobbyBlocked(EXPLORE.x, nz)) EXPLORE.z=nz;
}

function drawLobbyWalk(pg){
  const W=pg.width,H=pg.height,cx=W/2,cy=H*0.5;
  const f=W*0.9, near=0.28;
  const P=BG_SCENES.lobby.pal, amt=0.4;
  const wall=hueShift(P.wall,BG.hue,amt), floor=hueShift(P.floor,BG.hue,amt),
        ceil=hueShift(P.ceil,BG.hue,amt), lite=hueShift(P.light,BG.hue,amt);
  const sN=Math.sin(EXPLORE.yaw), cN=Math.cos(EXPLORE.yaw);
  // world -> screen (camera relative). returns {ez, x, y}
  const proj=(wx,wy,wz)=>{
    const dx=wx-EXPLORE.x, dz=wz-EXPLORE.z;
    const ex=dx*cN - dz*sN, ez=dx*sN + dz*cN;
    return {ez, x:cx+f*ex/ez, y:cy+f*wy/ez};
  };

  pg.push(); pg.colorMode(RGB,255); pg.noStroke();
  // ceiling + floor planes
  pg.fill(ceil);  pg.rect(0,0,W,cy);
  pg.fill(floor); pg.rect(0,cy,W,H-cy);

  const ci=Math.round(EXPLORE.x/LOBBY_CS), cj=Math.round(EXPLORE.z/LOBBY_CS);
  const R=14;
  const gctx=pg.drawingContext;

  // ---- ceiling tile panels + floor light pools (forward cells only) ----
  for(let i=ci-R;i<=ci+R;i++) for(let j=cj-R;j<=cj+R;j++){
    const ccx=i*LOBBY_CS, ccz=j*LOBBY_CS;
    const ctr=proj(ccx,LOBBY_CY,ccz); if(ctr.ez<near || ctr.ez>40) continue;
    const inten=constrain(map(ctr.ez,1,34,1,0.12),0.12,1);
    // tile frame
    const f1=proj(ccx-0.62,LOBBY_CY,ccz-0.62), f2=proj(ccx+0.62,LOBBY_CY,ccz-0.62),
          f3=proj(ccx+0.62,LOBBY_CY,ccz+0.62), f4=proj(ccx-0.62,LOBBY_CY,ccz+0.62);
    if(f1.ez>near&&f2.ez>near&&f3.ez>near&&f4.ez>near){
      pg.fill(red(ceil)*0.55,green(ceil)*0.55,blue(ceil)*0.55);
      pg.quad(f1.x,f1.y,f2.x,f2.y,f3.x,f3.y,f4.x,f4.y);
      // glowing panel
      const g1=proj(ccx-0.42,LOBBY_CY,ccz-0.42), g2=proj(ccx+0.42,LOBBY_CY,ccz-0.42),
            g3=proj(ccx+0.42,LOBBY_CY,ccz+0.42), g4=proj(ccx-0.42,LOBBY_CY,ccz+0.42);
      pg.fill(red(lite),green(lite),blue(lite),245*inten);
      pg.quad(g1.x,g1.y,g2.x,g2.y,g3.x,g3.y,g4.x,g4.y);
    }
    // floor pool
    const fp=proj(ccx,LOBBY_FY,ccz);
    if(fp.ez>near){ const r=Math.max(8,f*1.0/fp.ez);
      gctx.save(); const grad=gctx.createRadialGradient(fp.x,fp.y,0,fp.x,fp.y,r);
      grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.11*inten})`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      gctx.fillStyle=grad; gctx.fillRect(fp.x-r,fp.y-r,r*2,r*2); gctx.restore();
    }
  }

  // ---- wall blocks: collect visible vertical faces, paint far -> near ----
  const faces=[];
  for(let i=ci-R;i<=ci+R;i++) for(let j=cj-R;j<=cj+R;j++){
    const b=lobbyBlock(i,j); if(!b) continue;
    const xL=b.X-b.w/2, xR=b.X+b.w/2, zN=b.Z-b.d/2, zF=b.Z+b.d/2;
    const push=(x1,z1,x2,z2,tone)=>{
      const a=proj(x1,LOBBY_CY,z1), bb=proj(x2,LOBBY_CY,z2),
            c=proj(x2,LOBBY_FY,z2), d=proj(x1,LOBBY_FY,z1);
      if(a.ez<near||bb.ez<near||c.ez<near||d.ez<near) return;
      faces.push({a,b:bb,c,d,depth:(a.ez+bb.ez)/2,tone});
    };
    if(EXPLORE.x<xL)       push(xL,zN,xL,zF,0.6);
    else if(EXPLORE.x>xR)  push(xR,zF,xR,zN,0.6);
    if(EXPLORE.z<zN)       push(xR,zN,xL,zN,1.0);
    else if(EXPLORE.z>zF)  push(xL,zF,xR,zF,1.0);
  }
  faces.sort((p,q)=>q.depth-p.depth);
  for(const fc of faces){
    const sh=constrain(map(fc.depth,2,R*LOBBY_CS,1.05,0.32),0.32,1.05)*fc.tone;
    pg.fill(red(wall)*sh,green(wall)*sh,blue(wall)*sh);
    pg.quad(fc.a.x,fc.a.y,fc.b.x,fc.b.y,fc.c.x,fc.c.y,fc.d.x,fc.d.y);
    // top light wash
    const lp=(u,v,t)=>({x:u.x+(v.x-u.x)*t,y:u.y+(v.y-u.y)*t});
    const mL=lp(fc.a,fc.d,0.45), mR=lp(fc.b,fc.c,0.45);
    pg.fill(red(lite),green(lite),blue(lite),22*sh);
    pg.quad(fc.a.x,fc.a.y,fc.b.x,fc.b.y,mR.x,mR.y,mL.x,mL.y);
  }
  pg.pop();

  // ---- far darkness toward the horizon ----
  gctx.save();
  const dk=gctx.createRadialGradient(cx,cy,0,cx,cy,W*0.34);
  dk.addColorStop(0,'rgba(8,7,4,0.55)'); dk.addColorStop(1,'rgba(8,7,4,0)');
  gctx.fillStyle=dk; gctx.fillRect(cx-W*0.36,cy-W*0.36,W*0.72,W*0.72); gctx.restore();

  applyGrain(pg, BG.grain);
  applyVignette(pg);
  drawWalkHUD(pg,cx,cy);
}

function drawWalkHUD(pg,cx,cy){
  const H=pg.height;
  // crosshair
  pg.stroke(230,225,200,150); pg.strokeWeight(1);
  pg.line(cx-6,cy,cx+6,cy); pg.line(cx,cy-6,cx,cy+6); pg.noStroke();
  // control hint
  pg.fill(0,0,0,120); pg.rect(14,H-58,256,44);
  pg.fill(232,214,150); pg.textFont('monospace'); pg.textSize(11);
  pg.text('▶ EXPLORE · LEVEL 0', 24, H-40);
  pg.fill(180,168,120);
  pg.text('W A S D move   ← → turn   ESC exit', 24, H-23);
}

function drawVoidRoom(pg,cx,cy,wall,floor,ceil,lite){
  const W=pg.width,H=pg.height;
  const bw=W*0.62, bh=H*0.5;
  const bx=cx-bw/2, by=cy-bh*0.5;
  pg.fill(red(wall)*0.8,green(wall)*0.8,blue(wall)*0.8);
  pg.rect(bx,by,bw,bh);
  pg.fill(red(wall)*0.62,green(wall)*0.62,blue(wall)*0.62);
  pg.beginShape();pg.vertex(0,0);pg.vertex(bx,by);pg.vertex(bx,by+bh);pg.vertex(0,H);pg.endShape(CLOSE);
  pg.beginShape();pg.vertex(W,0);pg.vertex(bx+bw,by);pg.vertex(bx+bw,by+bh);pg.vertex(W,H);pg.endShape(CLOSE);
  pg.fill(red(ceil)*0.9,green(ceil)*0.9,blue(ceil)*0.9);
  pg.beginShape();pg.vertex(0,0);pg.vertex(W,0);pg.vertex(bx+bw,by);pg.vertex(bx,by);pg.endShape(CLOSE);
  for(let i=0;i<3;i++){
    pg.fill(red(lite),green(lite),blue(lite),180);
    pg.rect(cx-60+i*60-30, by+18, 26, 8);
  }
  pg.fill(8,7,5); pg.rect(cx-W*0.03, by+bh*0.55, W*0.06, bh*0.42);
}

/* Outdoor looping suburb: night sky, receding road, house silhouettes */
function drawOutdoor(pg,cx,cy,wall,floor,ceil,lite,t){
  const W=pg.width,H=pg.height;
  // night sky gradient over the upper half
  for(let y=0;y<cy;y++){
    const k=y/cy;
    pg.stroke(lerp(red(ceil)*0.5,red(ceil),k), lerp(green(ceil)*0.5,green(ceil),k), lerp(blue(ceil)*0.5,blue(ceil),k));
    pg.line(0,y,W,y);
  }
  pg.noStroke();
  // dark ground
  pg.fill(red(floor)*0.6,green(floor)*0.6,blue(floor)*0.6); pg.rect(0,cy,W,H-cy);
  // road receding to vanishing point
  pg.fill(18,18,22);
  pg.beginShape();
    pg.vertex(cx-W*0.02,cy); pg.vertex(cx+W*0.02,cy);
    pg.vertex(W*0.78,H); pg.vertex(W*0.22,H);
  pg.endShape(CLOSE);
  // center road dashes
  pg.fill(200,190,120,150);
  for(let i=1;i<6;i++){
    const f=i/6; const yy=lerp(cy,H,f); const dw=lerp(1.5,9,f);
    pg.rect(cx-dw/2, yy, dw, lerp(2,14,f));
  }
  // house rows both sides (looping silhouettes)
  for(let side=-1;side<=1;side+=2){
    for(let i=4;i>=1;i--){
      const f=i/5; const depth=lerp(0.08,0.9,f);
      const hw=lerp(W*0.05,W*0.30,depth);
      const hh=lerp(H*0.06,H*0.34,depth);
      const baseX = cx + side*(lerp(W*0.06,W*0.62,depth));
      const x = side<0 ? baseX-hw : baseX;
      const y = cy - hh*0.15;
      const sh=lerp(0.5,1,depth);
      pg.fill(red(wall)*sh,green(wall)*sh,blue(wall)*sh);
      pg.rect(x,y,hw,hh);
      // roof
      pg.beginShape();
        pg.vertex(x-hw*0.06,y); pg.vertex(x+hw*1.06,y); pg.vertex(x+hw*0.5,y-hh*0.32);
      pg.endShape(CLOSE);
      // lit windows
      if(noise(i*1.7, side*3.1, BG.seed*0.01)>0.45){
        pg.fill(255,200,120,200*sh);
        pg.rect(x+hw*0.2, y+hh*0.25, hw*0.18, hh*0.18);
        pg.rect(x+hw*0.6, y+hh*0.25, hw*0.18, hh*0.18);
      }
    }
  }
  // street-lamp glows tinted by light color (red/green sodium vibe)
  for(let side=-1;side<=1;side+=2){
    for(let i=3;i>=1;i--){
      const f=i/4; const yy=lerp(cy+10,H*0.9,f);
      const xx=cx+side*lerp(W*0.05,W*0.42,f);
      const r=lerp(14,60,f);
      const g=pg.drawingContext; g.save();
      const grad=g.createRadialGradient(xx,yy,0,xx,yy,r);
      grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.5)`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad; g.fillRect(xx-r,yy-r,r*2,r*2); g.restore();
    }
  }
  // stars
  for(let i=0;i<40;i++){
    const sx=(noise(i*0.3,1)*W); const sy=noise(i*0.3,9)*cy*0.9;
    pg.fill(255,255,255, 120*noise(i,t*0.2));
    pg.rect(sx,sy,1.4,1.4);
  }
}

/* ============================================================
   SCENE DETAIL OVERLAYS — signature features per scene
   ============================================================ */
function bgDrawDetail(pg, kind, cx, cy, wall, floor, ceil, lite, t){
  const W=pg.width,H=pg.height;
  switch(kind){
    case 'lobby':      detailLobby(pg,cx,cy,wall,lite); break;
    case 'pipes_v':    detailPipesV(pg,cx,cy,wall,lite); break;
    case 'pipes_h':    detailPipesH(pg,cx,cy,wall,lite,t); break;
    case 'pool':       detailPool(pg,cx,cy,floor,lite,t); break;
    case 'playplace':  detailPlayplace(pg,cx,cy,t); break;
    case 'dream':      detailDream(pg,cx,cy,lite,t); break;
    case 'substation': detailSubstation(pg,cx,cy,wall,lite,t); break;
    case 'office':     detailOffice(pg,cx,cy,wall,lite); break;
    case 'hotel':      detailHotel(pg,cx,cy,wall,lite); break;
    case 'lightsout':  detailLightsout(pg,cx,cy,wall,lite,t); break;
    case 'thalasso':   detailThalasso(pg,cx,cy,floor,ceil,lite,t); break;
    case 'cave':       detailCave(pg,cx,cy,wall,floor,lite,t); break;
    // suburb handled inside drawOutdoor
  }
}

// faint wallpaper seams + extra ceiling tube glow
function detailLobby(pg,cx,cy,wall,lite){
  const W=pg.width,H=pg.height;
  pg.stroke(red(wall)*0.7,green(wall)*0.7,blue(wall)*0.7,90); pg.strokeWeight(1);
  for(let i=1;i<7;i++){ const f=i/7; const y=lerp(0,cy,f); pg.line(0,y, cx, cy*0.5+ y*0.3); pg.line(W,y, cx, cy*0.5+ y*0.3); }
  pg.noStroke();
  // hum glow on nearest ceiling tube
  const g=pg.drawingContext; g.save();
  const grad=g.createRadialGradient(cx,cy*0.55,0,cx,cy*0.55,W*0.4);
  grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.22)`);
  grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad; g.fillRect(0,0,W,cy); g.restore();
}

// vertical pipes hugging both side walls + brackets (habitable zone)
function detailPipesV(pg,cx,cy,wall,lite){
  const W=pg.width,H=pg.height;
  for(let side=-1;side<=1;side+=2){
    const baseX = cx + side*W*0.40;
    for(let p=0;p<3;p++){
      const x = baseX + side*p*W*0.035;
      const pw = W*0.018;
      // metallic shading
      pg.fill(160,162,165); pg.rect(x-pw/2,0,pw,H);
      pg.fill(200,202,205); pg.rect(x-pw*0.18,0,pw*0.25,H); // highlight
      pg.fill(70,72,76,120); pg.rect(x+pw*0.18,0,pw*0.22,H); // shadow
      // brackets
      pg.fill(60,62,66);
      for(let b=1;b<6;b++){ const by=H*b/6; pg.rect(x-pw*0.8,by,pw*1.6,4); }
    }
  }
  // a stairwell rail hint at the far doorway
  pg.stroke(90,92,96,160); pg.strokeWeight(2);
  for(let s=0;s<4;s++){ const y=cy+ s*8; pg.line(cx-30,y, cx+30,y); }
  pg.noStroke();
}

// crisscrossing horizontal/diagonal rusted pipes (pipe dreams)
function detailPipesH(pg,cx,cy,wall,lite,t){
  const W=pg.width,H=pg.height;
  const rust=[[120,70,40],[92,52,30],[140,86,48]];
  for(let i=0;i<9;i++){
    const y = (i/9)*H + Math.sin(i*1.3)*10;
    const th = lerp(6,22, i/9);
    const c = rust[i%3];
    pg.fill(c[0]*0.6,c[1]*0.6,c[2]*0.6); pg.rect(0,y,W,th);
    pg.fill(c[0],c[1],c[2]); pg.rect(0,y,W,th*0.45);          // top highlight
    pg.fill(c[0]*0.3,c[1]*0.3,c[2]*0.3); pg.rect(0,y+th*0.7,W,th*0.3);
    // joints
    pg.fill(50,30,18);
    for(let j=0;j<5;j++){ const jx=(j+0.5)*W/5; pg.rect(jx-th*0.4,y-th*0.2,th*0.8,th*1.4); }
  }
  // a couple of diagonal pipes toward vanishing point
  pg.stroke(150,92,52); pg.strokeWeight(10);
  pg.line(0,H*0.2,cx,cy); pg.line(W,H*0.85,cx,cy);
  pg.noStroke();
  // warm steam glow
  const g=pg.drawingContext; g.save();
  const grad=g.createRadialGradient(cx,cy,0,cx,cy,W*0.5);
  grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.25)`);
  grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad; g.fillRect(0,0,W,H); g.restore();
}

// tile grid on walls/floor + shimmering water + caustics (poolrooms)
function detailPool(pg,cx,cy,floor,lite,t){
  const W=pg.width,H=pg.height;
  // tile grid on the lower (floor/water) region, perspective-ish
  pg.stroke(255,255,255,40); pg.strokeWeight(1);
  for(let i=1;i<10;i++){ const f=i/10; const y=lerp(cy,H,f*f); pg.line(0,y,W,y); }
  for(let i=-6;i<=6;i++){ const x=cx + i*W*0.08; pg.line(cx, cy, x, H); }
  pg.noStroke();
  // water surface band with moving shimmer
  for(let i=0;i<6;i++){
    const y = cy + (H-cy)*0.35 + i*6;
    const a = 60 - i*8;
    pg.fill(red(lite),green(lite),blue(lite), a);
    pg.beginShape();
    for(let x=0;x<=W;x+=12){ pg.vertex(x, y + Math.sin(x*0.03 + t*2 + i)*4); }
    pg.vertex(W,y+14); pg.vertex(0,y+14);
    pg.endShape(CLOSE);
  }
  // caustic light dots
  for(let i=0;i<30;i++){
    const x = (noise(i*0.5, t*0.3)*W);
    const y = cy + noise(i*0.5, 5, t*0.3)*(H-cy);
    pg.fill(255,255,255, 70*noise(i,t));
    pg.ellipse(x,y, 6+noise(i)*8, 3+noise(i)*4);
  }
}

// ball pit + plastic play tubes (the playplace)
function detailPlayplace(pg,cx,cy,t){
  const W=pg.width,H=pg.height;
  const cols=[[230,70,80],[245,200,60],[70,150,230],[80,200,120],[240,140,200]];
  // translucent play-tube arcs in the back
  for(let a=0;a<3;a++){
    const c=cols[a]; pg.noFill(); pg.strokeWeight(W*0.05);
    pg.stroke(c[0],c[1],c[2],90);
    pg.arc(cx + (a-1)*W*0.28, cy+H*0.05, W*0.4, W*0.4, PI+0.4, TWO_PI-0.4);
  }
  pg.noStroke();
  // ball pit filling lower third
  const top = H*0.62;
  for(let row=0; row<8; row++){
    const y = top + row* (H-top)/8;
    const r = lerp(8, 26, row/8);
    for(let x=-r; x<W+r; x+=r*1.7){
      const jitter = (noise(x*0.05,row, BG.seed*0.01)-0.5)*r;
      const c=cols[(Math.floor(x*0.13)+row)%cols.length];
      pg.fill(c[0],c[1],c[2]);
      pg.ellipse(x+jitter, y, r*1.7, r*1.7);
      pg.fill(255,255,255,110);
      pg.ellipse(x+jitter-r*0.35, y-r*0.35, r*0.5, r*0.5); // highlight
    }
  }
}

// extra dreamy bloom + drifting soft orbs (dreamcore void)
function detailDream(pg,cx,cy,lite,t){
  const W=pg.width,H=pg.height;
  const g=pg.drawingContext; g.save();
  for(let i=0;i<5;i++){
    const x = cx + Math.sin(t*0.4+i)*W*0.3;
    const y = cy + Math.cos(t*0.3+i*1.7)*H*0.2;
    const r = 60+i*30;
    const grad=g.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.16)`);
    grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad; g.fillRect(x-r,y-r,r*2,r*2);
  }
  g.restore();
}

// LEVEL 3 — transformers, cables, warning stripes, electric sparks
function detailSubstation(pg,cx,cy,wall,lite,t){
  const W=pg.width,H=pg.height;
  // transformer cabinets flanking the corridor
  for(let side=-1;side<=1;side+=2){
    for(let i=2;i>=1;i--){
      const f=i/3; const bw=lerp(W*0.06,W*0.20,f), bh=lerp(H*0.12,H*0.42,f);
      const x = cx + side*lerp(W*0.18,W*0.5,f) - (side<0?bw:0);
      const y = cy + H*0.06 - bh*0.3;
      const sh=lerp(0.5,1,f);
      pg.fill(70*sh,72*sh,76*sh); pg.rect(x,y,bw,bh);
      pg.fill(50*sh,52*sh,56*sh); pg.rect(x,y,bw,bh*0.12);          // vent top
      // cooling fins
      pg.stroke(40*sh,42*sh,46*sh); pg.strokeWeight(1);
      for(let k=1;k<6;k++){ const yy=y+bh*0.15+ k*bh*0.12; pg.line(x+2,yy,x+bw-2,yy); }
      pg.noStroke();
      // warning label
      pg.fill(240*sh,210*sh,40*sh); pg.rect(x+bw*0.25,y+bh*0.45,bw*0.5,bh*0.12);
    }
  }
  // drooping cables across the top
  pg.noFill(); pg.stroke(20,20,22); pg.strokeWeight(2);
  for(let i=0;i<4;i++){ const y=H*0.06+i*10; pg.bezier(0,y, cx*0.6,y+40, cx*1.4,y+40, W,y); }
  pg.stroke(30,30,34); pg.strokeWeight(2);
  pg.line(cx-W*0.3,H*0.05,cx,cy*0.9); pg.line(cx+W*0.3,H*0.05,cx,cy*0.9);
  pg.noStroke();
  // random electric spark glow
  if(noise(t*4)>0.78){
    const sx=cx + (noise(t*3,1)-0.5)*W*0.6, sy=cy + (noise(t*3,2)-0.5)*H*0.3;
    const g=pg.drawingContext; g.save();
    const grad=g.createRadialGradient(sx,sy,0,sx,sy,60);
    grad.addColorStop(0,'rgba(190,220,255,0.7)'); grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad; g.fillRect(sx-60,sy-60,120,120); g.restore();
    pg.stroke(220,235,255,200); pg.strokeWeight(1.5);
    let px=sx,py=sy; for(let s=0;s<6;s++){ const nx=px+(Math.random()-0.5)*30, ny=py+(Math.random()-0.5)*30; pg.line(px,py,nx,ny); px=nx;py=ny; }
    pg.noStroke();
  }
}

// LEVEL 4 — receding cubicle partitions + desks under dead fluorescents
function detailOffice(pg,cx,cy,wall,lite){
  const W=pg.width,H=pg.height;
  for(let side=-1;side<=1;side+=2){
    for(let i=5;i>=1;i--){
      const f=i/5; const pw=lerp(W*0.02,W*0.07,f), ph=lerp(H*0.06,H*0.22,f);
      const x = cx + side*lerp(W*0.08,W*0.46,f);
      const y = cy + H*0.1;
      const sh=lerp(0.55,1,f);
      // cubicle divider
      pg.fill(150*sh,142*sh,120*sh); pg.rect(side<0?x-pw:x, y-ph, pw, ph);
      pg.fill(120*sh,112*sh,92*sh);  pg.rect(side<0?x-pw:x, y-ph, pw, ph*0.08);
      // desk slab
      pg.fill(110*sh,96*sh,72*sh); pg.rect(side<0?x-pw*1.6:x-pw*0.6, y-ph*0.32, pw*1.6, ph*0.06);
      // monitor
      pg.fill(28,30,34); pg.rect(side<0?x-pw*1.1:x+pw*0.1, y-ph*0.5, pw*0.5, ph*0.18);
    }
  }
  // a couple of dead/flickering ceiling tubes
  pg.fill(red(lite),green(lite),blue(lite),60);
  pg.rect(cx-W*0.18,cy-2,W*0.36,3);
}

// LEVEL 5 — endless hotel hall: numbered doors, sconces, patterned runner
function detailHotel(pg,cx,cy,wall,lite){
  const W=pg.width,H=pg.height;
  for(let side=-1;side<=1;side+=2){
    for(let i=5;i>=1;i--){
      const f=i/5; const dw=lerp(W*0.015,W*0.06,f), dh=lerp(H*0.09,H*0.34,f);
      const x = cx + side*lerp(W*0.09,W*0.42,f) - (side<0?dw:0);
      const y = cy + H*0.02 - dh*0.1;
      const sh=lerp(0.5,1,f);
      // dark wood door
      pg.fill(60*sh,30*sh,28*sh); pg.rect(x,y,dw,dh);
      pg.fill(40*sh,20*sh,18*sh); pg.rect(x+dw*0.12,y+dh*0.1,dw*0.76,dh*0.36);
      pg.rect(x+dw*0.12,y+dh*0.54,dw*0.76,dh*0.36);
      // brass handle
      pg.fill(220*sh,180*sh,90*sh); pg.ellipse(x+(side<0?dw*0.2:dw*0.8), y+dh*0.5, dw*0.12, dw*0.12);
      // wall sconce glow above door
      const g=pg.drawingContext; g.save();
      const lx=x+dw*0.5, ly=y-dh*0.12, r=dw*1.4;
      const grad=g.createRadialGradient(lx,ly,0,lx,ly,r);
      grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.4*sh})`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad; g.fillRect(lx-r,ly-r,r*2,r*2); g.restore();
    }
  }
  // patterned carpet runner (diamonds) down the centre
  pg.fill(40,18,20); pg.beginShape();
    pg.vertex(cx-6,cy); pg.vertex(cx+6,cy); pg.vertex(W*0.68,H); pg.vertex(W*0.32,H);
  pg.endShape(CLOSE);
  pg.fill(150,120,60,150);
  for(let i=1;i<7;i++){ const f=i/7; const yy=lerp(cy,H,f*f); const s=lerp(2,18,f); pg.quad(cx,yy-s, cx+s,yy, cx,yy+s, cx-s,yy); }
}

// LEVEL 6 — near-total darkness, a flashlight cone, and eyes in the black
function detailLightsout(pg,cx,cy,wall,lite,t){
  const W=pg.width,H=pg.height;
  // blanket the whole frame in black
  pg.fill(4,4,6,250); pg.rect(0,0,W,H);
  // flashlight cone from lower-centre, drifting slightly
  const aim = cx + Math.sin(t*0.6)*W*0.12;
  const g=pg.drawingContext; g.save();
  const grad=g.createRadialGradient(aim,cy*0.9,0,aim,cy*0.9,W*0.5);
  grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.28)`);
  grad.addColorStop(0.5,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.06)`);
  grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad;
  g.beginPath(); g.moveTo(W*0.5,H);
  g.lineTo(aim-W*0.35, cy*0.5); g.lineTo(aim+W*0.35, cy*0.5); g.closePath(); g.fill();
  g.restore();
  // faint corridor walls revealed inside the cone
  pg.stroke(red(wall)*1.4,green(wall)*1.4,blue(wall)*1.4,40); pg.strokeWeight(1);
  pg.line(aim-W*0.32,cy*0.55, aim,cy*0.95); pg.line(aim+W*0.32,cy*0.55, aim,cy*0.95);
  pg.noStroke();
  // a pair of glowing eyes lurking in the dark
  const ex=cx + (noise(BG.seed*0.01)-0.5)*W*0.7, ey=cy + (noise(BG.seed*0.02)-0.3)*H*0.2;
  const blink = (Math.sin(t*0.9+BG.seed)*0.5+0.5);
  if(blink>0.2){
    pg.fill(220,40,40, 200*blink);
    pg.ellipse(ex-7,ey,6,4*blink+2); pg.ellipse(ex+7,ey,6,4*blink+2);
  }
}

// LEVEL 7 — deep open water: god rays, particles, an abyss, a far leviathan
function detailThalasso(pg,cx,cy,floor,ceil,lite,t){
  const W=pg.width,H=pg.height;
  // vertical depth gradient: lit surface -> black abyss
  const g=pg.drawingContext; g.save();
  const grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,`rgb(${red(ceil)|0},${green(ceil)|0},${blue(ceil)|0})`);
  grad.addColorStop(0.45,'rgb(14,46,74)');
  grad.addColorStop(1,'rgb(2,8,16)');
  g.fillStyle=grad; g.fillRect(0,0,W,H);
  // god rays from the surface
  g.globalCompositeOperation='lighter';
  for(let i=0;i<6;i++){
    const x = (i/5)*W + Math.sin(t*0.3+i)*20;
    const w = W*0.05;
    const lin=g.createLinearGradient(x,0,x+w*2,H*0.7);
    lin.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.10)`);
    lin.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=lin;
    g.beginPath(); g.moveTo(x,0); g.lineTo(x+w,0); g.lineTo(x+w*3,H*0.8); g.lineTo(x+w*1.5,H*0.8); g.closePath(); g.fill();
  }
  g.restore();
  // far leviathan silhouette
  pg.fill(0,0,0,90);
  pg.push(); pg.translate(cx + Math.sin(t*0.15)*W*0.2, cy+H*0.18);
  pg.beginShape();
    pg.vertex(-W*0.22,0); pg.vertex(-W*0.05,-H*0.05); pg.vertex(W*0.18,-H*0.02);
    pg.vertex(W*0.28,-H*0.06); pg.vertex(W*0.22,H*0.02); pg.vertex(W*0.05,H*0.05); pg.vertex(-W*0.22,H*0.02);
  pg.endShape(CLOSE);
  pg.pop();
  // drifting particles / marine snow
  for(let i=0;i<60;i++){
    const x=noise(i*0.7,1)*W;
    const y=(noise(i*0.7,2)*H + t*8) % H;
    pg.fill(220,235,255, 70*noise(i,t*0.5));
    pg.rect(x,y,1.6,1.6);
  }
}

// LEVEL 8 — rocky cavern: jagged stalactites/mites framing darkness, drips
function detailCave(pg,cx,cy,wall,floor,lite,t){
  const W=pg.width,H=pg.height;
  // dim ambient gradient
  const g=pg.drawingContext; g.save();
  const grad=g.createRadialGradient(cx,cy,0,cx,cy,W*0.6);
  grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},0.12)`);
  grad.addColorStop(0.4,'rgba(40,34,28,0.4)');
  grad.addColorStop(1,'rgba(6,5,4,0.95)');
  g.fillStyle=grad; g.fillRect(0,0,W,H); g.restore();
  // ceiling stalactites
  pg.fill(red(wall)*0.4,green(wall)*0.4,blue(wall)*0.4);
  pg.beginShape(); pg.vertex(0,0); pg.vertex(W,0);
  for(let x=W; x>=0; x-=W/14){
    const n=noise(x*0.02, BG.seed*0.01);
    pg.vertex(x, H*0.10 + n*H*0.28);
    pg.vertex(x-W/28, H*0.05);
  }
  pg.endShape(CLOSE);
  // floor stalagmites
  pg.fill(red(floor)*0.5,green(floor)*0.5,blue(floor)*0.5);
  pg.beginShape(); pg.vertex(0,H); pg.vertex(W,H);
  for(let x=W; x>=0; x-=W/12){
    const n=noise(x*0.025, 5, BG.seed*0.01);
    pg.vertex(x, H*0.92 - n*H*0.30);
    pg.vertex(x-W/24, H*0.97);
  }
  pg.endShape(CLOSE);
  // side rock masses
  pg.fill(red(wall)*0.32,green(wall)*0.32,blue(wall)*0.32);
  pg.beginShape(); pg.vertex(0,0); pg.vertex(W*0.16,0);
  for(let y=0;y<=H;y+=H/8){ pg.vertex(W*0.10+noise(y*0.02,9)*W*0.10, y); }
  pg.vertex(0,H); pg.endShape(CLOSE);
  pg.beginShape(); pg.vertex(W,0); pg.vertex(W*0.84,0);
  for(let y=0;y<=H;y+=H/8){ pg.vertex(W*0.90-noise(y*0.02,12)*W*0.10, y); }
  pg.vertex(W,H); pg.endShape(CLOSE);
  // occasional water drip
  const dx = noise(Math.floor(t*1.5))*W;
  const dy = (t*120) % H;
  pg.fill(200,220,235,120); pg.ellipse(dx,dy,2,6);
}

/* ---- grain & vignette: shared post FX ---- */
function applyGrain(pg, amount){
  if(amount<=0) return;
  pg.loadPixels();
  const d = pg.pixelDensity();
  const n = 4*(pg.width*d)*(pg.height*d);
  const strength = amount*46;
  for(let i=0;i<n;i+=4){
    const g = (Math.random()-0.5)*strength;
    pg.pixels[i]   += g;
    pg.pixels[i+1] += g;
    pg.pixels[i+2] += g;
  }
  pg.updatePixels();
}

function applyVignette(pg){
  const W=pg.width,H=pg.height;
  pg.push();pg.colorMode(RGB,255);pg.noFill();
  for(let i=0;i<60;i++){
    pg.stroke(0,0,0, i*0.6);
    pg.noFill();
    pg.rect(i*0.5, i*0.5, W-i, H-i);
  }
  pg.pop();
}
