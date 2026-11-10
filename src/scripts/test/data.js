// Datele paginii: setările din TinaCMS (src/content/test/configurator.json),
// catalogul de modele și generațiile. Le pune pagina Astro în <script id="hanter-data">.
const raw = JSON.parse(document.getElementById("hanter-data").textContent);
const base = String(raw.base || "/").replace(/\/?$/, "/");
const asset = p => !p ? "" : /^(https?:|data:)/.test(p) ? p : base + p.replace(/^\//, "");
const C = raw.cfg;

export const CARS = raw.cars;
export const GEN = raw.gens;
export const PHONE = C.phone;
export const ORDER_URL = C.orderUrl || "";
export const ROUND = C.roundTo || 50;
export const FINISH_NAMES = C.finishNames;
// Descriere + avantaje pe finisaj (mat / lucios)
export const FINISH_INFO = C.finishInfo || {};

// Fotografii reale ale materialelor: cheia = numele fișierului (ex. negru_bej_romb)
export const TEX = {};
export const LEATHER = C.leather.map(l => {
  let tex;
  if (l.image) { tex = l.image.split("/").pop().replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]/gi, "_"); TEX[tex] = asset(l.image); }
  return { id: l.id, finish: l.finish, name: l.name, desc: l.desc || "", lc: l.leatherColor, tc: l.threadColor, pattern: l.pattern, ppm: l.pricePerMeter, tex };
});
// Strat de protecție (salon): preț pe metru
export const PROT = C.protection.map(p => ({ id: p.id, name: p.name, desc: p.desc || "", ppm: p.pricePerMeter || 0, colors: (p.colors || []).map(c => [c.name, c.css]), details: p.details || "", pros: p.pros || [] }));
// Fără strat de protecție: se scade doar o parte din costul plasticului cu fire
export const NOPROT_DISCOUNT = seven => seven ? C.noProtectionDiscount.sevenSeats : C.noProtectionDiscount.fiveSeats;
// Manoperă + accesorii salon (clipse, bandă, călcâi) pe mărimea mașinii: [<1,9 m, ≤2,2 m, mai mare]
// Avansul la comandă: salon / cu portbagaj jos sau cu spătar / cu portbagaj full
export const DEPOSIT = C.deposit || { salon: 0, withTrunkBack: 0, withTrunkFull: 0 };
export const PRODUCTION_DAYS = C.productionDays || "";
// Coduri de reducere (TinaCMS): procent sau sumă fixă în lei; doar cele active
export const PROMOS = (C.promoCodes || []).filter(p => p.active !== false && p.code)
  .map(p => ({ code: String(p.code).trim().toUpperCase(), type: p.type === "lei" ? "lei" : "percent", value: Number(p.value) || 0 }));
// Stările comenzii (pagina „Starea comenzii”); textul din „value” e cel din coloana Status a tabelului
export const STATUSES = (C.orderStatuses || []).map(s => ({ value: s.value, title: s.title || s.value, text: s.text || "", cancel: !!s.cancel }));
// Până la ce pas (inclusiv) comanda se poate modifica/anula gratuit + textele pentru client
export const CANCEL_POLICY = C.cancelPolicy || null;
export const TRACK_URL = raw.trackUrl || "";
export const SALON_FEE = { cu: C.salonFee.withSills, fara: C.salonFee.withoutSills };
export const sizeTier = m => m < 1.9 ? 0 : (m <= 2.2 ? 1 : 2);
// Manoperă portbagaj [mat, lucios]
const fee = t => [t.feeMat || 0, t.feeGlossy || 0];
export const TRUNK = C.trunk.map(t => ({ id: t.id, name: t.name, desc: t.desc || "", fee: fee(t), key: t.id === "none" ? undefined : t.id }));
export const TRUNK_ADD = (C.trunkExtras || []).map(t => ({ id: t.id, name: t.name, desc: t.desc || "", fee: fee(t) }));
export const SALON = C.salonTypes.map(s => ({ id: s.id, name: s.name, desc: s.desc || "" }));
// Țări + prefix + câte cifre are numărul național (fără 0 din față)
export const CC = (C.countries || []).map(c => [c.code, c.name, String(c.dial), c.minDigits, c.maxDigits, c.example || ""]);
