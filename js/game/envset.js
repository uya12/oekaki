'use strict';

/* =====================================================
   ステージの「舞台」（森と同じ作り）
   - 天井（手前）：森＝葉っぱ／城＝石のアーチ／洞くつ＝岩とつらら／こおり＝氷とつらら／嵐＝黒い雲
   - 柱（奥）：天井のつなぎ目から地面へ。森＝木の幹／城＝石の柱／洞くつ・こおり＝ときどき岩（氷）の柱
   - 空気の色と、遠くの景色（ゆっくり動いて奥行きを出す）：谷・雪山・草原・空・洞くつ・嵐
   ===================================================== */
const CEIL_CFG = {
  forest: { off: -290, w0: 110, wr: 60 }, castle: { off: -300, w0: 150, wr: 30 },
  cave: { off: -300, w0: 80, wr: 70 }, ice: { off: -300, w0: 80, wr: 70 }, storm: { off: -340, w0: 120, wr: 80 }
};
function genCeiling(rng, th) {
  const CF = CEIL_CFG[th]; if (!CF) return;
  const gr = []; for (let c = 0; c < LW; c++) { const r = groundTop(c); gr.push(r < ROWS - 1 ? r : null); }
  const SEG = 3 * T;
  canopy = [];
  for (let x = 0; x < WW + SEG; x += SEG) canopy.push({ y: localGround(gr, Math.floor(x / T)) + CF.off });
  for (let k = 0; k < 2; k++) for (let i = 1; i < canopy.length - 1; i++) canopy[i].y = (canopy[i - 1].y + canopy[i].y * 2 + canopy[i + 1].y) / 4;
  const ceilY = x => canopy[clamp(Math.floor(x / SEG), 0, canopy.length - 1)].y;
  lobes = [];
  for (let x = -80 - rng() * 60; x < WW + 200;) { const w = CF.w0 + rng() * CF.wr; lobes.push({ x0: x, w, y: ceilY(x + w / 2) + (rng() - 0.5) * (th === 'castle' ? 0 : 16), d: 0.32 + rng() * 0.12, seed: Math.floor(rng() * 100000) }); x += w; }
  if (th === 'castle') { // アーチの高さはそろえる（となりと段ちがいにならないよう、つなぎ目で同じ高さ）
    for (let i = 0; i < lobes.length; i++) lobes[i].y = ceilY(lobes[i].x0 + lobes[i].w / 2);
  }
  trunks = [];
  const post = (i, kind, w) => { const x = lobes[i].x0, c = Math.floor(x / T), r = gr[c]; if (x > 60 && x < WW - 60) trunks.push({ x, w, kind, gy: r != null ? r * T : WH + 40, top: Math.min(lobes[i].y, lobes[i - 1] ? lobes[i - 1].y : lobes[i].y), br: rng() < 0.3 ? (rng() < 0.5 ? -1 : 1) : 0, by: 0.35 + rng() * 0.3, ph: Math.floor(rng() * 1000) }); };
  if (th === 'forest') {
    for (let i = 1 + Math.floor(rng() * 3); i < lobes.length;) { // 間隔はばらばら（かたまっている所・広くあいている所）
      const young = rng() < 0.2; post(i, 'tree', young ? 18 + rng() * 6 : 30 + rng() * 16);
      const q = rng(); i += q < 0.3 ? 1 : q < 0.7 ? 2 + Math.floor(rng() * 2) : 4 + Math.floor(rng() * 3);
    }
  } else if (th === 'castle') {
    for (let i = 1; i < lobes.length; i++) post(i, 'pillar', 38); // アーチのつなぎ目ごとに石の柱
  } else if (th === 'cave' || th === 'ice') {
    for (let i = 2 + Math.floor(rng() * 3); i < lobes.length; i += 4 + Math.floor(rng() * 5)) post(i, th === 'ice' ? 'icecol' : 'rockcol', 34 + rng() * 22);
  }
}

