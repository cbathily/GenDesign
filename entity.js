/* ============================================================
   ENTITY GENERATOR
   Spielfiguren & Monster. Blob/tall/humanoid Silhouetten,
   zufällig verteilte Augen (cursor-tracking), Gliedmaßen,
   Render-Modi: solid / 1-bit dither / photo-grain.
   ============================================================ */

const ENT = {
  mass:0.35, limbs:4, limbLen:1.0, eyes:0, track:0,
  shape:'figure', render:'photo-grain', preset:'bacteria', seed:7777,
  bodyHue:0, bodySat:0, limbStyle:'jointed',
  eyeType:'normal', mouthType:'none', bodyExtra:'none', headType:'hat',
};

const ENT_PRESETS = {
  bacteria: {shape:'figure',   mass:0.30, limbs:4, limbLen:1.10, eyes:0,  track:0, render:'photo-grain', bodyHue:0,   bodySat:0,  limbStyle:'jointed',  eyeType:'normal',   mouthType:'none',  bodyExtra:'none',   headType:'hat'},
  papermask:{shape:'figure',   mass:0.34, limbs:4, limbLen:1.10, eyes:5,  track:1, render:'photo-grain', bodyHue:0,   bodySat:0,  limbStyle:'jointed',  eyeType:'void',     mouthType:'none',  bodyExtra:'none',   headType:'mask'},
  kitty:    {shape:'figure',   mass:0.26, limbs:2, limbLen:1.25, eyes:0,  track:0, render:'photo-grain', bodyHue:0,   bodySat:0,  limbStyle:'jointed',  eyeType:'normal',   mouthType:'none',  bodyExtra:'none',   headType:'round'},
  aranea:   {shape:'spider',   mass:0.45, limbs:8, limbLen:0.85, eyes:2,  track:1, render:'photo-grain', bodyHue:0,   bodySat:0,  limbStyle:'jointed',  eyeType:'void',     mouthType:'teeth', bodyExtra:'none',   headType:'round'},
  siren_h:  {shape:'figure',   mass:0.34, limbs:4, limbLen:1.05, eyes:2,  track:1, render:'photo-grain', bodyHue:0,   bodySat:0,  limbStyle:'jointed',  eyeType:'void',     mouthType:'none',  bodyExtra:'glow',   headType:'siren'},
  watcher:  {shape:'tall',     mass:0.45, limbs:2, limbLen:0.85, eyes:7,  track:1, render:'photo-grain', bodyHue:220, bodySat:28, limbStyle:'long',     eyeType:'normal',   mouthType:'none',  bodyExtra:'none',   headType:'none'},
  crawler:  {shape:'humanoid', mass:0.50, limbs:6, limbLen:0.80, eyes:4,  track:1, render:'dither',      bodyHue:0,   bodySat:55, limbStyle:'jointed',  eyeType:'bleeding', mouthType:'gape',  bodyExtra:'none',   headType:'none'},
  stalker:  {shape:'figure',   mass:0.28, limbs:2, limbLen:1.20, eyes:2,  track:1, render:'photo-grain', bodyHue:0,   bodySat:0,  limbStyle:'long',     eyeType:'void',     mouthType:'teeth', bodyExtra:'glow',   headType:'round'},
  amalgam:  {shape:'humanoid', mass:0.65, limbs:4, limbLen:0.75, eyes:18, track:1, render:'photo-grain', bodyHue:300, bodySat:35, limbStyle:'many',     eyeType:'bleeding', mouthType:'multi', bodyExtra:'spines', headType:'none'},
  parasite: {shape:'blob',     mass:0.55, limbs:8, limbLen:0.70, eyes:8,  track:0, render:'solid',       bodyHue:80,  bodySat:45, limbStyle:'tentacle', eyeType:'compound', mouthType:'multi', bodyExtra:'holes',  headType:'none'},
  eyeblob:  {shape:'blob',     mass:0.75, limbs:2, limbLen:0.50, eyes:14, track:1, render:'photo-grain', bodyHue:140, bodySat:22, limbStyle:'tentacle', eyeType:'normal',   mouthType:'none',  bodyExtra:'none',   headType:'none'},
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
  const cx=W/2;
  const cy = ENT.shape==='figure' ? H*0.56
           : ENT.shape==='spider' ? H*0.58
           : H*0.52;
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
      const stretch = 1.0 + 1.1*Math.abs(sin(a));
      const r=baseR*(0.55+0.4*noise(cos(a)+5, sin(a)+5));
      pts.push({x:cx+cos(a)*r*0.7, y:cy+sin(a)*r*stretch});
    }
  } else if(ENT.shape==='humanoid'){
    for(let i=0;i<steps;i++){
      const a=map(i,0,steps,0,TWO_PI);
      let r=baseR*(0.6+0.25*noise(cos(a)+9,sin(a)+9));
      if(a>PI*0.75 && a<PI*1.25) r*=1.25;
      pts.push({x:cx+cos(a)*r*0.75, y:cy+sin(a)*r*1.2});
    }
  } else if(ENT.shape==='spider'){
    // Flat horizontal oval body with forward head protrusion (right side = front)
    for(let i=0;i<steps;i++){
      const a=map(i,0,steps,0,TWO_PI);
      let r=baseR*(0.40+0.10*noise(cos(a)*0.5+7, sin(a)*0.5+7));
      const aNorm=a>PI?a-TWO_PI:a;
      r+=baseR*0.26*exp(-0.5*pow(aNorm/0.65,2));
      pts.push({x:cx+cos(a)*r*1.45, y:cy+sin(a)*r*0.42});
    }
  } else { // 'figure': thin wire-limbed column (Bacteria / backrooms entity)
    for(let i=0;i<steps;i++){
      const a=map(i,0,steps,0,TWO_PI);
      const stretch=1.0+1.4*abs(sin(a));
      const r=baseR*(0.30+0.05*noise(cos(a)*0.4+6.5, sin(a)*0.4+6.5));
      pts.push({x:cx+cos(a)*r*0.20, y:cy+sin(a)*r*stretch});
    }
  }

  // ---- limbs: shape depends on limbStyle ----
  let limbs=[];
  const lc=ENT.limbs;
  const limbStyle = ENT.limbStyle || 'long';
  for(let i=0;i<lc;i++){
    const side=(i%2===0)?-1:1;
    let seg=[], px, py, ang, len;
    let rootX=cx, rootY=cy+baseR*0.45;

    if(ENT.shape==='spider'){
      // Spider legs: roots on sides of flat body, spread outward then arc down
      const numPairs=max(ceil(lc/2),1);
      const pairIdx=floor(i/2);
      const tBody=numPairs>1?map(pairIdx,0,numPairs-1,-0.48,0.48):0;
      rootX=cx+tBody*baseR*1.05;
      rootY=cy+baseR*0.05+random(-6,6);
      len=baseR*(0.72+ENT.limbLen*1.3);
      const sx=rootX+side*len*0.38+random(-6,6);
      const sy=rootY-len*0.10+random(-5,5);
      const mx2=sx+side*len*0.18+random(-5,5);
      const my2=sy+len*0.38;
      const fx=mx2+side*random(-5,4);
      const fy=my2+len*0.38;
      seg.push({x:sx,y:sy},{x:mx2,y:my2},{x:fx,y:fy});

    } else if(ENT.shape==='figure'){
      // Figure (Bacteria-style): long wire limbs from thin body
      const isLeg = i < floor(lc/2);
      rootX = cx + side*baseR*0.10;
      rootY = isLeg ? cy + baseR*0.80 : cy - baseR*0.18;
      len = baseR*(1.5 + ENT.limbLen*2.6);
      if(isLeg){
        const jx = rootX + side*len*0.10 + random(-6,6);
        const jy = rootY + len*0.28 + random(-8,8);
        const kx = jx + side*random(-14,10);
        const ky = jy + len*0.38;
        const fx = kx + side*random(-8,5);
        const fy = ky + len*0.26;
        seg.push({x:jx,y:jy},{x:kx,y:ky},{x:fx,y:fy});
      } else {
        const ex = rootX + side*len*0.22 + random(-6,6);
        const ey = rootY + len*0.12 + random(-10,10);
        const kx = ex + side*random(-10,6);
        const ky = ey + len*0.32;
        const fx = kx + side*random(-8,5);
        const fy = ky + len*0.40;
        seg.push({x:ex,y:ey},{x:kx,y:ky},{x:fx,y:fy});
      }

    } else if(limbStyle==='tentacle'){
      // sinuous, 6 segments, root low on body, spread outward
      rootX = cx + side*baseR*0.30 + random(-8,8);
      rootY = cy + baseR*0.48;
      px = rootX; py = rootY;
      len = baseR*(1.0+ENT.limbLen*2.0);
      ang = HALF_PI + side*0.25 + random(-0.35,0.35);
      for(let s=0;s<6;s++){
        ang += random(-0.5,0.5) + side*0.08;
        px += cos(ang)*(len/6);
        py += abs(sin(ang))*(len/6) + (len/6)*0.22;
        seg.push({x:px,y:py});
      }

    } else if(limbStyle==='jointed'){
      // 3-segment insect leg: elbow + knee + foot
      rootX = cx + side*baseR*0.50 + random(-5,5);
      rootY = cy + baseR*0.36;
      len = baseR*(0.90+ENT.limbLen*1.5);
      const ex = rootX + side*len*0.36 + random(-5,5);
      const ey = rootY + len*0.22 + random(-8,8);
      const kx = ex + side*random(-8,6);
      const ky = ey + len*0.38;
      const fx = kx + side*random(-5,5);
      const fy = ky + len*0.26;
      seg.push({x:ex,y:ey},{x:kx,y:ky},{x:fx,y:fy});

    } else if(limbStyle==='many'){
      // centipede: stacked vertically, spread outward
      const numRows = max(ceil(lc/2), 1);
      const rowIdx  = floor(i/2);
      rootX = cx + side*baseR*0.55;
      rootY = cy + lerp(-baseR*0.25, baseR*0.55, rowIdx/numRows);
      px = rootX; py = rootY;
      len = baseR*(0.50+ENT.limbLen*0.90);
      ang = HALF_PI + side*(0.78 + random(-0.22,0.22));
      for(let s=0;s<5;s++){
        ang += side*0.06 + random(-0.38,0.38);
        px += cos(ang)*(len/5);
        py += abs(sin(ang))*(len/5) + (len/5)*0.08;
        seg.push({x:px,y:py});
      }

    } else {
      // 'long': thin hanging limbs, 4 segments
      rootX = cx + side*baseR*0.40 + random(-10,10);
      rootY = cy + baseR*0.70;
      px = rootX; py = rootY;
      len = baseR*(0.80+ENT.limbLen*1.6);
      ang = HALF_PI+random(-0.5,0.5);
      for(let s=0;s<4;s++){
        ang += random(-0.6,0.6);
        px += cos(ang)*(len/4);
        py += abs(sin(ang))*(len/4) + (len/4)*0.40;
        seg.push({x:px,y:py});
      }
    }
    limbs.push({x0:rootX, y0:rootY, pts:seg});
  }

  // ---- figure head position (used for eye placement + drawing) ----
  const figHeadY = cy - baseR*1.52;
  const figHeadR = baseR*0.33;
  const head = ENT.shape==='figure' ? {x:cx, y:figHeadY, r:figHeadR} : null;

  // ---- eyes: body interior for blob/tall/humanoid, head interior for figure ----
  let eyes=[];
  let tries=0;
  while(eyes.length<ENT.eyes && tries<600){
    tries++;
    const a=random(TWO_PI), rr=random(0.15,0.88);
    let ex,ey;
    if(ENT.shape==='figure'){
      ex=cx+cos(a)*figHeadR*rr*0.78;
      ey=figHeadY+sin(a)*figHeadR*rr*0.78;
    } else if(ENT.shape==='spider'){
      // eyes in spider head area (front-right protrusion)
      ex=cx+baseR*1.02+cos(a)*baseR*0.16*rr;
      ey=cy+sin(a)*baseR*0.16*rr;
    } else if(ENT.shape==='tall'){
      ex=cx+cos(a)*baseR*0.45*rr;
      ey=cy+sin(a)*baseR*1.6*rr;
    } else {
      ex=cx+cos(a)*baseR*0.62*rr;
      ey=cy+sin(a)*baseR*0.9*rr;
    }
    let ok=true;
    const minD = ENT.shape==='figure' ? figHeadR*0.28 : baseR*0.18;
    for(const e of eyes){ if(dist(ex,ey,e.x,e.y)<minD){ok=false;break;} }
    if(ok){
      const er = ENT.shape==='figure'
        ? figHeadR*(0.09+random(0.06))
        : ENT.shape==='spider'
        ? baseR*(0.045+random(0.03))
        : baseR*(0.06+random(0.04));
      eyes.push({x:ex,y:ey,r:er});
    }
  }

  ENT_cache = {cx,cy,baseR,pts,limbs,eyes,W,H,limbStyle,head};
}

