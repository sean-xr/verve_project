// Animated training & reward design (bottom half of Fig. 4), OPSV mode on a negative question.
// Same visual language as pipeline.js: faint diagram, a token travels the arrows, boxes light up.
(() => {
const root = document.getElementById("trainanim");
if (!root) return;
const NS = "http://www.w3.org/2000/svg";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const BEATS = [
  "The policy gets the image, a question (here a negative one), and the self-verify prompt.",
  "It poses its own checks about the question's premises and answers each one…",
  "…then commits to a final answer.",
  "A reward model matches the checks against the golden Q&As, and the answer against the ground truth.",
  "Coverage, correctness and format combine into one reward. Checks only count if the answer is correct.",
  "GRPO compares 8 sampled responses and shifts the policy toward the higher-reward ones."
];
const ALPHA = 0.5, WF = 0.1, RK = 2 / 3, RC = 1, RF = 1;
const R = (1 - WF) * RC * (ALPHA + (1 - ALPHA) * RK) + WF * RF;

// ---------- svg helpers ----------
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent && parent.appendChild(e);
  return e;
}
function line(parent, x, y, parts, attrs = {}) {
  const t = el("text", { x, y, ...attrs }, parent);
  (Array.isArray(parts) ? parts : [[parts]]).forEach(([s, cls]) => {
    const sp = el("tspan", cls ? { class: cls } : {}, t);
    sp.textContent = s;
  });
  return t;
}
const COLORS = {
  purple: ["#d9d2f0", "#f3f2f6"], orange: ["#f6b26b", "#fde8d2"], pink: ["#d5a6bd", "#f3e4ec"]
};
function box(parent, id, x, y, w, h, header, color, lines, lh = 20) {
  const g = el("g", { class: "pl-node", id: "tr-" + id }, parent);
  const [hc, bc] = COLORS[color];
  el("rect", { x, y, width: w, height: h, rx: 4, fill: bc, class: "pl-frame" }, g);
  el("rect", { x, y, width: w, height: 26, rx: 4, fill: hc }, g);
  line(g, x + w / 2, y + 18, header, { "text-anchor": "middle", class: "pl-h" });
  const body = el("g", { class: "pl-body" }, g);
  lines.forEach((ln, i) => line(body, x + 10, y + 46 + i * lh, ln));
  return g;
}
function reward(parent, id, x, y, w, name, sym, sub) {
  const g = el("g", { class: "pl-node", id: "tr-" + id }, parent);
  el("rect", { x, y, width: w, height: 50, rx: 5, fill: "#e3c2d2", class: "pl-frame" }, g);
  const t = line(g, x + w / 2, y + 21, [[name]], { "text-anchor": "middle", class: "pl-h" });
  const t2 = el("text", { x: x + w / 2, y: y + 41, "text-anchor": "middle", class: "pl-math" }, g);
  t2.innerHTML = `<tspan font-style="italic">${sym}</tspan><tspan dy="4" font-size="12" font-style="italic">${sub}</tspan>`;
  const v = el("g", { class: "pl-stamp good", id: "tr-v-" + id }, parent);
  el("rect", { x: x + w - 34, y: y - 11, width: 46, height: 20, rx: 10 }, v);
  line(v, x + w - 11, y + 4, [[""]], { "text-anchor": "middle" });
  return g;
}
function icon(parent, id, cx, cy, src, name, lx, ly) {
  const g = el("g", { class: "pl-node pl-agent", id: "tr-" + id }, parent);
  el("circle", { cx, cy, r: 27, fill: "#fff", class: "pl-ring" }, g);
  el("image", { href: src, x: cx - 21, y: cy - 21, width: 42, height: 42 }, g);
  line(g, lx, ly, [[name]], { "text-anchor": "middle", class: "pl-role" });
  return g;
}
function edge(parent, id, d, style, labelText, lx, ly) {
  const g = el("g", { class: "pl-edge " + (style || ""), id: "te-" + id }, parent);
  el("path", { d, fill: "none", "marker-end": "url(#tr-arrow)" }, g);
  if (labelText) line(g, lx, ly, [[labelText]], { "text-anchor": "middle", class: "pl-elabel" });
  return g;
}

const VERIFIED = [
  "Let’s reason step by step…",
  "Q1: Can I see a container?  A1: yes.",
  "Q2: Is it red?  A2: no → neg-specific"
];

function build(svg) {
  svg.innerHTML = "";
  const defs = el("defs", {}, svg);
  const m = el("marker", { id: "tr-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" }, defs);
  el("path", { d: "M0,1L10,5L0,9z", class: "pl-arrowhead" }, m);
  const E = el("g", {}, svg), N = el("g", {}, svg);

  // edges
  edge(E, "img-pol", "M212,78 H240 V196 H250");
  edge(E, "sv-pol", "M222,214 H240 V196");
  edge(E, "q-pol", "M222,322 H240 V196");
  edge(E, "pol-ver", "M306,190 H318 V169 H330");
  edge(E, "pol-ans", "M306,202 H318 V265 H330");
  edge(E, "gold-rm", "M612,62 H668 V164", "dash");
  edge(E, "ver-rm", "M612,169 H644 V184 H652", "dash");
  edge(E, "ans-rm", "M612,265 H668 V218", "dot");
  edge(E, "gt-rm", "M612,337 H690 V218", "dot");
  edge(E, "rm-rk", "M705,182 H722 V106 H740", "dash");
  edge(E, "rm-rc", "M707,190 H740", "dot");
  edge(E, "rm-rf", "M705,198 H722 V274 H740");
  edge(E, "rk-r", "M868,106 H880 V190 H892");
  edge(E, "rc-r", "M868,190 H892");
  edge(E, "rf-r", "M868,274 H880 V190");
  edge(E, "grpo", "M986,190 H996 V404 H278 V226", "", "GRPO update", 640, 396);

  // inputs
  const img = el("g", { class: "pl-node", id: "tr-img" }, N);
  el("image", { href: "static/pipeline/nuts.webp", x: 20, y: 20, width: 192, height: 122, preserveAspectRatio: "xMidYMid slice" }, img);
  box(N, "sv", 20, 160, 202, 112, "Self-verify prompt", "purple",
    [[["First verify every claim"]], [["the question body relies"]], [["on against the image…"]]]);
  box(N, "q", 20, 288, 202, 64, "Question", "purple",
    [[["Positive", "w-pos"], [" or "], ["negative", "w-neg"]]]);

  icon(N, "pol", 278, 196, "static/teaser/verve.png", "Policy model", 278, 244);

  // policy outputs and supervision
  box(N, "gold", 332, 20, 280, 86, "Golden Q&As", "orange",
    [[["Q1: Is there a container?  A1: yes"]], [["Q2: Is any container red?  A2: no"]], [["Q3: Is it holding the nuts?  A3: yes"]]], 17);
  const ver = box(N, "ver", 332, 116, 280, 106, "Verified Q&As (on-policy)", "purple", [[[""]], [[""]], [[""]]]);
  ver.querySelectorAll(".pl-body text").forEach((t, i) => { t.dataset.full = VERIFIED[i]; t.classList.add("typing"); });
  box(N, "ans", 332, 236, 280, 58, [["Final answer  "], ["â", "it"]], "purple",
    [[["The container is not red.", "w-neg"]]]);
  box(N, "gt", 332, 308, 280, 58, [["Ground truth  "], ["a*", "it"]], "purple",
    [[["The container is not red.", "w-neg"]]]);

  icon(N, "rm", 680, 190, "static/pipeline/qwen.png", "Reward model", 682, 150);

  reward(N, "rk", 742, 82, 126, "Coverage", "R", "k");
  reward(N, "rc", 742, 166, 126, "Correctness", "R", "c");
  reward(N, "rf", 742, 250, 126, "Format", "R", "f");

  const fin = el("g", { class: "pl-node", id: "tr-r" }, N);
  el("rect", { x: 894, y: 158, width: 92, height: 64, rx: 5, fill: "#d5a6bd", class: "pl-frame" }, fin);
  line(fin, 940, 183, [["Final"]], { "text-anchor": "middle", class: "pl-h" });
  line(fin, 940, 205, [["reward "], ["R", "it"]], { "text-anchor": "middle", class: "pl-h" });
  const rv = el("g", { class: "pl-stamp ours", id: "tr-v-r" }, N);
  el("rect", { x: 902, y: 230, width: 76, height: 26, rx: 13 }, rv);
  line(rv, 940, 248, [["R = " + R.toFixed(2)]], { "text-anchor": "middle" });

  const f = el("text", { x: 866, y: 330, "text-anchor": "middle", class: "pl-math pl-node", id: "tr-formula" }, N);
  const v = (b, sb) => `<tspan font-style="italic">${b}</tspan><tspan dy="4" font-size="11" font-style="italic">${sb}</tspan><tspan dy="-4">`;
  f.innerHTML = `<tspan font-style="italic">R</tspan> = (1 − ${v("w", "f")}) </tspan>${v("R", "c")} (α + (1 − α) </tspan>${v("R", "k")}) + </tspan>${v("w", "f")} </tspan>${v("R", "f")}</tspan>`;

  // GRPO group: 8 sampled responses with their rewards
  const grp = el("g", { class: "pl-node", id: "tr-group" }, N);
  const rewards = [R, 0.10, 0.55, 0.85, 0.10, 0.78, 0.10, 0.70];
  const mean = rewards.reduce((a, b) => a + b) / rewards.length;
  const gx = 728, gy = 388, bw = 22, maxH = 36;
  rewards.forEach((r, i) => {
    const h = r * maxH, x = gx + i * (bw + 6);
    el("rect", { x, y: gy - h, width: bw, height: h, rx: 2, class: r >= mean ? "adv-pos" : "adv-neg" }, grp);
  });
  el("line", { x1: gx - 6, x2: gx + 8 * (bw + 6), y1: gy - mean * maxH, y2: gy - mean * maxH, class: "adv-mean" }, grp);
  line(grp, gx - 12, gy - 6, [["8 rollouts"]], { "text-anchor": "end", class: "pl-elabel" });

  el("circle", { r: 7, class: "pl-token", id: "tr-token", cx: -20, cy: -20 }, svg);
}

// ---------- run control ----------
let run = 0, paused = false, instant = false, io = null;
const frame = () => new Promise(r => {
  const t0 = performance.now(); let done = false;
  const fin = () => { if (!done) { done = true; r(performance.now() - t0); } };
  requestAnimationFrame(fin); setTimeout(fin, 50);
});
async function wait(ms, id) {
  let left = ms;
  while (left > 0) {
    if (id !== run) throw "stop";
    if (instant) return;
    const dt = await frame(); if (!paused) left -= dt;
  }
  if (id !== run) throw "stop";
}
const $ = s => root.querySelector(s);
const on = (...ids) => ids.forEach(i => $("#tr-" + i).classList.add("on"));
const act = (...ids) => {
  root.querySelectorAll(".pl-node.active").forEach(n => n.classList.remove("active"));
  ids.forEach(i => $("#tr-" + i).classList.add("active"));
};
async function travel(eid, id, speed = 2.4) {
  const g = $("#te-" + eid), path = g.querySelector("path"), tok = $("#tr-token");
  const len = path.getTotalLength(), dur = Math.max(320, len * speed);
  g.classList.add("lit");
  if (!instant) {
    tok.classList.add("show");
    let t = 0;
    while (t < dur && !instant) {
      if (id !== run) throw "stop";
      const dt = await frame(); if (!paused) t += dt;
      const k = Math.min(1, t / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const p = path.getPointAtLength(e * len);
      tok.setAttribute("cx", p.x); tok.setAttribute("cy", p.y);
    }
    tok.classList.remove("show");
  }
  g.classList.add("done");
}
const all = (ids, id) => Promise.all(ids.map(e => travel(e, id)));
async function typeLine(t, id) {
  const full = t.dataset.full, sp = t.querySelector("tspan");
  let ms = 0;
  while (!instant) {
    if (id !== run) throw "stop";
    const dt = await frame(); if (!paused) ms += dt;
    const k = Math.min(full.length, Math.floor(ms / 28));
    sp.textContent = full.slice(0, k);
    if (k >= full.length) break;
  }
  sp.textContent = full;
}
function setValue(key, text) {
  const v = $("#tr-v-" + key);
  v.querySelector("tspan").textContent = text;
  v.classList.add("on");
}
function beat(i) {
  root.querySelectorAll(".ta-beats i").forEach((d, j) => d.classList.toggle("on", j <= i));
  const c = $(".ta-caption");
  c.classList.remove("in"); void c.offsetWidth;
  c.textContent = BEATS[i]; c.classList.add("in");
}

async function play() {
  const id = ++run;
  paused = false;
  root.classList.remove("done");
  build($("svg"));
  const pb = $(".ta-play"); pb.textContent = "❚❚"; pb.setAttribute("aria-label", "Pause");
  try {
    beat(0);
    on("img", "sv", "q"); act("img", "sv", "q"); await wait(900, id);
    await all(["img-pol", "sv-pol", "q-pol"], id); on("pol"); act("pol"); await wait(600, id);

    beat(1);
    await travel("pol-ver", id); on("ver"); act("ver");
    for (const t of root.querySelectorAll("#tr-ver .pl-body text")) await typeLine(t, id);
    await wait(700, id);

    beat(2);
    await travel("pol-ans", id); on("ans"); act("ans"); await wait(1000, id);

    beat(3);
    on("gold", "gt"); act("gold", "gt"); await wait(700, id);
    await all(["gold-rm", "ver-rm", "ans-rm", "gt-rm"], id); on("rm"); act("rm"); await wait(700, id);

    beat(4);
    await travel("rm-rk", id); on("rk"); act("rk"); setValue("rk", "2/3"); await wait(500, id);
    await travel("rm-rc", id); on("rc"); act("rc"); setValue("rc", "1"); await wait(500, id);
    await travel("rm-rf", id); on("rf"); act("rf"); setValue("rf", "1"); await wait(500, id);
    await all(["rk-r", "rc-r", "rf-r"], id); on("r", "formula"); act("r"); await wait(300, id);
    $("#tr-v-r").classList.add("on"); await wait(1200, id);

    beat(5);
    on("group"); act("group"); await wait(900, id);
    await travel("grpo", id, 1.6); act("pol");
    $("#tr-pol").classList.add("pulse"); await wait(900, id);
    act();
    root.classList.add("done");
    pb.textContent = "▶"; pb.setAttribute("aria-label", "Play again");
  } catch (e) { if (e !== "stop") throw e; }
}
function finishNow() { instant = true; play().finally(() => { instant = false; }); }

// ---------- mount ----------
root.classList.add("js");
const live = document.createElement("div");
live.className = "pl-live";
live.innerHTML = `
  <div class="pl-scroll"><svg viewBox="0 0 1000 432" role="img" aria-label="Animated VERVE-Train reward pipeline"></svg></div>
  <div class="ta-controls">
    <button class="ta-btn ta-play" aria-label="Pause">❚❚</button>
    <button class="ta-btn ta-replay">↻ Replay</button>
    <div class="ta-beats">${BEATS.map(() => "<i></i>").join("")}</div>
    <span class="ta-caption"></span>
    <button class="ta-btn ta-skip">Skip ›</button>
  </div>`;
root.prepend(live);
build($("svg"));

const cancelAuto = () => { if (io) { io.disconnect(); io = null; } };
$(".ta-play").onclick = () => {
  cancelAuto();
  if (root.classList.contains("done") || !run) return play();
  paused = !paused;
  $(".ta-play").textContent = paused ? "▶" : "❚❚";
};
$(".ta-replay").onclick = () => { cancelAuto(); play(); };
$(".ta-skip").onclick = () => { cancelAuto(); finishNow(); };

if (reduceMotion) { finishNow(); return; }
io = new IntersectionObserver(es => {
  if (es.some(e => e.isIntersecting)) { io.disconnect(); io = null; play(); }
}, { threshold: 0.4 });
io.observe(root);
})();