/* ---------- 天井（手前） ---------- */
const CEIL_STYLE = {
  forest: { fill: '#48a852', rim: 'rgba(160,225,150,0.75)', line: '#1f5a2c' },
  castle: { fill: '#8f84a8', rim: 'rgba(225,215,245,0.75)', line: '#463b5c' },
  cave: { fill: '#4b4557', rim: 'rgba(150,140,175,0.55)', line: '#24212c' },
  ice: { fill: '#a6d6f2', rim: 'rgba(245,252,255,0.9)', line: '#4a8cbd' },
  storm: { fill: '#4f5470', rim: 'rgba(170,180,220,0.55)', line: '#262a3d' }
};
function drawCeiling(th) {
  const S = CEIL_STYLE[th], SEG = 3 * T, yAt = x => canopy[clamp(Math.floor(x / SEG), 0, canopy.length - 1)].y;
  const under = (x, y) => clamp((y - yAt(x) - 60) / 110, 0, 1); // ランナーやP2のカーソルが近づくと透ける
  let k = P ? under(P.x + P.w / 2, P.y) : 1;
  if (hover.on) k = Math.min(k, under(bwx(hover.sx), bwy(hover.sy)));
  const vis = lobes.filter(l => l.x0 + l.w > viewX - 60 && l.x0 < viewX + VWW + 60); if (!vis.length) return;
  const top = viewY - 30, last = vis[vis.length - 1];
  const spikes = th === 'cave' || th === 'ice';
  const edge = off => { // 下のふち
    for (const l of vis) {
      const cx = l.x0 + l.w / 2;
      if (th === 'castle') { g.lineTo(l.x0, l.y - off); g.ellipse(cx, l.y - off, l.w / 2 - 14, l.w * 0.3, 0, Math.PI, 0, false); g.lineTo(l.x0 + l.w, l.y - off); } // アーチ
      else if (spikes) { // 岩（氷）のふちと、ぶら下がるつらら
        const h = hash01(l.seed), h2 = hash01(l.seed + 7);
        g.lineTo(l.x0, l.y - off); g.lineTo(l.x0 + l.w * 0.25, l.y + 8 - off); g.lineTo(l.x0 + l.w * 0.38, l.y + 6 - off);
        g.lineTo(l.x0 + l.w * (0.45 + h * 0.1), l.y + 34 + h2 * 46 - off); g.lineTo(l.x0 + l.w * 0.6, l.y + 4 - off);
        g.lineTo(l.x0 + l.w * 0.78, l.y + 10 - off); g.lineTo(l.x0 + l.w * 0.86, l.y + 22 + h * 18 - off); g.lineTo(l.x0 + l.w * 0.92, l.y + 6 - off);
      } else g.ellipse(cx, l.y - off, l.w / 2, l.w * l.d * (th === 'storm' ? 0.8 : 1), 0, Math.PI, 0, true); // 丸いでこぼこ（葉っぱ・雲）
    }
  };
  g.save(); g.globalAlpha = 0.3 + 0.68 * k;
  g.beginPath(); g.moveTo(vis[0].x0, top); edge(0); g.lineTo(last.x0 + last.w, top); g.closePath();
  g.fillStyle = S.fill; g.fill();
  g.save(); g.clip(); // 天井の中のもよう
  if (th === 'forest') {
    g.fillStyle = 'rgba(30,110,50,0.22)';
    for (const l of vis) for (let j = 0; j < 2; j++) { const h = hash01(l.seed + j * 13), h2 = hash01(l.seed * 3 + j); g.beginPath(); g.ellipse(l.x0 + h * l.w, l.y - 60 - h2 * 140, 26 + h2 * 20, 12 + h * 8, (h - 0.5) * 1.2, 0, TAU); g.fill(); }
  } else if (th === 'castle') { // 石のブロック
    const W = Math.ceil(VWW) + 60, H = Math.ceil(VWH) + 60; // 石のブロック：前もって描いた1枚の絵を貼る
    g.drawImage(sprite(`ceil${W}x${H}`, W, H, (x, w, h) => { x.strokeStyle = 'rgba(60,48,84,0.35)'; x.lineWidth = 1.6; x.beginPath(); for (let y = 0; y <= h; y += 24) { x.moveTo(0, y); x.lineTo(w, y); const o = (Math.round(y / 24) % 2) * 24; for (let xx = o; xx <= w; xx += 48) { x.moveTo(xx, y); x.lineTo(xx, y + 24); } } x.stroke(); }), Math.floor(viewX / 48) * 48 - 2, Math.floor(viewY / 48) * 48 - 2);
  } else if (spikes) { // 岩（氷）のすじ
    g.strokeStyle = th === 'ice' ? 'rgba(255,255,255,0.5)' : 'rgba(120,110,140,0.35)'; g.lineWidth = 3;
    for (const l of vis) { const h = hash01(l.seed + 3); g.beginPath(); g.moveTo(l.x0 + l.w * 0.2, l.y - 40 - h * 60); g.lineTo(l.x0 + l.w * 0.5, l.y - 20 - h * 40); g.lineTo(l.x0 + l.w * 0.75, l.y - 50 - h * 50); g.stroke(); }
  } else if (th === 'storm') { // うずまく雲のかげ
    g.fillStyle = 'rgba(30,34,52,0.35)';
    for (const l of vis) { const h = hash01(l.seed + 5); g.beginPath(); g.ellipse(l.x0 + l.w * (0.3 + h * 0.4), l.y - 50 - h * 80, 50, 18, 0, 0, TAU); g.fill(); }
  }
  const flash = th === 'storm' && (bullets.some(b => b.kind === 'bolt' && b.life <= 18 && b.life > 10) || tick % 420 < 10);
  g.beginPath(); edge(th === 'castle' ? -8 : 10); g.strokeStyle = flash ? 'rgba(255,250,210,0.95)' : S.rim; g.lineWidth = 4; g.stroke(); // ふちの明るい線
  g.restore();
  g.beginPath(); edge(0); g.strokeStyle = S.line; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke(); // ふちの線
  g.restore();
}

