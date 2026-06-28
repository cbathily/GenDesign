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
    geo:'corridor', detail:'', hue:210, light:0.42, fog:0.30, grain:0.42,
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
  } else if (BG.scene === 'habitable'){
    drawHabitable(pg,cx,cy,wall,floor,ceil,lite);
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
  const noBloom = {lobby:1, habitable:1, lightsout:1, thalasso:1, cave:1};
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
   LEVEL 1 — HABITABLE ZONE (concrete parking-garage style)
   Betonsäulen-Raster, lange Leuchtstoffröhren, feuchter Boden.
   ============================================================ */
function drawHabitable(pg,cx,cy,wall,floor,ceil,lite){
  const W=pg.width,H=pg.height;
  const f=W*0.95, CY=-1.15, FY=1.0;
  const proj=(X,Y,Z)=>({x:cx + f*X/Z, y:cy + f*Y/Z});
  const farZ=lerp(12,24,(BG.depth-2)/12);
  const gctx=pg.drawingContext;

  // darker concrete ceiling + floor
  pg.fill(red(ceil)*0.7,green(ceil)*0.7,blue(ceil)*0.7); pg.rect(0,0,W,cy);
  pg.fill(red(floor)*0.78,green(floor)*0.78,blue(floor)*0.78); pg.rect(0,cy,W,H-cy);

  // faint structural ceiling beams across the width
  pg.stroke(red(ceil)*0.45,green(ceil)*0.45,blue(ceil)*0.45,150); pg.strokeWeight(1);
  for(let z=2; z<=farZ; z+=2){ const a=proj(-16,CY,z), b=proj(16,CY,z); pg.line(a.x,a.y,b.x,b.y); }
  pg.noStroke();

  // long fluorescent tube rows over the aisles + floor pools
  for(const xc of [-4,0,4]){
    for(let z=1.6; z<farZ; z+=1.0){
      const inten=constrain(map(z,1.6,farZ,1,0.18),0.18,1);
      const a=proj(xc-0.09,CY,z), b=proj(xc+0.09,CY,z), c=proj(xc+0.09,CY,z+0.62), d=proj(xc-0.09,CY,z+0.62);
      pg.fill(red(lite),green(lite),blue(lite),248*inten);
      pg.quad(a.x,a.y,b.x,b.y,c.x,c.y,d.x,d.y);
      // bloom + wet floor reflection pool
      const ctr=proj(xc,CY,z+0.3), fp=proj(xc,FY,z+0.3), r=Math.max(8,f*0.9/z);
      gctx.save(); gctx.globalCompositeOperation='lighter';
      const hg=gctx.createRadialGradient(ctr.x,ctr.y,0,ctr.x,ctr.y,r*0.7);
      hg.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.4*inten})`);
      hg.addColorStop(1,'rgba(0,0,0,0)');
      gctx.fillStyle=hg; gctx.fillRect(ctr.x-r,ctr.y-r,r*2,r*2);
      const fpg=gctx.createRadialGradient(fp.x,fp.y,0,fp.x,fp.y,r);
      fpg.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.14*inten})`);
      fpg.addColorStop(1,'rgba(0,0,0,0)');
      gctx.fillStyle=fpg; gctx.fillRect(fp.x-r,fp.y-r*0.5,r*2,r); gctx.restore();
    }
  }

  // wet streaks on the concrete floor
  pg.fill(0,0,0,40);
  for(let i=0;i<6;i++){ const lane=-6+i*2.4; const a=proj(lane,FY,2.5), b=proj(lane+0.4,FY,2.5), c=proj(lane*0.4,FY,farZ), d=proj(lane*0.4-0.2,FY,farZ);
    pg.quad(a.x,a.y,b.x,b.y,c.x,c.y,d.x,d.y); }

  // regular grid of concrete columns
  const cols=[];
  for(let z=3; z<farZ-0.3; z+=2.6){
    for(const lane of [-6,-2,2,6]){
      cols.push({X:lane, Z:z, w:1.15, d:1.15, mark: noise(z*0.5,lane*0.7,BG.seed*0.01)>0.55});
    }
  }
  cols.sort((a,b)=>b.Z-a.Z);
  for(const c of cols) drawConcreteColumn(pg,proj,c,CY,FY,wall,lite,farZ);

  // far darkness
  gctx.save();
  const dk=gctx.createRadialGradient(cx,cy,0,cx,cy,W*0.34);
  dk.addColorStop(0,'rgba(6,7,9,0.62)'); dk.addColorStop(1,'rgba(6,7,9,0)');
  gctx.fillStyle=dk; gctx.fillRect(cx-W*0.36,cy-W*0.36,W*0.72,W*0.72); gctx.restore();
}

function drawConcreteColumn(pg,proj,b,CY,FY,wall,lite,farZ){
  const zN=b.Z-b.d/2, zF=b.Z+b.d/2, xL=b.X-b.w/2, xR=b.X+b.w/2;
  const ftl=proj(xL,CY,zN), ftr=proj(xR,CY,zN), fbr=proj(xR,FY,zN), fbl=proj(xL,FY,zN);
  const sh=constrain(map(b.Z,3,farZ,1.06,0.4),0.4,1.06);
  const lp=(a,c,t)=>({x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t});
  // contact shadow
  pg.fill(0,0,0,70);
  const s1=proj(xL-0.2,FY,zN), s2=proj(xR+0.2,FY,zN), s3=proj(xR+0.5,FY,zF+0.4), s4=proj(xL-0.5,FY,zF+0.4);
  pg.quad(s1.x,s1.y,s2.x,s2.y,s3.x,s3.y,s4.x,s4.y);
  // side face
  pg.fill(red(wall)*sh*0.62,green(wall)*sh*0.62,blue(wall)*sh*0.62);
  let sTL,sBL;
  if(b.X>=0){ sTL=proj(xL,CY,zF); sBL=proj(xL,FY,zF); pg.quad(ftl.x,ftl.y,sTL.x,sTL.y,sBL.x,sBL.y,fbl.x,fbl.y); }
  else { sTL=proj(xR,CY,zF); sBL=proj(xR,FY,zF); pg.quad(ftr.x,ftr.y,sTL.x,sTL.y,sBL.x,sBL.y,fbr.x,fbr.y); }
  // front face (concrete)
  pg.fill(red(wall)*sh,green(wall)*sh,blue(wall)*sh);
  pg.quad(ftl.x,ftl.y,ftr.x,ftr.y,fbr.x,fbr.y,fbl.x,fbl.y);
  // top-down light wash
  const mL=lp(ftl,fbl,0.4), mR=lp(ftr,fbr,0.4);
  pg.fill(red(lite),green(lite),blue(lite),26*sh);
  pg.quad(ftl.x,ftl.y,ftr.x,ftr.y,mR.x,mR.y,mL.x,mL.y);
  // yellow safety stripe near the base (front)
  const yTop=lp(fbl,ftl,0.16), yTopR=lp(fbr,ftr,0.16);
  pg.fill(200*sh,170*sh,40*sh);
  pg.quad(yTop.x,yTop.y, yTopR.x,yTopR.y, fbr.x,fbr.y, fbl.x,fbl.y);
  // concrete streaks
  pg.stroke(red(wall)*sh*0.7,green(wall)*sh*0.7,blue(wall)*sh*0.7,70); pg.strokeWeight(1);
  for(let k=1;k<4;k++){ const tt=k/4; const a=lp(ftl,ftr,tt), c=lp(fbl,fbr,tt); pg.line(a.x,a.y,c.x,c.y); }
  pg.noStroke();
  // "F" level marking plate on some columns
  if(b.mark){
    const pTL=lp(ftl,ftr,0.28), pTR=lp(ftl,ftr,0.72);
    const pcTL=lp(pTL,fbl,0.32), pcTR=lp(pTR,fbr,0.32);
    const pcBL=lp(pTL,fbl,0.62), pcBR=lp(pTR,fbr,0.62);
    pg.fill(232*sh,230*sh,222*sh);
    pg.quad(pcTL.x,pcTL.y,pcTR.x,pcTR.y,pcBR.x,pcBR.y,pcBL.x,pcBL.y);
    const cxp=(pcTL.x+pcBR.x)/2, cyp=(pcTL.y+pcBR.y)/2, fs=Math.hypot(pcBL.x-pcTL.x,pcBL.y-pcTL.y)*0.9;
    if(fs>6){ pg.fill(40,40,42); pg.textAlign(CENTER,CENTER); pg.textFont('monospace'); pg.textSize(fs); pg.text('F',cxp,cyp); pg.textAlign(LEFT,BASELINE); }
  }
}

