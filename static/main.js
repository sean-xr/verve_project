(() => {
const NS = "http://www.w3.org/2000/svg";
const KIND_COLOR = { frontier: "var(--frontier)", base: "var(--base)", prior: "var(--prior)", ours: "var(--ours)" };
const $ = (s, r = document) => r.querySelector(s);

function svg(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}
function text(parent, x, y, str, attrs = {}) {
  const t = svg("text", { x, y, "font-size": 11, ...attrs }, parent);
  t.textContent = str;
  return t;
}
function unitsWide(host) {
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Math.max(320, Math.round(host.clientWidth * 14 / root));
}
const redrawers = [];
let resizeTimer;
addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => redrawers.forEach(f => f()), 120); });

function segmented(container, labels, onPick, initial = 0) {
  container.innerHTML = "";
  labels.forEach((l, i) => {
    const b = document.createElement("button");
    b.textContent = l;
    if (i === initial) b.classList.add("on");
    b.onclick = () => {
      container.querySelectorAll("button").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      onPick(l, i);
    };
    container.appendChild(b);
  });
}

// ---------- tooltip ----------
const tip = $("#tooltip");
function showTip(e, html) {
  tip.innerHTML = html; tip.hidden = false;
  const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX + pad, y = e.clientY + pad;
  if (x + w > innerWidth - 8) x = e.clientX - w - pad;
  if (y + h > innerHeight - 8) y = e.clientY - h - pad;
  tip.style.left = x + "px"; tip.style.top = y + "px";
}
const hideTip = () => { tip.hidden = true; };

// ---------- lightbox ----------
const lb = $("#lightbox");
document.querySelectorAll(".zoomable img").forEach(img => {
  img.addEventListener("click", () => { lb.querySelector("img").src = img.src; lb.hidden = false; });
});
lb.addEventListener("click", () => { lb.hidden = true; });
addEventListener("keydown", e => { if (e.key === "Escape") lb.hidden = true; });

// ---------- copy bibtex ----------
const copyBtn = $(".bibtex .copy");
copyBtn.onclick = () => {
  navigator.clipboard?.writeText($(".bibtex code").textContent).then(() => {
    copyBtn.textContent = "Copied"; setTimeout(() => copyBtn.textContent = "Copy", 1400);
  });
};

// ================= 1. MCQ explorer =================
(function mcqExplorer() {
  const root = $("#mcq-explorer");
  const tabs = $(".tabs", root), img = $(".mcq-img img", root), q = $(".mcq-q", root),
        opts = $(".mcq-opts", root), models = $(".mcq-models", root);
  let ex = 0, mode = "pos";

  MCQ_EXAMPLES.forEach((e, i) => {
    const b = document.createElement("button");
    b.textContent = `Example ${i + 1} · ${e.tag}`;
    b.onclick = () => { ex = i; render(); };
    tabs.appendChild(b);
  });
  root.querySelectorAll(".seg button").forEach(b => b.onclick = () => {
    mode = b.dataset.q;
    root.querySelectorAll(".seg button").forEach(x => x.classList.toggle("on", x === b));
    render();
  });

  function render() {
    const e = MCQ_EXAMPLES[ex];
    tabs.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === ex));
    img.src = e.img; img.alt = e.pos.q;
    q.className = "mcq-q " + mode;
    q.innerHTML = e[mode].q.replace(/\[(.+?)\]/, "<mark>$1</mark>");
    opts.innerHTML = e.opts.map((o, i) =>
      `<li class="${i === e[mode].gt ? "gt " + mode : ""}">${o}</li>`).join("");
    const mi = mode === "pos" ? 0 : 1;
    models.innerHTML = MCQ_MODELS.map(m => {
      const [choice, ok] = e.preds[m.key][mi];
      const [, okPos] = e.preds[m.key][0], [, okNeg] = e.preds[m.key][1];
      let ans;
      if (ok) ans = `<span class="ok">✓</span> ${e.opts[choice]}`;
      else if (choice != null) ans = `<span class="bad">✗</span> “${e.opts[choice]}”${mode === "neg" ? " — accepted the false premise" : ""}`;
      else ans = `<span class="bad">✗</span> picked a content answer, accepting the false premise`;
      const pair = okPos && okNeg ? `<span class="ok">paired credit ✓</span>` : `<span class="bad">no paired credit</span>`;
      return `<div class="model-card ${m.ours ? "ours" : ""}"><div class="name">${m.name}</div>
        <div class="ans">${ans}</div><div class="pair">${pair}</div></div>`;
    }).join("");
  }
  render();
})();

