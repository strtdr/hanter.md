import { DEPOSIT, LEATHER, NOPROT_DISCOUNT, PROT, SALON_FEE, TRUNK, TRUNK_ADD, sizeTier } from "./data.js";
import { $, S, rnd } from "./state.js";
import { car, fuelClash, fuelOpts, hasCsj, isSeven, variant } from "./catalog.js";
import { protSw } from "./visuals.js";
// Calculul prețului (formula Hanter.md)
export const fi = () => LEATHER.find(x=>x.id===S.leather).finish==="lucios" ? 1 : 0;
export function salonName(){ return car().only==="full" ? "Salon: pe toată suprafața" : `Salon ${S.salon==="cu"?"cu acoperire praguri":"fără praguri"}`; }
export function calc(){
  const V=variant(), v=V.h, l=LEATHER.find(x=>x.id===S.leather), p=PROT.find(x=>x.id===S.prot), t=TRUNK.find(x=>x.id===S.trunk);
  const lines=[], intern=[];
  let total=0, estimated=false;
  const onRequest = !v && (S.salon!=="none" || S.trunk!=="none");
  if(fuelOpts(V.g).length) lines.push(["","Motorizare: "+(S.fuel||"neselectată — alege mai sus"),null]);
  if(S.fuel && ((V.sv && S.salon!=="none" && fuelClash(V.sv[0])) || (V.tv && S.trunk!=="none" && fuelClash(V.tv[0])))) lines.push(["","Atenție: tiparul ales e pentru altă motorizare. Confirmăm mărimile pe WhatsApp/Viber înainte de lucru.",null]);
  if(S.salon!=="none"){
    lines.push(["h",salonName(),null]);
    if(V.sv && hasCsj(V.c)) lines.push(["","Varianta: "+V.sv[0],null]);
    lines.push(["", S.prot!=="none" ? `${protSw(p.colors[S.pc]||p.colors[0])}Strat de protecție: ${p.name.toLowerCase()}, ${(p.colors[S.pc]||p.colors[0])[0].toLowerCase()}` : `<i class="swc none"></i>Fără strat de protecție`,null]);
  }
  if(S.salon!=="none" && v){
    const m=v[S.salon];
    const plastic=(PROT.find(x=>x.id==="plastic")||PROT[0]).ppm;
    const leather=m*l.ppm, prot=S.prot==="none" ? Math.max(0, v.pres*plastic - NOPROT_DISCOUNT(isSeven(V))) : v.pres*p.ppm, fee=SALON_FEE[S.salon][sizeTier(v.cu)];
    const sum=rnd(leather+prot+fee);
    intern.push(["Piele salon",m,l.ppm,leather],[S.prot==="none"?`Fără protecție (plastic − ${NOPROT_DISCOUNT(isSeven(V))}, intern)`:"Protecție",v.pres,S.prot==="none"?plastic:p.ppm,prot],["Manoperă salon","",""+"",fee]);
    total+=sum;
    if((S.salon==="cu" && !v.okc) || (S.salon==="fara" && !v.okf)) estimated=true;
  }
  if(S.trunk!=="none"){
    const adds = S.trunk!=="full" ? TRUNK_ADD.filter(a=>S[a.id]).map(a=>a.name.toLowerCase()) : [];
    lines.push(["h",`Portbagaj: ${t.name.toLowerCase()}${adds.length?" + "+adds.join(" + "):""}`,null]);
    if(V.tv && hasCsj(V.c)) lines.push(["","Varianta: "+V.tv[0],null]);
  }
  if(S.trunk!=="none" && v){
    const key = t.key;
    const m=v[key], leather=m*l.ppm;
    let fee=t.fee[fi()];
    if(S.trunk!=="full"){ TRUNK_ADD.forEach(a=>{ if(S[a.id]) fee+=a.fee[fi()]; }); }
    else if(v.fx) fee+=v.fx; // complexitate mai mare la acoperirea totală (confirmat pe model)
    const sum=rnd(leather+fee);
    intern.push([`Piele portbagaj (${key})`,m,l.ppm,leather],[`Manoperă portbagaj (${l.finish})`,"","",fee]);
    total+=sum;
    if((v.est||[]).includes(key)) estimated=true;
  }
  return {lines,total,estimated,onRequest,intern,v,V,l,p,t};
}

// Avansul: depinde de portbagaj; niciodată mai mare decât totalul
export function deposit(r){
  const d = S.trunk==="full" ? DEPOSIT.withTrunkFull : (S.trunk==="none" ? DEPOSIT.salon : DEPOSIT.withTrunkBack);
  return !r.onRequest && r.total ? Math.min(d, r.total) : d;
}