/* ---------- 柱（奥：地形より先に描く） ---------- */
function drawPosts() {
  for (const t of trunks) {
    if (t.x + t.w * 3 < viewX || t.x - t.w * 3 > viewX + VWW) continue;
    const L = t.x - t.w / 2;
    if (t.kind === 'pillar') { // 城の石の柱（上に飾り、下に台）
      const top = t.top - 10;
      g.fillStyle = '#c3b9d6'; g.fillRect(L, top, t.w, t.gy - top);
      g.strokeStyle = 'rgba(90,75,115,0.45)'; g.lineWidth = 2; g.beginPath(); for (const u of [0.3, 0.5, 0.7]) { g.moveTo(L + t.w * u, top + 26); g.lineTo(L + t.w * u, t.gy - 18); } g.stroke();
      g.strokeStyle = '#4f4466'; g.lineWidth = 3; g.strokeRect(L, top, t.w, t.gy - top);
      g.fillStyle = '#a99ec0'; for (const [y, h] of [[top, 18], [t.gy - 16, 16]]) { g.fillRect(L - 8, y, t.w + 16, h); g.strokeRect(L - 8, y, t.w + 16, h); }
      continue;
    }
    if (t.kind === 'rockcol' || t.kind === 'icecol') { // 洞くつの柱（上と下が太く、まん中が細い）
      const top = t.top - 10, mid = (top + t.gy) / 2, ice = t.kind === 'icecol';
      g.beginPath(); g.moveTo(L - 10, top); g.lineTo(L + t.w + 10, top); g.quadraticCurveTo(t.x + t.w * 0.25, mid, L + t.w + 12, t.gy + 6); g.lineTo(L - 12, t.gy + 6); g.quadraticCurveTo(t.x - t.w * 0.25, mid, L - 10, top); g.closePath();
      g.fillStyle = ice ? 'rgba(180,225,250,0.85)' : '#5d566c'; g.fill(); g.strokeStyle = ice ? '#4a8cbd' : '#2c2836'; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = ice ? 'rgba(255,255,255,0.7)' : 'rgba(140,130,165,0.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(t.x - 4, top + 20); g.quadraticCurveTo(t.x - t.w * 0.1, mid, t.x - 6, t.gy - 20); g.stroke();
      continue;
    }
    // 森の木の幹：明るい茶色に、たてに並んだこげ茶のもよう
    const SEG = 3 * T, top = canopy[clamp(Math.floor(t.x / SEG), 0, canopy.length - 1)].y - 60;
    g.fillStyle = '#e2c084'; g.fillRect(L, top, t.w, t.gy - top + 8);
    g.fillStyle = 'rgba(150,105,55,0.75)';
    for (let y = top + (t.ph % 30), j = 0; y < t.gy; y += 30, j++) { const u = ((j * 37 + t.ph) % 7) / 7, cx = L + t.w * (0.25 + 0.5 * u); rrect(g, cx - 3, y, 6, 14, 3); g.fill(); }
    g.strokeStyle = '#7a5530'; g.lineWidth = 3; g.beginPath(); g.moveTo(L, top); g.lineTo(L, t.gy + 8); g.moveTo(L + t.w, top); g.lineTo(L + t.w, t.gy + 8); g.stroke();
    if (t.br) {
      const by = top + (t.gy - top) * t.by, ex = t.x + t.br * (t.w / 2 + 34);
      g.beginPath(); g.moveTo(t.x + t.br * t.w / 2, by + 8); g.lineTo(ex, by - 16); g.lineWidth = 6; g.strokeStyle = '#b8935c'; g.stroke();
      g.beginPath(); g.ellipse(ex + t.br * 6, by - 20, 12, 6, t.br * 0.6, 0, TAU); g.fillStyle = '#48a852'; g.fill(); g.strokeStyle = '#1f5a2c'; g.lineWidth = 1.5; g.stroke();
    }
  }
}