// ================= 2. MCQ bar chart =================
(function mcqChart() {
  const root = $("#mcq-chart"), sel = $("select", root), host = $(".chart", root);
  MCQ_COLS.forEach((c, i) => sel.add(new Option(c, i)));
  let bars, lineH, lineR, sx, W, L, R;
  const RH = 17, GH = 22, MAX = 75;
  function build() {
  host.innerHTML = "";
  W = unitsWide(host); L = 150; R = 50;
  sx = v => (v / MAX) * (W - L - R);
  let rows = 0; MCQ_TABLE.forEach(g => rows += g.rows.length);
  const H = rows * RH + MCQ_TABLE.length * GH + 24;
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}` }, host);

  const gGrid = svg("g", { class: "grid" }, s);
  for (let v = 0; v <= 70; v += 10) {
    svg("line", { x1: L + sx(v), x2: L + sx(v), y1: 0, y2: H - 18 }, gGrid);
    text(s, L + sx(v), H - 4, v, { "text-anchor": "middle", "font-size": 10, fill: "#999" });
  }
  bars = [];
  let y = 0;
  MCQ_TABLE.forEach(g => {
    y += GH;
    text(s, 0, y - 6, g.group, { "font-weight": 600, "font-size": 11.5 });
    g.rows.forEach(([name, kind, vals]) => {
      const indent = name.startsWith("+") ? 12 : 0;
      text(s, indent, y + RH / 2 + 4, name, { "font-size": 11, fill: kind === "ours" ? "var(--ours)" : "#444", "font-weight": kind === "ours" ? 600 : 400 });
      const r = svg("rect", { x: L, y: y + 2, height: RH - 5, width: W - L - R, rx: 2, fill: KIND_COLOR[kind], class: "bar hoverable" }, s);
      r.style.transformBox = "fill-box"; r.style.transformOrigin = "left";
      r.style.transition = "transform .45s cubic-bezier(.2,.7,.2,1)";
      const t = text(s, L, y + RH / 2 + 4, "", { "font-size": 10.5 });
      t.style.transition = "transform .45s cubic-bezier(.2,.7,.2,1)";
      r.addEventListener("mousemove", e => showTip(e, `<b>${g.group === "Frontier" ? "" : g.group + " "}${name}</b><br>${MCQ_COLS[sel.value]}: ${vals[sel.value]}%`));
      r.addEventListener("mouseleave", hideTip);
      bars.push({ r, t, vals });
      y += RH;
    });
  });
  lineH = svg("line", { y1: 0, y2: H - 18, stroke: "#555", "stroke-dasharray": "4 3" }, s);
  lineR = svg("line", { x1: L + sx(4), x2: L + sx(4), y1: 0, y2: H - 18, stroke: "#555", "stroke-dasharray": "4 3" }, s);
  update();
  }

  function update() {
    const c = +sel.value;
    const full = W - L - R;
    bars.forEach(({ r, t, vals }) => {
      const w = sx(vals[c]);
      r.style.transform = `scaleX(${Math.max(w, 0.5) / full})`;
      t.textContent = vals[c].toFixed(1);
      t.style.transform = `translateX(${w + 4}px)`;
    });
    const showH = c === 0;
    lineH.setAttribute("x1", L + sx(70.5)); lineH.setAttribute("x2", L + sx(70.5));
    lineH.style.opacity = showH ? 1 : 0; lineR.style.opacity = showH ? 1 : 0;
  }
  sel.onchange = update;
  build();
  redrawers.push(build);
})();

// ================= 3. Yes-bias dumbbells =================
(function yesBias() {
  const root = $("#yes-bias"), host = $(".chart", root);
  const keys = ["Qwen2.5-VL-7B", "Qwen3-VL-8B", "Qwen3.5-9B"];
  let cur = "Qwen3.5-9B";
  segmented($(".seg", root), keys, k => draw(k), 2);
  redrawers.push(() => draw(cur));
  function draw(k) {
    cur = k;
    host.innerHTML = "";
    const rows = [...BINARY.Gemini, ...BINARY[k]];
    const W = unitsWide(host), L = 150, R = 90, RH = 30, top = 22;
    const H = top + rows.length * RH + 24;
    const x = v => L + (v / 100) * (W - L - R);
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}` }, host);
    const gg = svg("g", { class: "grid" }, s);
    for (let v = 0; v <= 100; v += 20) {
      svg("line", { x1: x(v), x2: x(v), y1: top - 6, y2: H - 20 }, gg);
      text(s, x(v), H - 6, v, { "text-anchor": "middle", "font-size": 10, fill: "#999" });
    }
    text(s, W - R + 14, 12, "paired acc.", { "font-size": 10, fill: "#999" });
    rows.forEach(([name, kind, paired, yes, no], i) => {
      const cy = top + i * RH + RH / 2;
      if (i === 1) svg("line", { x1: 0, x2: W, y1: cy - RH / 2, y2: cy - RH / 2, stroke: "#e4e1da" }, s);
      text(s, name.startsWith("+") ? 12 : 0, cy + 4, name, { fill: kind === "ours" ? "var(--ours)" : "#444", "font-weight": kind === "ours" ? 600 : 400 });
      const line = svg("line", { x1: x(Math.min(yes, no)), x2: x(Math.max(yes, no)), y1: cy, y2: cy, stroke: KIND_COLOR[kind], "stroke-width": 3, opacity: .45 }, s);
      const cY = svg("circle", { cx: x(yes), cy, r: 6, fill: "var(--pos)", class: "hoverable" }, s);
      const cN = svg("circle", { cx: x(no), cy, r: 6, fill: "var(--neg)", class: "hoverable" }, s);
      [cY, cN].forEach(c => {
        c.addEventListener("mousemove", e => showTip(e, `<b>${name}</b><br>GT = yes: ${yes}%<br>GT = no: ${no}%<br>gap: ${(yes - no).toFixed(1)} pts`));
        c.addEventListener("mouseleave", hideTip);
      });
      text(s, W - R + 14, cy + 4, paired.toFixed(1), { "font-weight": 600, fill: KIND_COLOR[kind] });
    });
  }
  draw("Qwen3.5-9B");
})();

