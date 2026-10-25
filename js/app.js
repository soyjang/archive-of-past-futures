(function () {
  // Media families: used only for colour and filtering; the coded field is the medium itself
  const FAMS = [
    { id: "image", label: "Stereograph and film", media: ["stereograph", "film"], v: "--era1" },
    { id: "broadcast", label: "Radio and television", media: ["radio", "tv"], v: "--era2" },
    { id: "machines", label: "Teaching machines", media: ["machine"], v: "--era3" },
    { id: "computers", label: "Computers", media: ["computer"], v: "--fam7" },
    { id: "online", label: "Internet", media: ["online"], v: "--fam5" },
    { id: "ai", label: "AI and robots", media: ["ai", "robot"], v: "--era4" },
    { id: "immersion", label: "VR and direct transmission", media: ["vr", "brain"], v: "--fam6" },
    { id: "games", label: "Games", media: ["game"], v: "--fam8" }
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

  // Documented claims, gathered from primary sources or reputable compilations. Codes are provisional (single coder).
  // verify: wording or original venue still to be checked against the primary source.
  // ---------- data: each case lives in its own file (data/book.json, data/climate.json) ----------
  const SPEAKERS = ["Inventor", "Company", "Policymaker", "Intergovernmental body", "Activist or NGO", "Educator", "Researcher", "Designer", "Writer or artist", "Workshop participants"];
  const SUCC = { stereograph: "Stereograph", film: "Film", radio: "Radio", tv: "Television", machine: "Teaching machine", computer: "Computer", vr: "Virtual reality", online: "Internet", ai: "AI", robot: "Robot", game: "Game", brain: "Direct transmission to the brain" };
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
    const dd = document.getElementById("data-date");
    if (dd && data.updated) dd.textContent = ` · Case 1: ${data.speculations.length} speculations, data updated ${new Date(data.updated + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
    data.speculations.forEach(r => {
      const c = { id: r.id, year: r.year, who: r.who, text: r.text, desc: !!r.description, note: r.note, verify: r.verify, source: r.source,
        laws: r.tetrad, lawDetail: r.tetrad_detail || {}, lang: (r.construal || "").toLowerCase(), documented: true, speaker: r.speaker, medium: r.medium, detail: r.medium_wording || r.medium };
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
          <dt>Tetrad</dt><dd class="tetrad-dd">${c.laws.map(l => `<div><span class="tag">${LAWS[l].label}</span>${c.lawDetail[l] ? ` ${c.lawDetail[l]}` : ""}</div>`).join("")}</dd>
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
    if ($("#pg-bookcorpus").hidden || e.target.closest("input, select, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown" && e.target.closest("#srclist")) { e.preventDefault(); srcStep(1); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp" && e.target.closest("#srclist")) { e.preventDefault(); srcStep(-1); }
  });

  // ---------- pages ----------

  const PAGES = ["overview", "codebook", "book"];
  const SECTIONS = { overview: ["overview"], book: ["bookhead", "archive", "bookcorpus"], codebook: ["codebook"] };
  function route() {
    let h = location.hash.slice(1);
    if (h === "intro") h = "overview";
    if (h.startsWith("cb-")) { const t = document.getElementById(h); if (t && !$("#pg-codebook").hidden) { t.scrollIntoView(); return; } }
    const sub = h === "book" || h === "archive" ? "archive" : h === "book-corpus" || h === "sources" ? "bookcorpus" : null;
    const page = sub ? "book" : PAGES.includes(h) ? h : h.startsWith("cb-") ? "codebook" : "overview";
    Object.entries(SECTIONS).forEach(([pg, secs]) => secs.forEach(x => {
      const show = pg === page && (pg !== "book" || x === "bookhead" || x === sub);
      $(`#pg-${x}`).hidden = !show;
    }));
    document.querySelectorAll(".sitenav a").forEach(a => { if (a.dataset.page === page) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.querySelectorAll("#pg-bookhead .subnav a").forEach(a => a.setAttribute("aria-current", String(a.dataset.sub === sub)));
    if (sub === "archive") render();
    if (sub === "bookcorpus") renderSources();
    if (h.startsWith("cb-")) document.getElementById(h)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  fetch(DATA.book).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(d => { ingest(d, DATA.book); route(); })
    .catch(err => { $("header").insertAdjacentHTML("beforeend", `<p class="notice">Could not load the archive data (${DATA.book}): ${err.message}. The site has to be opened through a web server, not as a local file.</p>`); route(); });
})();