/* ---------- 空気の色と、遠くの景色（奥） ---------- */
const ENV_TINT = { forest: 'rgba(38,118,58,0.62)', canyon: 'rgba(255,140,70,0.12)', mountain: 'rgba(225,238,255,0.28)', cave: 'rgba(10,10,22,0.25)', ice: 'rgba(60,120,175,0.28)', storm: 'rgba(30,34,58,0.35)', castle: 'rgba(70,45,100,0.16)' };
function parallax(fac, S, fn) { // fac が大きいほど遠く（ゆっくり動く）
  const px = viewX * fac;
  for (let i = Math.floor((viewX - px - 400) / S); i <= Math.ceil((viewX + VWW - px + 400) / S); i++) fn(i * S + px, hash01(i * 97 + S), hash01(i * 31 + S * 3), i);
}
function drawEnvBack(th) {
  if (ENV_TINT[th]) { g.fillStyle = ENV_TINT[th]; g.fillRect(viewX - 10, viewY - 10, VWW + 20, VWH + 20); }
  const B = viewY + VWH;
  if (th === 'forest') {
    parallax(0.35, 180, (x, h, h2) => {
      const y = viewY + 120 + h2 * (VWH - 260);
      g.save(); g.translate(x + h * 80, y); g.rotate((h - 0.5) * 0.8); g.fillStyle = 'rgba(96,170,100,0.35)';
      g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2, a2 = a + TAU / 10; g.lineTo(Math.cos(a) * 34, Math.sin(a) * 34); g.lineTo(Math.cos(a2) * 13, Math.sin(a2) * 13); } g.closePath(); g.fill(); g.restore();
      if (h > 0.45) { g.fillStyle = 'rgba(22,70,36,0.45)'; g.beginPath(); for (const [dx, r] of [[-40, 46], [0, 60], [46, 44]]) { g.moveTo(x + dx + r, B); g.arc(x + dx, B - 90 + h2 * 30, r, Math.PI, 0); } g.fill(); }
    });
  } else if (th === 'canyon') { // 遠くの台地（2列）
    for (const [fac, S, col, hy] of [[0.65, 260, 'rgba(214,120,78,0.32)', 0.5], [0.42, 360, 'rgba(176,92,58,0.32)', 0.62]]) parallax(fac, S, (x, h, h2) => {
      const w = 120 + h * 160, top = viewY + VWH * hy - h2 * 120;
      g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2 - 20, B); g.lineTo(x - w / 2, top + 10); g.lineTo(x - w / 2 + 12, top); g.lineTo(x + w / 2 - 12, top); g.lineTo(x + w / 2, top + 10); g.lineTo(x + w / 2 + 20, B); g.closePath(); g.fill();
    });
  } else if (th === 'mountain') { // 遠くの雪山（2列）
    for (const [fac, S, col, hy] of [[0.65, 300, 'rgba(150,172,210,0.45)', 0.42], [0.42, 400, 'rgba(118,146,190,0.42)', 0.55]]) parallax(fac, S, (x, h, h2) => {
      const w = 200 + h * 200, top = viewY + VWH * hy - h2 * 110;
      g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2, B); g.lineTo(x, top); g.lineTo(x + w / 2, B); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.moveTo(x - w * 0.12, top + w * 0.16); g.lineTo(x, top); g.lineTo(x + w * 0.12, top + w * 0.16); g.lineTo(x + w * 0.04, top + w * 0.12); g.lineTo(x - w * 0.03, top + w * 0.18); g.closePath(); g.fill();
    });
  } else if (th === 'meadow') { // 遠くのなだらかな丘（2列）
    for (const [fac, S, col, hy] of [[0.65, 340, 'rgba(130,200,120,0.32)', 0.6], [0.4, 440, 'rgba(100,180,95,0.32)', 0.7]]) parallax(fac, S, (x, h, h2) => {
      const r = 160 + h * 140; g.fillStyle = col; g.beginPath(); g.ellipse(x, viewY + VWH * hy + r * 0.55 - h2 * 40, r, r * 0.55, 0, Math.PI, 0); g.lineTo(x + r, B); g.lineTo(x - r, B); g.closePath(); g.fill();
    });
  } else if (th === 'sky') { // 遠くの雲の山
    parallax(0.55, 300, (x, h, h2) => {
      const y = viewY + VWH * 0.62 + h2 * 60; g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath();
      for (const [dx, r] of [[-70, 50 + h * 20], [0, 70 + h2 * 20], [70, 46 + h * 24]]) { g.moveTo(x + dx + r, y); g.arc(x + dx, y, r, Math.PI, 0); }
      g.rect(x - 120, y, 240, B - y); g.fill();
    });
  } else if (th === 'cave' || th === 'ice') { // 奥の岩（氷）の柱
    parallax(0.5, 230, (x, h, h2) => {
      if (h < 0.35) return;
      const w = 50 + h * 50; g.fillStyle = th === 'ice' ? 'rgba(130,190,230,0.3)' : 'rgba(80,72,100,0.55)';
      g.beginPath(); g.moveTo(x - w / 2, viewY - 20); g.lineTo(x + w / 2, viewY - 20); g.quadraticCurveTo(x + w * 0.15, viewY + VWH / 2, x + w / 2 + 10, B); g.lineTo(x - w / 2 - 10, B); g.quadraticCurveTo(x - w * 0.15, viewY + VWH / 2, x - w / 2, viewY - 20); g.closePath(); g.fill();
    });
  } else if (th === 'storm') { // 遠くの雨のカーテンと、暗い雲の山
    parallax(0.6, 280, (x, h, h2) => {
      g.fillStyle = 'rgba(50,54,82,0.4)'; const y = viewY + VWH * 0.68 + h2 * 50; g.beginPath();
      for (const [dx, r] of [[-60, 40 + h * 20], [0, 60], [60, 38 + h2 * 20]]) { g.moveTo(x + dx + r, y); g.arc(x + dx, y, r, Math.PI, 0); }
      g.rect(x - 100, y, 200, B - y); g.fill();
      if (h > 0.5) { g.strokeStyle = 'rgba(120,130,170,0.25)'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 6; k++) { g.moveTo(x - 50 + k * 18, viewY + 60); g.lineTo(x - 80 + k * 18, y); } g.stroke(); }
    });
  }
}

