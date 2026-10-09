/* Terminal logic and page behavior. You do not need to edit this file. */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const out = $("#out"), input = $("#cmd"), bootEl = $("#boot"), site = $("#site");
let busy = true, hist = [], hi = 0;

function print(text, cls = "") {
  const d = document.createElement("div"); d.className = "ln " + cls; d.textContent = text;
  out.appendChild(d); out.scrollTop = out.scrollHeight; return d;
}

/* ---------- boot message ---------- */
async function boot() {
  busy = true;
  for (const [t, c] of [["SYSTEM BOOT INITIALIZED...", "ok"], ["Loading programmer profile...", ""], ["Access restricted to authorized visitors.", ""], ["", ""], ["Type 'help' to view available commands.", "hl"]]) {
    print(t, c); await sleep(320);
  }
  busy = false; input.focus();
}

/* ---------- commands ---------- */
const HELP = ["Available commands:", "  help                 show this list", "  admin                start the profile access sequence",
  "  programmers profile  open the programmer profile", "  about                short introduction", "  clear                clear the terminal"];

async function access() {
  busy = true; print("Authenticating visitor...", "ok");
  const bar = print(""); 
  for (let i = 0; i <= 10; i++) { bar.textContent = "[" + "#".repeat(i) + "-".repeat(10 - i) + "] " + i * 10 + "%"; bar.className = "ln ok"; await sleep(130); }
  print("ACCESS GRANTED", "hl"); await sleep(500);
  print("Initializing profile interface...", "ok"); await sleep(800);
  enterSite();
}
function enterSite() {
  bootEl.classList.add("leave");
  setTimeout(() => { bootEl.hidden = true; bootEl.classList.remove("leave"); site.hidden = false; site.classList.add("show");
    document.body.classList.remove("in-terminal"); scrollTo(0, 0); }, reduce ? 0 : 500);
}
function backToTerminal() {
  site.hidden = true; site.classList.remove("show"); bootEl.hidden = false; document.body.classList.add("in-terminal");
  out.innerHTML = ""; print("Session restored. Type 'help' to view available commands.", "ok"); busy = false; input.focus();
}

const COMMANDS = {
  "help": () => HELP.forEach(l => print(l)),
  "about": () => { print("ABOUT", "hl"); print($("#bio").textContent.trim().replace(/\s+/g, " ")); },
  "clear": () => { out.innerHTML = ""; },
  "admin": access,
  "programmers profile": access,
};
const normalize = s => s.toLowerCase().replace(/['’]/g, "").replace(/[-_\s]+/g, " ").trim();

function run(raw) {
  const cmd = normalize(raw);
  print("guest@portfolio:~$ " + raw.trim(), "cmd");
  if (!cmd) return;
  hist.push(raw.trim()); hi = hist.length;
  if (COMMANDS[cmd]) COMMANDS[cmd]();
  else { print("command not found: " + raw.trim(), "err"); print("Type 'help' to see the available commands.", "err"); }
}

$("#cmdform").addEventListener("submit", e => {
  e.preventDefault(); if (busy) return;
  const v = input.value; input.value = ""; run(v);
});
input.addEventListener("keydown", e => {            // up/down arrows recall earlier commands
  if (e.key === "ArrowUp" && hist.length) { hi = Math.max(0, hi - 1); input.value = hist[hi]; e.preventDefault(); }
  if (e.key === "ArrowDown" && hist.length) { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; e.preventDefault(); }
});
$(".win").addEventListener("click", e => { if (!getSelection().toString() && e.target.tagName !== "BUTTON") input.focus(); });

/* ---------- profile page ---------- */
// Edit your details once in index.html (data-var) and they are copied to every place that shows them.
$$("[data-show]").forEach(el => {
  const src = $(`[data-var="${el.dataset.show}"]`);
  if (src) { el.textContent = src.textContent; el.classList.toggle("ph", src.classList.contains("ph")); }
});
// Show the "no records" message when a list or link group is empty.
$$("[data-list]").forEach(l => { const e = l.parentElement.querySelector(".empty"); if (e) e.hidden = l.children.length > 0; });
$$(".link").forEach(a => { if (!a.getAttribute("href")) a.hidden = true; });
const lg = $("[data-links]"); if (lg && ![...lg.children].some(a => !a.hidden)) $("#contact .empty").hidden = false;

$("#backTerm").onclick = backToTerminal;
$("#toTop").onclick = () => scrollTo({top: 0, behavior: reduce ? "auto" : "smooth"});
const tick = () => $("#clock").textContent = new Date().toLocaleTimeString([], {hour12: false}); tick(); setInterval(tick, 1000);

// highlight the section being read
const links = $$("#nav a");
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { $$("main section").forEach(s => s.classList.toggle("active", s === e.target));
    links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)); }
}), {rootMargin: "-40% 0px -55% 0px"});
$$("main section").forEach(s => io.observe(s));

document.addEventListener("touchstart", () => {}, {passive: true});  // enables :active feedback on iOS
boot();
