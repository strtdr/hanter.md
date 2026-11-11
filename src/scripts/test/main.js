import "./nav.js";
import { updateWork } from "./gallery.js";
import { findPromo, promoLabel } from "./price.js";
import { CARS, LEATHER, PHONE } from "./data.js";
import { $, S, m2 } from "./state.js";
import { car } from "./catalog.js";
import { initTextures, matSVG } from "./visuals.js";
import { buildMsg, render } from "./render.js";
import { initOrder, sendOrder } from "./order.js";
// Pornirea paginii: evenimente și primul render
initTextures();
initOrder();
initPromo();
function picked(){ if(!$("fly").classList.contains("cta")) return; $("fly").classList.remove("cta"); }
$("brand").onchange=e=>{picked();S.brand=e.target.value;S.model=null;S.g=0;S.sv=0;S.tv=0;S.salon="cu";render();};
$("model").onchange=e=>{picked();S.model=e.target.value;S.g=0;S.sv=0;S.tv=0;S.salon="cu";render();};
$("gen").onchange=e=>{S.g=+e.target.value;S.fuel=null;S.sv=0;S.tv=0;S.salon="cu";render();};
$("flyGo").onclick=()=>{ if($("fly").classList.contains("cta")){ $("configurator").scrollIntoView({behavior:"smooth"}); setTimeout(()=>$("brand").focus({preventScroll:true}),600); return; } if($("order").disabled){ $("salon").scrollIntoView({behavior:"smooth",block:"center"}); return; } $("msgBox").hidden=false;$("copied").hidden=true;buildMsg(); $("msgBox").scrollIntoView({behavior:"smooth",block:"center"}); };
$("order").onclick=()=>{picked();$("msgBox").hidden=false;$("copied").hidden=true;buildMsg();};
function nfText(){ const car=$("nfCar").value.trim(), y=$("nfYear").value.trim(), m=$("nfMore").value.trim();
  return `Bună ziua! Nu am găsit mașina mea în configuratorul Hanter.md.\nMașina: ${car||"—"}${y?", "+y:""}${m?"\nDetalii: "+m:""}${$("nfPhone").value.trim()?"\nTelefonul meu: "+$("nfPhone").value.trim():""}\nVă rog să-mi spuneți dacă aveți tipar și prețul.`; }
