/* ============================================================
   ENTITY GENERATOR — modulares Layer-System (Paper-Doll)
   Eine Entity = Basis-Body + Layer-Kategorien:
     Body · Head · Eyes · Face(Mouth/Expression) · Torso ·
     Arms · Legs · Skin(Type+Pattern) · Accessories
   (Kategorie "Rüstung/Armor" bewusst weggelassen.)
   Alles 2D, prozedural, layerweise von hinten nach vorn gezeichnet.
   Optionen sind frei kombinierbar + Randomizer + Presets.
   ============================================================ */

const ENT_OPTIONS = {
  body:    ['none','humanoid','quadruped','insectoid','serpentine','blob','floating','mechanical'],
  head:    ['none','human','skull','wolf','bird','lizard','hydra','eyeless','monitor','mask','crystal'],
  eyeType: ['normal','glowing','compound','lens','hollow','cosmos'],
  mouth:   ['normal','maw','beak','none','many'],
  expr:    ['neutral','angry','sad','glitch','berserk'],
  torso:   ['none','humanoid','armored','organic','crystalline','scaly','mechanical','hollow'],
  armType: ['human','tentacle','claws','blades','stone','mech'],
  legs:    ['none','two','four','many','wheels','hover','slime','jump'],
  skin:    ['flesh','fur','scales','metal','stone','energy','crystal'],
  pattern: ['none','stripes','runes','biolum','scars','cracks'],
  accHorns:['none','curved','straight','ram','antler'],
  accWings:['none','angel','demon','insect'],
  accTail: ['none','lizard','devil','fish','tentacle'],
  accAura: ['none','flames','glow','smoke'],
};

// the empty starting point — you build the entity up from nothing,
// in a sensible order (Body first as the base, then the rest).
const ENT_EMPTY = {
  body:'none', head:'none',
  eyes:0, eyeType:'normal',
  mouth:'none', expr:'neutral',
  torso:'none',
  arms:0, armType:'human', armSym:true,
  legs:'none',
  skin:'flesh', pattern:'none',
  accHorns:'none', accWings:'none', accTail:'none', accAura:'none',
  accSpikes:false, accParasites:false, accChains:false,
};

const ENT = Object.assign(
  { size:0.55, seed:7777, track:1, render:'solid', bodyHue:210, bodyLight:45, preset:'empty' },
  ENT_EMPTY
);

function entReset(){ Object.assign(ENT, ENT_EMPTY, {preset:'empty'}); }

// true when no part has been added yet (only the empty stage shows)
function entIsEmpty(){
  return ENT.body==='none' && ENT.head==='none' && ENT.torso==='none' &&
    (ENT.eyes|0)===0 && (ENT.arms|0)===0 && ENT.legs==='none' &&
    ENT.accHorns==='none' && ENT.accWings==='none' && ENT.accTail==='none' &&
    ENT.accAura==='none' && !ENT.accSpikes && !ENT.accParasites && !ENT.accChains;
}

const ENT_PRESETS = {
  watcher:  {body:'humanoid', head:'eyeless', eyes:8, eyeType:'glowing', mouth:'none', expr:'neutral',
             torso:'organic', arms:2, armType:'human', legs:'two', skin:'flesh', pattern:'none',
             accHorns:'none', accWings:'none', accTail:'none', accAura:'glow', bodyHue:210, bodyLight:30},
  demon:    {body:'humanoid', head:'skull', eyes:2, eyeType:'glowing', mouth:'maw', expr:'angry',
             torso:'armored', arms:2, armType:'claws', legs:'two', skin:'flesh', pattern:'cracks',
             accHorns:'curved', accWings:'demon', accTail:'devil', accAura:'flames', accSpikes:true,
             bodyHue:6, bodyLight:32},
  spider:   {body:'insectoid', head:'eyeless', eyes:8, eyeType:'compound', mouth:'maw', expr:'berserk',
             torso:'scaly', arms:0, armType:'claws', legs:'many', skin:'scales', pattern:'none',
             accHorns:'none', accWings:'none', accTail:'none', accAura:'none', bodyHue:140, bodyLight:24},
  ghost:    {body:'floating', head:'human', eyes:2, eyeType:'hollow', mouth:'none', expr:'sad',
             torso:'hollow', arms:2, armType:'tentacle', legs:'none', skin:'energy', pattern:'biolum',
             accHorns:'none', accWings:'none', accTail:'none', accAura:'smoke', bodyHue:200, bodyLight:60},
  mech:     {body:'mechanical', head:'monitor', eyes:1, eyeType:'lens', mouth:'none', expr:'glitch',
             torso:'mechanical', arms:2, armType:'mech', legs:'wheels', skin:'metal', pattern:'runes',
             accHorns:'none', accWings:'none', accTail:'none', accAura:'none', accChains:true,
             bodyHue:210, bodyLight:55},
  hydra:    {body:'serpentine', head:'hydra', eyes:2, eyeType:'normal', mouth:'beak', expr:'angry',
             torso:'scaly', arms:0, armType:'claws', legs:'none', skin:'scales', pattern:'stripes',
             accHorns:'straight', accWings:'none', accTail:'tentacle', accAura:'none', bodyHue:120, bodyLight:34},
  cosmic:   {body:'humanoid', head:'crystal', eyes:3, eyeType:'cosmos', mouth:'none', expr:'neutral',
             torso:'crystalline', arms:4, armType:'blades', legs:'hover', skin:'crystal', pattern:'biolum',
             accHorns:'antler', accWings:'angel', accTail:'none', accAura:'glow', bodyHue:280, bodyLight:55},
};

function entApplyPreset(name){
  const p=ENT_PRESETS[name]; if(!p) return;
  // reset accessory toggles unless the preset re-sets them
  ENT.accSpikes=false; ENT.accParasites=false; ENT.accChains=false;
  Object.assign(ENT, p, {preset:name});
}

