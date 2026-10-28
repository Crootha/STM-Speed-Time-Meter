(()=>{
/* Texty jsou v src/i18n.js (window.TK_TEXTS) */
const T=window.TK_TEXTS;
const store={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
let lang=store.get("tk-lang")||((navigator.language||"cs").slice(0,2));
if(!T[lang])lang="en";
let L=T[lang];

/* ---------- formátování ---------- */
const numFmt=d=>new Intl.NumberFormat(lang,{minimumFractionDigits:d,maximumFractionDigits:d});
function parts(sec){
  if(!isFinite(sec))return["—",""];
  if(sec<60)return[numFmt(1).format(Math.round(sec*10)/10),L.s];
  if(sec>=3600){const tm=Math.round(sec/60),h=Math.floor(tm/60),m=tm%60;return[`${h} ${L.h} ${String(m).padStart(2,"0")}`,L.min]}
  let m=Math.floor(sec/60),s=Math.round(sec%60);if(s===60){m++;s=0}
  return[`${m}:${String(s).padStart(2,"0")}`,L.min];
}
const fmt=sec=>{const[a,b]=parts(sec);return b?`${a} ${b}`:a};
const clock=sec=>{let m=Math.floor(sec/60),s=Math.floor(sec%60);return`${m}:${String(s).padStart(2,"0")}`};

/* ---------- tachometr ---------- */
const MAX=200,A0=135,SWEEP=270,CX=200,CY=190,R=150,NS="http://www.w3.org/2000/svg";
let v=50,target=null;
const $=id=>document.getElementById(id);
const mk=(par,t,a,st)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(st)e.setAttribute("style",st);par.appendChild(e);return e};
const ang=s=>(A0+SWEEP*s/MAX)*Math.PI/180;
const pt=(s,r)=>[CX+r*Math.cos(ang(s)),CY+r*Math.sin(ang(s))];
const arc=(s1,s2,r)=>{const[a,b]=pt(s1,r),[c,d]=pt(s2,r);const large=(s2-s1)/MAX*SWEEP>180?1:0;return`M${a.toFixed(2)} ${b.toFixed(2)}A${r} ${r} 0 ${large} 1 ${c.toFixed(2)} ${d.toFixed(2)}`};
const g=$("gauge");
const defs=mk(g,"defs",{});
const rg=mk(defs,"radialGradient",{id:"face",cx:"50%",cy:"45%",r:"60%"});
mk(rg,"stop",{offset:"0%"},"stop-color:var(--face1)");mk(rg,"stop",{offset:"100%"},"stop-color:var(--face2)");
mk(g,"circle",{cx:CX,cy:CY,r:R+42,fill:"url(#face)","stroke-width":2},"stroke:var(--line)");
mk(g,"path",{d:arc(0,MAX,R),fill:"none","stroke-width":10,"stroke-linecap":"round"},"stroke:var(--track)");
mk(g,"path",{d:arc(130,MAX,R),fill:"none","stroke-width":10,opacity:.45},"stroke:var(--hot)");
const prog=mk(g,"path",{fill:"none","stroke-width":10,"stroke-linecap":"round"},"stroke:var(--needle);transition:stroke .2s");
for(let s=0;s<=MAX;s+=5){
  const major=s%20===0;const[a,b]=pt(s,R-8),[c,d]=pt(s,R-(major?24:15));
  mk(g,"line",{x1:a,y1:b,x2:c,y2:d,"stroke-width":major?2.5:1.2},major?"stroke:var(--fg)":"stroke:var(--minor)");
  if(major){const[x,y]=pt(s,R-40);mk(g,"text",{x,y:y+5,"text-anchor":"middle","font-size":15,"font-weight":600},"fill:var(--fg)").textContent=s}
}
mk(g,"path",{d:arc(6,MAX,R+10),fill:"none","stroke-width":1,opacity:.4},"stroke:var(--time)");
[[10,"6:00"],[15,"4:00"],[20,"3:00"],[30,"2:00"],[40,"1:30"],[60,"1:00"],[90,"0:40"],[120,"0:30"],[180,"0:20"]].forEach(([s,l])=>{
  const[a,b]=pt(s,R+7),[c,d]=pt(s,R+15);
  mk(g,"line",{x1:a,y1:b,x2:c,y2:d,"stroke-width":1.5},"stroke:var(--time)");
  const[x,y]=pt(s,R+28);mk(g,"text",{x,y:y+4,"text-anchor":"middle","font-size":13,"font-weight":600},"fill:var(--time)").textContent=l;
});
const timeMark=mk(g,"circle",{r:4},"fill:var(--time)");
mk(g,"text",{x:CX,y:CY+52,"text-anchor":"middle","font-size":11,"letter-spacing":"2"},"fill:var(--muted)").textContent="KM/H";
const gTimeLbl=mk(g,"text",{x:CX,y:CY+68,"text-anchor":"middle","font-size":10,"letter-spacing":"1.5"},"fill:var(--time)");
const needle=mk(g,"g",{});
mk(needle,"polygon",{points:`${CX-5},${CY} ${CX},${CY-(R-12)} ${CX+5},${CY}`},"fill:var(--needle)");
mk(g,"circle",{cx:CX,cy:CY,r:13,"stroke-width":2},"fill:var(--card);stroke:var(--needle)");
const big=mk(g,"text",{x:CX,y:CY+108,"text-anchor":"middle","font-size":38,"font-weight":700},"fill:var(--fg)");
const bigT=mk(g,"text",{x:CX,y:CY+132,"text-anchor":"middle","font-size":15,"font-weight":600},"fill:var(--time)");

/* ---------- graf ---------- */
const C=$("curve"),PL=48,PR=410,PT=14,PB=196,YMAX=6;
const cx=s=>PL+(PR-PL)*s/MAX,cy=m=>PB-(PB-PT)*Math.min(m,YMAX)/YMAX;
const yLbls=[];
for(let m=0;m<=YMAX;m++){mk(C,"line",{x1:PL,x2:PR,y1:cy(m),y2:cy(m),"stroke-width":1},"stroke:var(--line)");yLbls.push(mk(C,"text",{x:PL-8,y:cy(m)+4,"text-anchor":"end","font-size":11},"fill:var(--muted)"))}
for(let s=0;s<=MAX;s+=40)mk(C,"text",{x:cx(s),y:PB+18,"text-anchor":"middle","font-size":11},"fill:var(--muted)").textContent=s;
mk(C,"text",{x:PR,y:PB+34,"text-anchor":"end","font-size":11},"fill:var(--muted)").textContent="km/h";
let dp="";for(let s=10;s<=MAX;s++)dp+=(s===10?"M":"L")+cx(s).toFixed(1)+" "+cy(60/s).toFixed(1);
mk(C,"path",{d:dp+`L${cx(MAX)} ${PB}L${cx(10)} ${PB}Z`,opacity:.1},"fill:var(--time)");
mk(C,"path",{d:dp,fill:"none","stroke-width":2.5},"stroke:var(--time)");
const gx=mk(C,"line",{"stroke-dasharray":"3 3","stroke-width":1.2},"stroke:var(--needle)");
const gy=mk(C,"line",{"stroke-dasharray":"3 3","stroke-width":1.2},"stroke:var(--time)");
const dot=mk(C,"circle",{r:6,"stroke-width":2},"fill:var(--needle);stroke:var(--card)");
const lab=mk(C,"text",{"font-size":12.5,"font-weight":600},"fill:var(--fg)");

/* ---------- jazyk a vzhled ---------- */
const pb=$("presets");
function applyLang(){
  L=T[lang];document.documentElement.lang=lang;document.title=L.title;
  document.querySelectorAll("[data-i]").forEach(e=>{const k=e.dataset.i;if(L[k]!=null)e.innerHTML=L[k]});
  document.querySelectorAll("#langSeg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.lang===lang));
  document.querySelectorAll("#themeSeg button").forEach(b=>b.textContent=L[b.dataset.themeSet]);
  $("themeSeg").setAttribute("aria-label",L.themeLabel);
  g.setAttribute("aria-label",L.gaugeAria);C.setAttribute("aria-label",L.curveAria);
  $("speed").setAttribute("aria-label",L.speed+" (km/h)");
  gTimeLbl.textContent=L.gaugeTime;
  yLbls.forEach((t,m)=>t.textContent=m+" "+L.min);
  pb.innerHTML="";
  L.presets.forEach(([n,s])=>{const b=document.createElement("button");b.type="button";b.dataset.s=s;b.innerHTML=`${n} <small>${s}</small>`;b.onclick=()=>{target=s};pb.appendChild(b)});
  setRunLabel();render();drawRun();
}
document.querySelectorAll("#langSeg button").forEach(b=>b.onclick=()=>{lang=b.dataset.lang;store.set("tk-lang",lang);applyLang()});
let theme=store.get("tk-theme")||"auto";
function applyTheme(){
  const r=document.documentElement;
  if(theme==="auto")r.removeAttribute("data-theme");else r.setAttribute("data-theme",theme);
  document.querySelectorAll("#themeSeg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.themeSet===theme));
}
document.querySelectorAll("#themeSeg button").forEach(b=>b.onclick=()=>{theme=b.dataset.themeSet;store.set("tk-theme",theme);applyTheme()});

/* ---------- vykreslení ---------- */
function whoIdx(r){return r===0?0:r<=6?1:r<=16?2:r<=32?3:r<=50?4:r<=90?5:r<=130?6:r<=160?7:8}
let lastR=-1,lastLang="";
function render(){
  const s=Math.max(0,Math.min(MAX,v)),r=Math.round(s);
  needle.setAttribute("transform",`rotate(${(A0+SWEEP*s/MAX+90).toFixed(2)} ${CX} ${CY})`);
  prog.setAttribute("d",s>0.5?arc(0,s,R):"");
  prog.style.stroke=s>130?"var(--hot)":"var(--needle)";
  const[mx,my]=pt(s,R+10);timeMark.setAttribute("cx",mx);timeMark.setAttribute("cy",my);
  timeMark.style.opacity=s>=6?1:0;
  if(r===lastR&&lang===lastLang)return;lastR=r;lastLang=lang;
  const sec=r>0?3600/r:Infinity,[tv,tu]=parts(sec);
  big.textContent=r;bigT.textContent=r>0?fmt(sec)+" / km":"";
  $("vOut").textContent=r;$("tOut").textContent=tv;$("tUnit").textContent=tu;
  $("msOut").textContent=numFmt(1).format(r/3.6);
  $("speed").value=r;
  $("who").textContent=L.who[whoIdx(r)];
  const m=r>0?60/r:YMAX,X=cx(r),Y=cy(m);
  dot.setAttribute("cx",X);dot.setAttribute("cy",Y);
  gx.setAttribute("x1",X);gx.setAttribute("x2",X);gx.setAttribute("y1",Y);gx.setAttribute("y2",PB);
  gy.setAttribute("x1",PL);gy.setAttribute("x2",X);gy.setAttribute("y1",Y);gy.setAttribute("y2",Y);
  lab.textContent=r>0?`${r} km/h → ${fmt(sec)}`:L.standing;
  const right=X>PR-150;lab.setAttribute("x",right?X-10:X+10);lab.setAttribute("text-anchor",right?"end":"start");lab.setAttribute("y",Math.max(Y-10,PT+12));
  pb.querySelectorAll("button").forEach(b=>b.classList.toggle("on",+b.dataset.s===r));
  $("dists").innerHTML=L.dists.map(([n,k])=>`<tr><td>${n}</td><td>${r>0?fmt(k*3600/r):"—"}</td></tr>`).join("");
}

/* ---------- ovládání ---------- */
$("speed").addEventListener("input",e=>{v=+e.target.value;target=null;render()});
let gas=false,brake=false;
const hold=(id,set)=>{const b=$(id);
  const on=()=>{set(true);target=null;b.classList.add("held")},off=()=>{set(false);b.classList.remove("held")};
  b.addEventListener("pointerdown",e=>{e.preventDefault();on();try{b.setPointerCapture(e.pointerId)}catch(_){}});
  ["pointerup","pointercancel","lostpointercapture"].forEach(ev=>b.addEventListener(ev,off));
  b.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();on()}});
  b.addEventListener("keyup",off);b.addEventListener("contextmenu",e=>e.preventDefault());};
hold("gas",x=>gas=x);hold("brake",x=>brake=x);
document.addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;
  if(e.key==="ArrowUp"){gas=true;target=null;$("gas").classList.add("held");e.preventDefault()}
  if(e.key==="ArrowDown"){brake=true;target=null;$("brake").classList.add("held");e.preventDefault()}});