/* ============================================================
   LOBBY — WALK MODE (first-person prototype)
   Bewegliche Kamera (x,z,yaw), WASD + Pfeile, Kollision gegen
   Blöcke. Welt ist ein unendliches deterministisches Raster:
   jede Zelle (i,j) trägt evtl. einen Wandblock (per noise).
   ============================================================ */
const EXPLORE = { on:false, x:0, z:0, yaw:0, speed:0.11, turn:0.045, keys:{} };
const FLASH = { batt:1.0, drain:0.00045, beam:1 };   // flashlight battery (Lights Out)
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
// habitable zone: regular concrete-column grid (every other cell)
function habitableCol(i,j){
  if(i%2!==0 || j%2!==0) return null;
  return { X:i*LOBBY_CS, Z:j*LOBBY_CS, w:1.2, d:1.2, mark: noise(i*0.5,j*0.5,BG.seed*0.01)>0.5 };
}
// lights-out floorplan: grid of rooms joined by doorways (explorable)
function lsWallCell(i,j){ return { X:i*LOBBY_CS, Z:j*LOBBY_CS, w:LOBBY_CS*1.04, d:LOBBY_CS*1.04 }; }
function lightsoutWall(i,j){
  const RM=5, MID=2;
  const mi=((i%RM)+RM)%RM, mj=((j%RM)+RM)%RM;
  const onV=mi===0, onH=mj===0;
  if(onV||onH){
    if(onV&&onH) return lsWallCell(i,j);                    // corner pillar
    if(onV && mj===MID) return null;                        // doorway through E-W wall
    if(onH && mi===MID) return null;                        // doorway through N-S wall
    if(noise(i*0.3+700, j*0.3+700) > 0.8) return null;      // extra random opening (variety)
    return lsWallCell(i,j);
  }
  // occasional interior pillar so rooms aren't all empty boxes
  if(mi===MID && mj===MID && noise(i*0.6+50, j*0.6+50) > 0.72) return lsWallCell(i,j);
  return null;
}
// active scene's cell + collision dispatcher
function walkBlock(i,j){
  if(BG.scene==='habitable') return habitableCol(i,j);
  if(BG.scene==='lightsout') return lightsoutWall(i,j);
  return lobbyBlock(i,j);
}
function lobbyBlocked(x,z){
  const r=0.42, ci=Math.round(x/LOBBY_CS), cj=Math.round(z/LOBBY_CS);
  for(let i=ci-1;i<=ci+1;i++) for(let j=cj-1;j<=cj+1;j++){
    const b=walkBlock(i,j); if(!b) continue;
    if(x>b.X-b.w/2-r && x<b.X+b.w/2+r && z>b.Z-b.d/2-r && z<b.Z+b.d/2+r) return true;
  }
  return false;
}
// read keys, move the camera with per-axis collision (so you slide along walls)
function updateExplore(){
  if(WALK.won) return;                       // freeze once escaped
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
  if(!lobbyBlocked(nx, EXPLORE.z) && !propBlocked(nx, EXPLORE.z)) EXPLORE.x=nx;
  if(!lobbyBlocked(EXPLORE.x, nz) && !propBlocked(EXPLORE.x, nz)) EXPLORE.z=nz;
}

/* ---- WALK MODE ENTITIES (weeping-angel watchers) ---- */
const WALK_ENT = { list:[], encounters:0, flash:0 };
function distXZ(ax,az,bx,bz){ return Math.hypot(ax-bx, az-bz); }
function losBlocked(ax,az,bx,bz){
  const steps=Math.ceil(distXZ(ax,az,bx,bz)/0.5);
  for(let i=1;i<steps;i++){ const t=i/steps; if(lobbyBlocked(ax+(bx-ax)*t, az+(bz-az)*t)) return true; }
  return false;
}
function spawnWalkEntity(){
  for(let tries=0; tries<18; tries++){
    const ang = EXPLORE.yaw + (Math.random()-0.5)*2.2;      // mostly ahead-ish
    const dist = 9 + Math.random()*9;
    const x = EXPLORE.x + Math.sin(ang)*dist;
    const z = EXPLORE.z + Math.cos(ang)*dist;
    if(lobbyBlocked(x,z)) continue;
    if(distXZ(x,z,EXPLORE.x,EXPLORE.z) < 6) continue;
    WALK_ENT.list.push({
      x, z, seed:Math.random()*1000,
      eyes: 2 + (Math.random()*5|0),
      tall: 1.72 + Math.random()*0.45,         // towers nearly to the ceiling
      wide: 0.85 + Math.random()*0.4,
      hunt:false, wob:Math.random()*6,
    });
    return;
  }
}
function updateWalkEntities(){
  // despawn ones left far behind, keep the field populated
  WALK_ENT.list = WALK_ENT.list.filter(e=> distXZ(e.x,e.z,EXPLORE.x,EXPLORE.z) < 28);
  let guard=0;
  while(WALK_ENT.list.length < 4 && guard++ < 6) spawnWalkEntity();

  const s=Math.sin(EXPLORE.yaw), c=Math.cos(EXPLORE.yaw);
  for(const e of WALK_ENT.list){
    const dx=e.x-EXPLORE.x, dz=e.z-EXPLORE.z, d=Math.hypot(dx,dz)||1;
    const dotF=(dx/d)*s + (dz/d)*c;                          // >0 = in front
    const seen = dotF>0.72 && !losBlocked(EXPLORE.x,EXPLORE.z, e.x,e.z);
    e.hunt = !seen;
    if(!seen){
      // creep toward the player while unobserved (slower than walking)
      const step=0.062, nx=e.x-(dx/d)*step, nz=e.z-(dz/d)*step;
      if(!lobbyBlocked(nx,e.z)) e.x=nx;
      if(!lobbyBlocked(e.x,nz)) e.z=nz;
    }
    if(d < 0.95){                                            // caught → scare + reset
      WALK_ENT.encounters++; WALK_ENT.flash=1;
      const ang=EXPLORE.yaw+Math.PI+(Math.random()-0.5);
      e.x=EXPLORE.x+Math.sin(ang)*16; e.z=EXPLORE.z+Math.cos(ang)*16;
    }
  }
  if(WALK_ENT.flash>0) WALK_ENT.flash=Math.max(0, WALK_ENT.flash-0.04);
}
function drawWalkEntity(pg, e, proj, near, cx){
  const base=proj(e.x, LOBBY_FY, e.z); if(base.ez<near) return;
  if(losBlocked(EXPLORE.x,EXPLORE.z, e.x,e.z)) return;       // hidden behind a block
  const head=proj(e.x, LOBBY_FY - e.tall, e.z);
  const h=base.y-head.y; if(h<12) return;
  const cxs=base.x, topY=head.y, footY=base.y;
  const w=h*0.06*e.wide;                     // gaunt, pole-thin
  const fade=constrain(map(base.ez,2,32,1,0.16),0.16,1);
  const alpha=255*fade;
  const yAt=(fr)=>topY+fr*h;
  const shoulderW=w*1.9, hipW=w*1.15, headH=h*0.15;

  // ---- contact shadows under the feet ----
  pg.noStroke();
  for(const side of [-1,1]){ pg.fill(0,0,0,60*fade); pg.ellipse(cxs+side*w*3, footY, w*2.4, w*0.6); }

  // ---- legs (long, thin, slight stride) ----
  for(const side of [-1,1]){
    const ph=e.seed+(side>0?2.1:0.5);
    drawSirenLimb(pg, cxs+side*hipW, yAt(0.5), cxs+side*w*3 + Math.sin(ph)*w, footY, w*0.5, ph, alpha, 'foot');
  }

  // ---- gaunt torso (tapered pole) ----
  pg.fill(5,5,6,alpha);
  pg.beginShape();
  pg.vertex(cxs-shoulderW*1.15, yAt(0.16)); pg.vertex(cxs+shoulderW*1.15, yAt(0.16));
  pg.vertex(cxs+shoulderW*0.7,  yAt(0.30));
  pg.vertex(cxs+hipW,           yAt(0.5));
  pg.vertex(cxs-hipW,           yAt(0.5));
  pg.vertex(cxs-shoulderW*0.7,  yAt(0.30));
  pg.endShape(CLOSE);
  // rib / drip streaks
  pg.stroke(0,0,0,alpha*0.45); pg.strokeWeight(Math.max(1,w*0.14));
  for(let i=-1;i<=1;i++) pg.line(cxs+i*shoulderW*0.5, yAt(0.18), cxs+i*shoulderW*0.4+Math.sin(e.seed+i)*w, yAt(0.5));
  pg.noStroke();

  // ---- very long dangling arms with clawed hands (in front) ----
  for(const side of [-1,1]){
    const ph=e.seed+(side>0?3.7:1.3);
    drawSirenLimb(pg, cxs+side*shoulderW, yAt(0.17), cxs+side*w*2.4 + Math.sin(ph)*w*0.8, yAt(0.9), w*0.42, ph, alpha, 'hand');
  }

  // ---- siren head ----
  drawSirenHead(pg, cxs, topY, headH, w, e.seed, alpha, e.hunt, fade);
}