function entRandomize(){
  const pick=a=>a[(Math.random()*a.length)|0];
  ENT.body=pick(ENT_OPTIONS.body); ENT.head=pick(ENT_OPTIONS.head);
  ENT.eyes=(Math.random()*9)|0; ENT.eyeType=pick(ENT_OPTIONS.eyeType);
  ENT.mouth=pick(ENT_OPTIONS.mouth); ENT.expr=pick(ENT_OPTIONS.expr);
  ENT.torso=pick(ENT_OPTIONS.torso);
  ENT.arms=(Math.random()*7)|0; ENT.armType=pick(ENT_OPTIONS.armType); ENT.armSym=Math.random()<0.7;
  ENT.legs=pick(ENT_OPTIONS.legs);
  ENT.skin=pick(ENT_OPTIONS.skin); ENT.pattern=pick(ENT_OPTIONS.pattern);
  ENT.accHorns=pick(ENT_OPTIONS.accHorns); ENT.accWings=pick(ENT_OPTIONS.accWings);
  ENT.accTail=pick(ENT_OPTIONS.accTail);  ENT.accAura=pick(ENT_OPTIONS.accAura);
  ENT.accSpikes=Math.random()<0.4; ENT.accParasites=Math.random()<0.3; ENT.accChains=Math.random()<0.3;
  ENT.bodyHue=(Math.random()*360)|0; ENT.bodyLight=20+(Math.random()*55|0);
  ENT.seed=(Math.random()*99999)|0; ENT.preset='custom';
}

// ---- colour / skin ----
function entSkin(){
  let sat=55, light=ENT.bodyLight, hue=ENT.bodyHue;
  switch(ENT.skin){
    case 'metal':  sat=14; break;
    case 'stone':  sat=10; break;
    case 'energy': sat=95; light=Math.max(light,55); break;
    case 'crystal':sat=72; light=Math.max(light,48); break;
    case 'scales': sat=58; break;
    case 'fur':    sat=42; break;
    default:       sat=55;            // flesh
  }
  const C=(s,l)=>color('hsb('+Math.round(hue)+','+Math.round(s)+'%,'+Math.round(constrain(l,2,100))+'%)');
  return { type:ENT.skin, hue, sat, light,
           fill:C(sat,light), edge:C(sat,light*0.5), spec:C(sat*0.4, light*1.7+22), dark:C(sat,light*0.32) };
}

// keep these defined (app.js setup/windowResized reference them)
let ENT_cache = null;
function entBuildCache(){ /* deterministic per-frame now; nothing to cache */ }

/* ============================================================
   RIG — Ankerpunkte aus Body-Typ + Größe
   ============================================================ */
function entRig(W,H){
  const cx=W*0.5, cy=H*0.50;
  const R=lerp(H*0.085, H*0.20, ENT.size);     // base unit
  const rig={ cx, cy, R, W, H, body:ENT.body, ground:cy+R*1.9, orient:'upright',
              head:{x:cx,y:cy-R*1.25,r:R*0.5},
              trunk:{x:cx, top:cy-R*0.7, bot:cy+R*0.6, wTop:R*0.6, wBot:R*0.42},
              shoulders:[{x:cx-R*0.6,y:cy-R*0.55},{x:cx+R*0.6,y:cy-R*0.55}],
              hips:[{x:cx-R*0.3,y:cy+R*0.6},{x:cx+R*0.3,y:cy+R*0.6}] };

  if(ENT.body==='quadruped'){
    rig.orient='horizontal';
    rig.head={x:cx+R*1.15, y:cy-R*0.15, r:R*0.46};
    rig.trunk={x:cx-R*0.2, top:cy-R*0.55, bot:cy+R*0.45, wTop:R*1.4, wBot:R*1.4};
    rig.shoulders=[{x:cx+R*0.7,y:cy+R*0.4},{x:cx-R*0.9,y:cy+R*0.4}];
    rig.hips=[{x:cx+R*0.8,y:cy+R*0.45},{x:cx+R*0.3,y:cy+R*0.45},{x:cx-R*0.4,y:cy+R*0.45},{x:cx-R*1.0,y:cy+R*0.45}];
    rig.ground=cy+R*1.4;
  } else if(ENT.body==='serpentine'){
    rig.head={x:cx, y:cy-R*1.5, r:R*0.46};
    rig.trunk={x:cx, top:cy-R*1.1, bot:cy+R*1.6, wTop:R*0.5, wBot:R*0.34};
    rig.shoulders=[{x:cx-R*0.4,y:cy-R*0.9},{x:cx+R*0.4,y:cy-R*0.9}];
    rig.hips=[]; rig.ground=cy+R*1.9;
  } else if(ENT.body==='blob'){
    rig.head={x:cx, y:cy-R*0.55, r:R*0.7};
    rig.trunk={x:cx, top:cy-R*0.2, bot:cy+R*1.0, wTop:R*1.1, wBot:R*1.2};
    rig.shoulders=[{x:cx-R*0.9,y:cy+R*0.2},{x:cx+R*0.9,y:cy+R*0.2}];
    rig.hips=[{x:cx-R*0.5,y:cy+R*1.0},{x:cx+R*0.5,y:cy+R*1.0}];
    rig.ground=cy+R*1.3;
  } else if(ENT.body==='floating'){
    rig.head={x:cx, y:cy-R*1.0, r:R*0.55};
    rig.trunk={x:cx, top:cy-R*0.4, bot:cy+R*0.9, wTop:R*0.62, wBot:R*0.1};
    rig.shoulders=[{x:cx-R*0.6,y:cy-R*0.3},{x:cx+R*0.6,y:cy-R*0.3}];
    rig.hips=[]; rig.ground=cy+R*1.6;
  } else if(ENT.body==='insectoid'){
    rig.head={x:cx, y:cy-R*1.2, r:R*0.42};
    rig.trunk={x:cx, top:cy-R*0.8, bot:cy+R*0.9, wTop:R*0.5, wBot:R*0.7};
    rig.shoulders=[{x:cx-R*0.5,y:cy-R*0.55},{x:cx+R*0.5,y:cy-R*0.55}];
    rig.hips=[{x:cx-R*0.45,y:cy+R*0.5},{x:cx+R*0.45,y:cy+R*0.5}];
    rig.ground=cy+R*1.7;
  } else if(ENT.body==='mechanical'){
    rig.head={x:cx, y:cy-R*1.25, r:R*0.48};
    rig.trunk={x:cx, top:cy-R*0.75, bot:cy+R*0.6, wTop:R*0.66, wBot:R*0.5};
    rig.shoulders=[{x:cx-R*0.72,y:cy-R*0.6},{x:cx+R*0.72,y:cy-R*0.6}];
    rig.hips=[{x:cx-R*0.34,y:cy+R*0.6},{x:cx+R*0.34,y:cy+R*0.6}];
    rig.ground=cy+R*1.85;
  }
  return rig;
}

/* ============================================================
   LIMB helper — tapered, optionally bent, with end effector
   ============================================================ */
