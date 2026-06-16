/* ============================================================
   BACKGROUND GENERATOR
   Prozedurale liminale Räume: Korridore, Säulenhallen, void rooms.
   Ein-Punkt-Perspektive + Perlin-noise Wände + Fog + Grain.
   ============================================================ */

const BG = {
  hue: 50, depth: 7, light: 0.55, grain: 0.40, fog: 0.30,
  geo: 'corridor',
  palette: 'backrooms',
  seed: 1234,
  // base colors per palette (h,s,b in p5 HSB-ish but we use RGB helpers)
};

// Palette definitions — driven by prompt presets, hue slider shifts them
const BG_PALETTES = {
  backrooms: { wall:[150,140,55], floor:[150,135,70], ceil:[120,110,50], light:[255,245,180], mood:50 },
  poolrooms: { wall:[120,190,205], floor:[90,170,200], ceil:[140,200,210], light:[230,250,255], mood:185 },
  ballroom:  { wall:[210,150,180], floor:[80,150,150], ceil:[150,170,200], light:[255,200,225], mood:320 },
  rainbow:   { wall:[150,165,170], floor:[110,150,90], ceil:[170,175,185], light:[255,240,210], mood:140 },
};

function bgApplyPalette(name){
  BG.palette = name;
  if (BG_PALETTES[name]) BG.hue = BG_PALETTES[name].mood;
}

// shift an [r,g,b] toward a target hue by amount (0..1)
function hueShift(rgb, targetHue, amt){
  const c = color(rgb[0],rgb[1],rgb[2]);
  let h = hue(c), s = saturation(c), b = brightness(c);
  let nh = lerp(h, targetHue, amt);
  return color('hsb('+Math.round(nh)+','+Math.round(s)+'%,'+Math.round(b)+'%)');
}

function drawBackground(pg, t){
  const P = BG_PALETTES[BG.palette] || BG_PALETTES.backrooms;
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

  if (BG.geo === 'void'){
    drawVoidRoom(pg,cx,cy,wall,floor,ceil,lite);
  } else if (BG.geo === 'pillars'){
    drawCorridor(pg,cx,cy,wall,floor,ceil,lite,true);
  } else {
    drawCorridor(pg,cx,cy,wall,floor,ceil,lite,false);
  }

  // ---- light bloom at vanishing point ----
  const lightR = lerp(40,180,BG.light);
  for(let i=8;i>0;i--){
    pg.fill(red(lite),green(lite),blue(lite), 9*BG.light);
    pg.ellipse(cx,cy, lightR*i*0.5, lightR*i*0.32);
  }

  // ---- fog / haze ----
  if(BG.fog>0){
    for(let i=0;i<5;i++){
      const a = BG.fog*22*(1-i/6);
      pg.fill(red(lite),green(lite),blue(lite),a);
      pg.rect(0, cy-20 + i*4, W, 60);
    }
    // depth haze toward vanishing point
    pg.fill(red(ceil),green(ceil),blue(ceil), BG.fog*120);
    pg.ellipse(cx,cy, W*0.5, H*0.4);
  }

  pg.pop();

  // ---- grain overlay (drawn in RGB on top) ----
  applyGrain(pg, BG.grain);
  applyVignette(pg);
}

// One-point-perspective corridor. Receding rectangular "frames".
function drawCorridor(pg,cx,cy,wall,floor,ceil,lite,pillars){
  const W=pg.width,H=pg.height;
  const layers = BG.depth;
  // draw from far (small) to near (big)
  for(let i=layers;i>=1;i--){
    const f = i/layers;                  // 1 = near, ->0 far
    const w = lerp(W*0.12, W*1.05, f);
    const h = lerp(H*0.10, H*1.05, f);
    const x = cx - w/2, y = cy - h*0.5;
    // wall ring shade — darker far, with subtle noise
    const shade = lerp(0.55,1.0,f) * lerp(0.7,1.15,noise(i*0.5, BG.seed*0.01));
    pg.fill(red(wall)*shade, green(wall)*shade, blue(wall)*shade);
    // left & right walls (trapezoids) via the ring
    pg.beginShape();
      pg.vertex(0, y); pg.vertex(x, y);
      pg.vertex(x, y+h); pg.vertex(0, y+h);
    pg.endShape(CLOSE);
    pg.beginShape();
      pg.vertex(W, y); pg.vertex(x+w, y);
      pg.vertex(x+w, y+h); pg.vertex(W, y+h);
    pg.endShape(CLOSE);
    // ceiling strip
    pg.fill(red(ceil)*shade, green(ceil)*shade, blue(ceil)*shade);
    pg.beginShape();
      pg.vertex(0,0); pg.vertex(W,0); pg.vertex(x+w,y); pg.vertex(x,y);
    pg.endShape(CLOSE);
    // floor strip
    pg.fill(red(floor)*shade*0.92, green(floor)*shade*0.92, blue(floor)*shade*0.92);
    pg.beginShape();
      pg.vertex(0,H); pg.vertex(W,H); pg.vertex(x+w,y+h); pg.vertex(x,y+h);
    pg.endShape(CLOSE);

    // ceiling light panel every other ring (backrooms fluorescent)
    if(i%2===0){
      const lx = cx, ly = lerp(cy, y, 0.5);
      pg.fill(red(lite),green(lite),blue(lite), 200*shade);
      pg.rect(lx-w*0.06, y+ (h*0.02), w*0.12, h*0.015);
    }

    // pillars mode: vertical blocks flanking
    if(pillars && i<layers && i>1){
      const pw = w*0.09;
      const sh2 = shade*0.85;
      pg.fill(red(wall)*sh2, green(wall)*sh2, blue(wall)*sh2);
      pg.rect(x+w*0.16, y+h*0.12, pw, h*0.76);
      pg.rect(x+w*0.75, y+h*0.12, pw, h*0.76);
    }
  }
  // far doorway (dark)
  const dw=W*0.07, dh=H*0.12;
  pg.fill(8,7,5);
  pg.rect(cx-dw/2, cy-dh*0.55, dw, dh);
}

function drawVoidRoom(pg,cx,cy,wall,floor,ceil,lite){
  const W=pg.width,H=pg.height;
  // single big room: back wall + floor + ceiling perspective
  const bw=W*0.62, bh=H*0.5;
  const bx=cx-bw/2, by=cy-bh*0.5;
  // back wall
  pg.fill(red(wall)*0.8,green(wall)*0.8,blue(wall)*0.8);
  pg.rect(bx,by,bw,bh);
  // side walls
  pg.fill(red(wall)*0.62,green(wall)*0.62,blue(wall)*0.62);
  pg.beginShape();pg.vertex(0,0);pg.vertex(bx,by);pg.vertex(bx,by+bh);pg.vertex(0,H);pg.endShape(CLOSE);
  pg.beginShape();pg.vertex(W,0);pg.vertex(bx+bw,by);pg.vertex(bx+bw,by+bh);pg.vertex(W,H);pg.endShape(CLOSE);
  // ceiling
  pg.fill(red(ceil)*0.9,green(ceil)*0.9,blue(ceil)*0.9);
  pg.beginShape();pg.vertex(0,0);pg.vertex(W,0);pg.vertex(bx+bw,by);pg.vertex(bx,by);pg.endShape(CLOSE);
  // light grid on ceiling
  for(let i=0;i<3;i++){
    pg.fill(red(lite),green(lite),blue(lite),180);
    pg.rect(cx-60+i*60-30, by+18, 26, 8);
  }
  // door
  pg.fill(8,7,5); pg.rect(cx-W*0.03, by+bh*0.55, W*0.06, bh*0.42);
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