// ================= 4. Reward playground =================
(function rewardPlayground() {
  const root = $("#reward");
  const golden = [
    { q: "Is there a container?", gt: "yes" },
    { q: "Is the container red?", gt: "no", note: "the edited premise" },
    { q: "Is the container holding nuts?", gt: "yes" }
  ];
  const state = { verdicts: ["yes", "no", "skip"], ans: 1, alpha: 0.5, fmt: true };
  const wf = 0.1;
  const box = $(".rw-checks", root);
  golden.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "rw-check";
    row.innerHTML = `<div class="q">&lt;check&gt; ${g.q}${g.note ? `<small>${g.note}</small>` : ""}</div><div class="seg small"></div>`;
    box.appendChild(row);
    const opts = ["not asked", "yes", "no"], vals = ["skip", "yes", "no"];
    segmented($(".seg", row), opts, (_, j) => { state.verdicts[i] = vals[j]; update(); }, vals.indexOf(state.verdicts[i]));
  });
  root.querySelectorAll(".rw-answer button").forEach(b => b.onclick = () => {
    state.ans = +b.dataset.a;
    root.querySelectorAll(".rw-answer button").forEach(x => x.classList.toggle("on", x === b));
    update();
  });
  const alphaIn = $('[data-k="alpha"]', root), alphaOut = alphaIn.nextElementSibling;
  alphaIn.oninput = () => { state.alpha = +alphaIn.value; update(); };
  $('[data-k="fmt"]', root).onchange = e => { state.fmt = e.target.checked; update(); };
  const out = k => $(`[data-o="${k}"]`, root);

  function update() {
    const covered = golden.filter((g, i) => state.verdicts[i] === g.gt).length;
    const rk = covered / golden.length, rc = state.ans, rf = state.fmt ? 1 : 0;
    const r = (1 - wf) * rc * (state.alpha + (1 - state.alpha) * rk) + wf * rf;
    alphaOut.textContent = state.alpha.toFixed(2);
    out("rc").textContent = rc.toFixed(2);
    out("rk").textContent = `${rk.toFixed(2)} (${covered}/${golden.length})`;
    out("rf").textContent = rf.toFixed(2);
    out("r").textContent = r.toFixed(3);
    $(".rw-bar div", root).style.width = (r * 100) + "%";
    const wrongVerdict = golden.some((g, i) => state.verdicts[i] !== "skip" && state.verdicts[i] !== g.gt);
    let why;
    if (!rc) why = "The answer accepts the false premise, so R_c = 0 and the checks earn nothing. Only the format reward is left.";
    else if (wrongVerdict) why = "A check with the wrong verdict doesn't count toward coverage.";
    else if (covered === golden.length) why = "Correct answer with all premises verified: maximum reward.";
    else why = "Correct answer. Verifying more of the premises raises R_k.";
    $(".rw-why", root).textContent = why;
  }
  update();
})();