function nfUpd(){ const d=PHONE.replace(/\D/g,""); $("nfWa").href=`https://wa.me/${d}?text=${encodeURIComponent(nfText())}`; }
["nfCar","nfYear","nfMore","nfPhone"].forEach(id=>$(id).addEventListener("input",nfUpd)); nfUpd();
// „Nu am găsit mașina”: cererea merge în tabelul „Comenzi” și pe Telegram (prin Apps Script)
let nfDone = "";
const nfPayload = via => ({kind:"model negăsit", page:location.href.split("#")[0], car:$("nfCar").value.trim(), gen:$("nfYear").value.trim(), fuel:$("nfMore").value.trim(), phone:$("nfPhone").value.trim(), via, message:nfText()});
const nfSend = (via="") => { const key=nfText(); if(nfDone===key) return Promise.resolve(); nfDone=key; return sendOrder(nfPayload(via)).catch(e=>{ nfDone=""; throw e; }); };
$("nfSend").onclick = async () => {
  $("nfErr").hidden = true;
  if(!$("nfCar").value.trim()){ $("nfErr").textContent="Scrie marca și modelul mașinii."; $("nfErr").hidden=false; $("nfCar").focus(); return; }
  if($("nfPhone").value.replace(/\D/g,"").length < 8){ $("nfErr").textContent="Scrie telefonul, ca să-ți putem răspunde."; $("nfErr").hidden=false; $("nfPhone").focus(); return; }
  $("nfSend").disabled = true; $("nfSend").textContent = "Se trimite…";
  try { await nfSend("telefon"); $("nfSent").hidden=false; $("nfSend").textContent="Cererea e trimisă ✓"; }
  catch(e){ $("nfSend").disabled=false; $("nfSend").textContent="Trimite cererea"; $("nfErr").textContent="Nu am putut trimite automat. Scrie-ne pe WhatsApp sau Viber, mai jos."; $("nfErr").hidden=false; }
};
["nfCar","nfYear","nfMore","nfPhone"].forEach(id=>$(id).addEventListener("input",()=>{ if($("nfSend").disabled && nfDone!==nfText()){ $("nfSend").disabled=false; $("nfSend").textContent="Trimite cererea"; $("nfSent").hidden=true; } }));
$("nfWa").addEventListener("click",e=>{ if(!$("nfCar").value.trim()){ e.preventDefault(); $("nfCar").focus(); return; } nfSend("WhatsApp").catch(()=>{}); });
$("nfVb").onclick=()=>{ if(!$("nfCar").value.trim()){ $("nfCar").focus(); return; } nfSend("Viber").catch(()=>{}); const t=nfText(); try{ navigator.clipboard.writeText(t); }catch(e){} $("nfOk").hidden=false; location.href=`viber://chat?number=%2B${PHONE.replace(/\D/g,"")}`; };
$("copy").onclick=()=>{
  const t=$("msg").textContent;
  try{navigator.clipboard.writeText(t).then(()=>{$("copied").hidden=false;},selectMsg);}catch(e){selectMsg();}
};
function selectMsg(){const r=document.createRange();r.selectNodeContents($("msg"));const s=getSelection();s.removeAllRanges();s.addRange(r);}
const showIntern = () => { $("internBox").hidden = location.hash !== "#intern"; };
window.addEventListener("hashchange", showIntern); showIntern();
$("fModels").textContent = CARS.length.toLocaleString("ro-MD").replace(/[\s,. ]/g," ");
$("fPat").textContent = (Math.floor(CARS.reduce((s,c)=>s+c.s20.length+c.s30.length+c.s21.length,0)/500)*500).toLocaleString("ro-MD").replace(/[\s,. ]/g," ")+"+";
$("fly").addEventListener("click",e=>{ if(e.target.closest("#flyGo")) return; $("fly").classList.toggle("open"); });
render();
const heroL = LEATHER.find(x=>x.id==="m2") || LEATHER.find(x=>x.tex) || LEATHER[0];
if(heroL.tex) document.querySelector(".l1").classList.add("tx-"+heroL.tex);
if($("heroMat")) $("heroMat").innerHTML = matSVG(heroL, true, "hero");

// Cod de reducere: din câmp sau din link (?cod=TIKTOK); se ține minte 30 de zile pe acest telefon/calculator
function initPromo(){
  const KEY="hanter_promo";
  const msg=(t,ok)=>{ $("promoMsg").hidden=!t; $("promoMsg").textContent=t||""; $("promoMsg").className="promomsg"+(ok?" ok":t?" err":""); };
  const apply=(code,quiet)=>{
    const c=String(code||"").trim();
    if(!c){ S.promo=null; msg(""); try{localStorage.removeItem(KEY);}catch(e){} render(); return; }
    const p=findPromo(c);
    if(!p){ if(!quiet) msg("Codul nu e valabil.",false); S.promo=null; render(); return; }
    S.promo=p.code; $("promo").value=p.code; msg(`Cod aplicat: ${promoLabel(p)} din total`,true);
    try{ localStorage.setItem(KEY, JSON.stringify({c:p.code,t:Date.now()})); }catch(e){}
    render();
  };
  $("promoBtn").onclick=()=>apply($("promo").value);
  $("promo").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); apply($("promo").value); } });
  let start=new URLSearchParams(location.search).get("cod");
  if(!start){ try{ const s=JSON.parse(localStorage.getItem(KEY)||"null"); if(s && Date.now()-s.t<30*864e5) start=s.c; }catch(e){} }
  if(start) apply(start,true);
}

// pozele lucrărilor pentru mașina aleasă
const syncWork = () => setTimeout(() => updateWork(S.brand, S.model), 0);
$("brand").addEventListener("change", syncWork); $("model").addEventListener("change", syncWork); syncWork();