function drawEye(pg, e, dx, dy, eyeType, t, ei){
  const ex=e.x+dx, ey=e.y+dy, r=e.r;
  pg.noStroke();
  if(eyeType==='void'){
    pg.fill(0); pg.ellipse(ex,ey,r*2.2,r*2.2);
    pg.fill(255,255,255,35); pg.ellipse(ex-r*0.28,ey-r*0.28,r*0.28,r*0.28);
  } else if(eyeType==='bleeding'){
    pg.fill(238,232,210); pg.ellipse(ex,ey,r*2,r*2);
    pg.fill(20,18,16); pg.ellipse(ex,ey,r*1.1,r*1.1);
    pg.fill(0); pg.ellipse(ex,ey,r*0.55,r*0.55);
    pg.fill(255,255,255,200); pg.ellipse(ex-r*0.2,ey-r*0.2,r*0.25,r*0.25);
    pg.noFill(); pg.stroke(140,10,10,180); pg.strokeWeight(r*0.22);
    const dl=r*(1.5+noise(ei*3+500,t*0.3)*2.5);
    pg.line(ex+random(-r*0.3,r*0.3),ey+r, ex+random(-r*0.3,r*0.3),ey+r+dl);
    pg.noStroke();
  } else if(eyeType==='compound'){
    pg.fill(180,220,180,220); pg.ellipse(ex,ey,r*2.2,r*2.2);
    const hexN=7;
    for(let h=0;h<hexN;h++){
      const ha=map(h,0,hexN,0,TWO_PI);
      const hx=h===0?0:cos(ha)*r*0.58, hy=h===0?0:sin(ha)*r*0.58;
      pg.fill(10,40,10,200); pg.ellipse(ex+hx,ey+hy,r*0.44,r*0.44);
      pg.fill(0,60,0,230); pg.ellipse(ex+hx,ey+hy,r*0.22,r*0.22);
    }
  } else {
    pg.fill(238,232,210); pg.ellipse(ex,ey,r*2,r*2);
    pg.fill(20,18,16); pg.ellipse(ex,ey,r*1.1,r*1.1);
    pg.fill(0); pg.ellipse(ex,ey,r*0.55,r*0.55);
    pg.fill(255,255,255,200); pg.ellipse(ex-r*0.2,ey-r*0.2,r*0.25,r*0.25);
  }
}

