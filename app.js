(() => {
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const card = $("#card");
  const sheet = card.querySelector(".sheet");
  const text = $("#text");

  const DEFAULTS = { k: 5.2, ls: 0, sx: 1, lh: 1.8, w: "400", ink: "#1d1d1f", paper: "cream", lines: "ruled", orient: "landscape" };
  const PAPER = {
    cream: { bg: "#fbf6ea", rule: "rgba(120,100,70,.22)" },
    white: { bg: "#ffffff", rule: "rgba(60,80,120,.16)" },
    kraft: { bg: "#dcc5a0", rule: "rgba(80,55,25,.28)" },
    sky:   { bg: "#eaf2fa", rule: "rgba(50,90,140,.22)" },
  };

  // ---------- 저장 (브라우저 저장소가 막혀 있어도 동작) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가: 무시 */ } },
  };
  let s = { ...DEFAULTS, ...store.get("webletter.settings", {}) };
  text.value = store.get("webletter.text", "");

  // ---------- 설정 적용 ----------
  const fmt = {
    size: (k) => `${(k / 100 * 148 / 0.3528).toFixed(0)}pt`,
    track: (v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`,
    stretch: (v) => `${Math.round(v * 100)}%`,
    lead: (v) => `${v.toFixed(2)}`,
  };
  function apply() {
    root.style.setProperty("--k", s.k);
    root.style.setProperty("--ls", s.ls);
    root.style.setProperty("--sx", s.sx);
    root.style.setProperty("--lh", s.lh);
    root.style.setProperty("--w", s.w);
    root.style.setProperty("--ink", s.ink);
    card.className = `card paper-${s.paper} lines-${s.lines} ${s.orient}`;
    $("#size").value = s.k; $("#sizeOut").textContent = fmt.size(s.k);
    $("#track").value = s.ls; $("#trackOut").textContent = fmt.track(s.ls);
    $("#stretch").value = s.sx; $("#stretchOut").textContent = fmt.stretch(s.sx);
    $("#lead").value = s.lh; $("#leadOut").textContent = fmt.lead(s.lh);
    for (const [id, key] of [["weight", "w"], ["paper", "paper"], ["lines", "lines"], ["orient", "orient"], ["ink", "ink"]]) {
      document.querySelectorAll(`#${id} button`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === s[key])));
    }
    $("#inkCustom").value = s.ink;
    setPrintPage();
    store.set("webletter.settings", s);
    requestAnimationFrame(checkOverflow);
  }

  function checkOverflow() {
    // 마지막 줄의 아래 여백만 살짝 잘리는 건 괜찮음: 글자가 실제로 가려질 때만 경고
    const L = parseFloat(getComputedStyle(text).fontSize) * s.lh;
    const over = text.scrollHeight - text.clientHeight > L * 0.3;
    $("#overflow").hidden = !over;
    $("#count").textContent = `${[...text.value.replace(/\n/g, "")].length}자`;
  }

  // ---------- 입력 연결 ----------
  const bindRange = (id, key) => $(id).addEventListener("input", (e) => { s[key] = parseFloat(e.target.value); apply(); });
  bindRange("#size", "k"); bindRange("#track", "ls"); bindRange("#stretch", "sx"); bindRange("#lead", "lh");
  for (const [id, key] of [["weight", "w"], ["paper", "paper"], ["lines", "lines"], ["orient", "orient"], ["ink", "ink"]]) {
    $(`#${id}`).addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      s[key] = b.dataset.v; apply();
    });
  }
  $("#inkCustom").addEventListener("input", (e) => { s.ink = e.target.value; apply(); });
  text.addEventListener("input", () => { store.set("webletter.text", text.value); checkOverflow(); });
  $("#clear").addEventListener("click", () => {
    if (text.value && !confirm("지금 쓴 내용을 지우고 새로 쓸까요?")) return;
    text.value = ""; store.set("webletter.text", ""); checkOverflow(); text.focus();
  });
  $("#reset").addEventListener("click", () => { s = { ...DEFAULTS }; apply(); });
  window.addEventListener("resize", checkOverflow);
  document.fonts && document.fonts.ready.then(checkOverflow);

  // ---------- 인쇄: 방향에 맞는 용지 크기 ----------
  const pageStyle = document.createElement("style");
  document.head.appendChild(pageStyle);
  function setPrintPage() {
    pageStyle.textContent = s.orient === "portrait"
      ? "@page{size:100mm 148mm;margin:0}@media print{.card.portrait{width:100mm}}"
      : "@page{size:148mm 100mm;margin:0}";
  }
  $("#print").addEventListener("click", () => window.print());

  // ---------- PNG 저장: 화면과 같은 규칙으로 300dpi 캔버스에 다시 그림 ----------
  async function savePng() {
    await document.fonts.load(`${s.w} 40px "JunHand"`);
    const cr = card.getBoundingClientRect();
    const sr = sheet.getBoundingClientRect();
    const landscape = s.orient === "landscape";
    const W = landscape ? 1748 : 1181, H = landscape ? 1181 : 1748;  // 148×100mm @300dpi
    const scale = W / cr.width;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const paper = PAPER[s.paper];

    ctx.fillStyle = paper.bg; ctx.fillRect(0, 0, W, H);

    const cs = getComputedStyle(text);
    const F = parseFloat(cs.fontSize);              // 화면 px
    const L = F * s.lh;
    const ox = (sr.left - cr.left) * scale, oy = (sr.top - cr.top) * scale;
    const sw = sr.width * scale, sh = sr.height * scale;

    // 선
    ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, sw, sh); ctx.clip();
    ctx.strokeStyle = paper.rule; ctx.lineWidth = Math.max(1, scale * 1);
    if (s.lines === "ruled") {
      for (let y = 0.76 * L; y < sr.height; y += L) { const Y = oy + y * scale; ctx.beginPath(); ctx.moveTo(ox, Y); ctx.lineTo(ox + sw, Y); ctx.stroke(); }
    } else if (s.lines === "grid") {
      for (let y = L; y <= sr.height + 0.5; y += L) { const Y = oy + y * scale - 0.5; ctx.beginPath(); ctx.moveTo(ox, Y); ctx.lineTo(ox + sw, Y); ctx.stroke(); }
      for (let x = L; x <= sr.width + 0.5; x += L) { const X = ox + x * scale - 0.5; ctx.beginPath(); ctx.moveTo(X, oy); ctx.lineTo(X, oy + sh); ctx.stroke(); }
    }

    // 글씨: 화면 px 좌표계에서 계산하고, 장평은 가로 배율로
    ctx.setTransform(scale * s.sx, 0, 0, scale, ox, oy);
    ctx.font = `${s.w} ${F}px "JunHand"`;
    ctx.fillStyle = s.ink;
    ctx.textBaseline = "alphabetic";
    const ls = s.ls * F;
    const maxW = text.clientWidth;                  // 장평 적용 전 너비
    const m = ctx.measureText("가");
    const asc = m.fontBoundingBoxAscent ?? F * 0.9, desc = m.fontBoundingBoxDescent ?? F * 0.2;
    const baseOff = (L - (asc + desc)) / 2 + asc;
    let row = 0;
    for (const para of text.value.split("\n")) {
      let x = 0;
      for (const ch of [...para]) {
        const adv = ctx.measureText(ch).width + ls;
        if (ch !== " " && x > 0 && x + adv - ls > maxW + 0.5) { row++; x = 0; }
        ctx.fillText(ch, x, row * L + baseOff);
        x += adv;
      }
      row++;
    }
    ctx.restore();

    const a = document.createElement("a");
    a.download = `letter-${new Date().toISOString().slice(0, 10)}.png`;
    a.href = cv.toDataURL("image/png");
    a.click();
  }
  $("#savePng").addEventListener("click", savePng);

  apply();
  checkOverflow();
})();
