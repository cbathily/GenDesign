/* ============================================================
   ENTITY GENERATOR
   Spielfiguren & Monster. Blob/tall/humanoid Silhouetten,
   zufällig verteilte Augen (cursor-tracking), Gliedmaßen,
   Render-Modi: solid / 1-bit dither / photo-grain.
   ============================================================ */

const ENT = {
  mass:0.6, limbs:2, limbLen:0.7, eyes:9, track:1,
  shape:'blob', render:'solid', preset:'watcher', seed:7777,
};

const ENT_PRESETS = {
  watcher: {shape:'tall',   mass:0.45, limbs:2, limbLen:0.85, eyes:7,  render:'photo-grain'},
  blob:    {shape:'blob',   mass:0.75, limbs:2, limbLen:0.5,  eyes:14, render:'photo-grain'},
  crawler: {shape:'humanoid',mass:0.5, limbs:6, limbLen:0.8,  eyes:4,  render:'dither'},
  player:  {shape:'humanoid',mass:0.4, limbs:4, limbLen:0.9,  eyes:2,  render:'solid'},
};

function entApplyPreset(name){
  const p = ENT_PRESETS[name]; if(!p) return;
  Object.assign(ENT, p, {preset:name});
}

// precomputed blob outline + eye positions, regenerated on seed change
let ENT_cache = null;

function entBuildCache(pg){
  randomSeed(ENT.seed); noiseSeed(ENT.seed);
  const W=pg.width, H=pg.height;
  const cx=W/2, cy=H*0.52;
  const baseR = lerp(H*0.12, H*0.30, ENT.mass);

  // ---- silhouette outline points ----
  let pts=[];
  const steps=64;
  if(ENT.shape==='blob'){
    for(let i=0;i<steps;i++){
      const a=map(i,0,steps,0,TWO_PI);
      const r=baseR*(0.72+0.5*noise(cos(a)*1.1+2, sin(a)*1.1+2));
      pts.push({x:cx+cos(a)*r, y:cy+sin(a)*r*1.15});
    }
  } else if(ENT.shape==='tall'){
    for(let i=0;i<steps;i++){
      const a=map(i,0,steps,0,TWO_PI);
      const stretch = 1.0 + 1.1*Math.abs(sin(a)); // vertical stretch
      const r=baseR*(0.55+0.4*noise(cos(a)+5, sin(a)+5));
      pts.push({x:cx+cos(a)*r*0.7, y:cy+sin(a)*r*stretch});
    }
  } else { // humanoid -> rounded torso + head bump
    for(let i=0;i<steps;i++){
      const a=map(i,0,steps,0,TWO_PI);
      let r=baseR*(0.6+0.25*noise(cos(a)+9,sin(a)+9));
      // head bump near top
      if(a>PI*0.75 && a<PI*1.25) r*=1.25;
      pts.push({x:cx+cos(a)*r*0.75, y:cy+sin(a)*r*1.2});
    }
  }

  // ---- limbs (thin legs/arms hanging from lower body) ----
  let limbs=[];
  const lc=ENT.limbs;
  for(let i=0;i<lc;i++){
    const side = (i%2===0)?-1:1;
    const rootX = cx + side*baseR*0.4 + random(-10,10);
    const rootY = cy + baseR*0.7;
    const len = baseR*(0.8+ENT.limbLen*1.6);
    const segs=4;
    let seg=[]; let px=rootX, py=rootY, ang=HALF_PI+random(-0.5,0.5);
    for(let s=0;s<segs;s++){
      ang += random(-0.6,0.6);
      px += cos(ang)*(len/segs);
      py += Math.abs(sin(ang))*(len/segs)+ (len/segs)*0.4;
      seg.push({x:px,y:py});
    }
    limbs.push(seg);
  }

  // ---- eyes scattered over silhouette interior ----
  let eyes=[];
  let tries=0;
  while(eyes.length<ENT.eyes && tries<600){
    tries++;
    const a=random(TWO_PI), rr=random(0.15,0.9);
    let ex,ey;
    if(ENT.shape==='tall'){ ex=cx+cos(a)*baseR*0.45*rr; ey=cy+sin(a)*baseR*1.6*rr; }
    else { ex=cx+cos(a)*baseR*0.62*rr; ey=cy+sin(a)*baseR*0.9*rr; }
    // reject too-close
    let ok=true;
    for(const e of eyes){ if(dist(ex,ey,e.x,e.y)< baseR*0.18){ok=false;break;} }
    if(ok) eyes.push({x:ex,y:ey,r:baseR*(0.06+random(0.04))});
  }

  ENT_cache = {cx,cy,baseR,pts,limbs,eyes,W,H};
}

