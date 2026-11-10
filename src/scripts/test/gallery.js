// Galeria de lucrări: mărire (lightbox) + pozele modelului ales în configurator.
const el = document.getElementById("hanter-data");
const raw = el ? JSON.parse(el.textContent) : {};
const base = String(raw.base || "/").replace(/\/?$/, "/");
const u = p => !p ? "" : base + String(p).replace(/^\//, "");
const ITEMS = (raw.gallery && raw.gallery.items) || [];
const $ = id => document.getElementById(id);
const norm = s => String(s || "").trim().toLowerCase();
const cap = it => `${it.brand} ${it.model} · ${it.title}`;

let list = [], at = 0;
function show(i) {
  at = (i + list.length) % list.length; const it = list[at];
  $("lbImg").src = u(it.image); $("lbImg").alt = cap(it); $("lbCap").textContent = cap(it) + (list.length > 1 ? `  (${at + 1}/${list.length})` : "");
  $("lbPrev").hidden = $("lbNext").hidden = list.length < 2;
}
export function openLightbox(items, i) {
  const d = $("lb"); if (!d || !items.length) return;
  list = items; show(i);
  if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
}
if ($("lb")) {
  const d = $("lb"), close = () => (d.close ? d.close() : d.removeAttribute("open"));
  $("lbClose").onclick = close; $("lbPrev").onclick = () => show(at - 1); $("lbNext").onclick = () => show(at + 1);
  d.addEventListener("click", e => { if (e.target === d) close(); });
  d.addEventListener("keydown", e => { if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
  let x0 = null;
  d.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  d.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1)); x0 = null; });
}
document.querySelectorAll("[data-work]").forEach(b => b.addEventListener("click", () => openLightbox(ITEMS, +b.dataset.work)));
// clipul nu pornește singur dacă omul a cerut mai puțină mișcare
if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.querySelectorAll(".work video").forEach(v => { v.removeAttribute("autoplay"); v.pause(); v.controls = true; });

// În configurator: pozele lucrărilor pentru marca + modelul ales
export function updateWork(brand, model) {
  const wrap = $("workWrap"); if (!wrap) return;
  const mine = ITEMS.filter(it => norm(it.brand) === norm(brand) && norm(it.model) === norm(model));
  wrap.hidden = !mine.length;
  if (!mine.length) return;
  $("workTitle").textContent = `Am făcut deja covorașe pentru ${brand} ${model}`;
  $("workPics").innerHTML = mine.map((it, i) => `<button type="button" class="wthumb" data-i="${i}" aria-label="Mărește: ${cap(it).replace(/"/g, "&quot;")}"><img src="${u(it.thumb || it.image)}" alt="" loading="lazy" width="120" height="160"><span>${it.title}</span></button>`).join("");
  $("workPics").querySelectorAll(".wthumb").forEach(b => b.onclick = () => openLightbox(mine, +b.dataset.i));
}
