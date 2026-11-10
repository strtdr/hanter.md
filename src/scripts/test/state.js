import { LEATHER, ROUND } from "./data.js";
// Starea configuratorului + mici utilitare
export const S = {brand:"Toyota",model:"RAV4",sv:0,tv:0,salon:"cu",prot:"plastic",trunk:"none",margine:false,spatar:false,leather:LEATHER.some(x=>x.id==="m2")?"m2":LEATHER[0].id,pc:0,g:0,promo:null};
export const $ = id => document.getElementById(id);
export const fmt = n => n.toLocaleString("ro-MD").replace(/[\s,. ]/g," ") + " lei";
export const rnd = n => Math.round(n/ROUND)*ROUND;
export const m2 = v => String(v).replace(".",",") + " m";