/* ---------- 手前の小物 ---------- */
function drawEnvFront(th) {
  if (th === 'meadow' || th === 'mountain') { // 地面のふちの草（風でゆれる）／雪の吹きだまり
    const c0 = Math.max(0, Math.floor(viewX / T) - 1), c1 = Math.min(LW - 1, Math.ceil((viewX + VWW) / T) + 1);
    const wind = th === 'meadow' && effects.gust > 0 ? (effects.gustDir || 1) * 5 : 0;
    g.save(); g.lineCap = 'round';
    for (let c = c0; c <= c1; c++) {
      let r = Math.max(0, Math.floor(viewY / T)); while (r < ROWS - 1 && !solid(c, r)) r++;
      if (r >= ROWS - 1 || tileAt(c, r) !== 1) continue;
      const y = r * T, h = hash01(c * 53 + 9);
      if (th === 'meadow') {
        g.strokeStyle = h > 0.5 ? '#4f9a52' : '#62b562'; g.lineWidth = 2;
        for (let k = 0; k < 3; k++) { const x = c * T + 3 + k * 7, len = 6 + hash01(c * 7 + k) * 8, sw = Math.sin(tick / 25 + c * 0.7 + k) * 1.5 + wind; g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x + sw * 0.4, y - len * 0.5, x + sw, y - len); g.stroke(); }
      } else if (h > 0.6) { g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(c * T + T / 2, y + 2, 14 + h * 10, 6, 0, Math.PI, 0); g.fill(); }
    }
    g.restore();
  }
}