function entLimb(pg, x0,y0, x1,y1, w0,w1, bend, col){
  const mx=(x0+x1)/2 + (bend||0), my=(y0+y1)/2;
  const N=10, pts=[], L=[], Rr=[];
  for(let i=0;i<=N;i++){ const t=i/N;
    pts.push({ x:(1-t)*(1-t)*x0+2*(1-t)*t*mx+t*t*x1, y:(1-t)*(1-t)*y0+2*(1-t)*t*my+t*t*y1 }); }
  for(let i=0;i<=N;i++){ const t=i/N, w=lerp(w0,w1,t);
    const a=pts[Math.min(N,i+1)], b=pts[Math.max(0,i-1)];
    const dx=a.x-b.x, dy=a.y-b.y, len=Math.hypot(dx,dy)||1, nx=-dy/len, ny=dx/len;
    L.push({x:pts[i].x+nx*w,y:pts[i].y+ny*w}); Rr.push({x:pts[i].x-nx*w,y:pts[i].y-ny*w}); }
  pg.noStroke(); pg.fill(col); pg.beginShape();
  for(const p of L) pg.vertex(p.x,p.y);
  for(let i=N;i>=0;i--) pg.vertex(Rr[i].x,Rr[i].y);
  pg.endShape(CLOSE);
  return { tip:pts[N], dir:Math.atan2(pts[N].y-pts[N-1].y, pts[N].x-pts[N-1].x) };
}
function entHand(pg, tip, dir, w, type, sk){
  const x=tip.x, y=tip.y; pg.noStroke();
  if(type==='claws'){ pg.fill(sk.dark);
    for(let c=-1;c<=1;c++){ const a=dir+c*0.5; pg.stroke(sk.dark); pg.strokeWeight(w*0.5); pg.line(x,y, x+Math.cos(a)*w*2.4, y+Math.sin(a)*w*2.4); } pg.noStroke();
  } else if(type==='blades'){ pg.fill(sk.spec);
    pg.triangle(x-w*0.4,y, x+w*0.4,y, x+Math.cos(dir)*w*3.4, y+Math.sin(dir)*w*3.4);
  } else if(type==='tentacle'){ pg.fill(sk.fill);
    for(let i=0;i<4;i++){ const t=i/3; pg.ellipse(x+Math.cos(dir)*w*i*0.6, y+Math.sin(dir)*w*i*0.6, w*(1.2-t), w*(1.2-t)); }
  } else if(type==='mech'){ pg.fill(sk.dark);
    pg.rect(x-w*0.7,y-w*0.5,w*1.4,w); pg.fill(sk.spec);
    pg.rect(x-w*0.2+Math.cos(dir)*w, y-w*0.7, w*0.4, w*1.4);
  } else if(type==='stone'){ pg.fill(sk.fill);
    pg.ellipse(x,y,w*2.2,w*2.0); pg.fill(sk.dark); pg.ellipse(x+w*0.3,y,w*0.9,w*0.9);
  } else { pg.fill(sk.fill); pg.ellipse(x,y, w*1.8, w*2.0); }   // human hand
}

/* ============================================================
   LAYERS
   ============================================================ */
