// Animated training-data curation pipeline (top half of Fig. 4).
// The whole diagram is drawn faintly from the start; a token travels each arrow and
// lights up the boxes it reaches, including the reject -> feedback -> re-propose loop.
(() => {
const root = document.getElementById("pipeline");
if (!root) return;
const NS = "http://www.w3.org/2000/svg";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const BEATS = [
  "The captioner (Qwen3.5-27B) describes the image in detail.",
  "The proposer (GPT-OSS-120B) never sees the image. It only gets the caption and the question.",
  "It edits one entity and writes a yes/no check that targets the edit.",
  "The verifier looks at the image and says yes, there might be a basket. The edit is rejected and the evidence goes back.",
  "With the new evidence, the proposer tries again (i = 2).",
  "No red container in the image: the edit is accepted as a negative question.",
  "The annotator writes golden verification Q&As used as the OPSV reward."
];

// ---------- svg helpers ----------
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent && parent.appendChild(e);
  return e;
}
// rich line: array of [text, cls]
function line(parent, x, y, parts, attrs = {}) {
  const t = el("text", { x, y, ...attrs }, parent);
  (Array.isArray(parts) ? parts : [[parts]]).forEach(([s, cls]) => {
    const sp = el("tspan", cls ? { class: cls } : {}, t);
    sp.textContent = s;
  });
  return t;
}
const COLORS = {
  green: ["#b6d7a8", "#e3efdc"], orange: ["#f6b26b", "#fde8d2"],
  blue: ["#cfe2f3", "#f1f1f1"], red: ["#ea9999", "#f6dada"]
};
function box(parent, id, x, y, w, h, header, color, lines) {
  const g = el("g", { class: "pl-node", id: "pl-" + id }, parent);
  const [hc, bc] = COLORS[color];
  el("rect", { x, y, width: w, height: h, rx: 4, fill: bc, class: "pl-frame" }, g);
  el("rect", { x, y, width: w, height: 26, rx: 4, fill: hc }, g);
  line(g, x + w / 2, y + 18, header, { "text-anchor": "middle", class: "pl-h" });
  const body = el("g", { class: "pl-body" }, g);
  lines.forEach((ln, i) => line(body, x + 10, y + 46 + i * 20, ln));
  return g;
}
function icon(parent, id, cx, cy, src, name, lx, ly, anchor = "middle") {
  const g = el("g", { class: "pl-node pl-agent", id: "pl-" + id }, parent);
  el("circle", { cx, cy, r: 25, fill: "#fff", class: "pl-ring" }, g);
  el("image", { href: src, x: cx - 20, y: cy - 20, width: 40, height: 40 }, g);
  line(g, lx, ly, [[name]], { "text-anchor": anchor, class: "pl-role" });
  return g;
}
function edge(parent, id, d, labelText, lx, ly, anchor = "middle") {
  const g = el("g", { class: "pl-edge", id: "pe-" + id }, parent);
  el("path", { d, fill: "none", "marker-end": "url(#pl-arrow)" }, g);
  if (labelText) line(g, lx, ly, [[labelText]], { "text-anchor": anchor, class: "pl-elabel" });
  return g;
}

function build(svg) {
  svg.innerHTML = "";
  const defs = el("defs", {}, svg);
  const m = el("marker", { id: "pl-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" }, defs);
  el("path", { d: "M0,1L10,5L0,9z", class: "pl-arrowhead" }, m);

  const E = el("g", {}, svg), N = el("g", {}, svg);
  // edges (drawn first so nodes sit on top)
  edge(E, "img-cap", "M162,85 H178");
  edge(E, "cap-txt", "M228,85 H243");
  edge(E, "txt-prop", "M392,85 H410 V160 H418");
  edge(E, "pos-prop", "M392,192 H410 V160 H418");
  edge(E, "prop-p1", "M471,160 H482 V70 H498");
  edge(E, "p1-c1", "M792,70 H812");
  edge(E, "c1-ver", "M900,104 V150");
  edge(E, "ver-fb", "M878,176 H794", "Yes", 836, 168);
  edge(E, "fb-prop", "M498,166 H473");
  edge(E, "prop-p2", "M445,186 V257 H498");
  edge(E, "p2-c2", "M792,257 H812");
  edge(E, "c2-ver", "M900,236 V204");
  edge(E, "ver-neg", "M931,176 H980 V357 H794", "No (or i > 3)", 888, 349);
  edge(E, "pos-ann", "M392,226 H428 V328");
  edge(E, "neg-ann", "M498,357 H468");
  edge(E, "ann-gold", "M414,357 H394");

  // nodes
  const img = el("g", { class: "pl-node", id: "pl-img" }, N);
  el("image", { href: "static/pipeline/nuts.webp", x: 20, y: 38, width: 140, height: 93, preserveAspectRatio: "xMidYMid slice" }, img);
  icon(N, "cap", 203, 85, "static/pipeline/qwen.png", "Captioner", 203, 48);
  const txt = el("g", { class: "pl-node", id: "pl-txt" }, N);
  el("rect", { x: 245, y: 38, width: 146, height: 94, rx: 12, fill: "#fff", class: "pl-frame" }, txt);
  ["This image features", "a vibrant market", "stall…"].forEach((s, i) => line(txt, 256, 62 + i * 21, [[s]]));

  box(N, "pos", 20, 152, 372, 88, "Positive question", "green",
    [[["What is the material of the "], ["container", "w-pos"]], [["holding the nuts?"]]]);
  box(N, "gold", 20, 296, 372, 112, "Golden Q&As (pos / neg)", "orange",
    [[["Q1: Is there a container?  A1: yes"]],
     [["Q2: Is any container red?  "], ["A2: no", "w-neg"], [" ← neg-specific", "muted"]],
     [["Q3: Is any container holding the nuts?  A3: yes"]]]);

  icon(N, "prop", 445, 160, "static/pipeline/gpt.png", "Proposer", 445, 124);
  icon(N, "ann", 445, 357, "static/pipeline/gpt.png", "Annotator", 445, 400);

  box(N, "p1", 500, 34, 292, 72, [["Proposal  "], ["i = 1", "iter"]], "blue",
    [[["Change ‘"], ["container", "w-pos"], ["’ to ‘"], ["basket", "w-neg"], ["’"]]]);
  box(N, "fb", 500, 124, 292, 86, "Feedback", "blue",
    [[["Yes, the container holding the nuts"]], [["might be a basket, because…"]]]);
  box(N, "p2", 500, 221, 292, 72, [["Proposal  "], ["i = 2", "iter"]], "blue",
    [[["Add ‘"], ["red", "w-neg"], ["’ to the container"]]]);
  box(N, "neg", 500, 312, 292, 90, "Negative question", "red",
    [[["What is the material of the "], ["red", "w-neg"]], [["container holding the nuts?"]]]);

  // stamps on the proposals
  const s1 = el("g", { class: "pl-stamp bad", id: "pl-stamp1" }, N);
  el("rect", { x: 698, y: 36, width: 90, height: 22, rx: 11 }, s1);
  line(s1, 743, 52, [["✗ rejected"]], { "text-anchor": "middle" });
  const s2 = el("g", { class: "pl-stamp good", id: "pl-stamp2" }, N);
  el("rect", { x: 698, y: 223, width: 90, height: 22, rx: 11 }, s2);
  line(s2, 743, 239, [["✓ accepted"]], { "text-anchor": "middle" });

  const c1 = el("g", { class: "pl-node", id: "pl-c1" }, N);
  line(c1, 816, 64, [["Is there any "], ["basket", "w-neg"]]);
  line(c1, 816, 84, [["holding nuts?"]]);
  const c2 = el("g", { class: "pl-node", id: "pl-c2" }, N);
  line(c2, 816, 252, [["Is there any "], ["red", "w-neg"]]);
  line(c2, 816, 272, [["container?"]]);

  icon(N, "ver", 905, 176, "static/pipeline/qwen.png", "Verifier", 937, 146, "start");

  // moving token
  el("circle", { r: 7, class: "pl-token", id: "pl-token", cx: -20, cy: -20 }, svg);
}

// ---------- run control (same pattern as the teaser) ----------
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
const on = (...ids) => ids.forEach(i => $("#pl-" + i).classList.add("on"));
const act = (...ids) => {
  root.querySelectorAll(".pl-node.active").forEach(n => n.classList.remove("active"));
  ids.forEach(i => $("#pl-" + i).classList.add("active"));
};
async function travel(eid, id) {
  const g = $("#pe-" + eid), path = g.querySelector("path"), tok = $("#pl-token");
  const len = path.getTotalLength(), dur = Math.max(350, len * 2.6);
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
const both = (a, b, id) => Promise.all([travel(a, id), travel(b, id)]);
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
    on("img"); act("img"); await wait(500, id);
    await travel("img-cap", id); on("cap"); act("cap"); await wait(300, id);
    await travel("cap-txt", id); on("txt"); act("txt"); await wait(900, id);

    beat(1);
    on("pos"); act("pos"); await wait(600, id);
    await both("txt-prop", "pos-prop", id); on("prop"); act("prop"); await wait(700, id);

    beat(2);
    await travel("prop-p1", id); on("p1"); act("p1"); await wait(900, id);
    await travel("p1-c1", id); on("c1"); act("c1"); await wait(800, id);

    beat(3);
    await travel("c1-ver", id); on("ver"); act("ver"); await wait(600, id);
    $("#pl-stamp1").classList.add("on");
    await travel("ver-fb", id); on("fb"); act("fb"); await wait(1100, id);
    await travel("fb-prop", id); act("prop"); await wait(600, id);

    beat(4);
    await travel("prop-p2", id); on("p2"); act("p2"); await wait(900, id);
    await travel("p2-c2", id); on("c2"); act("c2"); await wait(700, id);
    await travel("c2-ver", id); act("ver"); await wait(600, id);

    beat(5);
    $("#pl-stamp2").classList.add("on");
    await travel("ver-neg", id); on("neg"); act("neg"); await wait(1100, id);

    beat(6);
    await both("pos-ann", "neg-ann", id); on("ann"); act("ann"); await wait(500, id);
    await travel("ann-gold", id); on("gold"); act("gold"); await wait(600, id);
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
  <div class="pl-scroll"><svg viewBox="0 0 1000 412" role="img" aria-label="Animated training data construction pipeline"></svg></div>
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
