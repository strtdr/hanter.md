import { CANCEL_POLICY, CC, FINISH_NAMES, ORDER_URL, TRACK_URL, TRUNK_ADD } from "./data.js";
import { $, S } from "./state.js";
import { car, hasCsj } from "./catalog.js";
import { calc, salonName } from "./price.js";
import { buildMsg } from "./render.js";
// Comenzile ajung în Google Sheet „Comenzi Hanter” + Telegram (Google Apps Script, vezi apps-script/).
export function orderPayload(kind){
  const r=calc(), V=r.V, pc=r.p.colors[S.pc]||r.p.colors[0];
  return {kind, page:location.href.split("#")[0],
    car:`${S.brand||""} ${S.model||""}`.trim(), gen:V&&V.g?V.g[0]:"", fuel:S.fuel||"",
    salon:S.salon==="none"?"":salonName(), salonVariant:V&&V.sv&&hasCsj(V.c)?V.sv[0]:"",
    leather:`${FINISH_NAMES[r.l.finish]}: ${r.l.name}, ${r.l.desc}`,
    protection:S.salon==="none"?"":(S.prot==="none"?"Fără":`${r.p.name}${pc?", "+pc[0]:""}`),
    trunk:S.trunk==="none"?"":`${r.t.name}${S.trunk!=="full"?TRUNK_ADD.filter(a=>S[a.id]).map(a=>" + "+a.name).join(""):""}`, trunkVariant:V&&V.tv?V.tv[0]:"",
    total:r.onRequest?"la cerere":r.total, promo:r.promo&&r.discount?`${r.promo.code} (−${r.discount} lei)`:"", message:$("msg").textContent};
}
// Număr de comandă scurt, ușor de dictat: H-7K2QX (fără 0/O/1/I)
export function newOrderId(){
  const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r=new Uint32Array(5); crypto.getRandomValues(r);
  return "H-"+[...r].map(x=>a[x%a.length]).join("");
}
export async function sendOrder(data){
  if(!ORDER_URL || ORDER_URL.startsWith("__")) throw new Error("no endpoint");
  await fetch(ORDER_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)});
}
export const flag = c => String.fromCodePoint(...[...c].map(x=>127397+x.charCodeAt(0)));
export function ccOf(){ return CC.find(x=>x[0]===$("oCc").value)||CC[0]; }
export function natDigits(){ const c=ccOf(); let d=$("oPhone").value.replace(/\D/g,"");
  if(d.startsWith("00"+c[2])) d=d.slice(2+c[2].length); else if($("oPhone").value.trim().startsWith("+") && d.startsWith(c[2])) d=d.slice(c[2].length);
  if(c[0]!=="IT" && d.startsWith("0")) d=d.slice(1); return d; }
export function phHint(bad){ const c=ccOf(), n=c[3]===c[4]?`${c[3]} cifre`:`${c[3]}–${c[4]} cifre`;
  $("oPhone").placeholder = (c[0]==="MD"?"0":"")+c[5];
  $("oPhHint").textContent = bad ? `Numărul pentru ${c[1]} trebuie să aibă ${n} după +${c[2]}${c[0]!=="IT"?" (fără 0 din față)":""}. Ai scris ${natDigits().length}.` : `+${c[2]} · ${n}${c[0]!=="IT"?", poți scrie și cu 0 în față":""}`;
  $("oPhHint").classList.toggle("bad",!!bad); }
export const phoneOk = () => { const c=ccOf(), L=natDigits().length; return L>=c[3] && L<=c[4]; };
export const phoneFull = () => `+${ccOf()[2]} ${natDigits()}`;
export function initOrder(){
  $("oPolicy").textContent = CANCEL_POLICY && CANCEL_POLICY.short || "";
  (()=>{ const sel=$("oCc"); sel.innerHTML=CC.map(([c,n,d])=>`<option value="${c}">${flag(c)} +${d} ${n}</option>`).join("");
    const lang=(navigator.language||"").toUpperCase(), reg=lang.split("-")[1]; sel.value = CC.some(x=>x[0]===reg) ? reg : "MD"; })();
  $("oCc").addEventListener("change",()=>{ phHint(false); $("oPhone").setCustomValidity(""); });
  phHint(false);
  $("ordf").addEventListener("submit", async e=>{
    e.preventDefault();
    if(!phoneOk()){ phHint(true); $("oPhone").focus(); $("oPhone").setCustomValidity($("oPhHint").textContent); $("oPhone").reportValidity(); return; }
    $("oPhone").setCustomValidity(""); phHint(false); buildMsg(); const ph=phoneFull();
    const via=(document.querySelector('input[name="oVia"]:checked')||{}).value||"Viber";
    $("oSend").disabled=true; $("oSend").textContent="Se trimite…"; $("oOk").hidden=true; $("oErr").hidden=true;
    const id=newOrderId(), pl=orderPayload("comandă");
    try{ await sendOrder({...pl, orderId:id, message:`Nr. comandă: ${id}\n`+pl.message, phone:ph, name:$("oName").value.trim(), via});
      $("oOkVia").textContent=via; $("oOkNr").textContent=id;
      const tel4=natDigits().slice(-4);
      if(TRACK_URL){ $("oOkTrack").href=`${TRACK_URL}?nr=${encodeURIComponent(id)}`; $("oOkTrack").hidden=false; }
      try{ localStorage.setItem("hanter_order", JSON.stringify({nr:id, tel:tel4, t:Date.now()})); }catch(e){}
      $("oOk").hidden=false; $("oSend").textContent="Comanda e trimisă ✓"; }
    catch(err){ $("oErr").hidden=false; $("oSend").disabled=false; $("oSend").textContent="Trimite comanda"; }
  });
  $("oPhone").addEventListener("input",()=>{ $("oPhone").setCustomValidity(""); if($("oPhHint").classList.contains("bad") && phoneOk()) phHint(false); });
}