function drawFigureHead(pg, C, br, bg, bb, t){
  if(!C.head) return;
  const h=C.head;
  const hbob=sin(t*1.85)*3;
  const hx=h.x, hy=h.y+hbob, hr=h.r;
  pg.noStroke(); pg.fill(br,bg,bb);

  if(ENT.headType==='hat'){
    // Wide brim disc — Bacteria / Kane Pixels style
    const brimW=C.baseR*1.45;
    pg.beginShape();
    for(let i=0;i<22;i++){
      const a=map(i,0,22,0,TWO_PI);
      const nv=noise(cos(a)*0.28+91, sin(a)*0.28+91, t*0.35)*0.07;
      pg.curveVertex(hx+cos(a)*brimW*(1+nv), hy+sin(a)*(hr*0.14+nv*5));
    }
    pg.endShape(CLOSE);
    // Crown on top of brim
    pg.beginShape();
    for(let i=0;i<16;i++){
      const a=map(i,0,16,0,TWO_PI);
      const nv=noise(cos(a)*0.38+92, sin(a)*0.38+92, t*0.45)*0.11;
      pg.curveVertex(hx+cos(a)*hr*(0.88+nv), hy-hr*0.55+sin(a)*hr*(0.80+nv));
    }
    pg.endShape(CLOSE);
    // Fuzzy crown edges
    pg.stroke(br,bg,bb); pg.strokeWeight(1.5);
    for(let i=0;i<18;i++){
      const a=random(TWO_PI), r2=hr*(0.82+random(0.14)), l=random(3,14);
      pg.line(hx+cos(a)*r2, hy-hr*0.55+sin(a)*r2, hx+cos(a)*(r2+l), hy-hr*0.55+sin(a)*(r2+l));
    }
    pg.noStroke();

  } else if(ENT.headType==='siren'){
    // Round head + two outward horn/speaker shapes
    pg.ellipse(hx, hy, hr*2.1, hr*2.0);
    for(const sd of [-1,1]){
      const bx=hx+sd*hr*0.30, by=hy-hr*0.28;
      const tx=hx+sd*hr*1.90, ty=hy-hr*1.45;
      const ang=atan2(ty-by,tx-bx), nx=-sin(ang)*hr, ny=cos(ang)*hr;
      pg.beginShape();
      pg.vertex(bx+nx*0.35,by+ny*0.35); pg.vertex(bx-nx*0.35,by-ny*0.35);
      pg.vertex(tx-nx*0.76,ty-ny*0.76); pg.vertex(tx+nx*0.76,ty+ny*0.76);
      pg.endShape(CLOSE);
      pg.fill(0); pg.ellipse(tx,ty,hr*1.05,hr*0.75);
      pg.fill(br,bg,bb);
    }
    pg.stroke(br,bg,bb); pg.strokeWeight(1.5);
    for(let i=0;i<14;i++){
      const a=random(TWO_PI), r2=hr*(0.9+random(0.12)), l=random(3,12);
      pg.line(hx+cos(a)*r2,hy+sin(a)*r2, hx+cos(a)*(r2+l),hy+sin(a)*(r2+l));
    }
    pg.noStroke();

  } else if(ENT.headType==='round'){
    pg.beginShape();
    for(let i=0;i<16;i++){
      const a=map(i,0,16,0,TWO_PI);
      const nv=noise(cos(a)*0.4+82, sin(a)*0.4+82, t*0.45)*0.14;
      pg.curveVertex(hx+cos(a)*hr*(1+nv), hy+sin(a)*hr*(1+nv));
    }
    pg.endShape(CLOSE);
    pg.stroke(br,bg,bb); pg.strokeWeight(1.5);
    for(let i=0;i<14;i++){
      const a=random(TWO_PI), r2=hr*(0.9+random(0.12)), l=random(3,12);
      pg.line(hx+cos(a)*r2,hy+sin(a)*r2, hx+cos(a)*(r2+l),hy+sin(a)*(r2+l));
    }
    pg.noStroke();

  } else if(ENT.headType==='mask'){
    // Paper Mask — blasses, flaches Papier mit Kinn-Spitze (Augen kommen aus dem Augen-System)
    const mw=hr*1.7, mh=hr*2.1, mcy=hy;
    const outline=()=>{ pg.beginShape();
      pg.vertex(hx-mw*0.5, mcy-mh*0.5);
      pg.vertex(hx+mw*0.5, mcy-mh*0.5);
      pg.vertex(hx+mw*0.42, mcy+mh*0.40);
      pg.vertex(hx,         mcy+mh*0.60);     // Kinn-Spitze
      pg.vertex(hx-mw*0.42, mcy+mh*0.40);
      pg.endShape(CLOSE); };
    // blasses Papier (mit leichtem Farbtint, falls bodySat>0)
    const pr=lerp(214, br, ENT.bodySat/260), pgc=lerp(205, bg, ENT.bodySat/260), pb=lerp(184, bb, ENT.bodySat/260);
    pg.noStroke(); pg.fill(pr,pgc,pb); outline();
    // Papier-Falten / Schattenkante
    pg.noFill(); pg.stroke(120,110,92,180); pg.strokeWeight(max(1,hr*0.06)); outline();
    pg.line(hx, mcy-mh*0.42, hx, mcy+mh*0.5);            // Mittel-Falte
    pg.noStroke();
    // schmaler Mundschlitz
    pg.fill(18,16,14); pg.rect(hx-mw*0.14, mcy+mh*0.26, mw*0.28, mh*0.045);
  }
  // headType 'none': no separate head
}