// long tapering, wobbling limb (foot or clawed hand) as a filled ribbon
function drawSirenLimb(pg, x0,y0, x1,y1, thick, ph, alpha, end){
  const K=14, pts=[];
  for(let k=0;k<=K;k++){
    const tt=k/K;
    const wob=Math.sin(ph+tt*5.5)*thick*0.9*(0.25+tt*0.85) + Math.sin(ph*1.9+tt*3)*thick*0.45;
    pts.push({x:lerp(x0,x1,tt)+wob, y:lerp(y0,y1,tt)});
  }
  const left=[],right=[];
  for(let k=0;k<=K;k++){
    const tt=k/K, th=lerp(thick*0.55, thick*0.14, tt);
    const pn=pts[Math.min(K,k+1)], pp=pts[Math.max(0,k-1)];
    const dx=pn.x-pp.x, dy=pn.y-pp.y, len=Math.hypot(dx,dy)||1;
    const nx=-dy/len, ny=dx/len;
    left.push({x:pts[k].x+nx*th, y:pts[k].y+ny*th});
    right.push({x:pts[k].x-nx*th, y:pts[k].y-ny*th});
  }
  pg.fill(5,5,6,alpha); pg.noStroke();
  pg.beginShape();
  for(const p of left) pg.vertex(p.x,p.y);
  for(let k=K;k>=0;k--) pg.vertex(right[k].x,right[k].y);
  pg.endShape(CLOSE);
  const f=pts[K], dir=Math.atan2(pts[K].y-pts[K-1].y, pts[K].x-pts[K-1].x);
  if(end==='hand'){
    pg.stroke(5,5,6,alpha); pg.strokeWeight(Math.max(1,thick*0.22));
    for(let c=-1;c<=1;c++){ const a=dir+c*0.45; pg.line(f.x,f.y, f.x+Math.cos(a)*thick*2.0, f.y+Math.sin(a)*thick*2.0); }
    pg.noStroke();
  } else {
    pg.beginShape();
    pg.vertex(f.x-thick*0.2,f.y); pg.vertex(f.x+thick*0.2,f.y);
    pg.vertex(f.x+Math.cos(dir)*thick*1.7, f.y+Math.sin(dir)*thick*1.7);
    pg.endShape(CLOSE);
  }
}

// twisted skull + two angled sirens (glow red while hunting)
function drawSirenHead(pg, cx0, topY, headH, w, seed, alpha, hunt, fade){
  const cyh=topY+headH*0.55, gctx=pg.drawingContext;
  pg.noStroke();
  // two sirens flaring up & out
  for(const side of [-1,1]){
    const bx=cx0+side*w*0.3, by=topY+headH*0.45;
    const tx=cx0+side*w*2.1, ty=topY-headH*0.75;
    const ang=Math.atan2(ty-by,tx-bx), nx=-Math.sin(ang), ny=Math.cos(ang);
    const wb=w*0.45, wt=w*0.95;
    pg.fill(7,7,8,alpha);
    pg.beginShape();
    pg.vertex(bx+nx*wb,by+ny*wb); pg.vertex(bx-nx*wb,by-ny*wb);
    pg.vertex(tx-nx*wt,ty-ny*wt); pg.vertex(tx+nx*wt,ty+ny*wt);
    pg.endShape(CLOSE);
    pg.fill(0,0,0,alpha); pg.ellipse(tx,ty, wt*1.7, wt*1.1);   // dark horn mouth
    if(hunt){ gctx.save();
      const gr=gctx.createRadialGradient(tx,ty,0,tx,ty,wt*2.2);
      gr.addColorStop(0,`rgba(225,40,28,${0.55*fade})`); gr.addColorStop(1,'rgba(0,0,0,0)');
      gctx.fillStyle=gr; gctx.fillRect(tx-wt*2.2,ty-wt*2.2,wt*4.4,wt*4.4); gctx.restore();
      pg.fill(255,70,50,200*fade); pg.ellipse(tx,ty,wt*0.7,wt*0.7);
    }
  }
  // central twisted skull
  pg.fill(8,8,9,alpha); pg.ellipse(cx0,cyh, w*1.8, headH*0.95);
  for(let i=0;i<5;i++){ const a=seed+i*1.5;
    pg.ellipse(cx0+Math.cos(a)*w*0.5, cyh+Math.sin(a)*headH*0.3, w*0.55, headH*0.42); }
  // grime sheen
  pg.fill(56,50,44, 75*fade);
  for(let i=0;i<4;i++){ const a=seed+i*2.0;
    pg.ellipse(cx0+Math.cos(a)*w*0.4, cyh+Math.sin(a)*headH*0.2, w*0.2, headH*0.16); }
}

/* ============================================================
   LOBBY ESCAPE — items, wall details & objective
   Sammle Almond Water → schaltet die EXIT-Tür frei → entkomme.
   ============================================================ */
const WALK = { items:[], props:[], collected:0, need:3, won:false };
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hashUnit(n){ const x=Math.sin(n*12.9898)*43758.5453; return x-Math.floor(x); }
function generateWalkWorld(){
  WALK.items=[]; WALK.props=[]; WALK.collected=0; WALK.won=false;
  const rnd=mulberry32((BG.seed|0)||1);
  const placeOpen=(minR,maxR)=>{
    for(let t=0;t<50;t++){
      const ang=rnd()*Math.PI*2, d=minR+rnd()*(maxR-minR);
      const x=Math.sin(ang)*d, z=Math.cos(ang)*d;
      const i=Math.round(x/LOBBY_CS), j=Math.round(z/LOBBY_CS);
      if(!walkBlock(i,j) && !lobbyBlocked(x,z)) return {x,z};
    } return null;
  };
  for(let n=0;n<6;n++){ const p=placeOpen(5,22); if(p) WALK.items.push({type:'almond',x:p.x,z:p.z,taken:false}); }
  for(let n=0;n<5;n++){ const p=placeOpen(3,24); if(p) WALK.items.push({type:'chair',x:p.x,z:p.z}); }
  for(let n=0;n<5;n++){ const p=placeOpen(3,24); if(p) WALK.items.push({type:'puddle',x:p.x,z:p.z}); }
  const ep=placeOpen(18,28)||{x:0,z:22}; WALK.items.push({type:'exit',x:ep.x,z:ep.z});
  // spare batteries + clutter props scattered through Lights Out
  if(BG.scene==='lightsout'){
    for(let n=0;n<5;n++){ const p=placeOpen(5,26); if(p) WALK.items.push({type:'battery',x:p.x,z:p.z,taken:false}); }
    const T=['crate','stack','barrel','shelf','boxes','cone','crate','boxes'];
    for(let n=0;n<26;n++){ const p=placeOpen(3,27); if(p) WALK.props.push({type:T[(rnd()*T.length)|0], x:p.x, z:p.z}); }
  }
}
// props block movement (no walking through crates)
function propBlocked(x,z){
  for(const p of WALK.props){
    const r = p.type==='shelf'?0.9 : p.type==='cone'?0 : 0.55;
    if(r>0 && (x-p.x)*(x-p.x)+(z-p.z)*(z-p.z) < (r+0.3)*(r+0.3)) return true;
  }
  return false;
}
function updateWalkWorld(){
  for(const it of WALK.items){
    const d=distXZ(it.x,it.z,EXPLORE.x,EXPLORE.z);
    if(it.type==='almond' && !it.taken && d<1.2){ it.taken=true; WALK.collected++; }
    if(it.type==='battery' && !it.taken && d<1.2){ it.taken=true; FLASH.batt=Math.min(1, FLASH.batt+0.6); }
    if(it.type==='exit' && WALK.collected>=WALK.need && !WALK.won && d<1.7){ WALK.won=true; }
  }
}
function faceUV(fc,u,v){
  const tx=fc.a.x+(fc.b.x-fc.a.x)*u, ty=fc.a.y+(fc.b.y-fc.a.y)*u;
  const bx=fc.d.x+(fc.c.x-fc.d.x)*u, by=fc.d.y+(fc.c.y-fc.d.y)*u;
  return {x:tx+(bx-tx)*v, y:ty+(by-ty)*v};
}
function clamp255(v){ return Math.max(0,Math.min(255,v|0)); }

