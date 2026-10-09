// Animated teaser: rebuilds Fig. 1 step by step. Every element is laid out from the start
// (invisible), so nothing jumps around while the animation plays.
(() => {
const root = document.getElementById("teaser");
if (!root) return;
const NS = "http://www.w3.org/2000/svg";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const BEATS = [
  "Ask about something that's in the image…",
  "…then change one word. Most models still answer.",
  "VERVE checks the premise before answering.",
  "Better perception and fewer hallucinations at the same time."
];

const icon = n => `<img class="ta-ic" src="static/teaser/${n}.png" alt="">`;
const chip = (cls, model, ans, ok) =>
  `<span class="ta-chip ${cls}">${icon(model)}<span class="ta-a">${ans}</span><span class="ta-mark ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"}</span></span>`;

const TRACE = [
  ["chk", "<check>"], ["", " Is there a player present in the image? "], ["chk", "</check><verdict>"], ["yes", " yes "], ["chk", "</verdict>"],
  ["", "\nThe player is visible in the foreground, running on the field.\n\n"],
  ["chk", "<check>"], ["", " Are shorts worn by the player? "], ["chk", "</check><verdict>"], ["yes", " yes "], ["chk", "</verdict>"],
  ["", "\nThe player is wearing shorts, visible below the jersey.\n\n"],
  ["chk", "<check>"], ["", " Are the shorts white? "], ["chk", "</check><verdict>"], ["no", " no "], ["chk", "</verdict>"],
  ["\n", "\n"], ["hl", "The shorts are black, not white."], ["", " There may be some white trim or marking, but clearly they are predominantly black.\n\n……\n\n"],
  ["", "Given these checks, the question asks for “the number visible on the player’s white shorts”. "],
  ["hl", "But since the shorts are black (not white), there is no “white shorts” to begin with. Therefore, the premise of the question is false."]
];
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TEMPLATE = `
<div class="ta-stage">
  <div class="ta-panel ta-pa">
    <div class="ta-scene">
      <div class="ta-photo s-photo"><img src="static/teaser/stadium.webp" alt="A football player running on a pitch"><div class="ta-box s-box"></div></div>
      <svg class="ta-arrow s-zoom" viewBox="0 0 40 20"><path d="M2 10H34M28 4l7 6-7 6" fill="none" stroke="#555" stroke-width="2"/></svg>
      <div class="ta-zoom s-zoom"><img src="static/teaser/zoom.webp" alt="Close-up of the player's black shorts"></div>
    </div>
    <div class="ta-card">
      <p class="ta-q s-q1">What number is visible on the player’s <b class="pos">black shorts</b>?</p>
      <div class="ta-row">${chip("s-a1", "gemini", "4", 1)}${chip("s-a2", "opd", "4", 1)}${chip("s-a3", "verve", "4", 1)}</div>
      <div class="ta-tag s-tag1">SOTA MLLMs are good in <mark class="g">Perception</mark></div>
    </div>
    <div class="ta-card">
      <p class="ta-q s-q2">What number is visible on the player’s <span class="ta-flip"><b class="pos old">black</b><b class="neg new">white</b></span> <b class="ta-sh">shorts</b>?</p>
      <div class="ta-row">${chip("s-b1", "gemini", "4", 0)}${chip("s-b2", "opd", "4", 0)}${chip("s-b3", "verve", "<i>It’s not white</i>", 1)}</div>
      <p class="ta-q s-q3">Can you see <b class="neg">white shorts</b>?</p>
      <div class="ta-row">${chip("s-c1", "gemini", "No", 1)}${chip("s-c2", "opd", "Yes", 0)}${chip("s-c3", "verve", "No", 1)}</div>
      <div class="ta-tag s-tag2">Yet prone to <mark class="r">Hallucination</mark></div>
    </div>
  </div>
  <div class="ta-panel ta-pb"><pre class="ta-trace">${TRACE.map(([c, t], i) =>
    `<span class="${c}" data-i="${i}"><span class="typed"></span><span class="ghost">${esc(t)}</span></span>`).join("")}</pre></div>
  <div class="ta-panel ta-pc"><svg class="ta-plot" viewBox="0 0 420 540"></svg></div>
</div>
<div class="ta-labels"><span>Example</span><span>Thinking trace of VERVE-9B</span><span>Perception vs. hallucination</span></div>
<div class="ta-controls">
  <button class="ta-btn ta-play" aria-label="Pause">❚❚</button>
  <button class="ta-btn ta-replay" aria-label="Replay">↻ Replay</button>
  <div class="ta-beats">${BEATS.map(() => "<i></i>").join("")}</div>
  <span class="ta-caption"></span>
  <button class="ta-btn ta-skip">Skip ›</button>
</div>`;

// ---------- run control ----------
let run = 0, paused = false, instant = false, io = null;
// next animation frame, with a timer fallback so the timeline never stalls if rAF is throttled
const frame = () => new Promise(r => {
  const t0 = performance.now();
  let done = false;
  const fin = () => { if (!done) { done = true; r(performance.now() - t0); } };
  requestAnimationFrame(fin); setTimeout(fin, 50);
});
async function wait(ms, id) {
  let left = ms;
  while (left > 0) {
    if (id !== run) throw "stop";
    if (instant) return;
    const dt = await frame();
    if (!paused) left -= dt;
  }
  if (id !== run) throw "stop";
}
const q = s => root.querySelectorAll(s);
const show = (s, cls = "in") => q(s).forEach(e => e.classList.add(cls));

function beat(i) {
  root.querySelectorAll(".ta-beats i").forEach((d, j) => d.classList.toggle("on", j <= i));
  const c = root.querySelector(".ta-caption");
  c.classList.remove("in"); void c.offsetWidth;
  c.textContent = BEATS[i]; c.classList.add("in");
}

async function typeTrace(id) {
  const segs = root.querySelectorAll(".ta-trace > span");
  for (const seg of segs) {
    const full = TRACE[+seg.dataset.i][1], typed = seg.querySelector(".typed"), ghost = seg.querySelector(".ghost");
    if (instant) { typed.textContent = full; ghost.textContent = ""; continue; }
    // time-based so speed doesn't depend on frame rate (ms per character)
    const per = seg.classList.contains("chk") ? 2 : 6;
    let t = 0;
    while (!instant) {
      if (id !== run) throw "stop";
      const dt = await frame(); if (!paused) t += dt;
      const k = Math.min(full.length, Math.floor(t / per));
      typed.textContent = full.slice(0, k); ghost.textContent = full.slice(k);
      if (k >= full.length) break;
    }
    typed.textContent = full; ghost.textContent = "";
    if (seg.classList.contains("no") || seg.classList.contains("yes") || seg.classList.contains("hl")) seg.classList.add("pop");
    if (seg.classList.contains("no")) await wait(350, id);
  }
}

// ---------- scatter ----------
const PLOT = { W: 420, H: 540, ml: 44, mr: 12, mt: 10, mb: 50, x0: 56.5, x1: 73, y0: 55, y1: 87.5 };
const X = v => PLOT.ml + (v - PLOT.x0) / (PLOT.x1 - PLOT.x0) * (PLOT.W - PLOT.ml - PLOT.mr);
const Y = v => PLOT.H - PLOT.mb - (v - PLOT.y0) / (PLOT.y1 - PLOT.y0) * (PLOT.H - PLOT.mt - PLOT.mb);
const SHAPES = ["circle", "square", "diamond"];
// which rows appear in the teaser (matching Fig. 1), with label offsets
const PICK = [
  { prior: { TreeVGR: [9, 16, "start"], DeepEyes: [-10, 2, "end"], Thyme: [9, 4, "start"] }, ours: "VERVE plain" },
  { prior: { ZwZ: [0, 18, "middle"] }, ours: "VERVE opsv" },
  { prior: { "Vision-OPD": [0, 20, "middle"] }, ours: "VERVE plain" }
];
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent && parent.appendChild(e);
  return e;
}
function marker(shape, x, y, r, fill, parent) {
  if (shape === "circle") return el("circle", { cx: x, cy: y, r, fill }, parent);
  if (shape === "square") return el("rect", { x: x - r, y: y - r, width: 2 * r, height: 2 * r, fill }, parent);
  return el("path", { d: `M${x},${y - r * 1.3}L${x + r * 1.3},${y}L${x},${y + r * 1.3}L${x - r * 1.3},${y}Z`, fill }, parent);
}
function star(x, y, r) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    d += (i ? "L" : "M") + (x + rr * Math.cos(a)).toFixed(1) + "," + (y + rr * Math.sin(a)).toFixed(1);
  }
  return d + "Z";
}
function label(parent, x, y, str, attrs = {}) {
  const t = el("text", { x, y, "font-size": 15, ...attrs }, parent);
  t.textContent = str;
  return t;
}
function buildPlot() {
  const s = root.querySelector(".ta-plot");
  const defs = el("defs", {}, s);
  const axes = el("g", { class: "p-axes" }, s);
  for (let v = 58; v <= 72; v += 2) {
    el("line", { x1: X(v), x2: X(v), y1: PLOT.mt, y2: PLOT.H - PLOT.mb, stroke: "#eee" }, axes);
    label(axes, X(v), PLOT.H - PLOT.mb + 18, v, { "text-anchor": "middle", fill: "#888", "font-size": 13 });
  }
  for (let v = 55; v <= 85; v += 5) {
    el("line", { x1: PLOT.ml, x2: PLOT.W - PLOT.mr, y1: Y(v), y2: Y(v), stroke: "#eee" }, axes);
    label(axes, PLOT.ml - 6, Y(v) + 4, v, { "text-anchor": "end", fill: "#888", "font-size": 13 });
  }
  el("rect", { x: PLOT.ml, y: PLOT.mt, width: PLOT.W - PLOT.ml - PLOT.mr, height: PLOT.H - PLOT.mt - PLOT.mb, fill: "none", stroke: "#333" }, axes);
  const xl = label(axes, (PLOT.ml + PLOT.W - PLOT.mr) / 2, PLOT.H - 8, "", { "text-anchor": "middle", "font-size": 15 });
  xl.innerHTML = `Performance on <tspan fill="var(--pos)" font-weight="600">perception</tspan> benchmarks`;
  const yl = label(axes, 0, 0, "", { "text-anchor": "middle", "font-size": 15, transform: `translate(12 ${(PLOT.mt + PLOT.H - PLOT.mb) / 2}) rotate(-90)` });
  yl.innerHTML = `Performance on <tspan fill="var(--neg)" font-weight="600">hallucination</tspan> benchmarks`;

  // legend
  const lg = el("g", { class: "p-legend" }, s);
  PH.forEach((b, i) => {
    marker(SHAPES[i], PLOT.ml + 16, PLOT.mt + 18 + i * 22, 6, b.color, lg);
    label(lg, PLOT.ml + 30, PLOT.mt + 23 + i * 22, b.backbone, { "font-size": 14 });
  });
  el("path", { d: star(PLOT.ml + 16, PLOT.mt + 18 + 3 * 22, 8), fill: "#888" }, lg);
  label(lg, PLOT.ml + 30, PLOT.mt + 23 + 3 * 22, "VERVE (ours)", { "font-size": 14 });

  PH.forEach((b, i) => {
    const row = n => b.rows.find(r => r[0] === n);
    const base = row("Base"), ours = row(PICK[i].ours);
    const pt = r => [r[2][8], r[3][6]];
    const [bx, by] = pt(base), [ox, oy] = pt(ours);
    const priors = Object.keys(PICK[i].prior).map(n => [n, pt(row(n)), PICK[i].prior[n]]);
    el("marker", { id: "ta-arr" + i, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto" }, defs)
      .appendChild(el("path", { d: "M0,0L10,5L0,10z", fill: b.color }));

    // shaded region: base -> ours -> priors (fades in last)
    const poly = [[bx, by], [ox, oy], ...priors.map(p => p[1]).sort((a, c) => c[0] - a[0])];
    el("polygon", { points: poly.map(([x, y]) => X(x) + "," + Y(y)).join(" "), fill: b.color, "fill-opacity": .08, class: "p-poly" }, s);

    // priors start stacked on the base and "fall" to their real position
    priors.forEach(([n, [px, py], [dx, dy, anchor]]) => {
      const g = el("g", { class: "p-prior" }, s);
      g.style.setProperty("--dx", (X(bx) - X(px)) + "px");
      g.style.setProperty("--dy", (Y(by) - Y(py)) + "px");
      marker(SHAPES[i], X(px), Y(py), 7, b.color, g).setAttribute("fill-opacity", .75);
      label(g, X(px) + dx, Y(py) + dy, n.replace("Vision-OPD", "VisionOPD"), { "text-anchor": anchor, fill: "#555" });
    });

    const gb = el("g", { class: "p-base" }, s);
    marker(SHAPES[i], X(bx), Y(by), 8, b.color, gb);
    label(gb, X(bx) - (i === 0 ? 0 : 0), Y(by) + (i === 0 ? -12 : 22), "Base", { "text-anchor": "middle", fill: "#333" });

    const line = el("line", { x1: X(bx), y1: Y(by), x2: X(bx), y2: Y(by), stroke: b.color, "stroke-width": 2.2, "stroke-dasharray": "6 4", "marker-end": `url(#ta-arr${i})`, class: "p-arrow" }, s);
    line.dataset.to = [X(ox), Y(oy)].join(",");
    const go = el("g", { class: "p-ours" }, s);
    el("path", { d: star(X(ox), Y(oy), 13), fill: b.color, stroke: "#fff", "stroke-width": 1.2 }, go);
    label(go, X(ox), Y(oy) - 17, "Ours", { "text-anchor": "middle", fill: "#333", "font-weight": 600 });
  });
}
async function drawArrow(line, id) {
  const [tx, ty] = line.dataset.to.split(",").map(Number);
  const x0 = +line.getAttribute("x1"), y0 = +line.getAttribute("y1");
  const dx = tx - x0, dy = ty - y0, len = Math.hypot(dx, dy);
  const ex = tx - dx / len * 13, ey = ty - dy / len * 13;  // stop just before the star
  line.classList.add("in");
  const dur = 650; let t = 0;
  while (t < dur && !instant) {
    if (id !== run) throw "stop";
    const dt = await frame(); if (!paused) t += dt;
    const k = 1 - Math.pow(1 - Math.min(t / dur, 1), 3);
    line.setAttribute("x2", x0 + (ex - x0) * k); line.setAttribute("y2", y0 + (ey - y0) * k);
  }
  line.setAttribute("x2", ex); line.setAttribute("y2", ey);
}

// ---------- the script ----------
async function play() {
  const id = ++run;
  paused = false;
  root.classList.remove("done");
  root.querySelector(".ta-live").innerHTML = TEMPLATE;
  buildPlot();
  wireControls();
  try {
    beat(0);
    show(".s-photo"); await wait(600, id);
    show(".s-box"); await wait(800, id);
    show(".s-zoom"); await wait(700, id);
    show(".s-q1"); await wait(800, id);
    for (const s of [".s-a1", ".s-a2", ".s-a3"]) { show(s); await wait(280, id); }
    await wait(300, id);
    show(".s-tag1"); await wait(1200, id);

    beat(1);
    show(".s-q2"); await wait(900, id);
    show(".ta-flip", "flipped"); await wait(1000, id);
    for (const s of [".s-b1", ".s-b2"]) { show(s); await wait(450, id); }
    show(".s-b3"); await wait(800, id);
    show(".s-q3"); await wait(600, id);
    for (const s of [".s-c1", ".s-c2", ".s-c3"]) { show(s); await wait(350, id); }
    await wait(300, id);
    show(".s-tag2"); await wait(1300, id);

    beat(2);
    show(".ta-pb", "active");
    await typeTrace(id); await wait(1200, id);

    beat(3);
    show(".ta-pc", "active");
    show(".p-axes"); show(".p-legend"); await wait(500, id);
    show(".p-base"); await wait(700, id);
    show(".p-prior"); await wait(1100, id);
    const arrows = root.querySelectorAll(".p-arrow"), ours = root.querySelectorAll(".p-ours");
    for (let i = 0; i < arrows.length; i++) { await drawArrow(arrows[i], id); ours[i].classList.add("in"); await wait(150, id); }
    show(".p-poly"); await wait(400, id);
    root.classList.add("done");
    const pb = root.querySelector(".ta-play"); pb.textContent = "▶"; pb.setAttribute("aria-label", "Play again");
  } catch (e) { if (e !== "stop") throw e; }
}

function finishNow() { instant = true; const p = play(); p.finally(() => { instant = false; }); }

function wireControls() {
  const cancelAuto = () => { if (io) { io.disconnect(); io = null; } };
  const btn = root.querySelector(".ta-play");
  btn.onclick = () => {
    cancelAuto();
    if (root.classList.contains("done")) return play();
    paused = !paused;
    btn.textContent = paused ? "▶" : "❚❚";
    btn.setAttribute("aria-label", paused ? "Play" : "Pause");
  };
  root.querySelector(".ta-replay").onclick = () => { cancelAuto(); play(); };
  root.querySelector(".ta-skip").onclick = () => { cancelAuto(); finishNow(); };
}

// ---------- start ----------
root.classList.add("js");
const live = document.createElement("div");
live.className = "ta-live";
root.prepend(live);
if (reduceMotion) { finishNow(); return; }
live.innerHTML = TEMPLATE; buildPlot(); wireControls();   // static, empty layout until it scrolls into view
io = new IntersectionObserver(es => {
  if (es.some(e => e.isIntersecting)) { io.disconnect(); io = null; play(); }
}, { threshold: 0.35 });
io.observe(root);
})();