function drawMouth(pg, C, t){
  const mt=ENT.mouthType||'none';
  if(mt==='none') return;
  const inHead = ENT.shape==='figure' && C.head;
  const mx2=C.cx;
  const my2=inHead ? C.head.y+C.head.r*0.32 : C.cy+C.baseR*0.12;
  const mw=inHead ? C.head.r*0.80 : C.baseR*0.22;
  pg.noStroke(); pg.fill(0);
  if(mt==='gape'){
    const mh=mw*(0.22+abs(sin(t*1.2))*0.14);
    pg.ellipse(mx2,my2,mw,mh*2);
  } else if(mt==='teeth'){
    pg.ellipse(mx2,my2,mw,mw*0.32);
    pg.fill(215,210,198);
    const nt=6;
    for(let ti=0;ti<nt;ti++){
      const tx=mx2-mw*0.42+ti*(mw*0.84/(nt-1));
      const th=mw*(0.08+random(0.06));
      pg.triangle(tx-mw*0.06,my2-mw*0.07, tx+mw*0.06,my2-mw*0.07, tx,my2-mw*0.07+th*2);
    }
  } else if(mt==='multi'){
    for(let mi=0;mi<3;mi++){
      const mmx=C.cx+noise(mi*10+401,t*0.2)*C.baseR*0.5-C.baseR*0.25;
      const mmy=C.cy+noise(mi*10+402,t*0.2)*C.baseR*0.6-C.baseR*0.3;
      pg.fill(0); pg.ellipse(mmx,mmy,mw*0.55,mw*0.18);
    }
  }
}

