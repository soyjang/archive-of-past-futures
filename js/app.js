(function () {
  // Media families: used only for colour and filtering; the coded field is the medium itself
  const FAMS = [
    { id: "image", label: "Stereograph and film", media: ["stereograph", "film"], v: "--era1" },
    { id: "broadcast", label: "Radio and television", media: ["radio", "tv"], v: "--era2" },
    { id: "machines", label: "Teaching machines", media: ["machine"], v: "--era3" },
    { id: "computers", label: "Computers", media: ["computer"], v: "--fam7" },
    { id: "online", label: "Internet", media: ["online"], v: "--fam5" },
    { id: "ai", label: "AI", media: ["ai"], v: "--era4" },
    { id: "immersion", label: "VR and direct transmission", media: ["vr", "brain"], v: "--fam6" }
  ];
  const LAWS = {
    enhance:   { label: "Enhances",   a0: 90,  a1: 180, verb: "enhance" },
    reverse:   { label: "Reverses",   a0: 0,   a1: 90,  verb: "reverse into its opposite" },
    retrieve:  { label: "Retrieves",  a0: 180, a1: 270, verb: "retrieve something older" },
    obsolesce: { label: "Obsolesces", a0: 270, a1: 360, verb: "make obsolete" }
  };
  const LAW_ORDER = ["enhance", "obsolesce", "retrieve", "reverse"];
  const DIMS = {
    scope:    { label: "Scope of change", levels: ["Supplements", "Transforms practice", "Replaces a medium", "Replaces an institution"], get: c => c.ring },
    temporal: { label: "Temporal distance", levels: ["Imminent", "Near", "Distant", "Unstated"], get: c => c.temporal },
    spatial:  { label: "Spatial distance", levels: ["Here", "Elsewhere", "Unspecified"], get: c => c.spatial },
    social:   { label: "Social distance", levels: ["Us", "Others", "Unspecified"], get: c => c.social },
    hyp:      { label: "Hypotheticality", levels: ["Will", "Should", "Could", "Is (depicted)"], get: c => c.hyp }
  };
  function rings() {
    const D = DIMS[state.dim], n = D.levels.length, r0 = 44, r1 = 296, step = (r1 - r0) / n;
    return D.levels.map((label, i) => ({ k: i + 1, label, r0: r0 + i * step, r1: r0 + (i + 1) * step }));
  }
  const levelOf = (c) => DIMS[state.dim].get(c);
  const OUTCOME = { absorbed: "Absorbed into practice", unrealised: "Not realised", open: "Still open" };

  // Documented claims, gathered from primary sources or reputable compilations. Codes are provisional (single coder).
  // verify: wording or original venue still to be checked against the primary source.
  // ---------- data: each case lives in its own file (data/book.json, data/climate.json) ----------
  const SPEAKERS = ["Inventor", "Company", "Policymaker", "Intergovernmental body", "Activist or NGO", "Educator", "Researcher", "Designer", "Writer or artist"];
  const SUCC = { stereograph: "Stereograph", film: "Film", radio: "Radio", tv: "Television", machine: "Teaching machine", computer: "Computer", vr: "Virtual reality", online: "Internet", ai: "AI", brain: "Direct transmission to the brain" };
  const GENRES = { press: "Press or magazine", talk: "Talk or broadcast", book: "Book", paper: "Academic paper", report: "Report", story: "Novel or story", film: "Film or television", image: "Image", design: "Design project", unknown: "Format unknown" };
  const STATUS = ["Existing", "Emerging", "Imagined"];
  const CLAIMS = [];
  const DATA = { book: "data/book.json", climate: "data/climate.json" };
  const META = {};
  // Records use the codebook's labels; turn them into the indices and keys the views use, and warn about any label not in the codebook
  function ingest(data, file) {
    const warn = (id, field, v) => console.warn(`${file} #${id}: “${v}” is not a ${field} in the codebook`);
    const idx = (arr, v, field, id) => { const i = arr.indexOf(v); if (i < 0) warn(id, field, v); return i + 1; };
    const key = (obj, v, field, id) => { const k = Object.keys(obj).find(k => obj[k] === v); if (!k) warn(id, field, v); return k; };
    META.book = { title: data.title, version: data.version, updated: data.updated, coder: data.coder };
    data.speculations.forEach(r => {
      const c = { id: r.id, year: r.year, who: r.who, text: r.text, desc: !!r.description, note: r.note, verify: r.verify, source: r.source,
        laws: r.tetrad, lang: (r.construal || "").toLowerCase(), documented: true, speaker: r.speaker, medium: r.medium, detail: r.medium_wording || r.medium };
      c.ring = idx(DIMS.scope.levels, r.scope, "scope of change", r.id);
      c.temporal = idx(DIMS.temporal.levels, r.horizon, "horizon", r.id); c.when = r.horizon_phrase || "";
      c.spatial = idx(DIMS.spatial.levels, r.spatial, "spatial distance", r.id);
      c.social = idx(DIMS.social.levels, r.social, "social distance", r.id);
      c.hyp = idx(DIMS.hyp.levels, r.hypotheticality, "hypotheticality", r.id);
      c.status = idx(STATUS, r.medium_status, "medium status", r.id);
      c.genre = key(GENRES, r.format, "format", r.id);
      c.succ = key(SUCC, r.medium, "medium", r.id);
      if (!SPEAKERS.includes(r.speaker)) warn(r.id, "speaker", r.speaker);
      c.short = c.who.split(/[,(]/)[0].trim();
      CLAIMS.push(c);
    });
  }

  const $ = (s) => document.querySelector(s);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const famOf = (c) => FAMS.find(f => f.media.includes(c.succ));

  const state = { view: "wheel", dim: "scope", decade: 2030, fams: new Set(), selected: null, gap: null };
  const lawsOf = (c) => c.laws;

  function visibleClaims() {
    return CLAIMS.filter(c => c.year <= state.decade + 9 && (!state.fams.size || state.fams.has(famOf(c).id)));
  }

  // ---------- geometry ----------
  const rad = (a) => a * Math.PI / 180;
  const pt = (r, a) => [r * Math.cos(rad(a)), -r * Math.sin(rad(a))];
  function sector(r0, r1, a0, a1) {
    const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r1} ${r1} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} A${r0} ${r0} 0 0 1 ${x4.toFixed(1)} ${y4.toFixed(1)}Z`;
  }

  // Every speculation is drawn the same way
  // Hollow dots are drawn smaller so their outer edge matches a filled dot of the same size
  function mark(c, x, y, r, cls, style, attrs = "") {
    const rr = cls.includes("hollow") ? r - 1.25 : r - 0.6;
    return `<circle class="${cls}" cx="${x}" cy="${y}" r="${rr}" style="${style}"${attrs}></circle>`;
  }

  // ---------- wheel ----------
  function renderWheel() {
    const claims = visibleClaims();
    const RS = rings();
    const cells = {};
    claims.forEach(c => lawsOf(c).forEach(l => { (cells[`${l}-${levelOf(c)}`] ||= []).push(c); }));
    let s = `<svg viewBox="-345 -345 690 690" role="img" aria-label="Tetrad wheel: claims placed by Tetrad law and speculative distance">
      <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="hatch-line" x1="0" y1="0" x2="0" y2="8"></line></pattern><pattern id="hatch-sel" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hatch-hl" width="8" height="8"></rect><line class="hatch-line hatch-line-sel" x1="0" y1="0" x2="0" y2="8"></line></pattern></defs>`;
    for (const law of LAW_ORDER) {
      const L = LAWS[law];
      for (const R of RS) {
        const key = `${law}-${R.k}`;
        const filled = !!cells[key];
        const hl = filled && state.selected && cells[key].some(c => c.id === state.selected);
        const cls = filled ? `cell filled${hl ? " hl" : ""}` : `cell gap${state.gap === key ? " sel" : ""}`;
        const attrs = filled ? "" : ` tabindex="0" role="button" data-gap="${key}" aria-label="Gap: ${L.label}, ${R.label}. No speculation codes here."`;
        s += `<path class="${cls}" d="${sector(R.r0, R.r1, L.a0, L.a1)}"${attrs}></path>`;
      }
    }
    s += `<circle r="44" fill="var(--panel)" stroke="var(--rule)"></circle>
      <text class="center-label" text-anchor="middle" y="-3">the claim's</text>
      <text class="center-label" text-anchor="middle" y="11">own present</text>`;
    RS.forEach(R => { s += `<text class="ring-label" x="5" y="${-(R.r0 + R.r1) / 2 + 4}">${R.label}</text>`; });
    const corner = { enhance: [-330, -318, "start"], reverse: [330, -318, "end"], retrieve: [-330, 322, "start"], obsolesce: [330, 322, "end"] };
    for (const law of LAW_ORDER) {
      const [x, y, anchor] = corner[law];
      const n = claims.filter(c => lawsOf(c).includes(law)).length;
      s += `<text class="axis-label" x="${x}" y="${y}" text-anchor="${anchor}">${LAWS[law].label}</text>
            <text class="axis-sub" x="${x}" y="${y + 16}" text-anchor="${anchor}">${n} speculation${n === 1 ? "" : "s"}</text>`;
    }
    let ds = "";
    const selPts = [];
    for (const [key, list] of Object.entries(cells)) {
      const [law, ring] = key.split("-");
      const L = LAWS[law], R = RS[+ring - 1];
      list.sort((a, b) => a.year - b.year).forEach((c, i) => {
        const a = L.a0 + (90 * (i + 1)) / (list.length + 1);
        const r = (R.r0 + R.r1) / 2 + (i % 2 ? 9 : -9) * (list.length > 2 ? 1 : 0);
        const [x, y] = pt(r, a);
        const col = `var(${famOf(c).v})`;
        const abstract = c.lang === "abstract";
        const sel = state.selected === c.id ? " sel" : state.selected ? " dim" : "";
        if (state.selected === c.id) selPts.push([+x.toFixed(1), +y.toFixed(1), col]);
        const style = abstract ? `stroke:${col}` : `fill:${col}`;
        ds += mark(c, +x.toFixed(1), +y.toFixed(1), 9, `dot${abstract ? " hollow" : ""}${sel}`, style, ` tabindex="0" role="button" data-id="${c.id}" aria-label="${c.year}, ${GENRES[c.genre]}, ${c.medium}, ${abstract ? "abstract" : "concrete"} language: ${c.text}"`);
      });
    }
    // A selected speculation that spans several Tetrad laws: link its copies through the centre and pulse each one
    if (selPts.length > 1) {
      s += `<g class="span"><circle class="span-ring" r="44"></circle>${selPts.map(([x, y]) => { const d = Math.hypot(x, y); return `<path class="span-line" d="M${(x / d * 44).toFixed(1)} ${(y / d * 44).toFixed(1)} L${x} ${y}"></path>`; }).join("")}</g>`;
    }
    s += ds;
    if (selPts.length) {
      s += selPts.map(([x, y, col]) => `<circle class="halo" cx="${x}" cy="${y}" r="9" style="stroke:${col}"></circle>`).join("");
      if (selPts.length > 1) s += `<text class="span-label" text-anchor="middle" y="62">spans ${selPts.length} laws</text>`;
    }
    s += `</svg>`;
    $("#wheel-wrap").innerHTML = s;
  }




  // ---------- panel ----------
  function gaps() {
    const claims = visibleClaims();
    const out = [];
    for (const law of LAW_ORDER) for (const R of rings()) {
      if (!claims.some(c => levelOf(c) === R.k && lawsOf(c).includes(law))) out.push(`${law}-${R.k}`);
    }
    return out;
  }
  function detailHTML(c) {
    return `        <div><h3>${c.year} · ${c.medium}</h3></div>
        <p class="quote">${c.desc ? `<em>${c.text}</em>` : "“" + c.text + "”"}</p>
        ${c.note ? `<p class="small">${c.note}</p>` : ""}
        <p class="small">— ${c.who}, ${c.year}</p>
        <div><span class="tag">${GENRES[c.genre]}</span>${c.verify ? ` <span class="tag ill">To verify</span>` : ""}</div>
        <dl class="meta">
          <dt>Medium</dt><dd><span class="swatch" style="background:var(${famOf(c).v})"></span> ${c.medium}${c.detail.toLowerCase() !== c.medium.toLowerCase() ? ` <span class="small">(${c.detail.charAt(0).toLowerCase() + c.detail.slice(1)})</span>` : ""}</dd>
          <dt>Status</dt><dd>${STATUS[c.status - 1]}</dd>
          <dt>Format</dt><dd>${GENRES[c.genre]}</dd>
          <dt>Speaker</dt><dd>${c.speaker}</dd>
          <dt>Tetrad</dt><dd>${c.laws.map(l => `<span class="tag">${LAWS[l].label}</span>`).join("")}</dd>
          <dt>Scope</dt><dd>${DIMS.scope.levels[c.ring - 1]}</dd>
          <dt>Temporal</dt><dd>${DIMS.temporal.levels[c.temporal - 1]}${c.when ? ` (“${c.when}”)` : ""}</dd>
          <dt>Spatial</dt><dd>${DIMS.spatial.levels[c.spatial - 1]}</dd>
          <dt>Social</dt><dd>${DIMS.social.levels[c.social - 1]}</dd>
          <dt>Hypothetical</dt><dd>${DIMS.hyp.levels[c.hyp - 1]}</dd>
          <dt>Construal</dt><dd>${c.lang === "abstract" ? "Abstract language" : "Concrete language"}</dd>
          <dt>Source</dt><dd>${c.source || "N/A"}${c.verify ? `<br><em>To verify:</em> ${c.verify}` : ""}</dd>
        </dl>`;
  }
  // McLuhan's Tetrad as a figure: four laws around the medium, placed as on the wheel
  function tetradSVG(claims) {
    const h = 58, n = (l) => claims.filter(c => c.laws.includes(l)).length;
    const dia = (cx, cy) => `M${cx} ${cy - h} L${cx + h} ${cy} L${cx} ${cy + h} L${cx - h} ${cy}Z`;
    const pos = { enhance: [-h, -h], reverse: [h, -h], retrieve: [-h, h], obsolesce: [h, h] };
    let g = `<path class="tet-mid" d="${dia(0, 0)}"></path><text class="tet-mid-n" text-anchor="middle" y="1">${claims.length}</text><text class="tet-l" text-anchor="middle" y="15" style="font-size:10px">Speculations</text>`;
    for (const law of LAW_ORDER) {
      const [x, y] = pos[law];
      g += `<path class="tet-cell" d="${dia(x, y)}"></path><text class="tet-n" x="${x}" y="${y + 2}" text-anchor="middle">${n(law)}</text><text class="tet-l" x="${x}" y="${y + 16}" text-anchor="middle">${LAWS[law].label}</text>`;
    }
    return `<svg class="tetrad" viewBox="${-2 * h - 2} ${-2 * h - 2} ${4 * h + 4} ${4 * h + 4}" role="img" aria-label="Tetrad: ${LAW_ORDER.map(l => `${LAWS[l].label} ${n(l)}`).join(", ")} of ${claims.length} speculations">${g}</svg>`;
  }
  // Descriptive counts the wheel cannot show: media, stated horizon, speaker
  function overviewStats(claims) {
    const N = claims.length || 1;
    const fam = FAMS.map(f => [f, claims.filter(c => famOf(c).id === f.id).length]).filter(x => x[1]);
    const media = `<section class="ov-block"><h3>Media</h3>
      <div class="hbar">${fam.map(([f, v]) => `<span class="hseg" style="flex:${v};background:var(${f.v})" title="${f.label}: ${v}"></span>`).join("")}</div>
      <ul class="ov-key">${fam.map(([f, v]) => `<li><span class="swatch" style="background:var(${f.v})"></span>${f.label}<b>${v}</b></li>`).join("")}</ul></section>`;
    const st = STATUS.map((l, k) => [l, k + 1, claims.filter(c => c.status === k + 1).length]);
    const status = `<section class="ov-block"><h3>Medium status</h3>
      <div class="hbar">${st.map(([l, k, v]) => v ? `<span class="hseg s${k}" style="flex:${v}" title="${l}: ${v}"></span>` : "").join("")}</div>
      <ul class="ov-key">${st.map(([l, k, v]) => `<li><span class="hkey s${k}"></span>${l}<b>${v}</b></li>`).join("")}</ul></section>`;
    const hz = DIMS.temporal.levels.map((l, k) => [l, k + 1, claims.filter(c => c.temporal === k + 1).length]);
    const horizon = `<section class="ov-block"><h3>Stated horizon</h3>
      <div class="hbar">${hz.map(([l, k, v]) => v ? `<span class="hseg h${k}" style="flex:${v}" title="${l}: ${v}"></span>` : "").join("")}</div>
      <ul class="ov-key">${hz.map(([l, k, v]) => `<li><span class="hkey h${k}"></span>${l}<b>${v}</b></li>`).join("")}</ul></section>`;
    const sp = SPEAKERS.map(l => [l, claims.filter(c => c.speaker === l).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    const mx = Math.max(1, ...sp.map(x => x[1]));
    const speaker = `<section class="ov-block"><h3>Speaker</h3>
      <div class="bars sm">${sp.map(([l, v]) => `<div class="bar"><span>${l}</span><span class="track"><span class="fill" style="display:block;width:${(v / mx) * 100}%"></span></span><span class="n">${v}</span></div>`).join("")}</div></section>`;
    return (state.fams.size ? "" : media) + status + horizon + speaker;
  }
  function gapNote() {
    const [law, ring] = state.gap.split("-"), L = LAWS[law], R = rings()[+ring - 1];
    const near = CLAIMS.filter(c => c.laws.includes(law)).length;
    return `<div class="gapnote">
        <div class="gapnote-head"><h3>Empty cell</h3></div>
        <h2>${L.label} · ${R.label}</h2>
        <p style="margin:0">No speculation in the archive imagines a medium that would ${L.verb} ${state.dim === "scope" ? `at the scale of “${R.label.toLowerCase()}”` : +ring === 4 ? "without stating a horizon" : `on ${R.label === "Imminent" ? "an imminent" : `a ${R.label.toLowerCase()}`} horizon`}. ${near} speculation${near === 1 ? "" : "s"} ${near === 1 ? "codes" : "code"} for ${L.label.toLowerCase()} ${state.dim === "scope" ? "at other scales" : "on other horizons"}.</p>
        <p class="small">An empty cell describes the archive; it is not an instruction for what to design, and it may reflect what the archive happened to collect.</p>
      </div>`;
  }
  // Depth 1 is the overview; selecting a dot or an empty cell flips the card to depth 2
  let lastFace = "front";
  function renderPanel() {
    const p = $("#panel");
    const face = state.selected ? "c:" + state.selected : state.gap ? "g:" + state.gap : "front";
    if (face === "front") {
      p.classList.remove("depth2");
      renderPanelBody();
    } else {
      p.classList.add("depth2");
      const body = state.selected ? `<div class="gapnote">${detailHTML(CLAIMS.find(x => x.id === state.selected))}</div>` : gapNote();
      p.innerHTML = `<button class="flip-back" type="button" aria-label="Back to overview">← Overview</button>${body}`;
      p.querySelector(".flip-back").addEventListener("click", () => { state.selected = null; state.gap = null; render(); });
    }
    if (face !== lastFace && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      p.classList.remove("flipping"); void p.offsetWidth; p.classList.add("flipping");
    }
    lastFace = face;
  }
  function renderPanelBody() {
    const p = $("#panel");
    const claims = visibleClaims();
    const counts = LAW_ORDER.map(l => [l, claims.filter(c => lawsOf(c).includes(l)).length]);
    const max = Math.max(1, ...counts.map(x => x[1]));
    const g = gaps();
    p.innerHTML = `<div><h3>Overview${state.fams.size ? ` · ${FAMS.find(f => state.fams.has(f.id)).label}` : ""}</h3></div>
      ${tetradSVG(claims)}
      ${overviewStats(claims)}`;
  }

  function legend() {
    $("#legend").innerHTML = `<span><i class="lg-dot"></i>Concrete language</span><span><i class="lg-dot hollow"></i>Abstract language</span><span><i class="lg-hatch"></i>Empty: no speculation codes for this</span>`;
  }

  function render() {
    legend();
    $("#decade-out").textContent = state.decade >= 2030 ? "2039" : `${state.decade + 9}`;
    renderWheel();
    renderPanel();
  }

  function select(id) { state.selected = state.selected === id ? null : id; state.gap = null; render(); }

  // ---------- fiction modal + multiplane sketch ----------
  let raf = null, lastFocus = null;
  function showFiction(f, eyebrow) {
    $("#m-title").textContent = f.title;
    $("#m-eyebrow").textContent = eyebrow;
    $("#m-world").textContent = f.world;
    $("#m-beats").innerHTML = f.beats.map(b => `<li>${b}</li>`).join("");
    $("#m-note").textContent = f.note;
    lastFocus = document.activeElement;
    $("#overlay").hidden = false;
    $("#m-close").focus();
    animate(f.scene);
  }
  function closeFiction() {
    $("#overlay").hidden = true;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function animate(scene) {
    const cv = $("#stage"), ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    const col = { paper: css("--paper"), panel: css("--panel"), ink: css("--ink"), muted: css("--muted"), rule: css("--rule"), accent: css("--accent"), soft: css("--accent-soft"), e1: css("--era1"), e3: css("--era3"), e4: css("--era4") };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); };
    function figure(x, y, s, headset, tint) {
      ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(x, y - 52 * s, 16 * s, 0, Math.PI * 2); ctx.fill();
      rr(x - 15 * s, y - 34 * s, 30 * s, 44 * s, 10 * s);
      if (headset) { ctx.fillStyle = col.ink; rr(x - 17 * s, y - 60 * s, 34 * s, 12 * s, 4 * s); }
    }
    function frame(t) {
      const cam = reduce ? 0 : Math.sin(t / 2400) * 60;
      const push = reduce ? 1 : 1 + 0.04 * Math.sin(t / 3100);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, col.soft); g.addColorStop(1, col.panel);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.setTransform(push, 0, 0, push, (1 - push) * W / 2, (1 - push) * H / 2);
      // PLANE 5: distant skyline
      ctx.save(); ctx.translate(cam * 0.15, 0); ctx.fillStyle = col.rule;
      for (let i = -2; i < 16; i++) { const h = 60 + ((i * 37) % 90); rr(i * 95, H * 0.55 - h, 70, h + 40, 4); }
      if (scene === "pile") { ctx.fillStyle = col.muted; rr(W * 0.66, H * 0.55 - 150, 190, 190, 6); ctx.fillStyle = col.soft; for (let k = 0; k < 6; k++) rr(W * 0.66 + 20 + (k % 3) * 55, H * 0.55 - 130 + Math.floor(k / 3) * 60, 34, 40, 3); }
      ctx.restore();
      // ground
      ctx.fillStyle = col.paper; ctx.fillRect(-200, H * 0.62, W + 400, H);
      // PLANE 3–4: midground figures
      ctx.save(); ctx.translate(cam * 0.45, 0);
      if (scene === "pile") {
        for (let i = 0; i < 5; i++) figure(120 + i * 170, H * 0.74, 0.9, true, col.e3);
        ctx.fillStyle = col.e1; ctx.beginPath(); ctx.arc(W * 0.5, H * 0.8, 70, Math.PI, 0); ctx.fill();
      } else if (scene === "stereo") {
        figure(W * 0.28, H * 0.78, 1.1, false, col.e1); ctx.fillStyle = col.ink; rr(W * 0.28 - 20, H * 0.78 - 64, 40, 14, 3);
        figure(W * 0.68, H * 0.78, 1.1, true, col.e4);
        ctx.strokeStyle = col.accent; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(W * 0.48, H * 0.3); ctx.lineTo(W * 0.48, H * 0.95); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col.muted; ctx.font = "600 26px " + getComputedStyle(document.body).fontFamily; ctx.fillText("1906", W * 0.2, H * 0.32); ctx.fillText("2026", W * 0.62, H * 0.32);
      } else {
        for (let i = 0; i < 4; i++) figure(180 + i * 230, H * 0.76, 1, i % 2 === 0, i % 2 ? col.e1 : col.e3);
      }
      ctx.restore();
      // PLANE 1: foreground, moves most
      ctx.save(); ctx.translate(cam * 1.1, 0);
      if (scene === "pile") {
        for (let k = 0; k < 14; k++) { ctx.fillStyle = k % 2 ? col.ink : col.muted; rr(-40 + (k % 7) * 52 + Math.floor(k / 7) * 26, H - 70 - Math.floor(k / 7) * 34, 60, 28, 8); }
      } else if (scene === "stereo") {
        ctx.fillStyle = col.e1; rr(W * 0.05, H - 90, 170, 80, 6); ctx.fillStyle = col.panel; rr(W * 0.05 + 18, H - 74, 60, 40, 4); rr(W * 0.05 + 92, H - 74, 60, 40, 4);
      } else {
        ctx.fillStyle = col.muted; rr(-30, H - 60, 260, 70, 10); rr(W - 200, H - 80, 260, 90, 10);
      }
      ctx.restore();
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    if (raf) cancelAnimationFrame(raf);
    frame(0);
  }

  // ---------- controls ----------
  function renderChips() {
    $("#eras").innerHTML = `<button type="button" class="chip all" aria-pressed="${!state.fams.size}" data-fam="all">All media</button>` +
      FAMS.map(f => `<button type="button" class="chip" aria-pressed="${state.fams.has(f.id)}" data-fam="${f.id}" style="--c:var(${f.v})"><span class="swatch" style="background:var(${f.v})"></span>${f.label}</button>`).join("");
  }
  renderChips();
  $("#eras").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-fam]"); if (!b) return;
    const id = b.dataset.fam;
    if (id === "all") state.fams.clear();
    else if (state.fams.has(id)) state.fams.clear(); else { state.fams.clear(); state.fams.add(id); }
    state.selected = null; state.gap = null;
    renderChips(); render();
  });
  $("#decade").addEventListener("input", (e) => { state.decade = +e.target.value; render(); });
  let timer = null;
  $("#play").addEventListener("click", () => {
    if (timer) { clearInterval(timer); timer = null; $("#play").textContent = "Play decades"; return; }
    state.decade = 1900; $("#decade").value = 1900; render();
    $("#play").textContent = "Stop";
    timer = setInterval(() => {
      if (state.decade >= 2030) { clearInterval(timer); timer = null; $("#play").textContent = "Play decades"; return; }
      state.decade += 10; $("#decade").value = state.decade; render();
    }, 900);
  });

  function activate(target) {
    const gap = target.closest("[data-gap]");
    if (gap) { state.gap = state.gap === gap.dataset.gap ? null : gap.dataset.gap; state.selected = null; render(); return true; }
    const d = target.closest("[data-id]");
    if (d) { select(+d.dataset.id); return true; }
    return false;
  }
  document.querySelector(".main").addEventListener("click", (e) => activate(e.target));
  document.querySelector(".main").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && activate(e.target)) e.preventDefault();
  });
  $("#m-close").addEventListener("click", closeFiction);
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") closeFiction(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#overlay").hidden) closeFiction(); });

  // ---------- sources page ----------
  // ---------- sources page: timeline + scrolling list in one fixed workspace ----------
  const SORTED = () => CLAIMS.slice().sort((a, b) => a.year - b.year || a.id - b.id);
  const FULL = [1900, 2030];
  const src = { sel: null, range: FULL.slice(), q: "" };
  const matchQ = (c) => !src.q || [c.text, c.who, c.medium, c.detail, c.note || "", c.source, GENRES[c.genre], String(c.year)].join(" ").toLowerCase().includes(src.q);
  const shownSrc = () => SORTED().filter(c => c.year >= src.range[0] && c.year <= src.range[1] && matchQ(c));
  const entryHTML = (c) => `<div class="yr"><i style="background:var(${famOf(c).v})"></i>${c.year}</div>
        <div class="body">
          <p class="q">${c.desc ? `<em>${c.text}</em>` : `“${c.text}”`}</p>
          ${c.note ? `<p class="meta">${c.note}</p>` : ""}
          <p class="meta">${c.who} · ${c.medium} · ${GENRES[c.genre]}</p>
          <p class="cite">${c.source}${c.verify ? ` <span class="tag ill">To verify</span> ${c.verify}` : ""}</p>
        </div>`;
  const SW = 1100, SX0 = 24, SX1 = 1076;
  const sX = (y) => SX0 + (y - src.range[0]) / Math.max(1, src.range[1] - src.range[0]) * (SX1 - SX0);
  function renderStrip() {
    const list = shownSrc(), n = list.length;
    const r = n > 80 ? 5 : n > 40 ? 7 : 9, step = r * 2 + 4, base = 260, cols = [];
    let dots = "", top = base - 40;
    list.forEach(c => {
      const x = sX(c.year); let k = 0;
      while (cols.some(([cx, ck]) => ck === k && Math.abs(cx - x) < r * 2 + 3)) k++;
      cols.push([x, k]);
      const y = base - k * step; top = Math.min(top, y - r - 10);
      const col = `var(${famOf(c).v})`, sel = src.sel === c.id;
      dots += `<circle class="dot${sel ? " sel" : src.sel ? " dim" : ""}" cx="${x.toFixed(1)}" cy="${y}" r="${r}" style="fill:${col}" tabindex="0" role="button" data-jump="${c.id}" aria-label="${c.year}, ${c.short}: ${c.text}"></circle>`;
      if (sel) dots += `<circle class="halo" cx="${x.toFixed(1)}" cy="${y}" r="${r}" style="stroke:${col}"></circle>`;
    });
    const span = src.range[1] - src.range[0], tick = span > 80 ? 20 : span > 30 ? 10 : span > 12 ? 5 : 1;
    let axis = `<line class="tl-axis" x1="${SX0}" x2="${SX1}" y1="${base + 18}" y2="${base + 18}"></line>`;
    for (let t = Math.ceil(src.range[0] / tick) * tick; t <= src.range[1]; t += tick) axis += `<line class="tl-axis" x1="${sX(t)}" x2="${sX(t)}" y1="${base + 14}" y2="${base + 22}"></line><text class="tl-tick" x="${sX(t)}" y="${base + 38}" text-anchor="middle">${t}</text>`;
    $("#strip-svg").innerHTML = `<svg viewBox="0 ${top} ${SW} ${base + 46 - top}" role="img" aria-label="Speculations by year">${axis}${dots}</svg>`;
    $("#src-count").innerHTML = `${n} of ${CLAIMS.length} speculations${src.q ? ` <button type="button" class="linkbtn" id="src-reset">Clear search</button>` : ""}`;
  }
  function renderSrcList() {
    const list = shownSrc();
    $("#srclist").innerHTML = list.length ? list.map(c => `<li id="src-${c.id}" class="${src.sel === c.id ? "sel" : ""}" data-pick="${c.id}">${entryHTML(c)}</li>`).join("") : `<li class="none">No speculations match.</li>`;
  }
  function scrollPaneTo(id) {
    const li = document.getElementById(`src-${id}`), pane = $("#srclist");
    if (!li) return;
    const delta = li.getBoundingClientRect().top - pane.getBoundingClientRect().top - 6;
    pane.scrollTo({ top: pane.scrollTop + delta, behavior: Math.abs(delta) > 600 || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function srcSelect(id, scroll = true) { src.sel = id; renderStrip(); renderSrcList(); if (scroll) scrollPaneTo(id); }
  function srcStep(d) {
    const list = shownSrc(); if (!list.length) return;
    const i = list.findIndex(c => c.id === src.sel);
    srcSelect(list[i < 0 ? 0 : Math.max(0, Math.min(list.length - 1, i + d))].id);
  }
  function renderSources() {
    if (src.sel && !shownSrc().some(c => c.id === src.sel)) src.sel = null;
    $("#src-legend").innerHTML = FAMS.map(f => `<span><span class="swatch" style="background:var(${f.v})"></span>${f.label}</span>`).join("");
    renderStrip(); renderSrcList();
  }
  // tooltip
  function showTip(el) {
    const c = CLAIMS.find(k => k.id === +(el.dataset.jump || el.dataset.id)), t = $("#tip");
    const words = c.text.length > 90 ? c.text.slice(0, 88).replace(/\s+\S*$/, "") + "…" : c.text;
    t.innerHTML = `<strong>${c.year} · ${c.short}</strong><span>${c.desc ? `<em>${words}</em>` : `“${words}”`}</span>`;
    t.hidden = false;
    const rc = el.getBoundingClientRect(), w = t.offsetWidth;
    t.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, rc.left + rc.width / 2 - w / 2)) + window.scrollX}px`;
    t.style.top = `${rc.top + window.scrollY - t.offsetHeight - 10}px`;
  }
  const hideTip = () => { $("#tip").hidden = true; };
  const wheel = $("#wheel-wrap");
  // Hovering a speculation that codes for several laws previews the lines that link its copies
  function spanPreview(id) {
    clearPreview();
    const svg = wheel.querySelector("svg"); if (!svg || +id === state.selected) return;
    const pts = [...svg.querySelectorAll(`circle.dot[data-id="${id}"]`)].map(d => [+d.getAttribute("cx"), +d.getAttribute("cy")]);
    if (pts.length < 2) return;
    const ns = "http://www.w3.org/2000/svg", g = document.createElementNS(ns, "g");
    g.setAttribute("class", "span preview");
    g.innerHTML = `<circle class="span-ring" r="44"></circle>` + pts.map(([x, y]) => { const d = Math.hypot(x, y); return `<path class="span-line" d="M${(x / d * 44).toFixed(1)} ${(y / d * 44).toFixed(1)} L${x} ${y}"></path>`; }).join("");
    svg.insertBefore(g, svg.querySelector("circle.dot"));
  }
  function clearPreview() { wheel.querySelectorAll(".span.preview").forEach(g => g.remove()); }
  wheel.addEventListener("mouseover", (e) => { const d = e.target.closest("circle.dot[data-id]"); if (d) { showTip(d); spanPreview(d.dataset.id); } });
  wheel.addEventListener("mouseout", (e) => { if (e.target.closest("circle.dot[data-id]")) { hideTip(); clearPreview(); } });
  wheel.addEventListener("focusin", (e) => { const d = e.target.closest("circle.dot[data-id]"); if (d) showTip(d); });
  wheel.addEventListener("focusout", hideTip);
  wheel.addEventListener("click", hideTip, true);
  const strip = $("#strip-svg");
  strip.addEventListener("mouseover", (e) => { const d = e.target.closest("[data-jump]"); if (d) showTip(d); });
  strip.addEventListener("mouseout", (e) => { if (e.target.closest("[data-jump]")) hideTip(); });
  strip.addEventListener("focusin", (e) => { const d = e.target.closest("[data-jump]"); if (d) showTip(d); });
  strip.addEventListener("focusout", hideTip);
  strip.addEventListener("keydown", (e) => { const d = e.target.closest("[data-jump]"); if (d && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); srcSelect(+d.dataset.jump); } });
  strip.addEventListener("click", (e) => { const d = e.target.closest("[data-jump]"); if (d) { hideTip(); srcSelect(+d.dataset.jump); } });
  $("#src-count").addEventListener("click", (e) => { if (e.target.id === "src-reset") { src.range = FULL.slice(); src.q = ""; $("#src-q").value = ""; renderSources(); } });
  $("#src-q").addEventListener("input", (e) => { src.q = e.target.value.trim().toLowerCase(); renderSources(); $("#srclist").scrollTop = 0; });
  $("#srclist").addEventListener("click", (e) => { const li = e.target.closest("[data-pick]"); if (li && !window.getSelection().toString()) srcSelect(+li.dataset.pick, false); });
  document.addEventListener("keydown", (e) => {
    if ($("#pg-bookcorpus").hidden || !$("#overlay").hidden || e.target.closest("input, select, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown" && e.target.closest("#srclist")) { e.preventDefault(); srcStep(1); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp" && e.target.closest("#srclist")) { e.preventDefault(); srcStep(-1); }
  });

  const cite = (id) => { const c = CLAIMS.find(x => x.id === id); return c ? `${c.short} ${c.year}` : ""; };
  // ---------- counterfactual obsolescence page ----------
  // Rule: eligible = scope at least "replaces the medium" (any format, any mood).
  // One per medium: the speculation with the most unimagined Tetrad laws; ties go to the earliest.
  const missingOf = (c) => LAW_ORDER.filter(l => !c.laws.includes(l));
  function selectCF() {
    const by = {};
    CLAIMS.filter(c => c.ring >= 3).forEach(c => (by[c.succ] ||= []).push(c));
    return Object.keys(SUCC).filter(k => by[k]).map(k => by[k].slice().sort((a, b) => missingOf(b).length - missingOf(a).length || a.year - b.year || a.id - b.id)[0]).sort((a, b) => a.year - b.year);
  }
  // Near and far versions, written for each selected speculation: one entry per unimagined law
  const CFTEXT = {
    5: { near: { label: "Near · one classroom, 1935", world: "1935. Ten years after Edison’s prediction, textbooks are as obsolete as the horse and carriage. Every lesson in Room 4 is a film.", beats: ["The teacher draws the blinds and threads a reel. No pupil holds anything.", "A pupil asks to see yesterday’s film again. The projector is booked until Thursday.", "The teacher writes a summary on the blackboard and hands out mimeographed notes.", "A pupil ties the term’s notes together with string and takes them home."], enhance: "the vivid example: pupils see a volcano erupt rather than read about it", retrieve: "the lecture: the teacher narrating over the film", reverse: "instant access flips into scheduling: one screening, booked in advance" },
         far: { label: "Far · what schooling became", world: "Film replaced the textbook. By 1960, to read means to watch, and a library is a film archive.", beats: ["Libraries are rebuilt as viewing rooms with numbered seats.", "Literacy is tested by recall: pupils can quote a film but cannot annotate it.", "A market grows for printed ‘film notes’ that summarise each reel.", "The film notes are bound, indexed and assigned: the textbook, under another name."], enhance: "a shared visual culture across the nation’s schools", retrieve: "memorisation and recitation", reverse: "abundance produces a new scarcity: the annotatable page" } },
    20: { near: { label: "Near · one home, 2157", world: "May 2157. Margie’s mechanical teacher works perfectly: it adjusts to her exact level every day.", beats: ["The teacher slows its geography to Margie’s pace; she scores well, alone.", "Tommy brings the real book over; they read the same page at the same time.", "The teacher logs the lost hour and lowers her level.", "Margie and Tommy keep reading anyway, each correcting the other."], enhance: "perfect pacing: each child taught exactly at her level" },
          far: { label: "Far · a world of private schooling", world: "Every child in the world learns alone, at home, at exactly the right pace.", beats: ["There is no word for classmate.", "Children meet only through screens, and only to play.", "A black market grows in printed books, the only things two children can read together.", "Reading together becomes an act of friendship, then of protest."], enhance: "the end of being left behind: no child is ever too slow or too fast for the class" } },
    21: { near: { label: "Near · one school, 1965", world: "Bradbury’s world has arrived: books are banned, and the parlour walls have moved into the classroom.", beats: ["Three walls of the classroom are screens; the lesson surrounds the pupils.", "A pupil asks a question; the wall answers with a family drama.", "The teacher, without books, tells the class a story from memory.", "The pupils repeat it to each other on the way home."], enhance: "immersion: the lesson fills the room", retrieve: "oral storytelling: the memorised book, as among the novel’s book people" },
          far: { label: "Far · a society of walls", world: "A generation has grown up with wall television and no books.", beats: ["Families talk with the characters on their walls more than with each other.", "History is what the walls have shown.", "Outside the cities, people memorise books, one each.", "A child asks to hear a book, the way her grandmother asks for a song."], enhance: "company: no one is ever without voices", retrieve: "the bard: whole books carried in memory" } },
    12: { near: { label: "Near · one house, 1995", world: "1995. Schools have gone. A ten-year-old learns at home with a personal computer while her parents are at work.", beats: ["She programs a turtle to draw a spiral, then a flower.", "Neighbourhood children start gathering at the one house with the fastest machine.", "A parent sets a time for the gatherings and stays to supervise.", "The gathering gets a timetable, a grown-up and a name: the computer club."], enhance: "learning by making: a child’s own projects, at her own pace", retrieve: "the school, reinvented as a club", reverse: "learning anywhere flips into learning where the machines are" },
          far: { label: "Far · learning where the machines are", world: "Schools are gone; learning happens wherever a computer is.", beats: ["Maps of learning follow maps of ownership.", "Public libraries become computer halls with waiting lists.", "Districts without machines lose a generation of learners.", "Campaigners demand a public building where any child can learn: a school."], enhance: "self-directed learning, for those who own a machine", retrieve: "the public library as the people’s university", reverse: "liberation from the institution flips into dependence on ownership" } },
    23: { near: { label: "Near · one classroom, 2030", world: "The Primer exists: every child receives an illustrated book that teaches her through stories about her own life.", beats: ["In class, thirty children read thirty different stories.", "The teacher cannot discuss a book no one else has read.", "The class becomes a quiet room of private tales.", "Two girls swap Primers for an afternoon, to see each other’s stories."], obsolesce: "the shared class text: the book everyone reads together", reverse: "a book written for one child flips into a book no one else can share" },
          far: { label: "Far · a generation raised by books", world: "A generation has been raised by Primers, each shaped by a story only its reader knows.", beats: ["Adults recognise each other by the tales their Primers told them.", "Those who could not afford a Primer were raised by people.", "Primer children seek out the remote actors who voiced their books.", "The actors, not the books, turn out to be what they remember."], obsolesce: "the parent and teacher as the voice of stories", reverse: "the perfectly personal book flips into a world without common stories" } },
    29: { near: { label: "Near · one afternoon, 2040", world: "Skills can be downloaded. A fourteen-year-old learns French in eleven seconds.", beats: ["She speaks French fluently, and has nothing to say in it.", "Her grandmother shows her a French novel she read slowly at school.", "The girl finds she can read every word and understand nothing.", "They read it together, a page an evening."], retrieve: "the slow read: understanding as time spent", reverse: "instant knowledge flips into knowledge without experience" },
          far: { label: "Far · after learning", world: "Nothing has to be learned any more; everything can be loaded.", beats: ["Schools close; download centres open.", "Everyone knows the same things in the same way.", "A taste grows for doing things badly, by hand, slowly.", "Apprenticeships return, as a luxury of the patient."], retrieve: "apprenticeship: learning by doing beside someone", reverse: "universal knowledge flips into sameness" } },
    14: { near: { label: "Near · one Tuesday, 2062", world: "2062. Thrun’s forecast has come true: ten institutions deliver all the world’s higher education.", beats: ["One seminar, forty thousand students, one professor’s face on every screen.", "A student waits nine days in a queue for five minutes of office hours.", "Students in one town start meeting in the shell of their old campus library.", "They hire a retired lecturer to talk with them. The campus is back, without a university."], enhance: "access: the best lecture, anywhere, for free", retrieve: "the study circle, meeting in the old campus library", reverse: "access for all flips into nine days in a queue for five minutes of attention" },
          far: { label: "Far · ten universities for the world", world: "Ten institutions teach the world; every graduate shares the same ten syllabi.", beats: ["National universities become examination centres.", "Scholarship converges on ten reading lists.", "Local knowledge survives in unaccredited reading groups.", "The groups begin to issue their own certificates."], enhance: "a single global standard of teaching", retrieve: "the medieval university: scholars gathering around a few masters", reverse: "global reach flips into a monoculture of knowledge" } }
  };
  const cfState = {};
  function renderCF() {
    const sel = selectCF();
    const none = Object.keys(SUCC).filter(k => !sel.some(c => c.succ === k));
    $("#cf-rule").innerHTML = `<strong>Selection rule.</strong> Eligible: every speculation, in any format, whose scope of change is at least “replaces the medium”. Grouped by medium; within each, the speculation with the most unimagined Tetrad laws is taken, and ties go to the earliest. ${sel.length} media have an eligible speculation. None yet for: ${none.map(k => SUCC[k].toLowerCase()).join(", ")}.`;
    $("#cf-cards").innerHTML = sel.map(c => {
      const missing = missingOf(c), d = cfState[c.id] || "near", T = CFTEXT[c.id], v = T ? T[d] : null;
      const claim = c.desc ? `<p class="quote"><em>${c.text}</em></p>` : `<p class="quote">“${c.text}”</p>`;
      return `<article class="cfcard">
        ${claim}<p class="small">— ${c.who}, ${c.year} · ${c.medium === "AI" ? "AI" : c.medium.toLowerCase()}</p>
        <dl class="cf-tet"><dt>Promised</dt><dd>${c.laws.map(l => `<span class="tag">${LAWS[l].label}</span>`).join("")}</dd>
          <dt>To imagine</dt><dd>${missing.map(l => `<span class="tag ill">${LAWS[l].label}</span>`).join("")}</dd></dl>
        ${v ? `<div class="seg" role="group" aria-label="Distance"><button type="button" data-cf="${c.id}" data-d="near" aria-pressed="${d === "near"}">Near, concrete</button><button type="button" data-cf="${c.id}" data-d="far" aria-pressed="${d === "far"}">Far, abstract</button></div>
        <div class="cf-body"><p class="cf-label">${v.label}</p><p>${v.world}</p>
          <dl class="cf-tet">${missing.map(l => `<dt>${LAWS[l].label}</dt><dd>${v[l] || "<em>to write</em>"}</dd>`).join("")}</dl></div>
        <button type="button" class="linkbtn" data-open="${c.id}">Open storyboard →</button>` : `<p class="small"><em>Near and far versions to write.</em></p>`}
      </article>`;
    }).join("");
  }
  $("#cf-cards").addEventListener("click", (e) => {
    const t = e.target.closest("[data-cf]");
    if (t) { cfState[+t.dataset.cf] = t.dataset.d; renderCF(); return; }
    const o = e.target.closest("[data-open]");
    if (o) {
      const c = CLAIMS.find(k => k.id === +o.dataset.open), v = CFTEXT[c.id][cfState[c.id] || "near"];
      showFiction({ title: `${c.short} was right`, world: v.world, beats: v.beats, note: `${missingOf(c).map(l => `${LAWS[l].label}: ${v[l] || "to write"}`).join(". ")}. Watch for remediation: where does something book-like return?`, scene: "generic" }, `Counterfactual obsolescence · ${v.label}`);
    }
  });

  // ---------- pages ----------
  // ---------- corpus: counts by format and by period, from the data ----------
  function renderCorpus() {
    const C = CLAIMS, row = (l, n) => `<tr><th>${l}</th><td>${n}</td></tr>`;
    const fm = Object.entries(GENRES).map(([k, l]) => [l, C.filter(c => c.genre === k).length]).filter(x => x[1]);
    const per = [["1900–1959", c => c.year < 1960], ["1960–1999", c => c.year >= 1960 && c.year < 2000], ["2000 on", c => c.year >= 2000]].map(([l, f]) => [l, C.filter(f).length]);
    $("#corpus-counts").innerHTML = `<div class="cases" style="align-items:start"><table class="sig"><thead><tr><th>Format</th><th>n</th></tr></thead><tbody>${fm.map(x => row(...x)).join("")}</tbody></table>
      <table class="sig"><thead><tr><th>Period</th><th>n</th></tr></thead><tbody>${per.map(x => row(...x)).join("")}${row("Total", C.length)}</tbody></table></div>`;
  }
  // ---------- readings ----------
  function renderReadings() {
    const C = CLAIMS, cnt = (a, f) => a.filter(f).length;
    const abs = c => c.lang === "abstract", rr = c => c.laws.includes("retrieve") || c.laws.includes("reverse"), multi = c => c.laws.length > 1;
    const byStatus = STATUS.map((l, i) => [l, C.filter(c => c.status === i + 1)]);
    const bySpace = DIMS.spatial.levels.map((l, i) => [l, C.filter(c => c.spatial === i + 1)]).filter(x => x[1].length);
    const byPeriod = [["Before 1960", c => c.year < 1960], ["1960–1999", c => c.year >= 1960 && c.year < 2000], ["2000 on", c => c.year >= 2000]].map(([l, f]) => [l, C.filter(f)]);
    const ex = byStatus[0][1], im = byStatus[2][1], world = C.filter(c => c.spatial === 3), placed = C.filter(c => c.spatial !== 3);
    const early = byPeriod[0][1], late = byPeriod[2][1];
    const writers = C.filter(c => c.speaker === "Writer or artist");
    const R = C.filter(c => c.laws.includes("retrieve")), V = C.filter(c => c.laws.includes("reverse"));
    // rows of 100% bars: segs = [[label, filter, cls]]
    const fig = (groups, segs) => `<div class="rd-fig">${groups.map(([g, a]) => `<div class="rd-row"><span class="rd-g">${g}</span><span class="hbar">${segs.map(([l, f, k]) => { const v = cnt(a, f); return v ? `<span class="hseg ${k}" style="flex:${v}" title="${l}: ${v}"></span>` : ""; }).join("")}</span><span class="rd-n">${segs.map(([l, f]) => cnt(a, f)).join(" · ")}</span></div>`).join("")}
      <div class="rd-key">${segs.map(([l, , k]) => `<span><i class="hkey ${k}"></i>${l}</span>`).join("")}</div></div>`;
    const conc = [["Concrete", c => !abs(c), "s1"], ["Abstract", abs, "s3"]];
    const items = [
      { t: "Construal follows the medium’s existence, not its horizon",
        p: `Speculations about an existing medium are mostly abstract (${cnt(ex, abs)} of ${ex.length}); speculations that imagine a medium are almost all concrete (${cnt(im, c => !abs(c))} of ${im.length}). Construal-level theory predicts that distant futures are construed abstractly (Trope &amp; Liberman 2010). Here the most distant media are described most concretely: those promoting a medium that exists promise outcomes; those inventing one have to show it working. Certainty goes the same way: speculations that say a change <em>will</em> happen are abstract in ${cnt(C.filter(c => c.hyp === 1), abs)} of ${C.filter(c => c.hyp === 1).length}, where the theory would expect what is held certain, and so near, to be described concretely.`,
        f: fig(byStatus, conc),
        i: "Read an abstract promise about an existing medium as affirmative, and ask what it would look like in use." },
      { t: "Unplaced futures are abstract",
        p: `Speculations set in no particular place are almost all abstract (${cnt(world, abs)} of ${world.length}), say “will” (${cnt(world, c => c.hyp === 1)} of ${world.length}) and ${cnt(world, rr) ? `rarely retrieve or reverse (${cnt(world, rr)} of ${world.length})` : `never retrieve or reverse (0 of ${world.length})`}. Those set somewhere, here or elsewhere, are mixed (${cnt(placed, c => !abs(c))} of ${placed.length} concrete). This is an observation rather than a test of construal-level theory: a future without a place is already, in part, an abstract one. Spatial distance proper, here against elsewhere, shows no clear pattern in the pilot.`,
        f: fig(bySpace, conc),
        i: "Place it. A future set in a particular place has to be shown working, and there retrieval and reversal become visible." },
      { t: "Retrieval and reversal live in imagined media",
        p: `Of ${R.length} speculations that retrieve, ${cnt(R, c => c.status === 3)} imagine their medium; of ${V.length} that reverse, ${cnt(V, c => c.status === 3)} do. Speculations about existing media almost never imagine the medium turning against itself (${cnt(ex, rr)} of ${ex.length}). The gaps in what promoters imagined are the gaps that fiction has filled.`,
        f: fig(byStatus, [["Retrieves or reverses", rr, "s1"], ["Neither", c => !rr(c), "s3"]]),
        i: "Counterfactual obsolescence completes an affirmative speculation with the laws only fiction has imagined." },
      { t: "Fiction holds several laws at once",
        p: `${cnt(writers, multi) === writers.length ? "Every" : "Most"} speculation${cnt(writers, multi) === writers.length ? "" : "s"} by a writer or artist code${cnt(writers, multi) === writers.length ? "s" : ""} for more than one law (${cnt(writers, multi)} of ${writers.length}), against ${cnt(ex, multi)} of ${ex.length} about existing media. The mechanical teacher in Isaac Asimov’s “The Fun They Had” (1951) enhances, obsolesces and reverses at once; promoters make single-law promises.`,
        f: fig(byStatus, [["Several laws", multi, "s1"], ["One law", c => !multi(c), "s3"]]),
        i: "Holding more than one law can be coded and tested on any design; inventing a medium is one way to get there, not the goal." },
      { t: "Recent speculations are dated and close",
        p: `Before 1960, ${cnt(early, c => c.temporal < 4)} of ${early.length} speculations state a horizon; since 2000, ${cnt(late, c => c.temporal < 4)} of ${late.length} do, ${cnt(late, c => c.temporal <= 2)} of them imminent or near (“the next 18 months”). Like ubiquitous computing’s “proximate future”, always just around the corner (Bell &amp; Dourish 2007), the present future of AI and online courses leaves little time for consequences to unfold.`,
        f: fig(byPeriod, [["Imminent or near", c => c.temporal <= 2, "s1"], ["Distant", c => c.temporal === 3, "s2"], ["Unstated", c => c.temporal === 4, "s3"]]),
        i: "Speculative design can widen the horizon that recent promotion has narrowed." }
    ];
    const sig = [["Medium", "Existing", "Imagined, or an existing one scaled down"], ["Place", "Unspecified", "A particular place"], ["Mode", "Will", "Is (depicted)"], ["Horizon", "Stated and imminent", "Distant or unstated"], ["Language", "Abstract", "Concrete"], ["Tetrad", "One law, usually enhance or obsolesce", "Several laws, including retrieval or reversal"]];
    $("#readings").innerHTML = items.map((r, k) => `<section class="rd"><h3><span class="rd-k">${k + 1}</span>${r.t}</h3><p>${r.p}</p>${r.f}<p class="rd-i"><strong>Implication.</strong> ${r.i}</p></section>`).join("") +
      `<section class="rd"><h3><span class="rd-k">→</span>Two signatures</h3><p>Taken together, the patterns describe two signatures of speculation, after Dunne and Raby’s distinction between affirmative and critical design (2013). Both speculate: the affirmative confirms a medium’s course, the critical questions it. The corporate and critical axes found in concept videos (Jang &amp; Bolter 2026; cf. Wong &amp; Khovanskaya 2018) are one case of this, but in the archive the affirmative signature is shared by inventors, policymakers and researchers as well as companies. For readers, the affirmative signature is a check on claims about new media in education, AI among them: a claim that carries it says nothing about retrieval or reversal, so ask. For designers, the critical signature is a set of heuristics for making and evaluating critical speculative design.</p>
        <table class="sig"><thead><tr><th></th><th>Affirmative</th><th>Critical</th></tr></thead><tbody>${sig.map(([a, b, c]) => `<tr><th>${a}</th><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody></table>
        <p class="small">Status, format, hypotheticality and construal move together in this sample; ${cnt(im, c => c.hyp === 4)} of the ${im.length} imagined media are depicted rather than predicted. They may be one split, between predicting what an existing medium will do and depicting one that does not exist, which a larger archive would need to separate.</p></section>
      <section class="rd rd-refs"><h3>References</h3><ul class="cb-refs">
        <li>Genevieve Bell and Paul Dourish. 2007. Yesterday’s tomorrows: notes on ubiquitous computing’s dominant vision. <em>Personal and Ubiquitous Computing</em> 11, 2, 133–143. https://doi.org/10.1007/s00779-006-0071-x</li>
        <li>Anthony Dunne and Fiona Raby. 2013. <em>Speculative Everything: Design, Fiction, and Social Dreaming</em>. MIT Press.</li>
        <li>Soyoun Jang and Jay D. Bolter. 2026. Historicising Speculative Design with McLuhan’s Tetrad. In <em>Proceedings of DRS2026</em>. Design Research Society. https://doi.org/10.21606/drs.2026.479</li>
        <li>Yaacov Trope and Nira Liberman. 2010. Construal-level theory of psychological distance. <em>Psychological Review</em> 117, 2, 440–463.</li>
        <li>Richmond Y. Wong and Vera Khovanskaya. 2018. Speculative design in HCI: from corporate imaginations to critical orientations. In <em>New Directions in Third Wave Human-Computer Interaction: Volume 2 – Methodologies</em>, Michael Filimowicz and Veronika Tzankova (Eds.). Springer, 175–202.</li></ul></section>`;
  }
  const PAGES = ["overview", "codebook", "book", "climate", "counterfactual"];
  const SECTIONS = { overview: ["overview"], book: ["bookhead", "archive", "bookcorpus", "readings"], codebook: ["codebook"], climate: ["climate"], counterfactual: ["counterfactual"] };
  function route() {
    let h = location.hash.slice(1);
    if (h === "gaps" || h === "ideas" || h === "design") h = "counterfactual";
    if (h === "intro") h = "overview";
    const anchor = h === "cf-full" ? h : null; if (anchor) h = "counterfactual";
    if (anchor) setCF(true);
    if (h.startsWith("cb-")) { const t = document.getElementById(h); if (t && !$("#pg-codebook").hidden) { t.scrollIntoView(); return; } }
    const sub = h === "book" || h === "archive" ? "archive" : h === "book-corpus" || h === "sources" ? "bookcorpus" : h === "readings" ? h : null;
    const page = sub ? "book" : PAGES.includes(h) ? h : h.startsWith("cb-") ? "codebook" : "overview";
    Object.entries(SECTIONS).forEach(([pg, secs]) => secs.forEach(x => {
      const show = pg === page && (pg !== "book" || x === "bookhead" || x === sub);
      $(`#pg-${x}`).hidden = !show;
    }));
    document.querySelectorAll(".sitenav a").forEach(a => { if (a.dataset.page === page) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.querySelectorAll("#pg-bookhead .subnav a").forEach(a => a.setAttribute("aria-current", String(a.dataset.sub === sub)));
    if (sub === "archive") render();
    if (sub === "readings") renderReadings();
    if (sub === "bookcorpus") { renderCorpus(); renderSources(); }
    if (page === "counterfactual") renderCF();
    if (h.startsWith("cb-")) document.getElementById(h)?.scrollIntoView();
    else if (anchor) document.getElementById(anchor)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }
  // From readings to design: the counterfactual card opens and closes its full write-up below the cards
  function setCF(open) {
    const t = $("#cf-toggle"), w = $("#cf-full-wrap"); if (!t || !w) return;
    w.hidden = !open; t.classList.toggle("active", open); t.setAttribute("aria-expanded", String(open));
  }
  $("#cf-toggle").addEventListener("click", (e) => {
    e.preventDefault();
    const open = $("#cf-full-wrap").hidden; setCF(open);
    if (open) $("#cf-full").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
  window.addEventListener("hashchange", route);
  fetch(DATA.book).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(d => { ingest(d, DATA.book); route(); })
    .catch(err => { $("header").insertAdjacentHTML("beforeend", `<p class="notice">Could not load the archive data (${DATA.book}): ${err.message}. The site has to be opened through a web server, not as a local file.</p>`); route(); });
})();
