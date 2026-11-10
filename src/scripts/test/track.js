// Pagina „Starea comenzii”: clientul scrie nr. comenzii + ultimele 4 cifre ale telefonului,
// iar Google Apps Script-ul (apps-script/Code.gs → doGet) răspunde cu starea din tabelul „Comenzi”.
import { CANCEL_POLICY, ORDER_URL, PHONE, STATUSES } from "./data.js";

const $ = id => document.getElementById(id);
const steps = STATUSES.filter(s => !s.cancel);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// „Nouă” (rândurile vechi) sau gol = primul pas
function stepIndex(v) {
  v = String(v || "").trim().toLowerCase();
  if (!v || v === "nouă") return 0;
  return steps.findIndex(s => s.value.toLowerCase() === v);
}

function timeline(cur) {
  $("tLine").innerHTML = steps.map((s, i) => {
    const st = cur < 0 ? "" : i < cur ? "done" : i === cur ? "now" : "";
    return `<li class="${st}"><span class="dot">${i < cur ? "✓" : i + 1}</span><div><b>${esc(s.title)}</b>${st === "now" ? `<p>${esc(s.text)}</p>` : ""}</div></li>`;
  }).join("");
}

const normNr = v => {
  let s = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length === 6 && s[0] === "H") s = s.slice(1);
  return s.length === 5 ? "H-" + s : "";
};

async function check(nr, tel) {
  $("tErr").hidden = true; $("tRes").hidden = true;
  $("tGo").disabled = true; $("tGo").textContent = "Se verifică…";
  try {
    if (!ORDER_URL) throw new Error("no endpoint");
    const r = await fetch(`${ORDER_URL}?nr=${encodeURIComponent(nr)}&tel=${encodeURIComponent(tel)}`).then(x => x.json());
    if (!r.ok) {
      $("tErr").textContent = "Nu am găsit comanda. Verifică numărul comenzii și ultimele 4 cifre ale telefonului cu care ai comandat.";
      $("tErr").hidden = false; timeline(-1); return;
    }
    const cancel = STATUSES.find(s => s.cancel && s.value.toLowerCase() === String(r.status).trim().toLowerCase());
    const i = cancel ? -1 : stepIndex(r.status);
    const s = cancel || steps[Math.max(i, 0)] || { title: r.status, text: "" };
    $("tMeta").textContent = [r.nr, r.car, r.date].filter(Boolean).join(" · ");
    $("tTitle").textContent = s.title;
    $("tText").textContent = s.text;
    $("tStep").textContent = cancel ? "" : `Pasul ${Math.max(i, 0) + 1} din ${steps.length}`;
    $("tRes").classList.toggle("cancel", !!cancel);
    // Modificare / anulare: gratuit până la pasul lastFreeStep, apoi materialul e folosit
    const cp = CANCEL_POLICY, pol = $("tPolicy");
    if (cp && !cancel && i < steps.length - 1) {
      const open = Math.max(i, 0) + 1 <= (cp.lastFreeStep || 0);
      pol.textContent = open ? cp.textOpen : cp.textLocked;
      pol.className = "tpol " + (open ? "open" : "locked");
      pol.hidden = !pol.textContent;
    } else pol.hidden = true;
    $("tRes").hidden = false;
    timeline(cancel ? -1 : Math.max(i, 0));
    try { localStorage.setItem("hanter_order", JSON.stringify({ nr, tel, t: Date.now() })); } catch (e) {}
  } catch (e) {
    $("tErr").textContent = "Nu am putut verifica acum. Încearcă din nou peste un minut sau sună-ne.";
    $("tErr").hidden = false;
  } finally {
    $("tGo").disabled = false; $("tGo").textContent = "Verifică";
  }
}

// Telefonul pentru întrebări
const tel = PHONE.replace(/[^\d+]/g, "");
$("tCall").href = `tel:${tel}`;
$("tCall").textContent = PHONE.replace(/^\+373(\d{3})(\d{2})(\d{3})$/, "+373 $1 $2 $3");

$("trf").addEventListener("submit", e => {
  e.preventDefault();
  const nr = normNr($("tNr").value), t = $("tTel").value.replace(/\D/g, "");
  if (!nr) { $("tErr").textContent = "Numărul comenzii arată așa: H-7K2QX (litera H și 5 caractere)."; $("tErr").hidden = false; $("tNr").focus(); return; }
  if (t.length !== 4) { $("tErr").textContent = "Scrie ultimele 4 cifre ale telefonului cu care ai comandat."; $("tErr").hidden = false; $("tTel").focus(); return; }
  $("tNr").value = nr;
  check(nr, t);
});

// Pornire: pașii la vedere; numărul din link (?nr=) și, pe același dispozitiv, ultima comandă
timeline(-1);
let saved = null;
try { saved = JSON.parse(localStorage.getItem("hanter_order") || "null"); } catch (e) {}
const fromUrl = normNr(new URLSearchParams(location.search).get("nr"));
const nr0 = fromUrl || (saved && saved.nr) || "";
if (nr0) $("tNr").value = nr0;
if (saved && saved.nr === nr0 && saved.tel) { $("tTel").value = saved.tel; check(nr0, saved.tel); }
else if (nr0) $("tTel").focus();