// ================= 5. Perception vs hallucination scatter =================
(function scatter() {
  const root = $("#scatter"), host = $(".chart", root);
  const xs = $('[data-axis="x"]', root), ys = $('[data-axis="y"]', root);
  PERC_COLS.forEach((c, i) => xs.add(new Option(c, i)));
  HALL_COLS.forEach((c, i) => ys.add(new Option(c, i)));
  xs.value = PERC_COLS.length - 1; ys.value = HALL_COLS.length - 1;
  const hidden = new Set();

  const leg = $(".backbone-legend", root);
  PH.forEach(b => {
    const s = document.createElement("span");
    s.className = "clickable";
    s.innerHTML = `<i class="dot" style="background:${b.color}"></i>${b.backbone}`;
    s.onclick = () => { hidden.has(b.backbone) ? hidden.delete(b.backbone) : hidden.add(b.backbone); s.classList.toggle("off"); draw(); };
    leg.appendChild(s);
  });
  leg.insertAdjacentHTML("beforeend", `<span>■ base</span><span>● search method</span><span>★ <span class="sc">Verve</span></span><span class="muted">click a backbone to hide it</span>`);

  function star(cx, cy, r) {
    let p = "";
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      p += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1);
    }
    return p + "Z";
  }

  function draw() {
    host.innerHTML = "";
    const xi = +xs.value, yi = +ys.value;
    const pts = [];
    PH.forEach(b => {
      if (hidden.has(b.backbone)) return;
      b.rows.forEach(([name, kind, p, h]) => {
        if (p[xi] == null || h[yi] == null) return;
        pts.push({ b, name, kind, x: p[xi], y: h[yi] });
      });
    });
    if (!pts.length) { host.innerHTML = `<p class="muted">Select a backbone.</p>`; return; }
    const W = unitsWide(host), H = Math.min(460, Math.max(360, W * 0.5)), ml = 48, mr = 20, mt = 16, mb = 42;
    const pad = (lo, hi) => { const d = Math.max(hi - lo, 4); return [lo - d * 0.12, hi + d * 0.12]; };
    const [x0, x1] = pad(Math.min(...pts.map(p => p.x)), Math.max(...pts.map(p => p.x)));
    const [y0, y1] = pad(Math.min(...pts.map(p => p.y)), Math.max(...pts.map(p => p.y)));
    const X = v => ml + (v - x0) / (x1 - x0) * (W - ml - mr);
    const Y = v => H - mb - (v - y0) / (y1 - y0) * (H - mt - mb);
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}` }, host);
    const defs = svg("defs", {}, s);
    PH.forEach((b, i) => {
      const m = svg("marker", { id: "arr" + i, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
      svg("path", { d: "M0,0L10,5L0,10z", fill: b.color }, m);
    });
    const gg = svg("g", { class: "grid" }, s);
    const tick = (lo, hi) => { const st = (hi - lo) > 30 ? 10 : (hi - lo) > 12 ? 5 : 2; const a = []; for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) a.push(v); return a; };
    tick(x0, x1).forEach(v => { svg("line", { x1: X(v), x2: X(v), y1: mt, y2: H - mb }, gg); text(s, X(v), H - mb + 16, v, { "text-anchor": "middle", "font-size": 10, fill: "#999" }); });
    tick(y0, y1).forEach(v => { svg("line", { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v) }, gg); text(s, ml - 6, Y(v) + 3, v, { "text-anchor": "end", "font-size": 10, fill: "#999" }); });
    text(s, (ml + W - mr) / 2, H - 6, PERC_COLS[xi] + " →  (perception)", { "text-anchor": "middle", "font-size": 11.5, fill: "var(--pos)", "font-weight": 600 });
    const yl = text(s, 0, 0, HALL_COLS[yi] + " →  (hallucination resistance)", { "text-anchor": "middle", "font-size": 11.5, fill: "var(--neg)", "font-weight": 600 });
    yl.setAttribute("transform", `translate(12 ${(mt + H - mb) / 2}) rotate(-90)`);

    // arrows: base -> each VERVE, base -> each prior (faint)
    PH.forEach((b, bi) => {
      if (hidden.has(b.backbone)) return;
      const base = pts.find(p => p.b === b && p.kind === "base");
      if (!base) return;
      pts.filter(p => p.b === b && p.kind !== "base").forEach(p => {
        const dx = X(p.x) - X(base.x), dy = Y(p.y) - Y(base.y), len = Math.hypot(dx, dy) || 1;
        svg("line", {
          x1: X(base.x) + dx / len * 8, y1: Y(base.y) + dy / len * 8, x2: X(p.x) - dx / len * 10, y2: Y(p.y) - dy / len * 10,
          stroke: b.color, "stroke-width": p.kind === "ours" ? 1.8 : 1, "stroke-dasharray": p.kind === "ours" ? "5 3" : "2 3",
          opacity: p.kind === "ours" ? .9 : .4, "marker-end": p.kind === "ours" ? `url(#arr${bi})` : ""
        }, s);
      });
    });
    // greedy label placement: try nudging up/down until the label box doesn't overlap a placed one or a marker
    const placed = pts.map(p => ({ x0: X(p.x) - 10, x1: X(p.x) + 10, y0: Y(p.y) - 10, y1: Y(p.y) + 10 }));
    const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
    const labelPos = new Map();
    [...pts].sort((a, b) => (a.kind === "ours" ? -1 : 0) - (b.kind === "ours" ? -1 : 0)).forEach(p => {
      const str = p.kind === "ours" ? p.name.replace("VERVE ", "") : p.kind === "base" ? "base" : p.name;
      const w = str.length * 6, cx = X(p.x), cy = Y(p.y);
      for (const [dx, dy] of [[11, 4], [11, -9], [11, 16], [-11 - w, 4], [11, -21], [11, 28], [-11 - w, -9], [-11 - w, 16]]) {
        const box = { x0: cx + dx, x1: cx + dx + w, y0: cy + dy - 10, y1: cy + dy + 2 };
        if (box.x1 > W - 2 || !placed.some(b => hit(box, b) && !(b.x0 === cx - 10 && b.y0 === cy - 10))) {
          placed.push(box); labelPos.set(p, [cx + dx, cy + dy, str]); return;
        }
      }
      labelPos.set(p, [cx + 11, cy + 4, str]);
    });
    pts.forEach(p => {
      const cx = X(p.x), cy = Y(p.y);
      let el;
      if (p.kind === "base") el = svg("rect", { x: cx - 6, y: cy - 6, width: 12, height: 12, fill: p.b.color }, s);
      else if (p.kind === "ours") el = svg("path", { d: star(cx, cy, 10), fill: p.b.color, stroke: "#fff", "stroke-width": 1 }, s);
      else el = svg("circle", { cx, cy, r: 6, fill: p.b.color, "fill-opacity": .55, stroke: p.b.color }, s);
      el.classList.add("hoverable");
      const label = p.kind === "base" ? p.b.backbone : p.name;
      const [lx, ly, str] = labelPos.get(p);
      text(s, lx, ly, str,
        { "font-size": 10.5, fill: p.kind === "ours" ? p.b.color : "#666", "font-weight": p.kind === "ours" ? 600 : 400 });
      el.addEventListener("mousemove", e => showTip(e, `<b>${p.kind === "base" ? label : p.b.backbone + " + " + p.name}</b><br>${PERC_COLS[xi]}: ${p.x}<br>${HALL_COLS[yi]}: ${p.y}`));
      el.addEventListener("mouseleave", hideTip);
    });
  }
  xs.onchange = ys.onchange = draw;
  draw();
  redrawers.push(draw);
})();