document.addEventListener("keyup",e=>{if(e.key==="ArrowUp"){gas=false;$("gas").classList.remove("held")}if(e.key==="ArrowDown"){brake=false;$("brake").classList.remove("held")}});
let drag=false;
function fromPointer(e){const p=g.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(g.getScreenCTM().inverse());
  let a=Math.atan2(q.y-CY,q.x-CX)*180/Math.PI;a=(a-A0+720)%360;if(a>SWEEP)a=a>SWEEP+45?0:SWEEP;v=Math.round(a/SWEEP*MAX);target=null;render()}
g.addEventListener("pointerdown",e=>{drag=true;try{g.setPointerCapture(e.pointerId)}catch(_){}fromPointer(e)});
g.addEventListener("pointermove",e=>{if(drag)fromPointer(e)});
["pointerup","pointercancel"].forEach(ev=>g.addEventListener(ev,()=>drag=false));

/* ---------- jízda ---------- */
let running=false,dist=0,elT=0,mult=1;
function setRunLabel(){$("run").textContent=running?L.pause:(dist>=1000?L.again:L.go)}
$("run").onclick=()=>{if(running){running=false}else{if(dist>=1000){dist=0;elT=0}running=true}setRunLabel();drawRun()};
$("fast").onclick=()=>{mult=mult===1?10:1;$("fast").setAttribute("aria-pressed",mult===10)};
const road=document.querySelector(".road"),car=$("car");
function drawRun(){
  const w=road.clientWidth-44,x=16+w*dist/1000;
  car.style.left=x+"px";$("trail").style.width=x+"px";
  $("dist").textContent=Math.floor(dist);$("elapsed").textContent=clock(elT);
  const r=Math.round(v);
  $("eta").textContent=dist>=1000?"✓":(r>0?clock((1000-dist)/(r/3.6)):"—");
}

/* ---------- smyčka ---------- */
let last=performance.now();
function loop(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;let ch=false;
  if(gas){v=Math.min(MAX,v+30*dt);ch=true}
  else if(brake){v=Math.max(0,v-60*dt);ch=true}
  else if(target!==null){const d=target-v;if(Math.abs(d)<.4){v=target;target=null}else v+=d*Math.min(1,dt*5);ch=true}
  if(ch)render();
  if(running){const st=dt*mult;dist+=Math.round(v)/3.6*st;elT+=st;if(dist>=1000){dist=1000;running=false;setRunLabel()}}
  if(running||ch)drawRun();
  requestAnimationFrame(loop);
}
applyTheme();applyLang();requestAnimationFrame(loop);
addEventListener("resize",drawRun);
})();