function entAura(pg, rig, kind){
  if(kind==='none') return;
  const g=pg.drawingContext, cx=rig.cx, cy=rig.cy, R=rig.R;
  g.save();
  if(kind==='glow'){
    const gr=g.createRadialGradient(cx,cy,0,cx,cy,R*3.2);
    gr.addColorStop(0,'rgba(150,210,255,0.30)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.fillRect(cx-R*3.2,cy-R*3.2,R*6.4,R*6.4);
  } else if(kind==='flames'){
    for(let i=0;i<26;i++){ const a=random(TWO_PI), rr=R*(1.0+random(1.4));
      const x=cx+Math.cos(a)*rr*0.6, y=rig.ground-Math.abs(Math.sin(a))*rr;
      const gr=g.createRadialGradient(x,y,0,x,y,R*0.5);
      gr.addColorStop(0,'rgba(255,150,40,0.5)'); gr.addColorStop(0.6,'rgba(220,50,20,0.3)'); gr.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gr; g.fillRect(x-R*0.5,y-R*0.5,R,R); }
  } else if(kind==='smoke'){
    for(let i=0;i<18;i++){ const x=cx+random(-R*1.6,R*1.6), y=cy+random(-R*1.4,R*1.8);
      const gr=g.createRadialGradient(x,y,0,x,y,R*0.7);
      gr.addColorStop(0,'rgba(120,120,140,0.18)'); gr.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gr; g.fillRect(x-R*0.7,y-R*0.7,R*1.4,R*1.4); }
  }
  g.restore();
}

function entWings(pg, rig, kind, sk){
  if(kind==='none') return;
  const cx=rig.cx, y=rig.trunk.top+ (rig.bot-rig.top||0), R=rig.R, ty=rig.trunk.top+R*0.1;
  pg.push();
  for(const side of [-1,1]){
    const bx=cx+side*R*0.5, by=ty;
    if(kind==='angel'){
      pg.fill(sk.spec); pg.noStroke();
      pg.beginShape(); pg.vertex(bx,by);
      pg.bezierVertex(bx+side*R*1.4,by-R*1.2, bx+side*R*2.4,by-R*0.2, bx+side*R*1.8,by+R*1.4);
      pg.bezierVertex(bx+side*R*1.2,by+R*0.6, bx+side*R*0.8,by+R*0.4, bx,by+R*0.2);
      pg.endShape(CLOSE);
    } else if(kind==='demon'){
      pg.fill(sk.dark); pg.noStroke();
      pg.beginShape(); pg.vertex(bx,by);
      pg.vertex(bx+side*R*2.2,by-R*0.8); pg.vertex(bx+side*R*1.7,by-R*0.1);
      pg.vertex(bx+side*R*2.3,by+R*0.5); pg.vertex(bx+side*R*1.6,by+R*0.6);
      pg.vertex(bx+side*R*2.0,by+R*1.3); pg.vertex(bx+side*R*0.9,by+R*0.7);
      pg.endShape(CLOSE);
    } else if(kind==='insect'){
      pg.fill(red(sk.spec),green(sk.spec),blue(sk.spec),120); pg.noStroke();
      pg.ellipse(bx+side*R*1.2, by+R*0.2, R*2.2, R*1.1);
      pg.ellipse(bx+side*R*1.0, by+R*0.9, R*1.5, R*0.8);
    }
  }
  pg.pop();
}

function entTail(pg, rig, kind, sk){
  if(kind==='none') return;
  const baseX=rig.cx, baseY=rig.trunk.bot, R=rig.R;
  pg.noStroke();
  if(kind==='lizard'){ entLimb(pg, baseX,baseY, baseX-R*0.2,rig.ground+R*0.2, R*0.22,R*0.02, R*1.2, sk.fill); }
  else if(kind==='devil'){ const r=entLimb(pg, baseX,baseY, baseX+R*1.0,baseY+R*1.2, R*0.14,R*0.05, R*0.8, sk.dark);
    pg.fill(sk.dark); pg.triangle(r.tip.x-R*0.18,r.tip.y, r.tip.x+R*0.18,r.tip.y, r.tip.x,r.tip.y+R*0.35); }
  else if(kind==='fish'){ pg.fill(red(sk.spec),green(sk.spec),blue(sk.spec),180);
    pg.triangle(baseX,baseY, baseX-R*0.7,baseY+R*1.1, baseX+R*0.7,baseY+R*1.1); }
  else if(kind==='tentacle'){ const r=entLimb(pg, baseX,baseY, baseX+R*0.3,rig.ground+R*0.3, R*0.2,R*0.03, Math.sin(frameCount*0.05)*R*0.8, sk.fill);
    entHand(pg, r.tip, r.dir, R*0.1, 'tentacle', sk); }
}

function entSpikes(pg, rig, sk){
  const t=rig.trunk; pg.fill(sk.dark); pg.noStroke();
  for(let i=0;i<6;i++){ const ty=lerp(t.top,t.bot,i/5);
    pg.triangle(t.x-2,ty, t.x+2,ty, t.x-rig.R*0.0, ty-rig.R*0.5);
    pg.triangle(t.x-rig.R*0.5,ty, t.x-rig.R*0.5+6,ty, t.x-rig.R*0.9, ty-rig.R*0.3); }
}

function entLegs(pg, rig, kind, sk){
  if(kind==='none'){ // floating wisp instead of legs
    if(rig.body==='floating'||rig.body==='serpentine'){
      pg.noStroke(); pg.fill(red(sk.fill),green(sk.fill),blue(sk.fill),200);
      pg.beginShape(); pg.vertex(rig.trunk.x-rig.trunk.wTop*0.6, rig.trunk.bot);
      for(let i=0;i<=8;i++){ const t=i/8; const w=lerp(rig.trunk.wTop*0.6,0,t);
        pg.vertex(rig.trunk.x+Math.sin(frameCount*0.05+t*6)*rig.R*0.3*(1-t)+w, lerp(rig.trunk.bot,rig.ground,t)); }
      for(let i=8;i>=0;i--){ const t=i/8; const w=lerp(rig.trunk.wTop*0.6,0,t);
        pg.vertex(rig.trunk.x+Math.sin(frameCount*0.05+t*6)*rig.R*0.3*(1-t)-w, lerp(rig.trunk.bot,rig.ground,t)); }
      pg.endShape(CLOSE);
    }
    return;
  }
  const R=rig.R, gy=rig.ground;
  const drawLeg=(x, foot)=>{ const r=entLimb(pg, x,rig.trunk.bot, x+(x<rig.cx?-1:1)*R*0.1, gy, R*0.16,R*0.08, 0, sk.fill);
    if(foot){ pg.fill(sk.dark); pg.ellipse(r.tip.x,gy, R*0.34, R*0.16); } };
  if(kind==='two'){ drawLeg(rig.cx-R*0.28,true); drawLeg(rig.cx+R*0.28,true); }
  else if(kind==='four'){ for(const s of [-0.5,-0.18,0.18,0.5]) drawLeg(rig.cx+R*s,true); }
  else if(kind==='many'){ for(let i=0;i<8;i++){ const s=(i-3.5)*0.28; const bend=(i%2?1:-1)*R*0.8;
      entLimb(pg, rig.cx+R*s*0.4, rig.trunk.bot-R*0.1, rig.cx+R*s*1.8, gy, R*0.07,R*0.02, bend, sk.fill); } }
  else if(kind==='jump'){ for(const side of [-1,1]){
      const kx=rig.cx+side*R*0.7, ky=rig.trunk.bot+R*0.2;
      entLimb(pg, rig.cx+side*R*0.25, rig.trunk.bot, kx,ky, R*0.13,R*0.09, 0, sk.fill);
      const r=entLimb(pg, kx,ky, rig.cx+side*R*0.45, gy, R*0.1,R*0.04, side*R*0.4, sk.fill);
      pg.fill(sk.dark); pg.ellipse(r.tip.x,gy,R*0.3,R*0.12); } }
  else if(kind==='wheels'){ pg.fill(sk.dark);
    for(const s of [-0.4,0.4]){ pg.ellipse(rig.cx+R*s, gy-R*0.3, R*0.7, R*0.7); pg.fill(sk.spec); pg.ellipse(rig.cx+R*s, gy-R*0.3, R*0.3,R*0.3); pg.fill(sk.dark);} }
  else if(kind==='hover'){ const g=pg.drawingContext; g.save();
    const gr=g.createRadialGradient(rig.cx,gy-R*0.1,0,rig.cx,gy-R*0.1,R*1.2);
    gr.addColorStop(0,'rgba(120,200,255,0.5)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.fillRect(rig.cx-R*1.2,gy-R*0.6,R*2.4,R*0.9); g.restore(); }
  else if(kind==='slime'){ pg.fill(sk.fill); pg.noStroke();
    pg.ellipse(rig.cx, rig.trunk.bot+R*0.3, rig.trunk.wBot*2.6, R*0.8); }
}

// base body silhouette (depends on ENT.body) — nothing when 'none'
function entBody(pg, rig, sk){
  if(rig.body==='none') return;
  const t=rig.trunk; pg.noStroke();
  const top=t.top, bot=t.bot, wT=t.wTop, wB=t.wBot, x=t.x;
  const drawTrunk=(col)=>{ pg.fill(col); pg.beginShape();
    pg.vertex(x-wT,top); pg.vertex(x+wT,top);
    pg.bezierVertex(x+wT*1.05,(top+bot)/2, x+wB*1.1,bot-rig.R*0.1, x+wB,bot);
    pg.vertex(x-wB,bot);
    pg.bezierVertex(x-wB*1.1,bot-rig.R*0.1, x-wT*1.05,(top+bot)/2, x-wT,top);
    pg.endShape(CLOSE); };

  if(rig.body==='blob'){ pg.fill(sk.fill);
    pg.beginShape();
    for(let i=0;i<24;i++){ const a=map(i,0,24,0,TWO_PI); const r=rig.R*(1.0+0.35*noise(cos(a)+3,sin(a)+3));
      pg.curveVertex(rig.cx+cos(a)*r, rig.cy+sin(a)*r*1.05); }
    pg.endShape(CLOSE);
  } else if(rig.body==='quadruped'){ pg.fill(sk.fill);
    pg.ellipse(t.x, rig.cy, wT*2.0, (bot-top)*1.6);
  } else if(rig.body==='serpentine'){ pg.fill(sk.fill);
    pg.beginShape();
    for(let i=0;i<=14;i++){ const tt=i/14; const yy=lerp(top,bot,tt); const w=lerp(wT,wB,tt);
      pg.vertex(x+Math.sin(tt*5+frameCount*0.03)*rig.R*0.5+w, yy); }
    for(let i=14;i>=0;i--){ const tt=i/14; const yy=lerp(top,bot,tt); const w=lerp(wT,wB,tt);
      pg.vertex(x+Math.sin(tt*5+frameCount*0.03)*rig.R*0.5-w, yy); }
    pg.endShape(CLOSE);
  } else { drawTrunk(sk.fill); }
}

// torso surface style (depends on ENT.torso) — needs a body to sit on
function entTorso(pg, rig, kind, sk){
  if(rig.body==='none' || kind==='none') return;
  const t=rig.trunk; pg.noStroke();
  const top=t.top, bot=t.bot, wT=t.wTop, wB=t.wBot, x=t.x;
  const g=pg.drawingContext;
  if(kind==='armored'){ pg.fill(sk.spec);
    for(let i=0;i<4;i++){ const yy=lerp(top,bot,i/4); pg.rect(x-wT*0.8, yy, wT*1.6, rig.R*0.16, 4); pg.fill(red(sk.dark),green(sk.dark),blue(sk.dark),120); } }
  else if(kind==='mechanical'){ pg.stroke(sk.dark); pg.strokeWeight(2); pg.noFill();
    pg.rect(x-wT*0.7, top+rig.R*0.2, wT*1.4, (bot-top)*0.7, 4);
    pg.fill(sk.spec); pg.noStroke(); pg.ellipse(x, (top+bot)/2, rig.R*0.4, rig.R*0.4); }
  else if(kind==='crystalline'){ pg.stroke(sk.spec); pg.strokeWeight(1.5);
    for(let i=0;i<5;i++){ pg.line(x,top, x+random(-wT,wT),bot); } pg.noStroke(); }
  else if(kind==='scaly'){ pg.fill(sk.dark);
    for(let yy=top; yy<bot; yy+=rig.R*0.22) for(let xx=x-wT; xx<x+wT; xx+=rig.R*0.26)
      pg.arc(xx,yy,rig.R*0.26,rig.R*0.26,0,PI); }
  else if(kind==='organic'){ pg.fill(red(sk.dark),green(sk.dark),blue(sk.dark),90);
    for(let i=0;i<7;i++) pg.ellipse(x+random(-wT*0.7,wT*0.7), random(top,bot), rig.R*0.3, rig.R*0.22); }
  else if(kind==='hollow'){ g.save(); g.globalCompositeOperation='destination-out';
    pg.fill(0); pg.ellipse(x,(top+bot)/2, wT*0.8,(bot-top)*0.55); g.restore(); }
}

function entSkinPattern(pg, rig, kind, sk){
  if(kind==='none' || rig.body==='none') return;
  const t=rig.trunk, x=t.x, top=t.top, bot=t.bot, wT=t.wTop, R=rig.R;
  pg.push();
  if(kind==='stripes'){ pg.stroke(sk.dark); pg.strokeWeight(R*0.12);
    for(let yy=top; yy<bot; yy+=R*0.34) pg.line(x-wT*0.9,yy, x+wT*0.9,yy+R*0.1); }
  else if(kind==='runes'){ pg.fill(sk.spec); pg.textAlign(CENTER,CENTER); pg.textSize(R*0.34);
    const gl=['ᚠ','ᚱ','ᛉ','ᛟ','ᚦ','ᛗ'];
    for(let i=0;i<5;i++) pg.text(gl[i%gl.length], x+random(-wT*0.6,wT*0.6), random(top+R*0.2,bot-R*0.2)); }
  else if(kind==='biolum'){ const g=pg.drawingContext;
    for(let i=0;i<14;i++){ const px=x+random(-wT*0.8,wT*0.8), py=random(top,bot);
      g.save(); const gr=g.createRadialGradient(px,py,0,px,py,R*0.3);
      gr.addColorStop(0,'rgba(120,240,255,0.8)'); gr.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gr; g.fillRect(px-R*0.3,py-R*0.3,R*0.6,R*0.6); g.restore(); } }
  else if(kind==='scars'){ pg.stroke(sk.spec); pg.strokeWeight(2);
    for(let i=0;i<6;i++){ const sx=x+random(-wT*0.7,wT*0.7), sy=random(top,bot);
      pg.line(sx,sy, sx+random(-R*0.4,R*0.4), sy+random(R*0.2,R*0.6)); } }
  else if(kind==='cracks'){ pg.stroke(255,80,40,200); pg.strokeWeight(1.5); pg.noFill();
    for(let i=0;i<5;i++){ let px=x+random(-wT*0.6,wT*0.6), py=top+random(R*0.2,bot-top-R*0.2);
      pg.beginShape(); pg.vertex(px,py); for(let k=0;k<4;k++){ px+=random(-R*0.3,R*0.3); py+=random(R*0.1,R*0.3); pg.vertex(px,py);} pg.endShape(); } }
  pg.pop();
}

function entArms(pg, rig, sk){
  const n=ENT.arms|0; if(n<=0) return;
  const sh=rig.shoulders[0], sh2=rig.shoulders[1]||sh;
  for(let i=0;i<n;i++){
    const side=(i%2===0)?-1:1;
    const root = side<0 ? {x:rig.shoulders[0].x,y:rig.shoulders[0].y} : {x:rig.shoulders[1].x,y:rig.shoulders[1].y};
    const lvl=(i>>1);
    const ry=root.y + lvl*rig.R*0.35;
    const asym = ENT.armSym ? 0 : random(-rig.R*0.4, rig.R*0.4);
    const reach = rig.R*(1.1+ENT.size*0.6) + lvl*rig.R*0.1;
    const ex = root.x + side*reach*0.5 + asym;
    const ey = ry + reach + (ENT.armSym?0:random(-rig.R*0.3,rig.R*0.3));
    const w0=rig.R*0.16, w1= (ENT.armType==='tentacle')?rig.R*0.04:rig.R*0.08;
    const bend = side*rig.R*0.5*(ENT.armType==='tentacle'?Math.sin(frameCount*0.05+i):0.6);
    const r=entLimb(pg, root.x,ry, ex,ey, w0,w1, bend, sk.fill);
    entHand(pg, r.tip, r.dir, w1*1.4+rig.R*0.04, ENT.armType, sk);
  }
}

/* ---- HEADS ---- */
function entHead(pg, rig, sk){
  if(ENT.head==='none') return;
  const h=rig.head, x=h.x, y=h.y, r=h.r; pg.noStroke();
  if(ENT.head==='hydra'){ // three necks+heads
    for(const side of [-1,0,1]){ const hx=x+side*r*1.3, hy=y - (side===0?r*0.3:0);
      entLimb(pg, rig.trunk.x, rig.trunk.top, hx,hy, r*0.4,r*0.3, side*r*0.6, sk.fill);
      pg.fill(sk.fill); pg.ellipse(hx,hy, r*1.1, r*1.3);
      pg.fill(sk.dark); pg.ellipse(hx,hy+r*0.2, r*0.5,r*0.3); }
    return;
  }
  pg.fill(sk.fill);
  switch(ENT.head){
    case 'skull':
      pg.ellipse(x,y, r*1.7, r*1.9); pg.rect(x-r*0.6,y+r*0.5,r*1.2,r*0.8,4);
      pg.fill(sk.dark); pg.ellipse(x-r*0.45,y-r*0.1,r*0.5,r*0.6); pg.ellipse(x+r*0.45,y-r*0.1,r*0.5,r*0.6);
      pg.triangle(x-r*0.12,y+r*0.3,x+r*0.12,y+r*0.3,x,y+r*0.6); break;
    case 'wolf':
      pg.ellipse(x,y,r*1.6,r*1.5); pg.triangle(x-r*0.8,y-r*0.6,x-r*0.3,y-r*0.5,x-r*0.55,y-r*1.3);
      pg.triangle(x+r*0.8,y-r*0.6,x+r*0.3,y-r*0.5,x+r*0.55,y-r*1.3);
      pg.fill(sk.fill); pg.triangle(x-r*0.5,y+r*0.3,x+r*0.5,y+r*0.3,x,y+r*1.2); break;   // snout
    case 'bird':
      pg.ellipse(x,y,r*1.5,r*1.6); pg.fill(sk.spec);
      pg.triangle(x-r*0.1,y+r*0.2,x+r*0.1,y+r*0.2,x,y+r*1.3);                            // beak
      pg.fill(sk.dark); for(let i=0;i<3;i++) pg.triangle(x-r*0.2+i*0.2*r,y-r,x+i*0.2*r,y-r, x-r*0.1+i*0.2*r,y-r*1.6); break;
    case 'lizard':
      pg.ellipse(x,y,r*1.4,r*1.3); pg.triangle(x-r*0.3,y+r*0.2,x+r*0.3,y+r*0.2,x+r*1.2,y+r*0.5); break;
    case 'eyeless':
      pg.ellipse(x,y,r*1.5,r*1.7); break;                                                 // smooth
    case 'monitor':
      pg.fill(sk.dark); pg.rect(x-r*0.9,y-r*0.8,r*1.8,r*1.6,6);
      pg.fill(red(sk.spec),green(sk.spec),blue(sk.spec),200); pg.rect(x-r*0.7,y-r*0.6,r*1.4,r*1.2,3); break;
    case 'mask':
      pg.ellipse(x,y,r*1.5,r*1.8); pg.fill(sk.spec); pg.ellipse(x,y,r*1.1,r*1.4);
      pg.fill(sk.dark); pg.arc(x,y+r*0.3,r*0.9,r*0.5,0,PI); break;
    case 'crystal':
      pg.fill(red(sk.spec),green(sk.spec),blue(sk.spec),230);
      pg.beginShape(); pg.vertex(x,y-r*1.3); pg.vertex(x+r*0.9,y-r*0.2); pg.vertex(x+r*0.5,y+r*1.1);
      pg.vertex(x-r*0.5,y+r*1.1); pg.vertex(x-r*0.9,y-r*0.2); pg.endShape(CLOSE);
      pg.stroke(sk.dark); pg.strokeWeight(1); pg.line(x,y-r*1.3,x,y+r*1.1); pg.line(x-r*0.9,y-r*0.2,x+r*0.9,y-r*0.2); pg.noStroke(); break;
    default: // human
      pg.ellipse(x,y, r*1.5, r*1.8);
  }
}

function entHorns(pg, rig, kind, sk){
  if(kind==='none') return;
  const h=rig.head, x=h.x, y=h.y-h.r*0.9, r=h.r; pg.fill(sk.dark); pg.noStroke();
  for(const side of [-1,1]){
    const bx=x+side*r*0.55;
    if(kind==='curved'){ pg.beginShape(); pg.vertex(bx,y); pg.bezierVertex(bx+side*r*0.6,y-r*0.9, bx+side*r*1.2,y-r*0.4, bx+side*r*0.9,y+r*0.1);
      pg.bezierVertex(bx+side*r*0.7,y-r*0.3, bx+side*r*0.3,y-r*0.5, bx,y); pg.endShape(CLOSE); }
    else if(kind==='straight'){ pg.triangle(bx-r*0.12,y, bx+r*0.12,y, bx+side*r*0.3,y-r*1.3); }
    else if(kind==='ram'){ pg.beginShape(); pg.vertex(bx,y);
      pg.bezierVertex(bx+side*r*1.1,y-r*0.2, bx+side*r*1.0,y+r*0.8, bx+side*r*0.2,y+r*0.6);
      pg.bezierVertex(bx+side*r*0.6,y+r*0.3, bx+side*r*0.5,y-r*0.1, bx,y); pg.endShape(CLOSE); }
    else if(kind==='antler'){ pg.stroke(sk.dark); pg.strokeWeight(r*0.12); pg.noFill();
      pg.line(bx,y, bx+side*r*0.6,y-r*1.2); pg.line(bx+side*r*0.3,y-r*0.6, bx+side*r*0.8,y-r*0.7);
      pg.line(bx+side*r*0.45,y-r*0.9, bx+side*r*0.9,y-r*1.0); pg.noStroke(); }
  }
}

/* ---- EYES + FACE ---- */
function entEyePos(rig){
  const h=rig.head, n=ENT.eyes|0, out=[];
  if(n<=0) return out;
  const er=h.r*(ENT.eyeType==='compound'?0.5:0.34);
  if(n<=3){ for(let i=0;i<n;i++){ const off=(n===1)?0:map(i,0,n-1,-h.r*0.55,h.r*0.55);
    out.push({x:h.x+off, y:h.y-(n===3&&i===1?h.r*0.3:0), r:er}); } }
  else { const cols=Math.ceil(Math.sqrt(n)); const rows=Math.ceil(n/cols); let idx=0;
    for(let r=0;r<rows;r++)for(let c=0;c<cols&&idx<n;c++,idx++){
      out.push({x:h.x+map(c,0,cols-1,-h.r*0.7,h.r*0.7), y:h.y+map(r,0,rows-1,-h.r*0.5,h.r*0.5), r:er*0.7}); } }
  return out;
}
function entEyes(pg, rig, mx,my){
  const eyes=entEyePos(rig); const type=ENT.eyeType;
  for(const e of eyes){
    let dx=0,dy=0;
    if(ENT.track){ const a=atan2(my-e.y,mx-e.x); const d=Math.min(e.r*0.4, dist(mx,my,e.x,e.y)*0.05); dx=cos(a)*d; dy=sin(a)*d; }
    pg.noStroke();
    if(type==='glowing'){ const g=pg.drawingContext; g.save();
      const gr=g.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r*2.2);
      gr.addColorStop(0,'rgba(255,90,60,0.9)'); gr.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gr; g.fillRect(e.x-e.r*2.2,e.y-e.r*2.2,e.r*4.4,e.r*4.4); g.restore();
      pg.fill(255,220,180); pg.ellipse(e.x,e.y,e.r,e.r); }
    else if(type==='compound'){ pg.fill(40,30,10);
      pg.ellipse(e.x,e.y,e.r*2,e.r*2);
      pg.fill(180,200,70,200); for(let i=0;i<7;i++){ const a=i/7*TWO_PI; pg.ellipse(e.x+cos(a)*e.r*0.55,e.y+sin(a)*e.r*0.55,e.r*0.5,e.r*0.5);} pg.ellipse(e.x,e.y,e.r*0.5,e.r*0.5); }
    else if(type==='lens'){ pg.fill(20,22,28); pg.ellipse(e.x,e.y,e.r*2,e.r*2);
      pg.stroke(150,170,190); pg.strokeWeight(2); pg.noFill(); pg.ellipse(e.x,e.y,e.r*1.4,e.r*1.4); pg.ellipse(e.x,e.y,e.r*0.8,e.r*0.8);
      pg.noStroke(); pg.fill(120,200,255,180); pg.ellipse(e.x+dx,e.y+dy,e.r*0.4,e.r*0.4); }
    else if(type==='hollow'){ pg.fill(8,8,10); pg.ellipse(e.x,e.y,e.r*1.8,e.r*2.0);
      pg.fill(60,60,70,120); pg.ellipse(e.x,e.y+e.r*0.3,e.r*0.7,e.r*0.5); }
    else if(type==='cosmos'){ pg.fill(10,8,24); pg.ellipse(e.x,e.y,e.r*2,e.r*2);
      pg.fill(255,255,255,220); for(let i=0;i<10;i++) pg.ellipse(e.x+random(-e.r*0.8,e.r*0.8),e.y+random(-e.r*0.8,e.r*0.8),random(1,2.4),random(1,2.4));
      pg.fill(150,90,255,90); pg.ellipse(e.x,e.y,e.r,e.r*0.7); }
    else { // normal
      pg.fill(238,232,210); pg.ellipse(e.x,e.y,e.r*2,e.r*2);
      pg.fill(30,24,20); pg.ellipse(e.x+dx,e.y+dy,e.r*1.0,e.r*1.0);
      pg.fill(0); pg.ellipse(e.x+dx,e.y+dy,e.r*0.5,e.r*0.5);
      pg.fill(255,255,255,200); pg.ellipse(e.x+dx-e.r*0.2,e.y+dy-e.r*0.2,e.r*0.22,e.r*0.22); }
  }
}
function entFace(pg, rig, sk){
  const h=rig.head, x=h.x, y=h.y+h.r*0.85, r=h.r;
  const expr=ENT.expr;
  pg.noStroke();
  const drawMouth=(mx0)=>{
    if(ENT.mouth==='none') return;
    if(ENT.mouth==='beak'){ pg.fill(sk.spec); pg.triangle(mx0-r*0.2,y, mx0+r*0.2,y, mx0,y+r*0.5); return; }
    if(ENT.mouth==='maw'){ pg.fill(8,6,8); pg.ellipse(mx0,y+r*0.1, r*0.9, r*0.7*(expr==='berserk'?1.6:1));
      pg.fill(238,232,210); for(let i=-2;i<=2;i++){ pg.triangle(mx0+i*r*0.18-3,y-r*0.2, mx0+i*r*0.18+3,y-r*0.2, mx0+i*r*0.18,y+r*0.0);
        pg.triangle(mx0+i*r*0.18-3,y+r*0.4, mx0+i*r*0.18+3,y+r*0.4, mx0+i*r*0.18,y+r*0.2); } return; }
    // normal mouth — curvature follows the expression
    pg.stroke(8,6,8); pg.strokeWeight(Math.max(2,r*0.12)); pg.noFill();
    const curve = expr==='sad'?-r*0.4 : (expr==='angry'?r*0.3 : (expr==='berserk'?r*0.6 : 0));
    pg.beginShape();
    pg.vertex(mx0-r*0.4,y);
    pg.quadraticVertex(mx0, y+curve, mx0+r*0.4, y);
    pg.endShape();
    pg.noStroke();
  };
  if(ENT.mouth==='many'){ for(const off of [-r*0.5,0,r*0.5]) drawMouth(x+off); }
  else drawMouth(x);
  // expression brows
  if(expr==='angry'||expr==='berserk'){ pg.stroke(8,6,8); pg.strokeWeight(Math.max(2,r*0.1));
    pg.line(x-r*0.6,h.y-r*0.5,x-r*0.1,h.y-r*0.2); pg.line(x+r*0.6,h.y-r*0.5,x+r*0.1,h.y-r*0.2); pg.noStroke(); }
  else if(expr==='sad'){ pg.stroke(8,6,8); pg.strokeWeight(Math.max(2,r*0.1));
    pg.line(x-r*0.6,h.y-r*0.2,x-r*0.1,h.y-r*0.5); pg.line(x+r*0.6,h.y-r*0.2,x+r*0.1,h.y-r*0.5); pg.noStroke(); }
  else if(expr==='glitch'){ const g=pg.drawingContext;
    for(let i=0;i<4;i++){ const yy=h.y+random(-r,r); g.save(); g.globalCompositeOperation='lighter';
      pg.fill(255,0,80,90); pg.rect(x-r+random(-4,4), yy, r*2, 3); pg.fill(0,255,200,90); pg.rect(x-r+random(-4,4), yy+2, r*2, 2); g.restore(); } }
}

function entParasites(pg, rig, sk){
  pg.noStroke();
  for(let i=0;i<5;i++){ const a=random(TWO_PI), rr=rig.R*(0.6+random(0.7));
    const x=rig.cx+cos(a)*rr, y=rig.cy+sin(a)*rr*1.1;
    pg.fill(sk.spec); pg.ellipse(x,y,rig.R*0.3,rig.R*0.2);
    pg.fill(8,8,10); pg.ellipse(x,y,rig.R*0.1,rig.R*0.1);
    pg.stroke(sk.spec); pg.strokeWeight(2); for(let k=0;k<4;k++){ const la=a+k; pg.line(x,y,x+cos(la)*rig.R*0.2,y+sin(la)*rig.R*0.2);} pg.noStroke(); }
}
function entChains(pg, rig, sk){
  pg.stroke(sk.spec); pg.strokeWeight(Math.max(2,rig.R*0.06)); pg.noFill();
  for(const side of [-1,1]){ const sh=side<0?rig.shoulders[0]:rig.shoulders[1];
    pg.beginShape(); pg.vertex(sh.x,sh.y);
    for(let i=1;i<=6;i++){ pg.vertex(sh.x+side*i*rig.R*0.12+Math.sin(i+frameCount*0.04)*rig.R*0.1, sh.y+i*rig.R*0.22); }
    pg.endShape(); }
  pg.noStroke();
}

/* ============================================================
   MAIN DRAW — layer order back -> front
   ============================================================ */
// spriteMode=true -> transparent background, no FX (for the saved-monster billboard)
function drawEntity(pg, mx, my, spriteMode){
  randomSeed(ENT.seed); noiseSeed(ENT.seed);
  const W=pg.width,H=pg.height;
  const sk=entSkin(); const rig=entRig(W,H);
  pg.push(); pg.colorMode(RGB,255);

  if(!spriteMode){
    // backdrop (liminal room, like the reference photos)
    pg.noStroke(); pg.fill(214,198,170); pg.rect(0,0,W,H*0.66);
    pg.fill(150,120,95); pg.rect(0,H*0.66,W,H*0.34);
    pg.fill(255,255,255,30);
    for(let y=20;y<H*0.66;y+=46) for(let x=20;x<W;x+=46) pg.ellipse(x,y,6,6);
  }

  // --- empty starting point: nothing built yet -> hint only ---
  if(entIsEmpty()){
    if(!spriteMode){
      pg.fill(120,104,80); pg.textFont('monospace'); pg.textAlign(CENTER,CENTER);
      pg.textSize(15); pg.text('— leere Entity —', W/2, H/2-12);
      pg.textSize(12); pg.fill(150,134,108);
      pg.text('starte mit einer BODY-Grundform, dann Layer dazu', W/2, H/2+12);
      pg.textAlign(LEFT,BASELINE);
    }
    pg.pop();
    if(!spriteMode){ if(ENT.render==='dither') ditherPixels(pg); else applyVignette(pg); }
    return;
  }

  // contact shadow (only when something stands on the ground; not in sprite mode)
  if(!spriteMode && (ENT.body!=='none' || ENT.legs!=='none')){ pg.fill(0,0,0,60); pg.ellipse(rig.cx, rig.ground, rig.R*2.4, rig.R*0.5); }

  // --- back layers ---
  entAura(pg, rig, ENT.accAura);
  entWings(pg, rig, ENT.accWings, sk);
  if(ENT.accSpikes) entSpikes(pg, rig, sk);
  entTail(pg, rig, ENT.accTail, sk);
  entLegs(pg, rig, ENT.legs, sk);

  // --- body + arms ---
  entBody(pg, rig, sk);
  entTorso(pg, rig, ENT.torso, sk);
  entSkinPattern(pg, rig, ENT.pattern, sk);
  if(sk.type==='fur' && ENT.body!=='none'){ pg.stroke(sk.edge); pg.strokeWeight(1);   // fuzzy fur edge
    const t=rig.trunk; for(let i=0;i<70;i++){ const a=random(TWO_PI), rr=random(rig.R*0.8,rig.R*1.2);
      const x=rig.cx+cos(a)*rr, y=rig.cy+sin(a)*rr*1.05; pg.line(x,y,x+cos(a)*random(4,12),y+sin(a)*random(4,12)); } pg.noStroke(); }
  entArms(pg, rig, sk);

  // --- head stack ---
  entHorns(pg, rig, ENT.accHorns, sk);
  entHead(pg, rig, sk);
  entEyes(pg, rig, mx, my);
  entFace(pg, rig, sk);

  // --- front extras ---
  if(ENT.accParasites) entParasites(pg, rig, sk);
  if(ENT.accChains) entChains(pg, rig, sk);

  pg.pop();

  if(spriteMode) return;                 // sprite: keep transparent, skip post FX

  // render-mode post FX
  if(ENT.render==='dither') ditherPixels(pg);
  else if(ENT.render==='photo-grain'){ applyGrain(pg,0.5); applyVignette(pg); }
  else applyVignette(pg);
}

/* 1-bit Floyd–Steinberg-ish dither (gameboy-ish portrait look) */
function ditherPixels(pg){
  pg.loadPixels();
  const d=pg.pixelDensity(); const W=pg.width*d, H=pg.height*d;
  const gray=new Float32Array(W*H);
  for(let i=0;i<W*H;i++){ const p=i*4; gray[i]=0.299*pg.pixels[p]+0.587*pg.pixels[p+1]+0.114*pg.pixels[p+2]; }
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=y*W+x; const old=gray[i]; const nw= old<128?0:255; const err=old-nw; gray[i]=nw;
    if(x+1<W) gray[i+1]+=err*7/16;
    if(y+1<H){ if(x>0) gray[i+W-1]+=err*3/16; gray[i+W]+=err*5/16; if(x+1<W) gray[i+W+1]+=err*1/16; }
  }
  for(let i=0;i<W*H;i++){ const p=i*4; const v=gray[i];
    if(v<128){ pg.pixels[p]=58; pg.pixels[p+1]=18; pg.pixels[p+2]=18; }
    else { pg.pixels[p]=224; pg.pixels[p+1]=232; pg.pixels[p+2]=214; }
    pg.pixels[p+3]=255; }
  pg.updatePixels();
}