function drawEntity(pg, mx, my){
  if(!ENT_cache) entBuildCache(pg);
  const C=ENT_cache;
  const W=pg.width,H=pg.height;
  pg.push(); pg.colorMode(RGB,255);

  // ---- room-ish backdrop so it reads like the reference photos ----
  pg.noStroke();
  pg.fill(214,198,170); pg.rect(0,0,W,H*0.66);          // pastel wall
  pg.fill(150,120,95);  pg.rect(0,H*0.66,W,H*0.34);     // floor
  // soft wallpaper dots
  pg.fill(255,255,255,30);
  for(let y=20;y<H*0.66;y+=46) for(let x=20;x<W;x+=46) pg.ellipse(x,y,6,6);

  // ---- limbs (behind body) ----
  pg.stroke(6,6,8); pg.strokeWeight(C.baseR*0.07); pg.noFill();
  for(const seg of C.limbs){
    pg.beginShape();
    pg.vertex(C.cx, C.cy+C.baseR*0.6);
    for(const s of seg) pg.curveVertex(s.x,s.y);
    pg.endShape();
    // little foot
    const last=seg[seg.length-1];
    pg.fill(6,6,8); pg.noStroke();
    pg.ellipse(last.x,last.y,C.baseR*0.14,C.baseR*0.09);
    pg.noFill(); pg.stroke(6,6,8);
  }

  // ---- body silhouette (matte black) ----
  pg.noStroke(); pg.fill(7,7,9);
  pg.beginShape();
  pg.curveVertex(C.pts[0].x,C.pts[0].y);
  for(const p of C.pts) pg.curveVertex(p.x,p.y);
  pg.curveVertex(C.pts[0].x,C.pts[0].y);
  pg.curveVertex(C.pts[1].x,C.pts[1].y);
  pg.endShape(CLOSE);
  // fuzzy fur edge
  pg.stroke(7,7,9); pg.strokeWeight(2);
  for(const p of C.pts){
    for(let k=0;k<3;k++){
      const a=random(TWO_PI), l=random(4,14);
      pg.line(p.x,p.y, p.x+cos(a)*l, p.y+sin(a)*l);
    }
  }
  pg.noStroke();

  // ---- eyes ----
  for(const e of C.eyes){
    // sclera
    pg.fill(238,232,210); pg.ellipse(e.x,e.y, e.r*2, e.r*2);
    // iris/pupil tracks cursor
    let dx=0,dy=0;
    if(ENT.track){
      const ang=atan2(my-e.y, mx-e.x);
      const d=Math.min(e.r*0.5, dist(mx,my,e.x,e.y)*0.05);
      dx=cos(ang)*d; dy=sin(ang)*d;
    }
    pg.fill(20,18,16); pg.ellipse(e.x+dx, e.y+dy, e.r*1.1, e.r*1.1);
    pg.fill(0); pg.ellipse(e.x+dx,e.y+dy, e.r*0.55,e.r*0.55);
    // glint
    pg.fill(255,255,255,200); pg.ellipse(e.x+dx-e.r*0.2, e.y+dy-e.r*0.2, e.r*0.25,e.r*0.25);
  }

  pg.pop();

  // ---- render mode post FX ----
  if(ENT.render==='dither') ditherPixels(pg);
  else if(ENT.render==='photo-grain'){ applyGrain(pg,0.5); applyVignette(pg); }
  else applyVignette(pg);
}

/* 1-bit Floyd–Steinberg-ish dither (like the pixel-portrait reference) */
function ditherPixels(pg){
  pg.loadPixels();
  const d=pg.pixelDensity(); const W=pg.width*d, H=pg.height*d;
  const gray=new Float32Array(W*H);
  for(let i=0;i<W*H;i++){
    const p=i*4;
    gray[i]=0.299*pg.pixels[p]+0.587*pg.pixels[p+1]+0.114*pg.pixels[p+2];
  }
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=y*W+x; const old=gray[i];
    const nw= old<128?0:255; const err=old-nw; gray[i]=nw;
    if(x+1<W) gray[i+1]+=err*7/16;
    if(y+1<H){
      if(x>0)   gray[i+W-1]+=err*3/16;
      gray[i+W]+=err*5/16;
      if(x+1<W) gray[i+W+1]+=err*1/16;
    }
  }
  // map to dark-red / cream (gameboy-ish like reference img 6)
  for(let i=0;i<W*H;i++){
    const p=i*4; const v=gray[i];
    if(v<128){ pg.pixels[p]=58; pg.pixels[p+1]=18; pg.pixels[p+2]=18; }
    else { pg.pixels[p]=224; pg.pixels[p+1]=232; pg.pixels[p+2]=214; }
    pg.pixels[p+3]=255;
  }
  pg.updatePixels();
}
