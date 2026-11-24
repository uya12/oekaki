'use strict';

/* =====================================================
   ステージの景色（背景ごとの作りこみ）。協力ストーリーだけ
   - 奥（地形の前に描く）：花・岩の柱・水晶・浮き島・城の壁・雪の木・枯れ木 など
   - 手前（ランナーの前に描く）：谷の岩のひさし・雲の海・嵐の雨と雲 など
   ホストもゲストも、同じ乱数から同じ景色を作る
   ===================================================== */
let deco = [], rockTop = [];
const SCN_SEG = 3 * T;
const hash01 = n => { n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n = Math.imul(n ^ (n >>> 12), 0x297a2d39); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
const groundTop = c => { let r = 0; while (r < ROWS - 1 && !solid(c, r)) r++; return r; };
// そのあたり（まわり24マス）の地面の高さ（真ん中くらい）
function localGround(gr, c) {
  const hs = []; for (let d = -12; d <= 12; d++) { const v = gr[c + d]; if (v != null) hs.push(v); }
  hs.sort((p, q) => p - q); return (hs.length ? hs[Math.floor(hs.length / 2)] : ROWS - 6) * T;
}
// 上のひさし（森の屋根・谷の岩）の高さの並び
function buildCeil(rng, gr, off, wob) {
  const out = [];
  for (let x = 0, i = 0; x < WW + SCN_SEG; x += SCN_SEG, i++) out.push({ y: localGround(gr, Math.floor(x / T)) + off + (rng() - 0.5) * wob, r: 30 + rng() * 14, dot: rng() });
  for (let i = 1; i < out.length - 1; i++) out[i].y = (out[i - 1].y + out[i].y * 2 + out[i + 1].y) / 4;
  return out;
}
// しかけ（穴・扉・カギ・リフト）やスタート・ゴールのじゃまにならない場所か
function sceneryFree(x, pad = 3) {
  const c = Math.floor(x / T);
  if (c < 8 || x > goalX - 120) return false;
  if (guides.some(gd => c >= gd.c0 - pad && c <= gd.c1 + pad)) return false;
  if (gates.some(gt => Math.abs(gt.c * T - x) < 60 || Math.abs(gt.sx - x) < 50) || locks.some(lk => Math.abs(lk.c * T - x) < 50)) return false;
  if (lifts.some(lf => x > lf.sx - 50 && x < lf.x + lf.w + 30)) return false;
  return !items.some(it => it.type === 'key' && Math.abs(it.x - x) < 50);
}
function genScenery(rng) {
  deco = []; rockTop = [];
  const th = curTheme(); if (!th) return;
  const gr = []; for (let c = 0; c < LW; c++) { const r = groundTop(c); gr.push(r < ROWS - 1 ? r : null); }
  // 平らな地面の上に、間をあけて置く
  const along = (a, b, fn, needFree) => {
    for (let x = 200 + rng() * a; x < WW - 150; x += a + rng() * (b - a)) {
      const c = Math.floor(x / T), r = gr[c];
      if (r == null || tileAt(c, r) !== 1 || solid(c, r - 1) || (needFree && !sceneryFree(x))) continue;
      fn(x, r * T);
    }
  };
  if (th === 'meadow') {
    along(55, 150, (x, gy) => deco.push({ k: rng() < 0.55 ? 'flower' : 'tuft', x, y: gy, s: 0.8 + rng() * 0.5, v: rng() }));
    along(650, 1100, (x, gy) => deco.push({ k: 'fence', x, y: gy, n: 3 + Math.floor(rng() * 3), v: rng() }), true);
  } else if (th === 'canyon') {
    along(360, 700, (x, gy) => deco.push({ k: 'mesa', x, y: gy, w: 60 + rng() * 80, h: 150 + rng() * 170, v: rng() }));
    along(140, 320, (x, gy) => deco.push({ k: rng() < 0.6 ? 'bush' : 'pebble', x, y: gy, s: 0.8 + rng() * 0.5, v: rng() }));
    rockTop = buildCeil(rng, gr, -330, 50);
  } else if (th === 'cave' || th === 'ice') {
    along(120, 280, (x, gy) => deco.push({ k: th === 'ice' ? 'icecrystal' : rng() < 0.5 ? 'crystal' : 'shroom', x, y: gy, s: 0.7 + rng() * 0.6, v: rng() }));
  } else if (th === 'sky') {
    for (let x = 300 + rng() * 300; x < WW; x += 500 + rng() * 500) { const c = Math.floor(x / T); deco.push({ k: 'island', x, y: localGround(gr, c) - 230 - rng() * 140, w: 90 + rng() * 90, v: rng() }); }
    along(260, 520, (x, gy) => deco.push({ k: 'puff', x, y: gy, s: 0.7 + rng() * 0.5, v: rng() }));
  } else if (th === 'castle') {
    for (let x = 220 + rng() * 120, i = 0; x < WW - 150; x += 230 + rng() * 110, i++) {
      const c = Math.floor(x / T), gy = localGround(gr, c);
      deco.push({ k: i % 3 === 2 ? 'banner' : 'window', x, y: gy - 190 - (i % 3 === 2 ? 40 : 0), v: rng() });
      deco.push({ k: 'torch', x: x + 115, y: gy - 120, v: rng() });
    }
  } else if (th === 'mountain') {
    along(90, 240, (x, gy) => deco.push({ k: 'pine', x, y: gy, s: 0.7 + rng() * 0.7, v: rng() }));
    along(260, 520, (x, gy) => deco.push({ k: 'snowrock', x, y: gy, s: 0.8 + rng() * 0.5, v: rng() }));
  } else if (th === 'storm') {
    along(420, 800, (x, gy) => deco.push({ k: 'deadtree', x, y: gy, s: 0.8 + rng() * 0.5, v: rng(), br: rng() < 0.5 ? -1 : 1 }));
    along(180, 380, (x, gy) => deco.push({ k: 'puddle', x, y: gy, s: 0.7 + rng() * 0.6, v: rng() }));
  }
}

/* ---------- 描画（奥） ---------- */
const inView = (x, w) => x + w > viewX - 40 && x - w < viewX + VWW + 40;
function drawSceneryBehind() {
  const th = curTheme(); if (!th) return;
  if (th === 'castle') drawCastleWall();
  if (th === 'cave' || th === 'ice') drawCaveCeiling(th === 'ice');
  for (const d of deco) {
    const w = d.k === 'mesa' ? d.w : d.k === 'island' ? d.w : d.k === 'fence' ? d.n * 26 : 70;
    if (!inView(d.x, w)) continue;
    DECO_DRAW[d.k](d);
  }
}
// 城の壁（石のレンガ）。地面より上の背景に、うすく
function drawCastleWall() {
  g.save();
  g.fillStyle = 'rgba(205,196,214,0.55)'; g.fillRect(viewX - 10, viewY - 10, VWW + 20, VWH + 20);
  g.strokeStyle = 'rgba(110,90,130,0.22)'; g.lineWidth = 1.5; g.beginPath();
  const bh = 26, bw = 52, y0 = Math.floor(viewY / bh) * bh, x0 = Math.floor(viewX / bw) * bw - bw;
  for (let y = y0; y < viewY + VWH + bh; y += bh) {
    g.moveTo(viewX - 10, y); g.lineTo(viewX + VWW + 10, y);
    const off = (Math.round(y / bh) % 2) * bw / 2;
    for (let x = x0 + off; x < viewX + VWW + bw; x += bw) { g.moveTo(x, y); g.lineTo(x, y + bh); }
  }
  g.stroke(); g.restore();
}
// 洞くつの天井のつらら（天井のマスの下に、決まった形でぶら下がる）
function drawCaveCeiling(ice) {
  const c0 = Math.max(0, Math.floor(viewX / T) - 1), c1 = Math.min(LW - 1, Math.ceil((viewX + VWW) / T) + 1);
  const r0 = Math.max(0, Math.floor(viewY / T)), r1 = Math.min(ROWS - 2, Math.ceil((viewY + VWH) / T));
  g.save(); g.fillStyle = ice ? 'rgba(190,228,255,0.9)' : 'rgba(120,110,130,0.9)'; g.strokeStyle = ice ? '#5aa0d0' : '#4a4252'; g.lineWidth = 1.5;
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if (tileAt(c, r) !== 1 || solid(c, r + 1)) continue;
    const h = hash01(c * 131 + r * 7); if (h > 0.45) continue; // 天井の下の半分くらいに
    const x = c * T + T / 2 + (h - 0.2) * 10, y = (r + 1) * T, len = 14 + h * 60;
    g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.lineTo(x + 1, y + len); g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
}
const DECO_DRAW = {
  flower(d) {
    const sway = Math.sin(tick / 35 + d.v * 9) * 3 + (curTheme() === 'meadow' && effects.gust > 0 ? (effects.gustDir || 1) * 7 : 0), s = d.s;
    g.save(); g.strokeStyle = '#4f9a52'; g.lineWidth = 2; g.beginPath(); g.moveTo(d.x, d.y); g.quadraticCurveTo(d.x + sway * 0.3, d.y - 10 * s, d.x + sway, d.y - 18 * s); g.stroke();
    const col = ['#ff9bb8', '#ffd84a', '#ffffff', '#b89cff'][Math.floor(d.v * 4)];
    g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); g.arc(d.x + sway + Math.cos(a) * 4 * s, d.y - 18 * s + Math.sin(a) * 4 * s, 3 * s, 0, TAU); g.fill(); }
    g.fillStyle = '#f2a52e'; g.beginPath(); g.arc(d.x + sway, d.y - 18 * s, 2.2 * s, 0, TAU); g.fill(); g.restore();
  },
  tuft(d) {
    const lean = Math.sin(tick / 30 + d.v * 7) * 0.12 + (curTheme() === 'meadow' && effects.gust > 0 ? (effects.gustDir || 1) * 0.55 : 0);
    g.save(); g.strokeStyle = '#5fae5f'; g.lineWidth = 2.2; g.beginPath();
    for (let k = -2; k <= 2; k++) { const h = (16 + Math.abs(k * 3)) * d.s, bx = d.x + k * 4; g.moveTo(bx, d.y); g.quadraticCurveTo(bx + lean * h * 0.4, d.y - h * 0.6, bx + k * 2 + lean * h, d.y - h); }
    g.stroke(); g.restore();
  },
  fence(d) {
    g.save(); g.strokeStyle = '#8a6a44'; g.fillStyle = '#d9b98b'; g.lineWidth = 2;
    for (let k = 0; k < d.n; k++) { const x = d.x + k * 26; rrect(g, x - 4, d.y - 34, 8, 34, 2); g.fill(); g.stroke(); }
    for (const yy of [d.y - 26, d.y - 14]) { g.fillRect(d.x, yy, (d.n - 1) * 26, 5); g.strokeRect(d.x, yy, (d.n - 1) * 26, 5); }
    g.restore();
  },
  mesa(d) { // 岩の柱（しま模様）
    g.save(); g.globalAlpha = 0.8;
    const L = d.x - d.w / 2, top = d.y - d.h;
    g.beginPath(); g.moveTo(L - 10, d.y); g.lineTo(L, top + 16); g.quadraticCurveTo(L + 4, top, L + 18, top); g.lineTo(L + d.w - 18, top); g.quadraticCurveTo(L + d.w - 4, top, L + d.w, top + 16); g.lineTo(L + d.w + 10, d.y); g.closePath();
    g.fillStyle = '#e0a676'; g.fill(); g.strokeStyle = '#9a6440'; g.lineWidth = 2; g.stroke();
    g.save(); g.clip(); g.strokeStyle = 'rgba(160,90,50,0.45)'; g.lineWidth = 5;
    for (let y = top + 26 + d.v * 20; y < d.y; y += 34) { g.beginPath(); g.moveTo(L - 12, y); g.quadraticCurveTo(d.x, y + 6, L + d.w + 12, y - 2); g.stroke(); }
    g.restore(); g.restore();
  },
  bush(d) {
    g.save(); g.fillStyle = '#a3a05a'; g.strokeStyle = '#6f6c30'; g.lineWidth = 1.5;
    for (const [dx, r] of [[-8, 8], [0, 11], [9, 8]]) { g.beginPath(); g.arc(d.x + dx * d.s, d.y - r * d.s * 0.7, r * d.s, Math.PI, 0); g.fill(); g.stroke(); }
    g.restore();
  },
  pebble(d) {
    g.save(); g.fillStyle = '#c49a78'; g.strokeStyle = '#8a6448'; g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(d.x, d.y - 5 * d.s, 10 * d.s, 6 * d.s, 0, Math.PI, 0); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(d.x + 12 * d.s, d.y - 3 * d.s, 6 * d.s, 4 * d.s, 0, Math.PI, 0); g.fill(); g.stroke(); g.restore();
  },
  crystal(d) { // 光る水晶
    const glow = 0.5 + 0.3 * Math.sin(tick / 40 + d.v * 9), s = d.s;
    g.save(); const gd = g.createRadialGradient(d.x, d.y - 14 * s, 2, d.x, d.y - 14 * s, 40 * s); gd.addColorStop(0, `rgba(170,140,255,${0.45 * glow})`); gd.addColorStop(1, 'rgba(170,140,255,0)');
    g.fillStyle = gd; g.fillRect(d.x - 40 * s, d.y - 54 * s, 80 * s, 80 * s);
    g.fillStyle = '#b9a2ff'; g.strokeStyle = '#5b3a9a'; g.lineWidth = 1.5;
    for (const [dx, h, a] of [[-7, 18, -0.3], [0, 28, 0], [8, 20, 0.35]]) { g.save(); g.translate(d.x + dx * s, d.y); g.rotate(a); g.beginPath(); g.moveTo(-4 * s, 0); g.lineTo(-4 * s, -h * s + 6); g.lineTo(0, -h * s); g.lineTo(4 * s, -h * s + 6); g.lineTo(4 * s, 0); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    g.restore();
  },
  icecrystal(d) {
    const s = d.s;
    g.save(); g.fillStyle = 'rgba(200,236,255,0.95)'; g.strokeStyle = '#5aa0d0'; g.lineWidth = 1.5;
    for (const [dx, h, a] of [[-8, 20, -0.35], [0, 32, 0], [9, 22, 0.3]]) { g.save(); g.translate(d.x + dx * s, d.y); g.rotate(a); g.beginPath(); g.moveTo(-5 * s, 0); g.lineTo(-5 * s, -h * s + 7); g.lineTo(0, -h * s); g.lineTo(5 * s, -h * s + 7); g.lineTo(5 * s, 0); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    g.restore();
  },
  shroom(d) { // 光るきのこ
    const s = d.s, glow = 0.6 + 0.3 * Math.sin(tick / 30 + d.v * 7);
    g.save(); g.fillStyle = '#e8e2d2'; g.fillRect(d.x - 2 * s, d.y - 12 * s, 4 * s, 12 * s);
    g.beginPath(); g.arc(d.x, d.y - 12 * s, 9 * s, Math.PI, 0); g.fillStyle = `rgba(120,230,200,${glow})`; g.fill(); g.strokeStyle = '#2f7a68'; g.lineWidth = 1.5; g.stroke();
    g.restore();
  },
  island(d) { // 遠くに浮かぶ島
    const y = d.y + Math.sin(tick / 90 + d.v * 6) * 6;
    g.save(); g.globalAlpha = 0.75;
    g.beginPath(); g.moveTo(d.x - d.w / 2, y); g.lineTo(d.x + d.w / 2, y); g.lineTo(d.x + d.w * 0.15, y + d.w * 0.55); g.lineTo(d.x - d.w * 0.2, y + d.w * 0.4); g.closePath();
    g.fillStyle = '#c9b49a'; g.fill(); g.strokeStyle = '#8a7356'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#7fc27f'; g.fillRect(d.x - d.w / 2, y - 6, d.w, 8);
    g.beginPath(); g.arc(d.x - d.w * 0.2, y - 16, 12, 0, TAU); g.arc(d.x - d.w * 0.05, y - 22, 14, 0, TAU); g.fillStyle = '#5aa865'; g.fill();
    g.restore();
  },
  puff(d) { // 地面のふちの小さな雲
    g.save(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.strokeStyle = '#b9cde6'; g.lineWidth = 1.5;
    g.beginPath(); for (const [dx, r] of [[-12, 9], [0, 13], [12, 9]]) { g.moveTo(d.x + dx * d.s + r * d.s, d.y); g.arc(d.x + dx * d.s, d.y, r * d.s, Math.PI, 0); } g.fill(); g.stroke(); g.restore();
  },
  window(d) { // 城の窓（格子つき）
    g.save(); const w = 34, h = 56, L = d.x - w / 2, top = d.y - h;
    g.beginPath(); g.moveTo(L, d.y); g.lineTo(L, top + w / 2); g.arc(d.x, top + w / 2, w / 2, Math.PI, 0); g.lineTo(L + w, d.y); g.closePath();
    const sk = g.createLinearGradient(0, top, 0, d.y); sk.addColorStop(0, '#6f5a9a'); sk.addColorStop(1, '#f3b9a5'); g.fillStyle = sk; g.fill();
    g.strokeStyle = '#5b4a6e'; g.lineWidth = 4; g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(d.x, top); g.lineTo(d.x, d.y); g.moveTo(L, top + 30); g.lineTo(L + w, top + 30); g.stroke();
    g.fillStyle = '#9c8fae'; g.fillRect(L - 6, d.y, w + 12, 6); g.restore();
  },
  banner(d) { // たれまく（消しゴムのしるし）
    const sw = Math.sin(tick / 50 + d.v * 6) * 3;
    g.save(); g.fillStyle = '#c84a5e'; g.strokeStyle = '#6e2333'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(d.x - 20, d.y); g.lineTo(d.x + 20, d.y); g.lineTo(d.x + 20 + sw, d.y + 80); g.lineTo(d.x + sw, d.y + 66); g.lineTo(d.x - 20 + sw, d.y + 80); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#6b6a7a'; g.fillRect(d.x - 26, d.y - 4, 52, 5);
    rrect(g, d.x - 10 + sw * 0.5, d.y + 22, 20, 14, 3); g.fillStyle = '#fbe6ee'; g.fill(); g.stroke(); // 消しゴム
    g.restore();
  },
  torch(d) { // たいまつ（ゆらゆら光る）
    const f = 0.85 + 0.15 * Math.sin(tick / 5 + d.v * 9) + 0.08 * Math.sin(tick / 2.3);
    g.save(); const gd = g.createRadialGradient(d.x, d.y - 16, 2, d.x, d.y - 16, 70 * f); gd.addColorStop(0, 'rgba(255,190,90,0.45)'); gd.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = gd; g.fillRect(d.x - 80, d.y - 90, 160, 160);
    g.fillStyle = '#6b5a4e'; g.fillRect(d.x - 3, d.y - 8, 6, 22); g.fillRect(d.x - 8, d.y - 10, 16, 5);
    g.beginPath(); g.moveTo(d.x - 7, d.y - 10); g.quadraticCurveTo(d.x - 6 * f, d.y - 26 * f, d.x, d.y - 32 * f); g.quadraticCurveTo(d.x + 7 * f, d.y - 22 * f, d.x + 7, d.y - 10); g.closePath();
    g.fillStyle = '#ffb347'; g.fill(); g.beginPath(); g.arc(d.x, d.y - 15, 3.5, 0, TAU); g.fillStyle = '#fff2b0'; g.fill();
    g.restore();
  },
  pine(d) { // 雪のつもった木
    const s = d.s;
    g.save(); g.fillStyle = '#7a5a40'; g.fillRect(d.x - 3 * s, d.y - 12 * s, 6 * s, 12 * s);
    for (let k = 0; k < 3; k++) {
      const y = d.y - 10 * s - k * 16 * s, w = (24 - k * 6) * s;
      g.beginPath(); g.moveTo(d.x - w, y); g.lineTo(d.x, y - 26 * s); g.lineTo(d.x + w, y); g.closePath(); g.fillStyle = '#4f8a6a'; g.fill(); g.strokeStyle = '#2f5a44'; g.lineWidth = 1.5; g.stroke();
      g.beginPath(); g.moveTo(d.x - w * 0.55, y - 9 * s); g.lineTo(d.x, y - 26 * s); g.lineTo(d.x + w * 0.55, y - 9 * s); g.quadraticCurveTo(d.x, y - 13 * s, d.x - w * 0.55, y - 9 * s); g.fillStyle = '#ffffff'; g.fill();
    }
    g.restore();
  },
  snowrock(d) {
    const s = d.s;
    g.save(); g.beginPath(); g.ellipse(d.x, d.y, 16 * s, 12 * s, 0, Math.PI, 0); g.fillStyle = '#9aa3b5'; g.fill(); g.strokeStyle = '#5d6170'; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.ellipse(d.x - 2 * s, d.y - 9 * s, 12 * s, 5 * s, 0, Math.PI, 0); g.fillStyle = '#fff'; g.fill(); g.restore();
  },
  deadtree(d) { // 嵐の中の枯れ木（風でゆれる）
    const s = d.s, sw = Math.sin(tick / 18 + d.v * 9) * 0.06;
    g.save(); g.translate(d.x, d.y); g.rotate(sw); g.strokeStyle = '#4a4458'; g.lineCap = 'round';
    g.lineWidth = 7 * s; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-6 * s * d.br, -50 * s, 4 * s * d.br, -95 * s); g.stroke();
    g.lineWidth = 4 * s; g.beginPath(); g.moveTo(-2 * s * d.br, -55 * s); g.lineTo(-28 * s * d.br, -80 * s); g.moveTo(2 * s * d.br, -75 * s); g.lineTo(26 * s * d.br, -96 * s); g.stroke();
    g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(-20 * s * d.br, -72 * s); g.lineTo(-24 * s * d.br, -92 * s); g.moveTo(18 * s * d.br, -90 * s); g.lineTo(30 * s * d.br, -86 * s); g.stroke();
    g.restore();
  },
  puddle(d) { // 水たまり（雨の波紋）
    const s = d.s;
    g.save(); g.beginPath(); g.ellipse(d.x, d.y + 1, 22 * s, 3.5 * s, 0, 0, TAU); g.fillStyle = 'rgba(120,140,190,0.55)'; g.fill();
    const ph = ((tick + d.v * 80) % 60) / 60; g.strokeStyle = `rgba(230,236,255,${0.8 * (1 - ph)})`; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(d.x + (d.v - 0.5) * 20 * s, d.y + 1, 3 + ph * 10 * s, 1 + ph * 2, 0, 0, TAU); g.stroke(); g.restore();
  }
};

/* ---------- 描画（手前） ---------- */
function drawSceneryFront() {
  const th = curTheme(); if (!th) return;
  if (th === 'canyon' && rockTop.length) drawRockTop();
  else if (th === 'sky') drawCloudSea();
  else if (th === 'storm') drawStormFront();
  else if (th === 'meadow' && effects.gust > 0) { // 風に飛ばされる花びら
    const dir = effects.gustDir || 1; g.save();
    for (let i = 0; i < 16; i++) {
      const x = viewX + (((i * 211 + tick * 7 * dir) % (VWW + 100)) + VWW + 100) % (VWW + 100) - 50, y = viewY + 60 + (i * 97) % (VWH - 160) + Math.sin(tick / 12 + i) * 14;
      g.save(); g.translate(x, y); g.rotate(tick / 10 + i); g.fillStyle = ['#ff9bb8', '#ffd84a', '#ffffff'][i % 3]; g.beginPath(); g.ellipse(0, 0, 4, 2.4, 0, 0, TAU); g.fill(); g.restore();
    }
    g.restore();
  }
}
// 谷：上につき出た岩のひさし（ここから岩が落ちてくる）。ランナーやP2のカーソルが近づくと透ける
function drawRockTop() {
  const i0 = Math.max(0, Math.floor(viewX / SCN_SEG) - 1), i1 = Math.min(rockTop.length - 1, Math.ceil((viewX + VWW) / SCN_SEG) + 1);
  const yAt = x => rockTop[clamp(Math.floor(x / SCN_SEG), 0, rockTop.length - 1)].y;
  const under = (x, y) => clamp((y - yAt(x) - 30) / 110, 0, 1);
  let k = P ? under(P.x + P.w / 2, P.y) : 1; if (hover.on) k = Math.min(k, under(bwx(hover.sx), bwy(hover.sy)));
  g.save(); g.globalAlpha = 0.35 + 0.6 * k;
  const top = viewY - 20;
  g.beginPath(); g.moveTo(i0 * SCN_SEG, top);
  for (let i = i0; i <= i1; i++) { const c = rockTop[i]; g.lineTo(i * SCN_SEG, c.y - 10); g.lineTo(i * SCN_SEG + SCN_SEG * (0.3 + c.dot * 0.4), c.y + 8 + c.dot * 22); }
  g.lineTo((i1 + 1) * SCN_SEG, top); g.closePath();
  g.fillStyle = '#c08458'; g.fill(); g.strokeStyle = '#6a3f24'; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke();
  g.save(); g.clip(); g.strokeStyle = 'rgba(120,70,40,0.4)'; g.lineWidth = 6; // しま模様
  for (let y = Math.floor(viewY / 40) * 40; y < yAt(viewX + VWW / 2) + 40; y += 40) { g.beginPath(); g.moveTo(viewX - 20, y + 10); g.quadraticCurveTo(viewX + VWW / 2, y - 6, viewX + VWW + 20, y + 12); g.stroke(); }
  g.restore();
  g.restore();
}
// 空：足もとの下に広がる雲の海（穴の下も雲）
function drawCloudSea() {
  const base = Math.max(viewY + VWH - 46, WH - 70), off = (tick * 0.35) % 90;
  g.save(); g.fillStyle = 'rgba(255,255,255,0.92)'; g.strokeStyle = '#b9cde6'; g.lineWidth = 2;
  g.beginPath();
  for (let x = Math.floor(viewX / 90) * 90 - 90 - off; x < viewX + VWW + 120; x += 90) {
    const h = hash01(Math.round((x + off) / 90) * 17); const r = 38 + h * 22, y = base + 10 - h * 12;
    g.moveTo(x + r, y); g.arc(x, y, r, Math.PI, 0);
  }
  g.rect(viewX - 100, base + 8, VWW + 200, VWH + 200); g.fill();
  g.restore();
}
// 嵐：上をおおう黒い雲・ななめの雨・かみなりの光
function drawStormFront() {
  g.save();
  g.strokeStyle = 'rgba(180,195,230,0.55)'; g.lineWidth = 1.6; g.beginPath(); // ななめの雨
  for (let i = 0; i < 110; i++) {
    const x = viewX + ((i * 97 + tick * 5) % (VWW + 160)) - 80, y = viewY + ((i * 53 + tick * 15) % (VWH + 40)) - 20;
    g.moveTo(x, y); g.lineTo(x - 7, y + 18);
  }
  g.stroke();
  if (bullets.some(b => b.kind === 'bolt' && b.life <= 18 && b.life > 12)) { g.fillStyle = 'rgba(255,255,240,0.28)'; g.fillRect(viewX - 10, viewY - 10, VWW + 20, VWH + 20); } // 雷が落ちた瞬間に光る
  g.restore();
}