// realistic wall face: vertical light gradient + chevron wallpaper + cream trim
function drawWallFace(pg, fc, wall, sh){
  const g=pg.drawingContext;
  const r=red(wall), gg=green(wall), bb=blue(wall);
  const top=sh*1.16, bot=sh*0.66;                    // lit near ceiling, dark toward floor
  const mx0=(fc.a.x+fc.b.x)/2, my0=(fc.a.y+fc.b.y)/2, mx1=(fc.d.x+fc.c.x)/2, my1=(fc.d.y+fc.c.y)/2;
  g.save();
  const grad=g.createLinearGradient(mx0,my0,mx1,my1);
  grad.addColorStop(0,`rgb(${clamp255(r*top)},${clamp255(gg*top)},${clamp255(bb*top)})`);
  grad.addColorStop(1,`rgb(${clamp255(r*bot)},${clamp255(gg*bot)},${clamp255(bb*bot)})`);
  g.beginPath(); g.moveTo(fc.a.x,fc.a.y); g.lineTo(fc.b.x,fc.b.y); g.lineTo(fc.c.x,fc.c.y); g.lineTo(fc.d.x,fc.d.y); g.closePath();
  g.fillStyle=grad; g.fill(); g.restore();

  const wpx=Math.hypot(fc.b.x-fc.a.x, fc.b.y-fc.a.y);
  // chevron wallpaper pattern (only on close, large faces — cheap + crisp)
  if(wpx>70 && fc.depth<11){
    pg.stroke(clamp255(r*sh*0.78),clamp255(gg*sh*0.78),clamp255(bb*sh*0.78),130);
    pg.strokeWeight(1); pg.noFill();
    const cols=5, rows=7;
    for(let cI=0;cI<cols;cI++){ const u=(cI+0.5)/cols;
      for(let rI=0;rI<rows;rI++){ const v=0.10+(rI/rows)*0.78;
        const tip=faceUV(fc,u,v), L=faceUV(fc,u-0.42/cols,v-0.5/rows), Rr=faceUV(fc,u+0.42/cols,v-0.5/rows);
        pg.line(L.x,L.y,tip.x,tip.y); pg.line(tip.x,tip.y,Rr.x,Rr.y);
      } }
    pg.noStroke();
  }
}
const WALK_GRAFFITI=['LEAVE','NO EXIT','HELP','TURN BACK','17','WHY','△'];
function drawFaceDecal(pg,fc,sh){
  const hu=hashUnit(fc.key);
  if(hu>0.22) return;                                   // most walls stay bare
  const wpx=Math.hypot(fc.b.x-fc.a.x, fc.b.y-fc.a.y); if(wpx<24) return;
  const a=200*Math.min(1,sh);
  if(hu<0.12){                                          // grime stain
    pg.noStroke();
    for(let i=0;i<4;i++){
      const p=faceUV(fc, 0.3+hashUnit(fc.key+i)*0.4, 0.25+hashUnit(fc.key+i*3)*0.4);
      pg.fill(28,22,10, a*0.5); pg.ellipse(p.x,p.y, wpx*(0.1+hashUnit(fc.key+i)*0.12), wpx*(0.14+hashUnit(fc.key+i)*0.14));
    }
  } else {                                              // graffiti / note
    const word=WALK_GRAFFITI[Math.floor(hu*1000)%WALK_GRAFFITI.length];
    const ang=Math.atan2(fc.b.y-fc.a.y, fc.b.x-fc.a.x);
    const c=faceUV(fc,0.5,0.5);
    pg.push(); pg.translate(c.x,c.y); pg.rotate(ang);
    pg.fill(46,32,18, a); pg.textAlign(CENTER,CENTER); pg.textFont('monospace'); pg.textSize(Math.max(8,wpx*0.13));
    pg.text(word,0,0); pg.pop();
    pg.textAlign(LEFT,BASELINE);
  }
}
function drawWalkItems(pg,proj,near){
  const list=WALK.items.filter(it=>!(it.type==='almond'&&it.taken))
    .map(it=>({it,ez:proj(it.x,LOBBY_FY,it.z).ez})).sort((a,b)=>b.ez-a.ez);
  for(const o of list){
    if(o.ez<near) continue;
    if(losBlocked(EXPLORE.x,EXPLORE.z,o.it.x,o.it.z)) continue;
    drawWalkItem(pg,o.it,proj);
  }
}
function drawWalkItem(pg,it,proj){
  const base=proj(it.x,LOBBY_FY,it.z); if(base.ez<0.28) return;
  const fade=constrain(map(base.ez,2,32,1,0.18),0.18,1), a=255*fade, gctx=pg.drawingContext;
  const cxs=base.x;
  const ppw=proj(it.x+0.5,LOBBY_FY,it.z).x - proj(it.x-0.5,LOBBY_FY,it.z).x;     // px per world unit
  const sc=(h)=> base.y - proj(it.x,LOBBY_FY-h,it.z).y;                          // px height of world height h
  pg.noStroke();
  if(it.type==='puddle'){
    const r=Math.abs(ppw)*0.9;
    pg.fill(18,18,16,90*fade); pg.ellipse(cxs,base.y, r*1.9, r*0.7);
    gctx.save(); const g=gctx.createRadialGradient(cxs,base.y,0,cxs,base.y,r);
    g.addColorStop(0,`rgba(225,232,215,${0.18*fade})`); g.addColorStop(1,'rgba(0,0,0,0)');
    gctx.fillStyle=g; gctx.fillRect(cxs-r,base.y-r*0.5,r*2,r); gctx.restore();
  } else if(it.type==='chair'){
    const H=sc(0.55), w=Math.abs(ppw)*0.5;
    pg.fill(22,19,16,a);
    pg.rect(cxs-w/2, base.y-H*0.55, w, H*0.12);          // seat
    pg.rect(cxs-w/2, base.y-H, w*0.16, H*0.5);           // back
    pg.rect(cxs-w/2, base.y-H*0.55, w*0.09, H*0.55);     // legs
    pg.rect(cxs+w/2-w*0.09, base.y-H*0.55, w*0.09, H*0.55);
  } else if(it.type==='battery'){
    // spare battery — faint green glow so it's spottable in the dark
    const H=sc(0.34), w=Math.abs(ppw)*0.13, bob=Math.sin(frameCount*0.07+it.x)*H*0.04;
    const yT=base.y-H+bob, gr=Math.max(w*2.6, sc(0.3));
    gctx.save(); const g=gctx.createRadialGradient(cxs,yT+H*0.5,0,cxs,yT+H*0.5,gr);
    g.addColorStop(0,`rgba(120,225,150,${0.32*fade})`); g.addColorStop(1,'rgba(0,0,0,0)');
    gctx.fillStyle=g; gctx.fillRect(cxs-gr,yT-H*0.2,gr*2,H*1.6); gctx.restore();
    pg.fill(58,150,92,a); pg.rect(cxs-w/2,yT,w,H);                 // green cell
    pg.fill(205,205,210,a); pg.rect(cxs-w*0.28,yT-H*0.08,w*0.56,H*0.1); // + terminal
    pg.fill(30,32,30,a); pg.rect(cxs-w/2,yT+H*0.46,w,H*0.16);     // label band
  } else if(it.type==='almond'){
    // iconic Almond Water bottle: cream body, silver cap, script label
    const H=sc(0.56), w=Math.abs(ppw)*0.22, bob=Math.sin(frameCount*0.06+it.x)*H*0.03;
    const yT=base.y-H+bob, gr=Math.max(w*2.4, sc(0.42));
    gctx.save(); const g=gctx.createRadialGradient(cxs,yT+H*0.5,0,cxs,yT+H*0.5,gr);
    g.addColorStop(0,`rgba(245,236,200,${0.34*fade})`); g.addColorStop(1,'rgba(0,0,0,0)');
    gctx.fillStyle=g; gctx.fillRect(cxs-gr,yT-H*0.2,gr*2,H*1.6); gctx.restore();
    // body (rounded) + shoulders + neck
    pg.fill(234,227,198,a);
    pg.rect(cxs-w/2, yT+H*0.24, w, H*0.76, w*0.2);
    pg.beginShape();
      pg.vertex(cxs-w/2, yT+H*0.30); pg.vertex(cxs-w*0.18, yT+H*0.12);
      pg.vertex(cxs+w*0.18, yT+H*0.12); pg.vertex(cxs+w/2, yT+H*0.30);
    pg.endShape(CLOSE);
    pg.rect(cxs-w*0.16, yT+H*0.05, w*0.32, H*0.1);                  // neck
    // silver cap
    pg.fill(186,186,190,a); pg.rect(cxs-w*0.2, yT, w*0.4, H*0.07, w*0.06);
    pg.fill(150,150,156,a); pg.rect(cxs-w*0.2, yT+H*0.045, w*0.4, H*0.02);
    // label area + script + ORIGINAL band
    pg.fill(245,239,214,a); pg.rect(cxs-w*0.46, yT+H*0.4, w*0.92, H*0.34);
    pg.fill(150,72,42,a*0.95); pg.rect(cxs-w*0.3, yT+H*0.48, w*0.6, H*0.045);  // "Almond"
    pg.fill(150,72,42,a*0.8);  pg.rect(cxs-w*0.24, yT+H*0.55, w*0.48, H*0.035); // "Water"
    pg.fill(178,150,68,a); pg.rect(cxs-w*0.46, yT+H*0.63, w*0.92, H*0.07);      // gold ORIGINAL band
    // glass sheen
    pg.fill(255,255,255,55*fade); pg.rect(cxs-w*0.34, yT+H*0.3, w*0.09, H*0.5, w*0.05);
  } else if(it.type==='exit'){
    const H=sc(2.0), w=Math.abs(ppw)*1.15, unlocked=WALK.collected>=WALK.need;
    const col=unlocked?[42,232,120]:[214,60,48];
    pg.fill(9,9,10,a); pg.rect(cxs-w/2, base.y-H, w, H);            // frame
    pg.fill(2,2,3,a);  pg.rect(cxs-w*0.34, base.y-H*0.9, w*0.68, H*0.88); // doorway
    gctx.save(); const g=gctx.createRadialGradient(cxs,base.y-H*0.8,0,cxs,base.y-H*0.8,w*1.7);
    g.addColorStop(0,`rgba(${col[0]},${col[1]},${col[2]},${0.42*fade})`); g.addColorStop(1,'rgba(0,0,0,0)');
    gctx.fillStyle=g; gctx.fillRect(cxs-w*1.7,base.y-H*0.8-w*1.7,w*3.4,w*3.4); gctx.restore();
    pg.fill(col[0],col[1],col[2],a); pg.rect(cxs-w*0.42, base.y-H*1.06, w*0.84, H*0.13);  // sign box
    pg.fill(6,6,7,a); pg.textAlign(CENTER,CENTER); pg.textFont('monospace'); pg.textSize(Math.max(7,H*0.085));
    pg.text(unlocked?'EXIT':'LOCKED', cxs, base.y-H*0.995);
    pg.textAlign(LEFT,BASELINE);
  }
}