function drawBodyExtras(pg, C, aPts, br, bg, bb, t){
  const ex=ENT.bodyExtra||'none';
  if(ex==='none') return;
  if(ex==='spines'){
    pg.stroke(br,bg,bb); pg.strokeWeight(C.baseR*0.025);
    for(let i=0;i<aPts.length;i+=3){
      const p=aPts[i];
      const outX=p.x-C.cx, outY=p.y-C.cy;
      const mag=sqrt(outX*outX+outY*outY)+0.001;
      const len2=C.baseR*(0.18+noise(i*0.3+600,t*0.4)*0.22);
      pg.line(p.x,p.y, p.x+(outX/mag)*len2, p.y+(outY/mag)*len2);
    }
    pg.noStroke();
  } else if(ex==='holes'){
    pg.fill(0,0,0,185);
    for(let i=0;i<7;i++){
      const hx=C.cx+noise(i*5+700,t*0.25)*C.baseR-C.baseR*0.5;
      const hy=C.cy+noise(i*5+701,t*0.25)*C.baseR-C.baseR*0.5;
      const hr2=C.baseR*(0.04+noise(i*5+702,0)*0.05);
      pg.ellipse(hx,hy,hr2*2,hr2*2);
    }
  } else if(ex==='glow'){
    pg.noStroke();
    for(let g=6;g>0;g--){
      pg.fill(br,bg,bb,map(g,6,0,0,48));
      const sc=1+g*0.09;
      pg.beginShape();
      for(const p of aPts) pg.curveVertex(C.cx+(p.x-C.cx)*sc, C.cy+(p.y-C.cy)*sc);
      pg.endShape(CLOSE);
    }
  }
}

