'use strict';

/* =====================================================
   ふしぎのマスのイラスト（ノートにかいたラクガキ風）
   drawEventArt(ctx, id, W, H)：ctx は W×H の大きさとして描く
   ===================================================== */
function drawEventArt(ctx, id, W, H) {
  const x = ctx, INK = '#24252b', t = (typeof tick === 'number' ? tick : 0);
  const S = Math.min(W / 240, H / 150); // 240×150 を基準にした大きさ
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  x.fillStyle = '#f7f9fc'; x.fillRect(0, 0, W, H);
  x.translate(W / 2 - 120 * S, H / 2 - 75 * S); x.scale(S, S); // ここから 240×150 の座標
  const P = (...pts) => { x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); };
  const fs = (fill, lw = 2.4) => { if (fill) { x.fillStyle = fill; x.fill(); } x.strokeStyle = INK; x.lineWidth = lw; x.stroke(); };
  const circ = (cx, cy, r) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); };
  const ell = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); };
  const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
  const spark = (cx, cy, r, col = '#ffd23f') => { x.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, q = k % 2 ? r * 0.4 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fillStyle = col; x.fill(); };
  const face = (cx, cy, r, col, mood = 'smile') => { // ラクガキのキャラ（丸い顔と足）
    P(cx - r * 0.35, cy + r * 0.9, cx - r * 0.45, cy + r * 1.6); P(cx + r * 0.35, cy + r * 0.9, cx + r * 0.45, cy + r * 1.6); x.strokeStyle = INK; x.lineWidth = 2.4; x.stroke();
    P(cx - r * 0.35, cy + r * 0.9, cx - r * 0.45, cy + r * 1.6); x.stroke();
    circ(cx, cy, r); fs('#fff', 3); circ(cx, cy, r - 3); x.strokeStyle = col; x.lineWidth = 3; x.stroke();
    x.fillStyle = INK; circ(cx - r * 0.33, cy - r * 0.12, r * 0.1); x.fill(); circ(cx + r * 0.33, cy - r * 0.12, r * 0.1); x.fill();
    x.beginPath();
    if (mood === 'smile') x.arc(cx, cy + r * 0.12, r * 0.35, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (mood === 'sad') x.arc(cx, cy + r * 0.55, r * 0.3, 1.15 * Math.PI, 1.85 * Math.PI);
    else { x.moveTo(cx - r * 0.25, cy + r * 0.35); x.lineTo(cx + r * 0.25, cy + r * 0.35); }
    x.strokeStyle = INK; x.lineWidth = 2; x.stroke();
  };
  const card = (cx, cy, rot, col = '#fff') => { x.save(); x.translate(cx, cy); x.rotate(rot); rr(-14, -19, 28, 38, 4); fs(col, 2.2); rr(-9, -13, 18, 14, 2); fs('#d6e2f1', 1.4); x.restore(); };
  const cloud = (list, fill = '#fff', lw = 5) => { // まるの集まり。中の線は見せない
    const path = () => { x.beginPath(); for (const [cx, cy, r] of list) { x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, Math.PI * 2); } };
    if (lw) { path(); x.strokeStyle = INK; x.lineWidth = lw; x.stroke(); } path(); x.fillStyle = fill; x.fill();
  };
  /* ---- 背景：イベントごとの場所を書きこむ（枠いっぱいにぬる） ---- */
  let seed = 7; for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647; // いつも同じ並びになる乱数
  const LX = -60, RX = 300, TOP = -40, BOT = 190;
  const grad = (stops, y0 = TOP, y1 = 128) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const sky = stops => { x.fillStyle = grad(stops); x.fillRect(LX, TOP, RX - LX, BOT - TOP); };
  const soft = (a = 0.35) => `rgba(36,37,43,${a})`;
  const glow = (gx, gy, r, col) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2); };
  const hills = (base, amp, n, fill, line = soft(0.3)) => { x.beginPath(); x.moveTo(LX, BOT); x.lineTo(LX, base); const w = (RX - LX) / n; for (let i = 0; i < n; i++) { const x0 = LX + i * w; x.quadraticCurveTo(x0 + w / 2, base - amp * (0.6 + rnd() * 0.8), x0 + w, base); } x.lineTo(RX, BOT); x.closePath(); x.fillStyle = fill; x.fill(); x.strokeStyle = line; x.lineWidth = 2; x.stroke(); };
  const sun = (sx, sy, r = 13) => { glow(sx, sy, r * 3, 'rgba(255,240,160,0.75)'); circ(sx, sy, r); fs('#ffe066', 2); };
  const stars = (n, y1 = 90) => { for (let k = 0; k < n; k++) { const sx = rnd() * 240, sy = rnd() * y1, r = 0.8 + rnd() * 1.4; x.fillStyle = `rgba(255,250,220,${0.5 + rnd() * 0.5})`; circ(sx, sy, r); x.fill(); } spark(rnd() * 240, 10 + rnd() * 30, 4, '#fff6c8'); };
  const tree = (tx, ty, s, leaf = '#6fbf73', trunk = '#9a6b45') => { rr(tx - 2.5 * s, ty - 18 * s, 5 * s, 18 * s, 1.5 * s); x.fillStyle = trunk; x.fill(); x.strokeStyle = INK; x.lineWidth = 1.4; x.stroke(); cloud([[tx, ty - 27 * s, 10 * s], [tx - 8 * s, ty - 20 * s, 7.5 * s], [tx + 8 * s, ty - 20 * s, 7.5 * s]], leaf, 3); };
  const floorFill = (y, top, bottom) => { x.fillStyle = grad([top, bottom], y, BOT); x.fillRect(LX, y, RX - LX, BOT - y); };
  const groundLine = y => { P(LX, y, RX, y); x.strokeStyle = INK; x.lineWidth = 2.4; x.stroke(); };
  const grass = (y, col, dark, flowers = 9) => {
    floorFill(y, col, dark); groundLine(y);
    x.strokeStyle = dark; x.lineWidth = 1.5;
    for (let k = 0; k < 28; k++) { const gx = rnd() * 260 - 10, gy = y + 5 + rnd() * 22; P(gx - 3, gy - 4, gx, gy, gx + 3, gy - 5); x.stroke(); }
    for (let k = 0; k < 18; k++) { const gx = rnd() * 260 - 10; P(gx - 2, y + 1, gx, y - 4 - rnd() * 3, gx + 2, y + 1); x.stroke(); }
    for (let k = 0; k < flowers; k++) { const fx = rnd() * 240, fy = y + 7 + rnd() * 16; x.fillStyle = ['#fff', '#ffc2d4', '#ffe58a'][k % 3]; for (let a = 0; a < 5; a++) { circ(fx + Math.cos(a * 1.26) * 2.3, fy + Math.sin(a * 1.26) * 2.3, 1.7); x.fill(); } x.fillStyle = '#f2a65a'; circ(fx, fy, 1.2); x.fill(); }
  };
  const mushroom = (mx, my, s = 1) => { rr(mx - 2.5 * s, my - 7 * s, 5 * s, 7 * s, 2); fs('#fff4dc', 1.4); x.beginPath(); x.ellipse(mx, my - 7 * s, 7 * s, 6 * s, 0, Math.PI, 0); x.closePath(); fs('#e8305f', 1.6); x.fillStyle = '#fff'; circ(mx - 3 * s, my - 10 * s, 1.3 * s); x.fill(); circ(mx + 2.5 * s, my - 9 * s, 1.1 * s); x.fill(); };
  const SCENE = { inkpool: 'meadow', dropped: 'meadow', rope: 'meadow', catch: 'meadow', spring: 'forest', lost: 'forest', vending: 'dusk', thief: 'night', sharpener: 'room', mirror: 'room', bookstore: 'shop', nap: 'sky', dice: 'sky', cursedbox: 'cave', eraserbite: 'cave', swamp: 'swamp', trap: 'swamp', cups: 'castle', guard: 'castle', simon: 'castle', taiko: 'festival' };
  const kind = SCENE[id] || 'meadow';
  let groundFn = y => grass(y, '#93d06f', '#5fa54a');
  if (kind === 'meadow') {
    sky(['#8fcdf9', '#cfeaff', '#f2faff']); sun(208, 24);
    cloud([[30, 26, 7], [40, 21, 9], [52, 26, 6]], '#fff', 3); cloud([[140, 14, 6], [150, 10, 8], [161, 15, 6]], '#fff', 3);
    hills(100, 26, 3, '#c9e8b4'); for (let k = 0; k < 6; k++) tree(10 + k * 42 + rnd() * 16, 104 + rnd() * 4, 0.45, '#a6d78e', '#a98a6a');
    hills(114, 14, 4, '#a9da8f');
    // 柵
    x.strokeStyle = '#a07a52'; x.lineWidth = 2; for (let k = 0; k < 5; k++) { P(4 + k * 11, 128, 4 + k * 11, 112); x.stroke(); } P(0, 116, 50, 116); x.stroke(); P(0, 122, 50, 122); x.stroke();
  } else if (kind === 'forest') {
    sky(['#a9d39a', '#d3eabf', '#ecf5dc']);
    for (let k = 0; k < 10; k++) { const tx = -20 + k * 28 + rnd() * 12, w = 5 + rnd() * 6; x.fillStyle = 'rgba(96,140,88,0.28)'; x.fillRect(tx - w / 2, -40, w, 170); }
    x.save(); x.globalAlpha = 0.3; x.fillStyle = '#fffbe0'; for (const [a, b] of [[54, 80], [124, 142], [176, 190]]) { P(a, -40, b, -40, b + 46, 130, a + 30, 130); x.fill(); } x.restore();
    for (const [tx, w] of [[6, 20], [38, 10], [206, 13], [236, 22]]) {
      P(tx - w / 2, -40, tx + w / 2, -40, tx + w / 2, 120, tx + w / 2 + 5, 129, tx - w / 2 - 5, 129, tx - w / 2, 120); x.closePath(); fs('#8a6a4a', 2);
      x.strokeStyle = 'rgba(60,40,24,0.45)'; x.lineWidth = 1.3; for (let k = 0; k < 4; k++) { const by = 20 + rnd() * 90, bx = tx - w / 4 + rnd() * w / 2; P(bx, by, bx + 1, by + 8 + rnd() * 6); x.stroke(); }
    }
    const top = []; for (let k = -1; k < 12; k++) top.push([k * 24 + rnd() * 8, -4 + rnd() * 12, 16 + rnd() * 9]);
    cloud(top, '#5fa65c', 4); const hi = top.filter((_, i) => i % 2).map(([cx, cy, r]) => [cx - 3, cy - 4, r * 0.55]); x.save(); x.globalAlpha = 0.35; cloud(hi, '#9fd38a', 0); x.restore();
    groundFn = y => { grass(y, '#86c06a', '#4f8f45', 4); mushroom(20, y + 12, 1.1); mushroom(30, y + 15, 0.8); mushroom(222, y + 14, 1); for (const fx of [52, 196]) for (let a = -2; a <= 2; a++) { x.strokeStyle = '#3f7d3a'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(fx, y + 6); x.quadraticCurveTo(fx + a * 5, y - 6, fx + a * 9, y - 4 + Math.abs(a) * 2); x.stroke(); } };
  } else if (kind === 'dusk' || kind === 'night') {
    const night = kind === 'night';
    sky(night ? ['#1d2558', '#353a7a', '#5a559c'] : ['#5f62c0', '#d88ab5', '#ffc48a']);
    if (night) { stars(26); circ(204, 26, 12); fs('#fff4c2', 2); x.fillStyle = 'rgba(200,190,140,0.5)'; circ(200, 23, 2.5); x.fill(); circ(207, 30, 2); x.fill(); }
    else { glow(46, 100, 60, 'rgba(255,210,140,0.8)'); circ(46, 104, 20); fs('#ffa66b', 2); for (const [cx, cy] of [[150, 30], [190, 46]]) cloud([[cx, cy, 6], [cx + 9, cy - 3, 7], [cx + 18, cy, 5]], '#f6b9cc', 3); }
    let bx = -12;
    while (bx < 250) { const w = 24 + rnd() * 18, h = 30 + rnd() * 42, by = 128 - h; x.beginPath(); x.moveTo(bx, 128); x.lineTo(bx, by); if (rnd() < 0.45) { x.lineTo(bx + w / 2, by - 12); } x.lineTo(bx + w, by); x.lineTo(bx + w, 128); x.closePath(); fs(night ? '#363b70' : '#7a5f9c', 1.6);
      for (let wy = by + 7; wy < 120; wy += 12) for (let wx = bx + 5; wx < bx + w - 6; wx += 9) { x.fillStyle = rnd() < 0.45 ? '#ffe58a' : night ? '#262a55' : '#62498a'; x.fillRect(wx, wy, 5, 6); }
      bx += w + 2 + rnd() * 6; }
    const lx = night ? 30 : 214; glow(lx, 56, 34, 'rgba(255,230,140,0.75)'); rr(lx - 2, 56, 4, 72, 2); fs('#4a4d6b', 1.6); rr(lx - 8, 48, 16, 12, 4); fs('#ffe58a', 2);
    groundFn = y => { floorFill(y, night ? '#6a6893' : '#b7a9c4', night ? '#47466e' : '#8d7fa6'); x.fillStyle = night ? '#7f7da6' : '#cdbfd8'; x.fillRect(LX, y, RX - LX, 5); groundLine(y); P(LX, y + 5, RX, y + 5); x.strokeStyle = soft(0.35); x.lineWidth = 1.4; x.stroke(); x.strokeStyle = soft(0.18); for (let k = -6; k <= 6; k++) { P(120 + k * 22, y + 5, 120 + k * 40, BOT); x.stroke(); } P(LX, y + 15, RX, y + 15); x.stroke(); };
  } else if (kind === 'room') {
    x.fillStyle = '#fbeed6'; x.fillRect(LX, TOP, RX - LX, 170); x.fillStyle = '#f4dfbb'; for (let i = -40; i < 280; i += 20) x.fillRect(i, TOP, 8, 170);
    x.fillStyle = '#e2bf8e'; x.fillRect(LX, 96, RX - LX, 32); P(LX, 96, RX, 96); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.strokeStyle = 'rgba(122,82,54,0.35)'; x.lineWidth = 1.2; for (let i = -40; i < 280; i += 16) { P(i, 98, i, 128); x.stroke(); }
    rr(14, 18, 52, 56, 3); x.fillStyle = grad(['#8fcdf9', '#e6f5ff'], 18, 74); x.fill(); x.strokeStyle = INK; x.lineWidth = 2.4; x.stroke(); cloud([[30, 40, 5], [37, 37, 6], [45, 40, 4]], '#fff', 2.5); P(40, 18, 40, 74); x.stroke(); P(14, 46, 66, 46); x.stroke();
    for (const [cx0, s] of [[8, 1], [72, -1]]) { x.beginPath(); x.moveTo(cx0, 12); x.quadraticCurveTo(cx0 + s * 12, 50, cx0 + s * 2, 84); x.lineTo(cx0 - s * 6, 84); x.lineTo(cx0 - s * 6, 12); x.closePath(); fs('#f7a9bf', 2); }
    rr(2, 10, 76, 5, 2); fs('#c99a68', 1.8);
    if (id === 'sharpener') { rr(200, 26, 30, 24, 2); fs('#fff', 2); x.strokeStyle = '#5b8def'; x.lineWidth = 2; x.beginPath(); x.moveTo(205, 44); x.quadraticCurveTo(212, 30, 218, 42); x.quadraticCurveTo(222, 48, 226, 32); x.stroke(); rr(196, 64, 40, 4, 1); fs('#c99a68', 1.6); for (const [px, c] of [[204, '#e8305f'], [214, '#5b8def'], [224, '#33b06a']]) { rr(px - 3, 50, 6, 14, 1); fs(c, 1.4); } }
    else { rr(212, 100, 18, 22, 3); fs('#e8925a', 1.8); for (const a of [-0.6, 0, 0.6]) { x.save(); x.translate(221, 100); x.rotate(a); ell(0, -12, 5, 11); fs('#6fbf73', 1.6); x.restore(); } }
    groundFn = y => { floorFill(y, '#d4a167', '#b07f47'); groundLine(y); x.strokeStyle = 'rgba(90,55,25,0.35)'; x.lineWidth = 1.3; for (const dy of [9, 21, 36]) { P(LX, y + dy, RX, y + dy); x.stroke(); } for (let k = 0; k < 14; k++) { const px = rnd() * 260 - 10, row = [0, 9, 21][k % 3]; P(px, y + row, px, y + row + (row === 21 ? 15 : row === 9 ? 12 : 9)); x.stroke(); } };
  } else if (kind === 'shop') {
    x.fillStyle = grad(['#8a5f3a', '#b88a5c'], TOP, 128); x.fillRect(LX, TOP, RX - LX, 170); x.strokeStyle = 'rgba(60,35,15,0.3)'; x.lineWidth = 1.4; for (let i = -40; i < 280; i += 14) { P(i, TOP, i, 128); x.stroke(); }
    rr(196, 22, 36, 38, 3); x.fillStyle = grad(['#3a3f86', '#8b7cc9'], 22, 60); x.fill(); x.strokeStyle = INK; x.lineWidth = 2.2; x.stroke(); circ(222, 32, 5); fs('#fff4c2', 1.4); P(214, 22, 214, 60); x.strokeStyle = INK; x.stroke();
    glow(26, 40, 46, 'rgba(255,214,120,0.7)'); P(26, -40, 26, 24); x.strokeStyle = INK; x.lineWidth = 1.6; x.stroke(); P(16, 34, 36, 34, 30, 22, 22, 22); x.closePath(); fs('#2f6b4f', 2); circ(26, 38, 4); fs('#ffe58a', 1.4);
    groundFn = y => { floorFill(y, '#8f6038', '#6c4526'); groundLine(y); x.strokeStyle = 'rgba(40,20,5,0.35)'; x.lineWidth = 1.2; for (const dy of [10, 24]) { P(LX, y + dy, RX, y + dy); x.stroke(); }
      const books = (bx, n) => { for (let k = 0; k < n; k++) { const w = 26 - (k % 2) * 4 + rnd() * 4; rr(bx - w / 2 + (rnd() - 0.5) * 4, y - 7 - k * 7, w, 7, 1.5); fs(['#e8305f', '#5b8def', '#33b06a', '#ffd23f', '#b693e8'][(k + n) % 5], 1.5); } };
      books(28, 4); books(210, 3); books(232, 2); };
  } else if (kind === 'sky') {
    sky(['#6fb8f0', '#acd8fa', '#e4f4ff']); sun(30, 26, 12);
    for (let k = 0; k < 6; k++) { const cx = 64 + rnd() * 176, cy = 30 + rnd() * 60, r = 5 + rnd() * 5; x.fillStyle = 'rgba(255,255,255,0.75)'; for (const [dx, dy, s] of [[0, 0, 1], [r, 2, 0.75], [-r, 2, 0.7]]) { circ(cx + dx, cy + dy, r * s); x.fill(); } }
    x.strokeStyle = soft(0.55); x.lineWidth = 1.6; for (const [bx, by] of [[196, 30], [208, 24], [186, 40]]) { x.beginPath(); x.moveTo(bx - 5, by); x.quadraticCurveTo(bx - 2, by - 4, bx, by); x.quadraticCurveTo(bx + 2, by - 4, bx + 5, by); x.stroke(); }
    const bank = (y, fill, lw) => { const l = []; for (let k = -2; k < 13; k++) l.push([k * 22 + rnd() * 8, y + rnd() * 6, 14 + rnd() * 8]); cloud(l, fill, lw); x.fillStyle = fill; x.fillRect(LX, y + 8, RX - LX, BOT); };
    bank(124, '#d5eafb', 0); bank(140, '#eef7ff', 3);
    groundFn = y => { const l = []; for (let k = -2; k < 13; k++) l.push([k * 22 + rnd() * 6, y + 10, 14 + rnd() * 6]); cloud(l, '#fff', 4.5); x.fillStyle = '#fff'; x.fillRect(LX, y + 10, RX - LX, BOT); x.fillStyle = '#e1effb'; for (const [cx, cy, r] of l) { ell(cx, cy + r * 0.7, r * 0.7, 3); x.fill(); } };
  } else if (kind === 'cave') {
    sky(['#463b70', '#5c5190', '#7368a6']);
    hills(104, 34, 4, '#5f5592', soft(0.4)); hills(118, 18, 5, '#6c62a0', soft(0.35));
    for (let k = 0; k < 11; k++) { const tx = -10 + k * 25 + rnd() * 10, len = 12 + rnd() * 26, w = 6 + rnd() * 5; P(tx - w, -40, tx + w, -40, tx + 1, -2 + len); x.closePath(); fs('#4a4078', 1.6); }
    for (let k = 0; k < 7; k++) { x.fillStyle = 'rgba(190,170,255,0.5)'; circ(rnd() * 240, 20 + rnd() * 80, 1 + rnd()); x.fill(); }
    groundFn = y => { floorFill(y, '#7f74b0', '#584d88'); groundLine(y); for (let k = 0; k < 12; k++) { ell(rnd() * 250 - 5, y + 6 + rnd() * 20, 3 + rnd() * 5, 2 + rnd() * 2); fs('#9b90c8', 1.2); }
      const crystal = (cx, cy, h, a, col) => { x.save(); x.translate(cx, cy); x.rotate(a); P(-4, 0, -5, -h * 0.7, 0, -h, 5, -h * 0.7, 4, 0); x.closePath(); fs(col, 1.8); x.fillStyle = 'rgba(255,255,255,0.45)'; P(-2, -2, -3, -h * 0.65, 0, -h * 0.9); x.fill(); x.restore(); };
      for (const [cx, col] of [[22, '#8fe3f2'], [216, '#d2a8f5']]) { glow(cx, y - 10, 30, col === '#8fe3f2' ? 'rgba(143,227,242,0.55)' : 'rgba(210,168,245,0.55)'); crystal(cx - 8, y + 2, 18, -0.4, col); crystal(cx, y + 2, 28, 0, col); crystal(cx + 8, y + 2, 16, 0.45, col); } };
  } else if (kind === 'swamp') {
    sky(['#7f9a8e', '#a9bda0', '#cfd9bb']);
    x.strokeStyle = 'rgba(64,80,64,0.35)'; x.lineCap = 'round';
    for (let k = 0; k < 5; k++) { const tx = 20 + k * 50 + rnd() * 20; x.lineWidth = 5; P(tx, 128, tx + 2, 60 + rnd() * 20); x.stroke(); x.lineWidth = 2.5; P(tx + 1, 86, tx - 12, 72); x.stroke(); P(tx + 2, 78, tx + 14, 66); x.stroke(); }
    for (const [fy, a] of [[96, 0.35], [112, 0.45]]) { x.fillStyle = `rgba(255,255,255,${a})`; for (let k = 0; k < 4; k++) { ell(k * 70 + rnd() * 20, fy + rnd() * 6, 50, 6); x.fill(); } }
    for (const [tx, s] of [[8, 1], [232, -1]]) { P(tx - 7, 129, tx - 5, 40, tx - 2, -40, tx + 6, -40, tx + 5, 40, tx + 8, 129); x.closePath(); fs('#6d6650', 2); x.strokeStyle = INK; x.lineWidth = 3; P(tx + s * 4, 60, tx + s * 26, 44, tx + s * 34, 48); x.stroke(); P(tx + s * 24, 46, tx + s * 28, 34); x.stroke(); }
    for (let k = 0; k < 7; k++) { const fx = 30 + rnd() * 180, fy = 30 + rnd() * 70; glow(fx, fy, 6, 'rgba(255,240,120,0.9)'); x.fillStyle = '#fff6a0'; circ(fx, fy, 1.4); x.fill(); }
    groundFn = y => { floorFill(y, '#7c8858', '#58623f'); groundLine(y); for (let k = 0; k < 5; k++) { ell(rnd() * 240, y + 10 + rnd() * 14, 10 + rnd() * 8, 2.5); x.fillStyle = 'rgba(60,75,95,0.55)'; x.fill(); }
      for (const rx of [18, 26, 34, 206, 214, 226]) { const h = 18 + rnd() * 14; x.strokeStyle = '#4c5a35'; x.lineWidth = 1.8; P(rx, y + 4, rx + (rnd() - 0.5) * 4, y - h); x.stroke(); if (rnd() < 0.6) { ell(rx, y - h + 3, 2.4, 6); fs('#7a5134', 1.2); } } };
  } else if (kind === 'castle') {
    x.fillStyle = grad(['#b5aac9', '#d8d0e4'], TOP, 128); x.fillRect(LX, TOP, RX - LX, 170); x.strokeStyle = soft(0.16); x.lineWidth = 1.2;
    for (let r = 0; r * 12 + TOP < 128; r++) { const yy = TOP + r * 12; P(LX, yy, RX, yy); x.stroke(); for (let c = -4; c < 22; c++) { const xx = c * 22 + (r % 2) * 11; P(xx, yy, xx, yy + 12); x.stroke(); } }
    for (const wx of [18, 198]) { x.beginPath(); x.moveTo(wx, 70); x.lineTo(wx, 30); x.arc(wx + 12, 30, 12, Math.PI, 0); x.lineTo(wx + 24, 70); x.closePath(); x.fillStyle = grad(['#2f3a80', '#7d8fd6'], 18, 70); x.fill(); x.strokeStyle = INK; x.lineWidth = 2.4; x.stroke(); P(wx + 12, 18, wx + 12, 70); x.lineWidth = 1.6; x.stroke(); x.fillStyle = '#fff4c2'; circ(wx + 6, 32, 1.4); x.fill(); circ(wx + 18, 44, 1.2); x.fill(); }
    for (const bx of [64, 160]) { P(bx, -40, bx + 16, -40, bx + 16, 40, bx + 8, 34, bx, 40); x.closePath(); fs('#c9374f', 2); x.strokeStyle = '#ffd23f'; x.lineWidth = 1.6; P(bx + 3, -40, bx + 3, 34); x.stroke(); P(bx + 13, -40, bx + 13, 34); x.stroke(); rr(bx + 3, 10, 10, 7, 2); fs('#fbe6ee', 1.2); x.fillStyle = '#5b8def'; x.fillRect(bx + 3, 10, 3.5, 7); }
    for (const tx of [6, 234]) { glow(tx, 74, 22, 'rgba(255,180,90,0.7)'); rr(tx - 3, 78, 6, 14, 2); fs('#6b5a4a', 1.6); x.beginPath(); x.moveTo(tx, 64); x.quadraticCurveTo(tx + 7, 74, tx, 79); x.quadraticCurveTo(tx - 7, 74, tx, 64); fs('#ffb347', 1.6); }
    groundFn = y => { floorFill(y, '#a99dc0', '#8b7fa6'); groundLine(y); x.strokeStyle = soft(0.2); x.lineWidth = 1.2; for (let k = -6; k <= 6; k++) { P(120 + k * 24, y, 120 + k * 44, BOT); x.stroke(); } for (const dy of [9, 22]) { P(LX, y + dy, RX, y + dy); x.stroke(); }
      P(96, y, 144, y, 168, BOT, 72, BOT); x.closePath(); fs('#c9374f', 2); x.strokeStyle = '#ffd23f'; x.lineWidth = 1.6; P(100, y + 1, 79, BOT); x.stroke(); P(140, y + 1, 161, BOT); x.stroke(); };
  } else if (kind === 'festival') {
    sky(['#1f2660', '#38387f', '#6b4f99']); stars(22, 70);
    for (const [fx, fy, r, cs] of [[120, 38, 17, ['#ff7a9c', '#ffd23f']], [22, 58, 10, ['#8fe3f2', '#fff']], [220, 60, 11, ['#b6f08a', '#ffd23f']]]) { for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; x.strokeStyle = cs[k % 2]; x.lineWidth = 1.8; P(fx + Math.cos(a) * r * 0.35, fy + Math.sin(a) * r * 0.35, fx + Math.cos(a) * r, fy + Math.sin(a) * r); x.stroke(); x.fillStyle = cs[k % 2]; circ(fx + Math.cos(a) * (r + 3), fy + Math.sin(a) * (r + 3), 1.1); x.fill(); } }
    for (const [sx, w, s] of [[-6, 56, 1], [190, 56, -1]]) { const roofY = 82; rr(sx, roofY + 8, w, 38, 1); fs('#7b4a3a', 1.8); for (let k = 0; k < 5; k++) { P(sx + k * w / 5, roofY, sx + (k + 1) * w / 5, roofY, sx + (k + 1) * w / 5 + 2, roofY + 12, sx + k * w / 5 + 2, roofY + 12); x.closePath(); fs(k % 2 ? '#fff' : '#e8305f', 1.4); } glow(sx + w / 2, roofY + 24, 24, 'rgba(255,200,120,0.55)'); }
    x.strokeStyle = INK; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-20, 0); x.quadraticCurveTo(120, 30, 260, 0); x.stroke();
    for (let k = 0; k <= 10; k++) { const u = k / 10, lx = (1 - u) * (1 - u) * -20 + 2 * (1 - u) * u * 120 + u * u * 260, ly = 2 * (1 - u) * u * 30 + 4; glow(lx, ly + 4, 12, 'rgba(255,170,100,0.6)'); ell(lx, ly + 4, 5, 6.5); fs(k % 3 === 1 ? '#ffd23f' : '#ff7a59', 1.4); }
    groundFn = y => { floorFill(y, '#c29a70', '#94704c'); groundLine(y); for (let k = 0; k < 10; k++) { ell(rnd() * 240, y + 6 + rnd() * 20, 2 + rnd() * 2, 1.4); x.fillStyle = 'rgba(90,60,30,0.45)'; x.fill(); } for (const gx of [40, 120, 200]) { x.fillStyle = 'rgba(255,214,140,0.35)'; ell(gx, y + 10, 34, 5); x.fill(); } };
  }
  const ground = (y = 128) => groundFn(y);
  const bob = Math.sin(t / 20) * 2;
  switch (id) {
    case 'inkpool': { // インクだまりからカードが出てくる
      ground(); ell(120, 122, 70, 16); fs('#2d3a66'); ell(105, 118, 22, 4); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fill();
      card(122, 92 + bob, -0.15, '#ffe58a'); spark(150, 70, 9); spark(92, 78, 6); spark(165, 100, 5, '#8fd0e8');
      for (const [dx, r] of [[-45, 10], [48, 8]]) { x.beginPath(); x.ellipse(120 + dx, 122, r, 3, 0, 0, Math.PI * 2); x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 1.5; x.stroke(); }
      break;
    }
    case 'sharpener': { // えんぴつけずり
      ground(); rr(78, 70, 64, 50, 8); fs('#e8305f'); rr(90, 82, 22, 22, 4); fs('#ffd8e2', 2);
      x.save(); x.translate(100, 93); x.rotate(-0.12); P(0, -6, 95, -6, 95, 6, 0, 6); fs('#ffd84a'); P(95, -6, 110, -6, 110, 6, 95, 6); fs('#f2a3b3'); P(0, -6, -14, 0, 0, 6); fs('#e9c69a'); P(-14, 0, -6, -2.4, -6, 2.4); fs(INK, 1); x.restore();
      for (const [sx, sy, a] of [[62, 124, 0.4], [150, 126, -0.3], [70, 112, 1.2]]) { x.save(); x.translate(sx, sy); x.rotate(a); P(-6, 0, 0, -4, 6, 0); fs('#e9c69a', 1.6); x.restore(); }
      spark(160, 62, 7); break;
    }
    case 'spring': { // げんきの泉
      ground(); ell(120, 120, 62, 14); fs('#9fd3f4'); rr(108, 72, 24, 48, 6); fs('#c9d2df');
      x.strokeStyle = '#3e8fd6'; x.lineWidth = 3;
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(120, 72); x.quadraticCurveTo(120 + s * 30, 40 + bob, 120 + s * 48, 112); x.stroke(); }
      for (const [hx, hy, s] of [[70, 58, 7], [170, 52, 9], [150, 28, 6]]) { x.save(); x.translate(hx, hy + bob); x.beginPath(); x.moveTo(0, s * 0.9); x.bezierCurveTo(-s * 1.4, -s * 0.2, -s * 0.6, -s * 1.3, 0, -s * 0.5); x.bezierCurveTo(s * 0.6, -s * 1.3, s * 1.4, -s * 0.2, 0, s * 0.9); fs('#f27eb1', 1.8); x.restore(); }
      break;
    }
    case 'dropped': case 'cursedbox': { // たからばこ（のろいは黒い箱）
      const curse = id === 'cursedbox';
      ground();
      if (curse) { const g = x.createRadialGradient(120, 96, 10, 120, 96, 80); g.addColorStop(0, 'rgba(140,80,200,0.45)'); g.addColorStop(1, 'rgba(140,80,200,0)'); x.fillStyle = g; x.fillRect(30, 10, 180, 140); }
      else { x.save(); x.globalAlpha = 0.5; x.strokeStyle = '#ffd23f'; x.lineWidth = 4; for (let k = 0; k < 7; k++) { const a = -Math.PI * (0.15 + k * 0.7 / 6); P(120 + Math.cos(a) * 30, 80 + Math.sin(a) * 30, 120 + Math.cos(a) * 64, 80 + Math.sin(a) * 64); x.stroke(); } x.restore(); }
      rr(80, 84, 80, 42, 5); fs(curse ? '#3b2f55' : '#c99a68'); P(80, 100, 160, 100); x.stroke();
      x.save(); x.translate(80, 84); x.rotate(curse ? -0.08 : -0.5); rr(0, -22, 80, 22, 8); fs(curse ? '#4b3a6b' : '#d9ad7c'); x.restore();
      rr(114, 94, 12, 14, 2); fs(curse ? '#9a7bd0' : '#ffd23f', 2);
      if (curse) { circ(120, 58 + bob, 13); fs('#f0eaff', 2); x.fillStyle = INK; circ(115, 56 + bob, 3); x.fill(); circ(125, 56 + bob, 3); x.fill(); P(114, 66 + bob, 126, 66 + bob); x.stroke(); }
      else { spark(108, 70, 8); spark(136, 64, 6); spark(150, 78, 5); rr(176, 112, 26, 14, 4); fs('#fbe6ee', 2); x.fillStyle = '#5b8def'; x.fillRect(176, 112, 9, 14); } // 落ちている消しゴム
      break;
    }
    case 'vending': { // あやしい自動はんばいき
      ground(); rr(78, 22, 84, 106, 8); fs('#5b8def'); rr(88, 32, 46, 56, 4); fs('#d9e4ff', 2);
      const goods = ['#ffe58a', '#ffd8e2', '#c9f0d2', '#d9e4ff'];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { rr(94 + c * 20, 38 + r * 24, 14, 18, 3); fs(goods[r * 2 + c], 1.6); P(92, 58 + r * 24, 132, 58 + r * 24); x.strokeStyle = INK; x.lineWidth = 1.6; x.stroke(); }
      for (let k = 0; k < 4; k++) { circ(148, 40 + k * 12, 4); fs(k === 1 ? '#e8305f' : '#fff', 1.6); }
      rr(100, 90, 40, 10, 3); fs('#fff', 1.6); x.fillStyle = '#e8305f'; x.font = '900 9px sans-serif'; x.textAlign = 'center'; x.fillText('HPで買う', 120, 98.5);
      rr(92, 104, 56, 14, 3); fs('#24252b', 2);
      x.fillStyle = '#ffd23f'; x.font = '900 26px sans-serif'; x.fillText('?', 184, 52 + bob); break;
    }
    case 'lost': { // 迷子のラクガキ
      ground(); P(178, 128, 178, 62); fs(null, 4); P(160, 64, 206, 64, 214, 72, 206, 80, 160, 80); fs('#ffe58a'); P(176, 84, 132, 84, 124, 92, 132, 100, 176, 100); fs('#d9e4ff');
      face(84, 96, 18, '#8fd0e8', 'sad'); x.fillStyle = '#8fd0e8'; ell(74, 104 + Math.abs(bob), 3, 5); x.fill(); ell(95, 106 - Math.abs(bob), 2.5, 4); x.fill();
      x.fillStyle = INK; x.font = '900 16px sans-serif'; x.textAlign = 'center'; x.fillText('?', 110, 70 + bob); break;
    }
    case 'dice': { // サイコロの神さま
      cloud([[120, 34, 26], [94, 42, 18], [146, 42, 19], [108, 50, 16], [134, 50, 16]]);
      x.fillStyle = INK; circ(111, 34, 2.6); x.fill(); circ(129, 34, 2.6); x.fill(); // 目
      x.beginPath(); x.arc(120, 38, 7, 0.15 * Math.PI, 0.85 * Math.PI); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); // にっこり
      x.fillStyle = '#ffd23f'; P(108, 12, 112, 2, 120, 10, 128, 2, 132, 12); x.closePath(); fs('#ffd23f', 1.8); // かんむり
      ground();
      x.save(); x.translate(120, 100 + bob); x.rotate(0.25 + t / 200); rr(-22, -22, 44, 44, 8); fs('#fff', 2.6); x.fillStyle = '#e8305f';
      for (const [dx, dy] of [[-10, -10], [10, 10], [0, 0]]) { circ(dx, dy, 4); x.fill(); } x.restore();
      spark(70, 90, 6); spark(176, 84, 7); break;
    }
    case 'eraserbite': { // 光る消しゴムのかけら
      ground(); const g = x.createRadialGradient(120, 92, 4, 120, 92, 60); g.addColorStop(0, 'rgba(255,230,120,0.8)'); g.addColorStop(1, 'rgba(255,230,120,0)'); x.fillStyle = g; x.fillRect(50, 30, 140, 110);
      x.save(); x.translate(120, 96 + bob); x.rotate(-0.25); P(-26, -14, 22, -18, 30, 6, -18, 16); fs('#fbe6ee', 2.6); P(-26, -14, -12, -15, -6, 15, -18, 16); fs('#5b8def', 2); x.restore();
      for (const [sx, sy, r] of [[80, 60, 7], [160, 58, 9], [172, 98, 5], [70, 100, 5]]) spark(sx, sy + bob, r);
      for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(251,230,238,0.9)'; circ(100 + k * 9, 124 - (t / 3 + k * 9) % 30, 2.2); x.fill(); }
      break;
    }
    case 'bookstore': { // 古い本屋
      ground(); rr(56, 26, 128, 102, 4); fs('#c99a68'); for (const y of [58, 92]) { P(56, y, 184, y); x.stroke(); }
      const cols = ['#e8305f', '#5b8def', '#33b06a', '#ffd23f', '#b693e8', '#f2a65a'];
      for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) { const h = 22 + ((k * 7 + row * 3) % 6), w = 12 + (k % 3) * 2, X = 62 + k * 17; x.save(); if ((k + row) % 5 === 0) { x.translate(X, 30 + row * 34 + 26); x.rotate(-0.25); rr(0, -h, w, h, 1); } else rr(X, 30 + row * 34 + 26 - h, w, h, 1); fs(cols[(k + row) % cols.length], 1.6); x.restore(); }
      rr(96, 6, 48, 20, 4); fs('#fff', 2); x.fillStyle = INK; x.font = '900 13px sans-serif'; x.textAlign = 'center'; x.fillText('本', 120, 21); break;
    }
    case 'nap': { // ふかふかの雲で昼寝
      x.save(); x.translate(0, bob);
      cloud([[80, 102, 22], [108, 88, 30], [144, 92, 26], [172, 106, 18], [100, 110, 18], [130, 112, 20], [158, 112, 16]]);
      face(118, 74, 15, '#e8305f', 'flat'); x.fillStyle = INK; x.font = '900 14px sans-serif'; x.fillText('Z', 150, 50); x.font = '900 11px sans-serif'; x.fillText('z', 164, 38); x.font = '900 9px sans-serif'; x.fillText('z', 174, 28);
      x.restore(); break;
    }
    case 'mirror': { // 鏡のラクガキ
      ground(); rr(118, 20, 76, 108, 30); fs('#e8d6a8', 3); rr(126, 28, 60, 92, 24); fs('#d9f1ff', 2);
      x.save(); x.beginPath(); rr(126, 28, 60, 92, 24); x.clip(); face(156, 74, 15, '#5b3a9a', 'flat'); x.fillStyle = 'rgba(255,255,255,0.4)'; P(132, 40, 150, 30, 136, 70); x.fill(); x.restore();
      face(72, 92, 16, '#e8305f', 'smile');
      x.fillStyle = '#e8305f'; x.font = '900 16px sans-serif'; x.textAlign = 'center'; x.fillText('!', 100, 60 + bob); x.fillStyle = '#5b3a9a'; x.fillText('!', 200, 30 + bob); break;
    }
    case 'swamp': { // インクの沼
      ground(122); x.beginPath(); x.moveTo(40, 122); x.quadraticCurveTo(120, 150 + bob, 200, 122); x.quadraticCurveTo(120, 112, 40, 122); fs('#2d3a66');
      for (const [bx, r] of [[90, 5], [130, 7], [160, 4]]) { circ(bx, 118 - ((t / 2 + bx) % 12), r); x.strokeStyle = 'rgba(160,180,240,0.8)'; x.lineWidth = 1.6; x.stroke(); }
      P(30, 128, 30, 86); fs(null, 3.5); P(14, 86, 50, 86, 56, 94, 50, 100, 14, 100); fs('#ffe58a'); x.fillStyle = INK; x.font = '900 10px sans-serif'; x.textAlign = 'center'; x.fillText('→', 34, 97);
      face(214, 96, 13, '#e8305f', 'flat'); break;
    }
    case 'trap': { // 大王のわな（トラバサミ）
      ground(); ell(120, 124, 58, 9); fs('#9aa3b5');
      x.save(); x.translate(120, 120);
      for (const s of [-1, 1]) { x.save(); x.scale(s, 1); x.rotate(-0.35 + Math.sin(t / 10) * 0.05); P(0, 0, 50, 0); x.quadraticCurveTo(50, -40, 0, -46); fs(null, 3.5); for (let k = 0; k < 5; k++) { P(8 + k * 9, -2, 12 + k * 9, -12, 16 + k * 9, -2); fs('#c9d2df', 1.6); } x.restore(); }
      x.restore(); circ(120, 120, 6); fs('#6b7080');
      rr(170, 28, 44, 30, 6); fs('#fbe6ee', 2.4); x.fillStyle = '#5b8def'; x.fillRect(170, 28, 14, 30); x.fillStyle = INK; x.font = '900 12px sans-serif'; x.textAlign = 'center'; x.fillText('ケシ', 199, 48); // 大王のしるし
      x.fillStyle = '#d1293f'; x.font = '900 24px sans-serif'; x.fillText('!', 64, 62 + bob); break;
    }
    case 'thief': { // 消しカスどろぼう
      ground();
      x.save(); x.translate(120, 92 + bob);
      x.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, r = 30 + (k % 2 ? 6 : 0); x.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.85); } x.closePath(); fs('#e9e1ea', 2.6);
      rr(-26, -12, 52, 14, 6); fs(INK, 1); x.fillStyle = '#fff'; circ(-11, -5, 3.5); x.fill(); circ(11, -5, 3.5); x.fill();
      P(-8, 12, 0, 8, 8, 12); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.restore();
      x.save(); x.translate(176, 100 + bob); circ(0, 0, 18); fs('#c99a68', 2.4); P(-6, -18, 0, -24, 6, -18); fs('#c99a68', 2); card(0, 2, 0.2, '#ffe58a'); x.restore();
      for (const [sx, sy] of [[60, 118], [70, 110], [52, 104]]) { circ(sx, sy, 2.5); x.fillStyle = '#e9e1ea'; x.fill(); }
      break;
    }
    case 'rope': { // 大なわとび
      ground();
      x.beginPath(); x.moveTo(40, 92); x.quadraticCurveTo(120, -30, 200, 92); x.strokeStyle = '#7a4fd0'; x.lineWidth = 3.5; x.stroke();
      for (const ex of [28, 212]) { rr(ex - 14, 84, 28, 44, 6); fs('#fbe6ee', 2.2); x.fillStyle = '#5b8def'; x.fillRect(ex - 14, 106, 28, 9); x.fillStyle = INK; circ(ex - 5, 96, 2); x.fill(); circ(ex + 5, 96, 2); x.fill(); }
      face(100, 74 - bob, 13, '#e8305f', 'smile'); face(140, 70 + bob, 13, '#2a5bd7', 'smile');
      x.fillStyle = 'rgba(36,37,43,0.15)'; ell(100, 129, 11, 2.5); x.fill(); ell(140, 129, 11, 2.5); x.fill();
      spark(120, 40, 6); break;
    }
    case 'catch': { // ハートキャッチ
      ground();
      for (const [hx, hy, sz] of [[78, 34, 8], [140, 22, 7], [172, 58, 9]]) { x.save(); x.translate(hx, hy + bob); x.beginPath(); x.moveTo(0, sz * 0.9); x.bezierCurveTo(-sz * 1.4, -sz * 0.2, -sz * 0.6, -sz * 1.3, 0, -sz * 0.5); x.bezierCurveTo(sz * 0.6, -sz * 1.3, sz * 1.4, -sz * 0.2, 0, sz * 0.9); fs('#f27eb1', 1.8); x.restore(); }
      card(106, 56 - bob, 0.3, '#ffe58a');
      P(84, 98, 156, 98, 148, 126, 92, 126); x.closePath(); fs('#d9ad7c'); for (let k = -2; k <= 2; k++) { P(120 + k * 12, 100, 120 + k * 10, 124); x.strokeStyle = 'rgba(122,82,54,0.6)'; x.lineWidth = 1.5; x.stroke(); }
      break;
    }
    case 'cups': { // 大王のカップあて
      ground();
      for (let k = 0; k < 3; k++) { const cx = 70 + k * 50, lift = k === 1 ? 18 + bob : 0; if (k === 1) spark(cx, 116, 9); P(cx - 16, 96 - lift, cx + 16, 96 - lift, cx + 21, 128 - lift, cx - 21, 128 - lift); x.closePath(); fs('#e8305f'); }
      rr(186, 30, 44, 26, 5); fs('#fbe6ee', 2.2); x.fillStyle = '#5b8def'; x.fillRect(186, 30, 13, 26); x.fillStyle = INK; circ(209, 41, 2.2); x.fill(); circ(219, 41, 2.2); x.fill();
      x.font = '900 20px sans-serif'; x.textAlign = 'center'; x.fillText('?', 120, 70 + bob); break;
    }
    case 'taiko': { // インクだいこ
      ground(); ell(120, 96, 46, 14); fs('#c99a68'); x.beginPath(); x.moveTo(74, 96); x.lineTo(78, 124); x.quadraticCurveTo(120, 136, 162, 124); x.lineTo(166, 96); fs('#e8305f'); ell(120, 96, 46, 14); fs('#fff4dc');
      for (const [sx, a, c] of [[70, -0.6, '#e8305f'], [170, 0.6, '#2a5bd7']]) { x.save(); x.translate(sx, 62 + bob); x.rotate(a); rr(-4, -30, 8, 40, 4); fs('#d9ad7c', 2); circ(0, -32, 7); fs(c, 2); x.restore(); }
      x.fillStyle = '#ffd23f'; x.font = '900 18px sans-serif'; x.textAlign = 'center'; x.fillText('♪', 34, 40 + bob); x.fillText('♫', 210, 36 - bob); break;
    }
    case 'guard': { // たからをまもれ
      ground(); rr(102, 104, 36, 24, 4); fs('#d9ad7c'); rr(116, 110, 8, 8, 2); fs('#ffd23f', 1.5);
      for (const [px, c] of [[84, '#ffd8e2'], [156, '#cfe0ff']]) { rr(px - 22, 80, 44, 9, 4); fs(c, 2.4); }
      for (const [sx, sy] of [[60, 30], [120, 20], [188, 40]]) { x.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, r = 6 + (k % 2) * 3; x.lineTo(sx + Math.cos(a) * r, sy + bob + Math.sin(a) * r); } x.closePath(); fs('#9aa3b5', 1.8); }
      rr(196, 8, 38, 22, 5); fs('#fbe6ee', 2); x.fillStyle = '#5b8def'; x.fillRect(196, 8, 11, 22); break;
    }
    case 'simon': { // おぼえて！大王のまね
      ground(); const cs = ['#e8305f', '#f2a65a', '#2a5bd7', '#33b06a'];
      cs.forEach((c, i) => { circ(48 + i * 48, 96, 18); fs(i === Math.floor(t / 30) % 4 ? c : '#fff', 3); x.strokeStyle = c; x.lineWidth = 4; circ(48 + i * 48, 96, 18); x.stroke(); });
      rr(98, 26, 44, 26, 6); fs('#fbe6ee', 2.2); x.fillStyle = '#5b8def'; x.fillRect(98, 26, 13, 26); x.fillStyle = INK; circ(122, 38, 2.3); x.fill(); circ(132, 38, 2.3); x.fill();
      x.font = '900 16px sans-serif'; x.textAlign = 'center'; x.fillText('?', 156, 34 + bob); break;
    }
    default: x.fillStyle = INK; x.font = '900 40px sans-serif'; x.textAlign = 'center'; x.fillText('？', 120, 90);
  }
  x.restore();
}