function drawLobbyWalk(pg){
  updateWalkWorld();
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
  // ceiling + floor planes as moody gradients (darker toward the horizon)
  const bctx=pg.drawingContext;
  bctx.save();
  const cg=bctx.createLinearGradient(0,0,0,cy);
  cg.addColorStop(0,`rgb(${clamp255(red(ceil)*0.62)},${clamp255(green(ceil)*0.62)},${clamp255(blue(ceil)*0.62)})`);
  cg.addColorStop(1,`rgb(${clamp255(red(ceil)*0.9)},${clamp255(green(ceil)*0.9)},${clamp255(blue(ceil)*0.9)})`);
  bctx.fillStyle=cg; bctx.fillRect(0,0,W,cy);
  const fgr=bctx.createLinearGradient(0,cy,0,H);
  fgr.addColorStop(0,`rgb(${clamp255(red(floor)*0.5)},${clamp255(green(floor)*0.5)},${clamp255(blue(floor)*0.5)})`);
  fgr.addColorStop(1,`rgb(${clamp255(red(floor)*0.95)},${clamp255(green(floor)*0.95)},${clamp255(blue(floor)*0.95)})`);
  bctx.fillStyle=fgr; bctx.fillRect(0,cy,W,H-cy);
  bctx.restore();

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
      pg.fill(red(lite),green(lite),blue(lite),250*inten);
      pg.quad(g1.x,g1.y,g2.x,g2.y,g3.x,g3.y,g4.x,g4.y);
      // louver cross (fixture detail)
      const mt={x:(g1.x+g2.x)/2,y:(g1.y+g2.y)/2}, mb={x:(g4.x+g3.x)/2,y:(g4.y+g3.y)/2};
      const ml={x:(g1.x+g4.x)/2,y:(g1.y+g4.y)/2}, mr={x:(g2.x+g3.x)/2,y:(g2.y+g3.y)/2};
      pg.stroke(red(ceil)*0.5,green(ceil)*0.5,blue(ceil)*0.5,160*inten); pg.strokeWeight(1);
      pg.line(mt.x,mt.y,mb.x,mb.y); pg.line(ml.x,ml.y,mr.x,mr.y); pg.noStroke();
      // bloom halo around the fixture
      gctx.save(); gctx.globalCompositeOperation='lighter';
      const hr=Math.max(12, f*0.55/ctr.ez);
      const hg=gctx.createRadialGradient(ctr.x,ctr.y,0,ctr.x,ctr.y,hr);
      hg.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.5*inten})`);
      hg.addColorStop(1,'rgba(0,0,0,0)');
      gctx.fillStyle=hg; gctx.fillRect(ctr.x-hr,ctr.y-hr,hr*2,hr*2); gctx.restore();
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
    const push=(x1,z1,x2,z2,tone,ft)=>{
      const a=proj(x1,LOBBY_CY,z1), bb=proj(x2,LOBBY_CY,z2),
            c=proj(x2,LOBBY_FY,z2), d=proj(x1,LOBBY_FY,z1);
      if(a.ez<near||bb.ez<near||c.ez<near||d.ez<near) return;
      faces.push({a,b:bb,c,d,depth:(a.ez+bb.ez)/2,tone, key:i*131+j*977+ft*17});
    };
    if(EXPLORE.x<xL)       push(xL,zN,xL,zF,0.6,0);
    else if(EXPLORE.x>xR)  push(xR,zF,xR,zN,0.6,1);
    if(EXPLORE.z<zN)       push(xR,zN,xL,zN,1.0,2);
    else if(EXPLORE.z>zF)  push(xL,zF,xR,zF,1.0,3);
  }
  faces.sort((p,q)=>q.depth-p.depth);
  for(const fc of faces){
    const sh=constrain(map(fc.depth,2,R*LOBBY_CS,1.05,0.30),0.30,1.05)*fc.tone;
    drawWallFace(pg,fc,wall,sh);
    drawFaceDecal(pg,fc,sh);                              // stains / graffiti
  }

  // ---- items: almond water, exit, chairs, puddles (far -> near) ----
  drawWalkItems(pg,proj,near);
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

/* ---- WALK PROPS (3D clutter: crates, barrels, shelves, cones) ---- */
function drawSolidBox(pg,proj,X,Z,hw,hd,h,col,bn,baseH){
  baseH=baseH||0;
  const yB=LOBBY_FY-baseH, yT=yB-h, xL=X-hw,xR=X+hw,zN=Z-hd,zF=Z+hd;
  const ftl=proj(xL,yT,zN),ftr=proj(xR,yT,zN),fbr=proj(xR,yB,zN),fbl=proj(xL,yB,zN);
  const btl=proj(xL,yT,zF),btr=proj(xR,yT,zF),bbr=proj(xR,yB,zF),bbl=proj(xL,yB,zF);
  if([ftl,ftr,fbr,fbl,btl,btr,bbr,bbl].some(p=>p.ez<0.2)) return;
  const sh=(m)=>pg.fill(clamp255(col[0]*bn*m),clamp255(col[1]*bn*m),clamp255(col[2]*bn*m));
  pg.noStroke();
  if(EXPLORE.x<xL){ sh(0.66); pg.quad(ftl.x,ftl.y,btl.x,btl.y,bbl.x,bbl.y,fbl.x,fbl.y); }
  else if(EXPLORE.x>xR){ sh(0.66); pg.quad(ftr.x,ftr.y,btr.x,btr.y,bbr.x,bbr.y,fbr.x,fbr.y); }
  if(EXPLORE.z<zN){ sh(1.0); pg.quad(ftl.x,ftl.y,ftr.x,ftr.y,fbr.x,fbr.y,fbl.x,fbl.y); }
  else if(EXPLORE.z>zF){ sh(0.82); pg.quad(btl.x,btl.y,btr.x,btr.y,bbr.x,bbr.y,bbl.x,bbl.y); }
  sh(1.3); pg.quad(ftl.x,ftl.y,ftr.x,ftr.y,btr.x,btr.y,btl.x,btl.y);   // top
}
function drawWalkProps(pg,proj,near){
  const list=WALK.props.map(p=>({p,ez:proj(p.x,LOBBY_FY,p.z).ez})).sort((a,b)=>b.ez-a.ez);
  for(const o of list){
    if(o.ez<near) continue;
    if(losBlocked(EXPLORE.x,EXPLORE.z,o.p.x,o.p.z)) continue;
    drawProp(pg,o.p,proj,near);
  }
}
function drawProp(pg,p,proj,near){
  const base=proj(p.x,LOBBY_FY,p.z); if(base.ez<near) return;
  const beam = (BG.scene==='lightsout') ? FLASH.beam : 1;
  const bn=constrain(map(base.ez,0.6,8,1.0,0.05),0.05,1.0)*beam;
  switch(p.type){
    case 'crate': drawSolidBox(pg,proj,p.x,p.z,0.5,0.5,1.0,[120,86,48],bn); break;
    case 'boxes': drawSolidBox(pg,proj,p.x,p.z,0.55,0.55,0.78,[172,142,98],bn); break;
    case 'stack':
      drawSolidBox(pg,proj,p.x,p.z,0.52,0.52,0.95,[118,84,46],bn);
      drawSolidBox(pg,proj,p.x+0.12,p.z+0.1,0.4,0.4,0.7,[134,98,56],bn,0.95); break;
    case 'barrel': drawSolidBox(pg,proj,p.x,p.z,0.38,0.38,1.1,[74,76,80],bn); break;
    case 'shelf': drawSolidBox(pg,proj,p.x,p.z,0.85,0.32,2.05,[92,92,98],bn); break;
    case 'cone': {
      const tip=proj(p.x,LOBBY_FY-0.55,p.z), bl=proj(p.x-0.28,LOBBY_FY,p.z), br=proj(p.x+0.28,LOBBY_FY,p.z);
      if(tip.ez<near) break; const mb=Math.max(0.15,bn);
      pg.noStroke(); pg.fill(clamp255(236*mb),clamp255(118*mb),clamp255(38*bn));
      pg.triangle(tip.x,tip.y,bl.x,bl.y,br.x,br.y);
      const m1=proj(p.x-0.17,LOBBY_FY-0.27,p.z),m2=proj(p.x+0.17,LOBBY_FY-0.27,p.z),m3=proj(p.x+0.12,LOBBY_FY-0.17,p.z),m4=proj(p.x-0.12,LOBBY_FY-0.17,p.z);
      pg.fill(clamp255(220*mb),clamp255(218*mb),clamp255(208*mb)); pg.quad(m1.x,m1.y,m2.x,m2.y,m3.x,m3.y,m4.x,m4.y);
      break;
    }
  }
}

// dispatch first-person walk by active scene
function drawSceneWalk(pg){
  if(BG.scene==='habitable') drawHabitableWalk(pg);
  else if(BG.scene==='lightsout') drawLightsoutWalk(pg);
  else drawLobbyWalk(pg);
}

/* ============================================================
   LEVEL 6 — LIGHTS OUT (walk): near-total darkness + flashlight.
   Geometrie wird per Entfernung "beleuchtet", der Rest von einer
   Taschenlampen-Maske (radialer Schwarz-Verlauf) verschluckt.
   ============================================================ */
function drawDarkFace(pg, fc){
  const g=pg.drawingContext;
  const bn=constrain(map(fc.depth,0.6,7.5,1.0,0.04),0.04,1.0)*FLASH.beam;   // flashlight falloff × battery
  const top=162*bn, bot=98*bn;                                   // concrete grey
  const mx0=(fc.a.x+fc.b.x)/2,my0=(fc.a.y+fc.b.y)/2, mx1=(fc.d.x+fc.c.x)/2,my1=(fc.d.y+fc.c.y)/2;
  g.save();
  const grad=g.createLinearGradient(mx0,my0,mx1,my1);
  grad.addColorStop(0,`rgb(${clamp255(top)},${clamp255(top)},${clamp255(top*1.02)})`);
  grad.addColorStop(1,`rgb(${clamp255(bot)},${clamp255(bot)},${clamp255(bot*1.02)})`);
  g.beginPath(); g.moveTo(fc.a.x,fc.a.y); g.lineTo(fc.b.x,fc.b.y); g.lineTo(fc.c.x,fc.c.y); g.lineTo(fc.d.x,fc.d.y); g.closePath();
  g.fillStyle=grad; g.fill(); g.restore();
  // faint concrete streaks where lit
  if(bn>0.14){
    const wpx=Math.hypot(fc.b.x-fc.a.x,fc.b.y-fc.a.y);
    if(wpx>40){ pg.stroke(top*0.6,top*0.6,top*0.62,55); pg.strokeWeight(1);
      for(let k=1;k<3;k++){ const u=k/3, A=faceUV(fc,u,0.1), B=faceUV(fc,u,0.9); pg.line(A.x,A.y,B.x,B.y); }
      pg.noStroke(); }
  }
}

function drawLightsoutWalk(pg){
  updateWalkWorld();
  const W=pg.width,H=pg.height,cx=W/2,cy=H*0.5;
  const f=W*0.9, near=0.28, CS=LOBBY_CS, CY=LOBBY_CY, FY=LOBBY_FY;
  const sN=Math.sin(EXPLORE.yaw), cN=Math.cos(EXPLORE.yaw);
  const proj=(wx,wy,wz)=>{ const dx=wx-EXPLORE.x, dz=wz-EXPLORE.z;
    const ex=dx*cN - dz*sN, ez=dx*sN + dz*cN; return {ez, x:cx+f*ex/ez, y:cy+f*wy/ez}; };
  const gctx=pg.drawingContext;

  // ---- battery drain + flicker → effective beam strength ----
  if(!WALK.won) FLASH.batt=Math.max(0, FLASH.batt-FLASH.drain);
  let flick=1;
  if(FLASH.batt<0.28){ flick=0.55+Math.random()*0.45; if(Math.random()<0.05) flick=0.12; }
  const beam=(0.08 + 0.92*FLASH.batt)*flick;        // 0..1
  FLASH.beam=beam;

  pg.push(); pg.colorMode(RGB,255); pg.noStroke();
  // very dim floor + near-black ceiling (also dimmed by battery)
  pg.fill(60*beam,59*beam,57*beam); pg.rect(0,cy,W,H-cy);
  pg.fill(20*beam,20*beam,24*beam); pg.rect(0,0,W,cy);

  // wall faces (flashlight-lit by distance)
  const ci=Math.round(EXPLORE.x/CS), cj=Math.round(EXPLORE.z/CS), R=13;
  const faces=[];
  for(let i=ci-R;i<=ci+R;i++) for(let j=cj-R;j<=cj+R;j++){
    const b=walkBlock(i,j); if(!b) continue;
    const xL=b.X-b.w/2, xR=b.X+b.w/2, zN=b.Z-b.d/2, zF=b.Z+b.d/2;
    // only draw faces that border an OPEN cell (skip walls buried inside walls)
    const openL=!walkBlock(i-1,j), openR=!walkBlock(i+1,j), openN=!walkBlock(i,j-1), openF=!walkBlock(i,j+1);
    const push=(x1,z1,x2,z2)=>{
      const a=proj(x1,CY,z1), bb=proj(x2,CY,z2), c=proj(x2,FY,z2), d=proj(x1,FY,z1);
      if(a.ez<near||bb.ez<near||c.ez<near||d.ez<near) return;
      faces.push({a,b:bb,c,d,depth:(a.ez+bb.ez)/2});
    };
    if(EXPLORE.x<xL && openL)      push(xL,zN,xL,zF);
    else if(EXPLORE.x>xR && openR) push(xR,zF,xR,zN);
    if(EXPLORE.z<zN && openN)      push(xR,zN,xL,zN);
    else if(EXPLORE.z>zF && openF) push(xL,zF,xR,zF);
  }
  faces.sort((p,q)=>q.depth-p.depth);
  for(const fc of faces) drawDarkFace(pg,fc);
  drawWalkProps(pg,proj,near);
  pg.pop();

  // ---- flashlight: cut a bright hole (size/strength by battery), rest black ----
  const bob=Math.sin(frameCount*0.12)*H*0.012, aimX=cx, aimY=cy+bob;
  const reach=W*(0.16 + 0.27*beam), inner=W*0.03;
  gctx.save();
  const m=gctx.createRadialGradient(aimX,aimY,inner, aimX,aimY,reach);
  m.addColorStop(0,'rgba(0,0,0,0)');
  m.addColorStop(0.5,'rgba(0,0,0,0.5)');
  m.addColorStop(1,'rgba(1,1,3,0.99)');
  gctx.fillStyle=m; gctx.fillRect(0,0,W,H);
  // warm beam tint in the core
  gctx.globalCompositeOperation='lighter';
  const wl=gctx.createRadialGradient(aimX,aimY,0, aimX,aimY,reach*0.6);
  wl.addColorStop(0,`rgba(255,248,222,${0.14*beam})`); wl.addColorStop(1,'rgba(0,0,0,0)');
  gctx.fillStyle=wl; gctx.fillRect(0,0,W,H);
  gctx.restore();

  // ---- glowing items pierce the dark (drawn after the mask) ----
  pg.push(); pg.colorMode(RGB,255); pg.noStroke();
  drawWalkItems(pg,proj,near);
  pg.pop();

  applyGrain(pg, BG.grain);
  applyVignette(pg);
  drawWalkHUD(pg,cx,cy);
  drawBatteryHUD(pg);
}

function drawBatteryHUD(pg){
  const W=pg.width, bw=128, bh=12, bx=W-bw-18, by=16;
  pg.noStroke();
  pg.fill(0,0,0,160); pg.rect(bx-3,by-3,bw+6,bh+18);
  pg.fill(38,38,42); pg.rect(bx,by,bw,bh);
  const low=FLASH.batt<0.28;
  pg.fill(low?210:120, low?70:206, low?56:132);
  pg.rect(bx,by,bw*FLASH.batt,bh);
  pg.fill(200,198,188); pg.textFont('monospace'); pg.textSize(10); pg.textAlign(RIGHT,TOP);
  const label = FLASH.batt<=0.001 ? 'FLASHLIGHT  DEAD' : 'FLASHLIGHT  '+Math.round(FLASH.batt*100)+'%';
  pg.text(label, bx+bw, by+bh+3); pg.textAlign(LEFT,BASELINE);
}

function drawHabitableWalk(pg){
  updateWalkWorld();
  const W=pg.width,H=pg.height,cx=W/2,cy=H*0.5;
  const f=W*0.9, near=0.28, CS=LOBBY_CS, CY=LOBBY_CY, FY=LOBBY_FY;
  const P=BG_SCENES.habitable.pal, amt=0.4;
  const wall=hueShift(P.wall,BG.hue,amt), floor=hueShift(P.floor,BG.hue,amt),
        ceil=hueShift(P.ceil,BG.hue,amt), lite=hueShift(P.light,BG.hue,amt);
  const sN=Math.sin(EXPLORE.yaw), cN=Math.cos(EXPLORE.yaw);
  const proj=(wx,wy,wz)=>{ const dx=wx-EXPLORE.x, dz=wz-EXPLORE.z;
    const ex=dx*cN - dz*sN, ez=dx*sN + dz*cN; return {ez, x:cx+f*ex/ez, y:cy+f*wy/ez}; };

  pg.push(); pg.colorMode(RGB,255); pg.noStroke();
  const gctx=pg.drawingContext;
  // dark concrete ceiling + floor gradients
  gctx.save();
  const cg=gctx.createLinearGradient(0,0,0,cy);
  cg.addColorStop(0,`rgb(${clamp255(red(ceil)*0.5)},${clamp255(green(ceil)*0.5)},${clamp255(blue(ceil)*0.5)})`);
  cg.addColorStop(1,`rgb(${clamp255(red(ceil)*0.78)},${clamp255(green(ceil)*0.78)},${clamp255(blue(ceil)*0.78)})`);
  gctx.fillStyle=cg; gctx.fillRect(0,0,W,cy);
  const fgr=gctx.createLinearGradient(0,cy,0,H);
  fgr.addColorStop(0,`rgb(${clamp255(red(floor)*0.45)},${clamp255(green(floor)*0.45)},${clamp255(blue(floor)*0.45)})`);
  fgr.addColorStop(1,`rgb(${clamp255(red(floor)*0.9)},${clamp255(green(floor)*0.9)},${clamp255(blue(floor)*0.9)})`);
  gctx.fillStyle=fgr; gctx.fillRect(0,cy,W,H-cy);
  gctx.restore();

  const ci=Math.round(EXPLORE.x/CS), cj=Math.round(EXPLORE.z/CS), R=14;

  // ---- fluorescent tubes over the aisles (odd lattice lines) + wet floor pools ----
  for(let k=ci-R;k<=ci+R;k++){
    if(k%2===0) continue;
    const xline=k*CS;
    for(let j=cj-R;j<=cj+R;j++){
      const z0=j*CS-CS*0.42, z1=j*CS+CS*0.42, zc=j*CS;
      const ctr=proj(xline,CY,zc); if(ctr.ez<near || ctr.ez>40) continue;
      const inten=constrain(map(ctr.ez,1,34,1,0.14),0.14,1);
      const a=proj(xline-0.1,CY,z0), b=proj(xline+0.1,CY,z0), c=proj(xline+0.1,CY,z1), d=proj(xline-0.1,CY,z1);
      if(a.ez>near&&b.ez>near&&c.ez>near&&d.ez>near){
        pg.fill(red(lite),green(lite),blue(lite),250*inten);
        pg.quad(a.x,a.y,b.x,b.y,c.x,c.y,d.x,d.y);
        gctx.save(); gctx.globalCompositeOperation='lighter';
        const hr=Math.max(10,f*0.5/ctr.ez);
        const hg=gctx.createRadialGradient(ctr.x,ctr.y,0,ctr.x,ctr.y,hr);
        hg.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.45*inten})`);
        hg.addColorStop(1,'rgba(0,0,0,0)');
        gctx.fillStyle=hg; gctx.fillRect(ctr.x-hr,ctr.y-hr,hr*2,hr*2); gctx.restore();
      }
      const fp=proj(xline,FY,zc);
      if(fp.ez>near){ const r=Math.max(8,f*1.0/fp.ez);
        gctx.save(); const grad=gctx.createRadialGradient(fp.x,fp.y,0,fp.x,fp.y,r);
        grad.addColorStop(0,`rgba(${red(lite)|0},${green(lite)|0},${blue(lite)|0},${0.13*inten})`);
        grad.addColorStop(1,'rgba(0,0,0,0)');
        gctx.fillStyle=grad; gctx.fillRect(fp.x-r,fp.y-r*0.5,r*2,r); gctx.restore();
      }
    }
  }

  // ---- concrete columns: collect faces, paint far -> near ----
  const faces=[];
  for(let i=ci-R;i<=ci+R;i++) for(let j=cj-R;j<=cj+R;j++){
    const b=walkBlock(i,j); if(!b) continue;
    const xL=b.X-b.w/2, xR=b.X+b.w/2, zN=b.Z-b.d/2, zF=b.Z+b.d/2;
    const push=(x1,z1,x2,z2,tone,front)=>{
      const a=proj(x1,CY,z1), bb=proj(x2,CY,z2), c=proj(x2,FY,z2), d=proj(x1,FY,z1);
      if(a.ez<near||bb.ez<near||c.ez<near||d.ez<near) return;
      faces.push({a,b:bb,c,d,depth:(a.ez+bb.ez)/2,tone,front, mark:b.mark});
    };
    if(EXPLORE.x<xL)       push(xL,zN,xL,zF,0.6,false);
    else if(EXPLORE.x>xR)  push(xR,zF,xR,zN,0.6,false);
    if(EXPLORE.z<zN)       push(xR,zN,xL,zN,1.0,true);
    else if(EXPLORE.z>zF)  push(xL,zF,xR,zF,1.0,true);
  }
  faces.sort((p,q)=>q.depth-p.depth);
  for(const fc of faces){
    const sh=constrain(map(fc.depth,2,R*CS,1.05,0.32),0.32,1.05)*fc.tone;
    drawConcreteWalkFace(pg,fc,wall,lite,sh);
  }

  drawWalkItems(pg,proj,near);
  pg.pop();

  // far darkness
  gctx.save();
  const dk=gctx.createRadialGradient(cx,cy,0,cx,cy,W*0.34);
  dk.addColorStop(0,'rgba(6,7,9,0.6)'); dk.addColorStop(1,'rgba(6,7,9,0)');
  gctx.fillStyle=dk; gctx.fillRect(cx-W*0.36,cy-W*0.36,W*0.72,W*0.72); gctx.restore();

  applyGrain(pg, BG.grain);
  applyVignette(pg);
  drawWalkHUD(pg,cx,cy);
}