// room-ish backdrop so the entity reads like the reference photos
function drawEntityBackdrop(pg){
  const W=pg.width,H=pg.height;
  pg.push(); pg.colorMode(RGB,255); pg.noStroke();
  pg.fill(214,198,170); pg.rect(0,0,W,H*0.66);          // pastel wall
  pg.fill(150,120,95);  pg.rect(0,H*0.66,W,H*0.34);     // floor
  pg.fill(255,255,255,30);
  for(let y=20;y<H*0.66;y+=46) for(let x=20;x<W;x+=46) pg.ellipse(x,y,6,6);
  pg.pop();
}

function drawEntity(pg, mx, my, t){
  t = t || 0;
  if(!ENT_cache) entBuildCache(pg);
  drawEntityBackdrop(pg);
  drawEntityFigure(pg, mx, my, t);
  // ---- render mode post FX ----
  if(ENT.render==='dither') ditherPixels(pg);
  else if(ENT.render==='photo-grain'){ applyGrain(pg,0.5); applyVignette(pg); }
  else applyVignette(pg);
}

// Nur die Figur (ohne Backdrop/PostFX) — wiederverwendbar für ein Sprite
function drawEntityFigure(pg, mx, my, t){
  t = t || 0;
  const C=ENT_cache; if(!C) return;
  pg.push(); pg.colorMode(RGB,255);
  noiseSeed(ENT.seed);

  // ---- body colour: HSB (dark + hue) → RGB for drawing ----
  colorMode(HSB, 360, 100, 100);
  const _bc = color(ENT.bodyHue, ENT.bodySat, lerp(12, 40, ENT.bodySat / 100));
  colorMode(RGB, 255);
  const br=red(_bc)|0, bg=green(_bc)|0, bb=blue(_bc)|0;

  // ---- animated blob points: breathing pulse + noise-based surface undulation ----
  const breath = 1 + 0.04 * sin(t * 1.6);
  const aPts = C.pts.map((p, i) => {
    const dx = p.x - C.cx, dy = p.y - C.cy;
    const angle = atan2(dy, dx);
    const r = sqrt(dx * dx + dy * dy);
    const nv = noise(i * 0.38 + 10, t * 0.55);
    const ar = (r + C.baseR * 0.10 * (nv - 0.5)) * breath;
    return { x: C.cx + cos(angle) * ar, y: C.cy + sin(angle) * ar };
  });

  // ---- limbs (behind body) — style-aware + tip wobble ----
  const wAmt = C.baseR * 0.06;
  const lstyle = C.limbStyle || 'long';
  const isFigure = ENT.shape==='figure';
  const isSpider = ENT.shape==='spider';
  const lThick = isFigure         ? C.baseR*0.022
               : isSpider          ? C.baseR*0.030
               : lstyle==='tentacle' ? C.baseR*0.10
               : lstyle==='many'     ? C.baseR*0.035
               : lstyle==='jointed'  ? C.baseR*0.05
               :                       C.baseR*0.07;
  pg.stroke(br,bg,bb); pg.strokeWeight(lThick); pg.noFill();

  for(let li=0; li<C.limbs.length; li++){
    const lmb=C.limbs[li];
    const seg=lmb.pts;
    const useJointed = lstyle==='jointed' || isFigure || isSpider;

    if(useJointed){
      pg.beginShape();
      pg.vertex(lmb.x0, lmb.y0);
      for(let si=0; si<seg.length; si++){
        const s=seg[si], wf=(si+1)/seg.length;
        const wx=(noise(li*5+si*0.6,    t*0.85)-0.5)*wAmt*wf;
        const wy=(noise(li*5+si*0.6+50, t*0.85)-0.5)*wAmt*wf;
        pg.vertex(s.x+wx, s.y+wy);
      }
      pg.endShape();
      const jDot = isFigure ? C.baseR*0.045 : C.baseR*0.10;
      pg.fill(br,bg,bb); pg.noStroke();
      for(let si=0; si<seg.length-1; si++){
        const s=seg[si], wf=(si+1)/seg.length;
        const wx=(noise(li*5+si*0.6,    t*0.85)-0.5)*wAmt*wf;
        const wy=(noise(li*5+si*0.6+50, t*0.85)-0.5)*wAmt*wf;
        pg.ellipse(s.x+wx, s.y+wy, jDot, jDot);
      }
      pg.noFill(); pg.stroke(br,bg,bb);

    } else {
      // curved styles (long / tentacle / many)
      pg.beginShape();
      pg.vertex(lmb.x0, lmb.y0);
      for(let si=0; si<seg.length; si++){
        const s=seg[si], wf=(si+1)/seg.length;
        const wx=(noise(li*5+si*0.6,    t*0.85)-0.5)*wAmt*wf;
        const wy=(noise(li*5+si*0.6+50, t*0.85)-0.5)*wAmt*wf;
        pg.curveVertex(s.x+wx, s.y+wy);
      }
      pg.endShape();
      if(lstyle !== 'tentacle'){
        const last=seg[seg.length-1];
        const lwx=(noise(li*5+(seg.length-1)*0.6,    t*0.85)-0.5)*wAmt;
        const lwy=(noise(li*5+(seg.length-1)*0.6+50, t*0.85)-0.5)*wAmt;
        pg.fill(br,bg,bb); pg.noStroke();
        pg.ellipse(last.x+lwx, last.y+lwy, C.baseR*0.14, C.baseR*0.09);
        pg.noFill(); pg.stroke(br,bg,bb);
      }
    }
  }

  // ---- body silhouette using animated points ----
  pg.noStroke(); pg.fill(br,bg,bb);
  pg.beginShape();
  pg.curveVertex(aPts[0].x, aPts[0].y);
  for(const p of aPts) pg.curveVertex(p.x, p.y);
  pg.curveVertex(aPts[0].x, aPts[0].y);
  pg.curveVertex(aPts[1].x, aPts[1].y);
  pg.endShape(CLOSE);
  // fuzzy fur edge on animated outline
  pg.stroke(br,bg,bb); pg.strokeWeight(2);
  for(const p of aPts){
    for(let k=0;k<3;k++){
      const a=random(TWO_PI), l=random(4,14);
      pg.line(p.x,p.y, p.x+cos(a)*l, p.y+sin(a)*l);
    }
  }
  pg.noStroke();

  // ---- figure head (drawn on top of thin body, below eyes) ----
  if(isFigure && C.head) drawFigureHead(pg, C, br, bg, bb, t);

  // ---- body extras + mouth ----
  drawBodyExtras(pg, C, aPts, br, bg, bb, t);
  drawMouth(pg, C, t);

  // ---- eyes ----
  for(let ei=0; ei<C.eyes.length; ei++){
    const e = C.eyes[ei];
    let dx=0, dy=0;
    if(ENT.track){
      const ang = atan2(my-e.y, mx-e.x);
      const d = Math.min(e.r*0.5, dist(mx,my,e.x,e.y)*0.05);
      dx = cos(ang)*d; dy = sin(ang)*d;
    } else {
      dx = (noise(ei*4.3 + 200, t*0.38) - 0.5) * e.r * 0.55;
      dy = (noise(ei*4.3 + 300, t*0.38) - 0.5) * e.r * 0.55;
    }
    drawEye(pg, e, dx, dy, ENT.eyeType||'normal', t, ei);
  }

  pg.pop();
}

