import { CARS, FINISH_INFO, FINISH_NAMES, LEATHER, PHONE, PROT, SALON, TRUNK, TRUNK_ADD, PRODUCTION_DAYS } from "./data.js";
import { $, S, fmt, m2 } from "./state.js";
import { PT, YR, brands, car, curGen, fuelClash, fuelOpts, gens, hasCsj, salonList, trunkList, vtags } from "./catalog.js";
import { leatherSw, matSVG, protSw, thumb } from "./visuals.js";
import { calc, salonName, deposit } from "./price.js";
// Afișarea configuratorului
export function fillSelect(sel, items, val){ sel.innerHTML = items.map(([v,l])=>`<option value="${v}"${String(v)===String(val)?" selected":""}>${l}</option>`).join(""); }
export function radios(el, name, items, extra, disabled){
  el.innerHTML = items.map(it=>`<label class="opt"><input type="radio" name="${name}" id="${name}-${it.id}" value="${it.id}"${it.id===S[name]?" checked":""}${disabled?" disabled":""}><span><b>${it.name}</b>${it.desc?`<em>${it.desc}</em>`:""}${extra?`<i>${extra(it)}</i>`:""}</span></label>`).join("");
  el.onchange = e => { S[name] = e.target.value; if(name==="salon") S.sv=0; if(name==="trunk") S.tv=0; if(name==="prot") S.pc=0; render(); };
}
export function swatches(el, list, key){
  el.innerHTML = list.map((c,i)=>`<button type="button" style="background:${c[1]}" aria-label="${c[0]}" aria-pressed="${i===S[key]}" data-i="${i}"></button>`).join("");
  el.onclick = e => { const b=e.target.closest("button"); if(!b) return; S[key]=+b.dataset.i; render(); };
}
export function vcards(el, list, key){
  const parts=list.map(x=>x[0].split(" · ").map(s=>s.trim()).filter(Boolean));
  const common=parts.length>1 ? parts[0].filter(t=>parts.every(p=>p.includes(t))) : [];
  el.innerHTML=list.map((x,i)=>{
    const p=parts[i], yrs=p.filter(t=>YR.test(t)).join(", ");
    const diff=p.filter(t=>!YR.test(t) && !common.includes(t));
    const same=p.filter(t=>!YR.test(t) && common.includes(t));
    const tags=vtags(x[0]).map(([t,k])=>`<span class="vt vt-${k}">${t}</span>`).join("");
    const title = diff.length ? diff.join(" · ") : (list.length===1 && same.length ? same.join(" · ") : (list.length===1 ? "Varianta standard" : "Varianta de bază"));
    const rest = list.length>1 && same.length ? `<em>Comun pentru toate: ${same.join(" · ")}</em>` : "";
    const clash=fuelClash(x[0]);
    return `<label class="opt vopt${clash?" clash":""}"><input type="radio" name="${key}" value="${i}"${i===S[key]?" checked":""}><span>${yrs?`<small class="vy">${yrs}</small>`:""}<b>${title}</b>${rest}${tags?`<span class="vts">${tags}</span>`:""}${clash?`<em class="cw">Tipar pentru altă motorizare decât ${S.fuel.toLowerCase()}</em>`:""}</span></label>`;
  }).join("");
  el.onchange=e=>{ S[key]=+e.target.value; render(); };
}
export function render(){
  fillSelect($("brand"), brands.map(b=>[b,b]), S.brand);
  const models = CARS.filter(c=>c.b===S.brand).map(c=>c.m).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(!models.includes(S.model)) { S.model=models[0]; S.sv=0; S.tv=0; }
  fillSelect($("model"), models.map(m=>[m,m]), S.model);
  const c=car(), l=LEATHER.find(x=>x.id===S.leather);
  const csj=hasCsj(c);
  const G=gens(c); if(S.g>=G.length) S.g=0;
  fillSelect($("gen"), G.map((x,i)=>[i,x[0]]), S.g);
  if(c.only==="full" && S.salon==="fara") S.salon="cu";
  // ce e disponibil la furnizor pentru generația aleasă
  const avail={none:true, cu: salonList(c,"cu").length>0, fara: c.only!=="full" && salonList(c,"fara").length>0};
  const tAvail = trunkList(c).length>0;
  if(!avail[S.salon]) S.salon = avail.cu ? "cu" : (avail.fara ? "fara" : "none");
  if(!tAvail && S.trunk==="full") S.trunk="none";
  const salonItems = c.only==="full" ? [{id:"cu",name:"Pe toată suprafața",desc:"Covorașe pe toată podeaua"},SALON[2]] : SALON;
  radios($("salon"),"salon", salonItems);
  salonItems.forEach(it=>{ if(it.id!=="none" && avail[it.id] && csj){ const i=$("salon-"+it.id); const n=salonList(c,it.id).length; if(i) i.nextElementSibling.insertAdjacentHTML("beforeend",`<i>${n} ${n===1?"variantă":"variante"} de tipar</i>`); } });
  salonItems.forEach(it=>{ if(!avail[it.id]){ const i=$("salon-"+it.id); if(i){ i.disabled=true; i.nextElementSibling.querySelector("em").textContent="Nu este disponibil pentru modelul vostru"; } } });
  const sl=salonList(c); if(S.sv>=sl.length) S.sv=0;
  $("svWrap").hidden = S.salon==="none" || !csj || !sl.length;
  vcards($("svc"), sl, "sv");
  const nc=salonList(c,"cu").length, nf=c.only==="full"?0:salonList(c,"fara").length;
  $("svHint").innerHTML = (sl.length===1 ? "Există o singură variantă de tipar pentru alegerea ta. Verifică dacă detaliile de mai jos sunt ca la mașina ta." : `Există ${sl.length} variante de tipar. Alege-o pe cea care e exact ca mașina ta: versiunea (benzină / diesel, hibrid, electrică), pedala, gurile de aerisire, numărul de locuri.`) + (c.only!=="full" ? ` <b>Cu praguri: ${nc||"nu e disponibil"}${nc?(nc===1?" variantă":" variante"):""} · Fără praguri: ${nf||"nu e disponibil"}${nf?(nf===1?" variantă":" variante"):""}.</b>` : "");
  const tl=trunkList(c); if(S.tv>=tl.length) S.tv=0;
  $("tvWrap").hidden = S.trunk==="none" || !hasCsj(c) || !tl.length;
  vcards($("tvc"), tl, "tv");
  $("tvHint").textContent = tl.length===1 ? "O singură variantă de tipar pentru portbagaj. Verifică detaliile." : `${tl.length} variante de tipar pentru portbagaj. Alege-o pe cea potrivită.`;
  const nWorks = c.hv.reduce((s,h)=>Math.max(s,h.n||0),0);
  $("carinfo").innerHTML = (c.hv.length ? (nWorks>1 ? `<span class="chip">✓ ${nWorks} lucrări Hanter.md pe acest model</span>` : `<span class="chip">Model lucrat de Hanter.md</span>`) : `<span class="chip warn">Preț la cerere: calculăm la comandă</span>`) + (csj && sl.length ? ` <span class="chip">${sl.length} ${sl.length===1?"variantă":"variante"} de tipar</span>` : "");
  const cg=curGen(c);
  const FU=fuelOpts(cg); $("fuelWrap").hidden=!FU.length;
  if(FU.length){ if(!FU.includes(S.fuel)) S.fuel=null;
    $("fuel").innerHTML=FU.map(f=>`<label class="opt"><input type="radio" name="fuel" value="${f}"${S.fuel===f?" checked":""}><span><b>${f}</b></span></label>`).join("");
    $("fuel").onchange=e=>{S.fuel=e.target.value;render();}; } else S.fuel=null;
  if(cg[3]) $("carinfo").insertAdjacentHTML("beforeend", ` <span class="chip">Versiuni ${cg[0].split(" · ")[1]}: ${[...new Set(cg[3].split(",").map(t=>PT[t]))].join(", ")}</span>`);
  $("salonMore").setAttribute("aria-disabled", S.salon==="none");
  radios($("prot"),"prot",PROT, null, S.salon==="none");
  const pr=PROT.find(x=>x.id===S.prot); if(S.pc>=pr.colors.length) S.pc=0;
  $("protColWrap").hidden = !pr.colors.length || S.salon==="none";
  $("protCol").innerHTML = pr.colors.map((c,i)=>`<button type="button" style="background:${c[1]}" aria-label="${c[0]}" aria-pressed="${i===S.pc}" data-i="${i}"></button>`).join("");
  $("protCol").onclick = e => { const b=e.target.closest("button"); if(!b) return; S.pc=+b.dataset.i; render(); };
  $("pcName").textContent = pr.colors[S.pc] ? pr.colors[S.pc][0] : "";
  radios($("trunk"),"trunk",TRUNK);
  if(!tAvail){ const i=$("trunk-full"); if(i){ i.disabled=true; i.nextElementSibling.querySelector("em").textContent="Nu este disponibil pentru modelul vostru"; } }
  const addOff = S.trunk==="none" || S.trunk==="full";
  $("trunkAdd").setAttribute("aria-disabled", addOff);
  $("trunkAdd").innerHTML = TRUNK_ADD.map(a=>`<label class="opt"><input type="checkbox" id="add-${a.id}" data-k="${a.id}"${S[a.id]?" checked":""}${addOff?" disabled":""}><span><b>+ ${a.name}</b><em>${a.desc}</em></span></label>`).join("");
  $("trunkAdd").onchange = e => { S[e.target.dataset.k]=e.target.checked; render(); };
  $("leather").innerHTML = Object.keys(FINISH_NAMES).filter(f=>LEATHER.some(x=>x.finish===f)).map(f=>`<div class="sub">${FINISH_NAMES[f]}</div><div class="opts matopts">${LEATHER.filter(x=>x.finish===f).map(it=>`<label class="opt matopt"><input type="radio" name="leather" id="leather-${it.id}" value="${it.id}"${it.id===S.leather?" checked":""}><span>${thumb(it)}<b>${it.name}</b><em>${it.desc}</em></span></label>`).join("")}</div>`).join("");
  $("leather").onchange = e => { S.leather=e.target.value; render(); };
  // Descrierea materialului ales: finisajul pielii și covorașul de protecție
  const info=(title,text,pros)=>`<b>${title}</b>${text?`<p>${text}</p>`:""}${pros&&pros.length?`<ul>${pros.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}`;
  const fi_=FINISH_INFO[l.finish]||{};
  $("finInfo").innerHTML = info(FINISH_NAMES[l.finish], fi_.text, fi_.pros);
  const pp=PROT.find(x=>x.id===S.prot);
  $("protInfo").innerHTML = pp && S.salon!=="none" ? info(pp.name, pp.details, pp.pros) : "";
  $("protInfo").hidden = !$("protInfo").innerHTML;
  $("matCap").textContent = l.tex ? `Material real: ${l.name.toLowerCase()}${l.finish==="lucios"?" (luciu simulat)":""}` : "Previzualizare orientativă a culorilor";
  $("mat").innerHTML=matSVG(l,S.salon==="cu" && c.only!=="full","main");

  const r=calc();
  const ft = r.onRequest ? "La cerere" : fmt(r.total);
  if($("flyTotal").textContent!==ft){ $("flyTotal").textContent=ft; $("flyTotal").classList.add("bump"); clearTimeout(window.__bt); window.__bt=setTimeout(()=>$("flyTotal").classList.remove("bump"),450); }
  { const pc=r.p.colors[S.pc]||r.p.colors[0], rows=[];
    if(S.salon!=="none") rows.push(`<span class="fr"><i class="swc sal ${S.salon}"></i>${S.salon==="cu"?"Cu acoperire praguri":"Fără acoperire praguri"}</span>`);
    rows.push(`<span class="fr">${leatherSw(r.l)}${FINISH_NAMES[r.l.finish]}: ${r.l.name.toLowerCase()}</span>`);
    if(S.salon!=="none") rows.push(`<span class="fr">${S.prot==="none"?'<i class="swc none"></i>Fără strat de protecție':protSw(pc)+r.p.name+(pc?", "+pc[0].toLowerCase():"")}</span>`);
    if(S.trunk!=="none") rows.push(`<span class="fr"><i class="swc trk"></i>Portbagaj: ${r.t.name.toLowerCase()}${S.trunk!=="full"?TRUNK_ADD.filter(a=>S[a.id]).map(a=>" + "+a.name.toLowerCase()).join(""):""}</span>`);
    const sum = `${leatherSw(r.l)}${S.salon!=="none"&&S.prot!=="none"?protSw(pc):""}<span class="ft">${FINISH_NAMES[r.l.finish]}: ${r.l.name.toLowerCase()}${S.salon!=="none"?" · "+(S.prot==="none"?"fără protecție":r.p.name.toLowerCase()):""}</span>`;
    $("flyMat").innerHTML = `<span class="fsum">${sum}<i class="fx" aria-hidden="true">▴</i></span><span class="frows">${rows.join("")}</span>`; }
  $("flyGo").textContent = $("fly").classList.contains("cta") ? "Configurator" : "Comandă";
  $("flyCar").textContent=`${S.brand} ${S.model}` + (curGen(c)[1] ? ` · ${curGen(c)[0]}` : "");
  $("carTitle").textContent=`${S.brand} ${S.model}` + (curGen(c)[1] ? ` · ${curGen(c)[0]}` : "");
  const row=([k,t])=>`<div${k?` class="${k}"`:""}><span>${t}</span><span></span></div>`;
  $("lines").innerHTML = r.lines.length ? r.lines.filter(x=>x[0]!=="pline").map(row).join("") + `<div><span>${leatherSw(l)}${FINISH_NAMES[l.finish]}: ${l.name.toLowerCase()}, ${l.desc.toLowerCase()}</span><span></span></div>` + r.lines.filter(x=>x[0]==="pline").map(row).join("") : `<div><span>Alege covorașe pentru salon sau portbagaj.</span><span></span></div>`;
  $("total").textContent= r.onRequest ? "La cerere" : fmt(r.total);
  const dep = deposit(r);
  $("dep").innerHTML = dep ? `Avans la comandă: <b>${fmt(dep)}</b>${PRODUCTION_DAYS?` · gata în ${PRODUCTION_DAYS} zile`:""}` : "";
  $("conf").className = "note" + (r.estimated||r.onRequest?" warn":"");
  $("conf").textContent = r.onRequest
    ? "Încă nu avem consumul de material pentru acest model. Trimite comanda și îți spunem prețul exact."
    : r.estimated
    ? "Preț orientativ: avem puține lucrări pe acest model. Confirmăm prețul exact când primim comanda."
    : "Prețul se confirmă după verificarea modelului în baza furnizorului.";
  $("order").disabled = S.salon==="none" && S.trunk==="none";
  $("intern").innerHTML = `<table><thead><tr><th>Poziție</th><th>Consum</th><th>Lei/m</th><th>Lei</th></tr></thead><tbody>${r.intern.map(([a,m,p,s])=>`<tr><td>${a}</td><td class="n">${m===""?"":m2(m)}</td><td class="n">${p}</td><td class="n">${Math.round(s)}</td></tr>`).join("")}</tbody></table>${r.v?`<p class="note" style="margin-top:8px">Consum folosit: ${r.v.l||"toți anii"} · salon cu praguri ${m2(r.v.cu)}, fără ${m2(r.v.fara)}, protecție ${m2(r.v.pres)} · portbagaj jos ${m2(r.v.jos)}, cu spătar ${m2(r.v.spatar)}, full ${m2(r.v.full)}${r.v.est&&r.v.est.length?` · estimat: ${r.v.est.join(", ")}`:""} · ${r.v.n||0} lucrări</p>`:`<p class="note" style="margin-top:8px">Fără consum în tabelul Hanter.md pentru acest model.</p>`}`;
  if(!$("msgBox").hidden) buildMsg();
}

export function buildMsg(){
  const r=calc(), V=r.V;
  const parts=[`Bună ziua! Vreau covorașe Hanter.md:`,`Mașina: ${S.brand} ${S.model}, ${V.g[0]}${S.fuel?", "+S.fuel.toLowerCase():""}`];
  if(S.salon!=="none") parts.push(`${salonName()}, protecție: ${r.p.name.toLowerCase()}${S.prot!=="none"?" ("+(r.p.colors[S.pc]||r.p.colors[0])[0].toLowerCase()+")":""}${V.sv&&hasCsj(V.c)?"\nVarianta: "+V.sv[0]:""}`);
  if(S.trunk!=="none") parts.push(`Portbagaj: ${r.t.name.toLowerCase()}${S.trunk!=="full"?TRUNK_ADD.filter(a=>S[a.id]).map(a=>" + "+a.name.toLowerCase()).join(""):""}${V.tv?"\nVarianta portbagaj: "+V.tv[0]:""}`);
  parts.push(`Material: ${FINISH_NAMES[r.l.finish].toLowerCase()}, ${r.l.name.toLowerCase()}, ${r.l.desc.toLowerCase()}`);
  if(S.fuel && ((V.sv && S.salon!=="none" && fuelClash(V.sv[0])) || (V.tv && S.trunk!=="none" && fuelClash(V.tv[0])))) parts.push(`Atenție: tiparul din configurator e pentru altă motorizare decât ${S.fuel.toLowerCase()} — vă rog să confirmați mărimile.`);
  parts.push(r.onRequest ? `Preț: la cerere` : `Preț din configurator: ${fmt(r.total)}`);
  if(r.promo && r.discount) parts.push(`Cod de reducere: ${r.promo.code} (−${fmt(r.discount)})`);
  if(deposit(r)) parts.push(`Avans: ${fmt(deposit(r))}`);
  const t=parts.join("\n");
  $("msg").textContent=t;
  const digits=PHONE.replace(/\D/g,"");
  $("wa").href=`https://wa.me/${digits}?text=${encodeURIComponent(t)}`;
  $("vb").href=`viber://chat?number=%2B${digits}`;
  $("ph").textContent=PHONE;
}