function drawConcreteWalkFace(pg,fc,wall,lite,sh){
  const g=pg.drawingContext, r=red(wall),gg=green(wall),bb=blue(wall);
  const top=sh*1.12, bot=sh*0.7;
  const mx0=(fc.a.x+fc.b.x)/2,my0=(fc.a.y+fc.b.y)/2, mx1=(fc.d.x+fc.c.x)/2,my1=(fc.d.y+fc.c.y)/2;
  g.save();
  const grad=g.createLinearGradient(mx0,my0,mx1,my1);
  grad.addColorStop(0,`rgb(${clamp255(r*top)},${clamp255(gg*top)},${clamp255(bb*top)})`);
  grad.addColorStop(1,`rgb(${clamp255(r*bot)},${clamp255(gg*bot)},${clamp255(bb*bot)})`);
  g.beginPath(); g.moveTo(fc.a.x,fc.a.y); g.lineTo(fc.b.x,fc.b.y); g.lineTo(fc.c.x,fc.c.y); g.lineTo(fc.d.x,fc.d.y); g.closePath();
  g.fillStyle=grad; g.fill(); g.restore();
  // concrete streaks
  const wpx=Math.hypot(fc.b.x-fc.a.x,fc.b.y-fc.a.y);
  if(wpx>40){
    pg.stroke(clamp255(r*sh*0.72),clamp255(gg*sh*0.72),clamp255(bb*sh*0.72),60); pg.strokeWeight(1);
    for(let kk=1;kk<4;kk++){ const u=kk/4; const a=faceUV(fc,u,0.08), c=faceUV(fc,u,0.92); pg.line(a.x,a.y,c.x,c.y); }
    pg.noStroke();
  }
  // yellow safety stripe at the base
  const A=faceUV(fc,0,0.86),B=faceUV(fc,1,0.86),C=faceUV(fc,1,1),D=faceUV(fc,0,1);
  pg.fill(clamp255(202*sh),clamp255(170*sh),clamp255(44*sh)); pg.quad(A.x,A.y,B.x,B.y,C.x,C.y,D.x,D.y);
  // "F" marking plate on marked front faces
  if(fc.front && fc.mark && wpx>46){
    const pa=faceUV(fc,0.3,0.3), pb=faceUV(fc,0.7,0.3), pc=faceUV(fc,0.7,0.6), pd=faceUV(fc,0.3,0.6);
    pg.fill(clamp255(230*sh),clamp255(228*sh),clamp255(220*sh)); pg.quad(pa.x,pa.y,pb.x,pb.y,pc.x,pc.y,pd.x,pd.y);
    const cxp=(pa.x+pc.x)/2, cyp=(pa.y+pc.y)/2, fs=Math.hypot(pd.x-pa.x,pd.y-pa.y)*0.95;
    if(fs>6){ pg.fill(40,40,42); pg.textAlign(CENTER,CENTER); pg.textFont('monospace'); pg.textSize(fs); pg.text('F',cxp,cyp); pg.textAlign(LEFT,BASELINE); }
  }
}