// Bounding-Box der Figur in aktuellen ENT_cache-Koordinaten (+ Rand für Animation)
function entCacheBounds(){
  const C=ENT_cache; if(!C) return null;
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  const add=(x,y)=>{ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; };
  for(const p of C.pts) add(p.x,p.y);
  for(const l of C.limbs){ add(l.x0,l.y0); for(const s of l.pts) add(s.x,s.y); }
  for(const e of C.eyes){ add(e.x-e.r,e.y-e.r); add(e.x+e.r,e.y+e.r); }
  if(C.head){ const hr=C.head.r*1.6; add(C.head.x-hr, C.head.y-hr); add(C.head.x+hr, C.head.y+hr*1.3); }
  const mX=(maxX-minX)*0.14+12, mY=(maxY-minY)*0.10+12;   // Rand: Atmen/Wackeln/Fransen
  return {minX:minX-mX, minY:minY-mY, maxX:maxX+mX, maxY:maxY+mY};
}

// Rendert NUR die Figur (transparent, ohne Backdrop/Grain) in einen Offscreen-Buffer.
// Baut den Cache für die Buffer-Größe, gibt die Figur-Bounds in Buffer-Koords zurück.
function drawEntitySprite(buf, t){
  const saved = ENT_cache;
  ENT_cache = null;
  entBuildCache(buf);
  const bounds = entCacheBounds();
  buf.clear();
  drawEntityFigure(buf, -99999, -99999, t);   // mx/my weit weg → kein Eye-Tracking
  ENT_cache = saved;                            // Entity-Tab-Cache wiederherstellen
  return bounds;
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