// ================= 6. Transfer deltas =================
(function transfer() {
  const root = $("#transfer-chart"), host = $(".chart", root);
  const keys = Object.keys(XFER);
  let cur = "Qwen3.5-9B";
  segmented($(".seg", root), keys, k => draw(k), 1);
  redrawers.push(() => draw(cur));
  function draw(k) {
    cur = k;
    host.innerHTML = "";
    const d = XFER[k];
    const series = [
      [d.prior[0], d.prior[1], "var(--prior)"],
      ["VERVE plain", d.plain, "var(--ours)"],
      ["VERVE opsv", d.opsv, "var(--ours2)"]
    ];
    const deltas = series.map(([, v]) => v.map((x, i) => x - d.base[i]));
    const all = deltas.flat(), lo = Math.min(-10, ...all), hi = Math.max(15, ...all);
    const W = unitsWide(host), H = 300, ml = 36, mr = 8, mt = 14, mb = 50;
    const Y = v => mt + (hi - v) / (hi - lo) * (H - mt - mb);
    const gw = (W - ml - mr) / XFER_COLS.length, bw = gw * 0.22;
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}` }, host);
    const gg = svg("g", { class: "grid" }, s);
    for (let v = Math.ceil(lo / 5) * 5; v <= hi; v += 5) {
      svg("line", { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v) }, gg);
      text(s, ml - 6, Y(v) + 3, (v > 0 ? "+" : "") + v, { "text-anchor": "end", "font-size": 10, fill: "#999" });
    }
    svg("line", { x1: ml, x2: W - mr, y1: Y(0), y2: Y(0), stroke: "#888" }, s);
    XFER_COLS.forEach((c, i) => {
      const gx = ml + i * gw + gw / 2;
      text(s, gx, H - mb + 18, XFER_SHORT[i], { "text-anchor": "middle", "font-size": 10.5, "font-weight": 600 });
      text(s, gx, H - mb + 32, XFER_TAGS[i], { "text-anchor": "middle", "font-size": 9.5, fill: "#999" });
      series.forEach(([name, vals, col], si) => {
        const dv = deltas[si][i], bx = gx + (si - 1) * (bw + 3) - bw / 2;
        const r = svg("rect", { x: bx, width: bw, y: Math.min(Y(0), Y(dv)), height: Math.max(1, Math.abs(Y(dv) - Y(0))), fill: col, rx: 1.5, class: "hoverable" }, s);
        r.addEventListener("mousemove", e => showTip(e, `<b>${k} + ${name}</b><br>${c}: ${vals[i]} (base ${d.base[i]})<br>Δ ${(dv > 0 ? "+" : "") + dv.toFixed(1)}`));
        r.addEventListener("mouseleave", hideTip);
      });
    });
    const leg = root.querySelector(".legend span:first-child");
    leg.innerHTML = `<i class="sw prior"></i>${d.prior[0]}`;
  }
  draw("Qwen3.5-9B");
})();
})();