function drawWalkHUD(pg,cx,cy){
  const W=pg.width,H=pg.height;
  // crosshair
  pg.stroke(230,225,200,150); pg.strokeWeight(1);
  pg.line(cx-6,cy,cx+6,cy); pg.line(cx,cy-6,cx,cy+6); pg.noStroke();
  // control hint
  pg.fill(0,0,0,120); pg.rect(14,H-58,256,44);
  pg.fill(232,214,150); pg.textFont('monospace'); pg.textSize(11);
  const S=BG_SCENES[BG.scene]||BG_SCENES.lobby;
  pg.text('▶ EXPLORE · LEVEL '+S.level, 24, H-40);
  pg.fill(180,168,120);
  pg.text('W A S D move   ← → turn   ESC exit', 24, H-23);
  // objective (top-left)
  const unlocked=WALK.collected>=WALK.need;
  pg.textFont('monospace'); pg.textSize(12);
  pg.fill(150,200,240); pg.text('◇ ALMOND WATER  '+WALK.collected+' / '+WALK.need, 20, 26);
  pg.fill(unlocked?[70,230,130]:[210,90,80]);
  pg.text(unlocked?'◇ EXIT  UNLOCKED — find the door':'◇ EXIT  LOCKED', 20, 44);
  // win overlay
  if(WALK.won){
    pg.fill(0,0,0,180); pg.rect(0,0,W,H);
    pg.textAlign(CENTER,CENTER);
    pg.fill(70,230,130); pg.textSize(34); pg.text('YOU ESCAPED', cx, cy-14);
    pg.fill(200,230,210); pg.textSize(14); pg.text('Level 0 — The Lobby', cx, cy+18);
    pg.fill(150,150,140); pg.textSize(12); pg.text('press ESC to return', cx, cy+44);
    pg.textAlign(LEFT,BASELINE);
  }
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
