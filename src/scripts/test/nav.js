// Butonul cu trei linii (dreapta sus): apare când meniul de sus iese din ecran; pe telefon e mereu vizibil.
const btn = document.getElementById("navBtn"), menu = document.getElementById("navMenu"), top = document.getElementById("topbar");
if (btn && menu) {
  const set = open => { menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); btn.classList.toggle("open", open); };
  btn.addEventListener("click", e => { e.stopPropagation(); set(menu.hidden); });
  menu.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
  document.addEventListener("click", e => { if (!menu.hidden && !menu.contains(e.target)) set(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
  if (top && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      document.body.classList.toggle("scrolled", !en.isIntersecting);
      if (en.isIntersecting) set(false);
    }).observe(top);
  } else document.body.classList.add("scrolled");
  // secțiunea curentă, evidențiată în listă
  const links = [...menu.querySelectorAll('a[href*="#"]')];
  const secs = links.map(a => document.getElementById(a.getAttribute("href").split("#")[1])).filter(Boolean);
  if (secs.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle("cur", a.getAttribute("href").endsWith("#" + en.target.id)));
    }), { rootMargin: "-40% 0px -55% 0px" });
    secs.forEach(s => io.observe(s));
  }
}
