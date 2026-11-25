'use strict';

/* =====================================================
   ふしぎのマスのミニゲーム（ホストの画面で遊ぶ）
   startMini(kind, canvas, done)：遊び終わると done(tier) をよぶ
     tier：2 = 大成功 / 1 = 成功 / 0 = 失敗
   - target：えんぴつのまと（動く印を真ん中で止める。3回）
   - catch ：ハートキャッチ（落ちてくるハートとカードを受け止める。12秒）
   - cups  ：大王のカップあて（シャッフルされたカップから星を当てる）
   ===================================================== */
let miniStop = null; // 遊んでいるミニゲームを止める
function startMini(kind, cv, done) {
  if (miniStop) miniStop();
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, INK = '#24252b';
  let alive = true, raf = 0, ptrX = W / 2, keyL = false, keyR = false, pressed = false, clickAt = null;
  const now = () => performance.now();
  const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  const onDown = e => { e.preventDefault(); [ptrX] = toCanvas(e); clickAt = toCanvas(e); pressed = true; };
  const onMove = e => { [ptrX] = toCanvas(e); };
  const onKey = e => {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (e.type === 'keydown' && !e.repeat) pressed = true; }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyL = e.type === 'keydown';
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keyR = e.type === 'keydown';
  };
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const stop = () => { alive = false; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); if (miniStop === stop) miniStop = null; };
  miniStop = stop;
  const finish = tier => { if (!alive) return; stop(); setTimeout(() => done(tier), 900); }; // 結果を少し見せてから
  // 紙の背景
  const paper = () => {
    x.fillStyle = '#f7f9fc'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(150,185,220,0.35)'; x.lineWidth = 1; x.beginPath();
    for (let i = 0; i <= W; i += 24) { x.moveTo(i, 0); x.lineTo(i, H); } for (let j = 0; j <= H; j += 24) { x.moveTo(0, j); x.lineTo(W, j); } x.stroke();
  };
  const text = (s, X, Y, size = 22, col = INK) => { x.font = `900 ${size}px 'Zen Maru Gothic', sans-serif`; x.textAlign = 'center'; x.lineWidth = 5; x.strokeStyle = '#fff'; x.strokeText(s, X, Y); x.fillStyle = col; x.fillText(s, X, Y); };
  const heart = (cx, cy, s, col) => { x.beginPath(); x.moveTo(cx, cy + s * 0.9); x.bezierCurveTo(cx - s * 1.4, cy - s * 0.2, cx - s * 0.6, cy - s * 1.3, cx, cy - s * 0.5); x.bezierCurveTo(cx + s * 0.6, cy - s * 1.3, cx + s * 1.4, cy - s * 0.2, cx, cy + s * 0.9); x.fillStyle = col; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); };
  const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };

  if (kind === 'target') { // ---- えんぴつのまと ----
    const L = 50, R = W - 50, C = W / 2, BY = H * 0.55;
    let tries = 0, score = 0, t0 = now(), msg = '', msgT = 0, stopX = null, stopUntil = 0;
    const marks = [];
    const loop = () => {
      if (!alive) return; if (curScreen !== 'scr-reward') { stop(); return; } raf = requestAnimationFrame(loop); // 画面が変わったら止める
      const tm = now(), speed = 1.4 + tries * 0.55;
      let px = stopX;
      if (stopX == null) { const ph = ((tm - t0) / 1000 * speed) % 2; px = L + (R - L) * (ph < 1 ? ph : 2 - ph); }
      if (pressed && stopX == null && tries < 3) {
        pressed = false; stopX = px; stopUntil = tm + 700; tries++;
        const d = Math.abs(px - C), pt = d <= 9 ? 2 : d <= 32 ? 1 : 0; score += pt; marks.push([px, pt]);
        msg = ['ざんねん', 'おしい！', 'ぴったり！'][pt]; msgT = tm; SFX.pick();
      }
      pressed = false;
      if (stopX != null && tm > stopUntil) { stopX = null; t0 = tm; if (tries >= 3) { finish(score >= 5 ? 2 : score >= 3 ? 1 : 0); } }
      paper();
      text(`えんぴつのまと　${Math.min(tries + 1, 3)}回目 / 3`, W / 2, 34, 20);
      rr(L, BY - 16, R - L, 32, 16); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#c9f0d2'; x.fillRect(C - 32, BY - 14, 64, 28); x.fillStyle = '#ffd23f'; x.fillRect(C - 9, BY - 14, 18, 28);
      for (const [mx, pt] of marks) { x.fillStyle = ['#d1293f', '#2a9d5c', '#e0a100'][pt]; x.beginPath(); x.arc(mx, BY + 26, 5, 0, Math.PI * 2); x.fill(); }
      x.save(); x.translate(px, BY - 18); x.fillStyle = '#ffd84a'; x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(-7, -50); x.lineTo(7, -50); x.lineTo(7, -12); x.lineTo(0, 0); x.lineTo(-7, -12); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#f2a3b3'; x.fillRect(-7, -58, 14, 8); x.strokeRect(-7, -58, 14, 8); x.restore();
      if (tm - msgT < 700) text(msg, W / 2, BY + 70, 26, msg === 'ぴったり！' ? '#e0a100' : msg === 'おしい！' ? '#2a9d5c' : '#d1293f');
      else text('黄色の真ん中で タップ／スペース！', W / 2, BY + 70, 17, '#5d6170');
      text(`とくてん ${score}`, W - 64, 64, 16, '#2a5bd7');
    };
    raf = requestAnimationFrame(loop); // 画面の切りかえのあとで動きはじめる
  } else if (kind === 'catch') { // ---- ハートキャッチ ----
    const DUR = 12000, t0 = now(), items = []; let score = 0, last = t0, bx = W / 2, nextAt = t0;
    const loop = () => {
      if (!alive) return; if (curScreen !== 'scr-reward') { stop(); return; } raf = requestAnimationFrame(loop); // 画面が変わったら止める
      const tm = now(), dt = Math.min(50, tm - last) / 16.7; last = tm;
      const left = Math.max(0, DUR - (tm - t0));
      if (keyL) ptrX -= 9 * dt; if (keyR) ptrX += 9 * dt;
      ptrX = Math.max(40, Math.min(W - 40, ptrX)); bx += (ptrX - bx) * Math.min(1, 0.35 * dt);
      if (tm >= nextAt && left > 400) { const q = Math.random(); items.push({ x: 30 + Math.random() * (W - 60), y: -20, v: 2.2 + (tm - t0) / DUR * 2.4 + Math.random(), k: q < 0.5 ? 'heart' : q < 0.82 ? 'card' : 'crumb' }); nextAt = tm + 360 + Math.random() * 260; }
      for (const it of items) {
        it.y += it.v * dt;
        if (!it.got && it.y > H - 52 && it.y < H - 24 && Math.abs(it.x - bx) < 44) { it.got = true; const p = it.k === 'crumb' ? -2 : 1; score = Math.max(0, score + p); it.pop = p; it.popT = tm; if (p > 0) SFX.pick(); else SFX.hurt(); }
      }
      paper();
      for (const it of items) {
        if (it.got) { if (tm - it.popT < 500) text(it.pop > 0 ? '+1' : '−2', it.x, it.y - (tm - it.popT) / 20, 18, it.pop > 0 ? '#2a9d5c' : '#d1293f'); continue; }
        if (it.k === 'heart') heart(it.x, it.y, 11, '#f27eb1');
        else if (it.k === 'card') { rr(it.x - 10, it.y - 13, 20, 26, 3); x.fillStyle = '#ffe58a'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); }
        else { x.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, r = 11 + (k % 2) * 4; x.lineTo(it.x + Math.cos(a) * r, it.y + Math.sin(a) * r); } x.closePath(); x.fillStyle = '#9aa3b5'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].y > H + 30 || (items[i].got && tm - items[i].popT > 500)) items.splice(i, 1);
      // かご
      x.beginPath(); x.moveTo(bx - 42, H - 46); x.lineTo(bx + 42, H - 46); x.lineTo(bx + 32, H - 14); x.lineTo(bx - 32, H - 14); x.closePath(); x.fillStyle = '#d9ad7c'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2.5; x.stroke();
      x.strokeStyle = 'rgba(122,82,54,0.6)'; x.lineWidth = 1.5; x.beginPath(); for (let k = -2; k <= 2; k++) { x.moveTo(bx + k * 14, H - 44); x.lineTo(bx + k * 11, H - 16); } x.stroke();
      text(`ハートキャッチ　のこり ${Math.ceil(left / 1000)}秒`, W / 2, 30, 18); text(`とくてん ${score}`, W - 64, 58, 16, '#2a5bd7');
      if (tm - t0 < 1800) text('ハートとカードを受け止めよう！ 灰色の消しカスはダメ', W / 2, H / 2, 16, '#5d6170');
      if (left <= 0) { text(score >= 12 ? '大成功！' : score >= 6 ? '成功！' : 'ざんねん…', W / 2, H / 2, 32, score >= 6 ? '#2a9d5c' : '#d1293f'); finish(score >= 12 ? 2 : score >= 6 ? 1 : 0); }
    };
    raf = requestAnimationFrame(loop); // 画面の切りかえのあとで動きはじめる
  } else { // ---- 大王のカップあて ----
    const CX = [W * 0.22, W * 0.5, W * 0.78], CY = H * 0.62, swaps = [];
    const star = Math.floor(Math.random() * 3);
    for (let k = 0; k < 8; k++) { const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 2); if (b >= a) b++; swaps.push([a, b]); }
    const t0 = now(); let phase = 'show', picked = null, resultT = 0;
    const SHOW = 1500, T0 = SHOW + 300;
    const swapDur = k => Math.max(220, 520 - k * 40);
    const loop = () => {
      if (!alive) return; if (curScreen !== 'scr-reward') { stop(); return; } raf = requestAnimationFrame(loop); // 画面が変わったら止める
      const tm = now() - t0;
      // シャッフルのどこまで進んだか
      let acc = T0, cur = -1, frac = 0;
      const p = [0, 1, 2]; // p[カップ] = 何番目の場所にあるか
      for (let k = 0; k < swaps.length; k++) {
        const d = swapDur(k);
        if (tm < acc) break;
        const [a, b] = swaps[k], ca = p.indexOf(a), cb = p.indexOf(b);
        if (tm < acc + d) { cur = k; frac = (tm - acc) / d; p.cur = [ca, cb]; break; }
        p[ca] = b; p[cb] = a; acc += d;
      }
      const shuffleEnd = T0 + swaps.reduce((s, _, k) => s + swapDur(k), 0);
      if (phase === 'show' && tm > SHOW) phase = 'shuffle';
      if (phase === 'shuffle' && tm > shuffleEnd) phase = 'pick';
      // いまのカップの場所（x）
      const cupX = c => { if (cur >= 0 && p.cur && (c === p.cur[0] || c === p.cur[1])) { const from = p[c], to = c === p.cur[0] ? p[p.cur[1]] : p[p.cur[0]], e = (1 - Math.cos(frac * Math.PI)) / 2; return [CX[from] + (CX[to] - CX[from]) * e, -Math.sin(frac * Math.PI) * 26 * (c === p.cur[0] ? 1 : -1)]; } return [CX[p[c]], 0]; };
      if (phase === 'pick' && pressed && clickAt) {
        pressed = false;
        for (let c = 0; c < 3; c++) if (Math.abs(clickAt[0] - CX[p[c]]) < 55 && Math.abs(clickAt[1] - CY) < 70) { picked = c; phase = 'result'; resultT = tm; SFX.pick(); }
      }
      pressed = false;
      paper();
      text('大王のカップあて', W / 2, 30, 18);
      text(phase === 'show' ? '星はここ！ よく見て…' : phase === 'shuffle' ? 'シャッフル中…' : phase === 'pick' ? '星はどのカップ？ タップしてえらぼう' : picked === star ? '当たり！' : 'はずれ…', W / 2, 62, phase === 'result' ? 30 : 18, phase === 'result' ? (picked === star ? '#e0a100' : '#d1293f') : '#5d6170');
      // 消しゴム大王（右上）
      rr(16, 12, 50, 28, 6); x.fillStyle = '#fbe6ee'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.fillStyle = '#5b8def'; x.fillRect(16, 12, 15, 28); x.fillStyle = INK; x.beginPath(); x.arc(45, 24, 2.5, 0, 7); x.arc(55, 24, 2.5, 0, 7); x.fill(); // 大王（左上）
      for (let c = 0; c < 3; c++) {
        const [cx, dy] = cupX(c), lift = phase === 'show' || (phase === 'result' && (c === picked || c === star)) ? 46 : 0;
        if (c === star && lift) { x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 7 : 16; x.lineTo(cx + Math.cos(a) * r, CY + 22 + Math.sin(a) * r); } x.closePath(); x.fillStyle = '#ffd23f'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); }
        const y = CY - lift + dy;
        x.beginPath(); x.moveTo(cx - 30, y - 30); x.lineTo(cx + 30, y - 30); x.lineTo(cx + 40, y + 40); x.lineTo(cx - 40, y + 40); x.closePath();
        x.fillStyle = phase === 'result' && c === picked ? (c === star ? '#ffe58a' : '#ffd8e2') : '#e8305f'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2.5; x.stroke();
        x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(cx - 22, y - 22, 8, 54);
      }
      x.fillStyle = '#c9d2df'; x.fillRect(0, CY + 40, W, 4);
      if (phase === 'result' && tm - resultT > 300) finish(picked === star ? 2 : 0);
    };
    raf = requestAnimationFrame(loop); // 画面の切りかえのあとで動きはじめる
  }
}
