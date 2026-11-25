'use strict';

/* =====================================================
   ふしぎのマスのイラスト（ノートにかいたラクガキ風）
   drawEventArt(ctx, id, W, H)：ctx は W×H の大きさとして描く
   ===================================================== */
function drawEventArt(ctx, id, W, H) {
  const x = ctx, INK = '#24252b', t = (typeof tick === 'number' ? tick : 0);
  const S = Math.min(W / 240, H / 150); // 240×150 を基準にした大きさ
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  // 紙の背景（方眼）と地面
  x.fillStyle = '#f7f9fc'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(150,185,220,0.35)'; x.lineWidth = 1; x.beginPath();
  for (let i = 0; i <= W; i += 15 * S) { x.moveTo(i, 0); x.lineTo(i, H); }
  for (let j = 0; j <= H; j += 15 * S) { x.moveTo(0, j); x.lineTo(W, j); }
  x.stroke();
  x.translate(W / 2 - 120 * S, H / 2 - 75 * S); x.scale(S, S); // ここから 240×150 の座標
  const P = (...pts) => { x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); };
  const fs = (fill, lw = 2.4) => { if (fill) { x.fillStyle = fill; x.fill(); } x.strokeStyle = INK; x.lineWidth = lw; x.stroke(); };
  const circ = (cx, cy, r) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); };
  const ell = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); };
  const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
  const ground = (y = 128, col = '#e3e6ee') => { x.fillStyle = col; x.fillRect(-200, y, 640, 60); P(-200, y, 440, y); x.strokeStyle = INK; x.lineWidth = 2.4; x.stroke(); };
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
  const cloud = (list, fill = '#fff') => { // まるの集まり。中の線は見せない
    const path = () => { x.beginPath(); for (const [cx, cy, r] of list) { x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, Math.PI * 2); } };
    path(); x.strokeStyle = INK; x.lineWidth = 5; x.stroke(); path(); x.fillStyle = fill; x.fill();
  };
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
    case 'target': { // えんぴつのまと
      ground(); for (const [r, c] of [[44, '#fff'], [32, '#e8305f'], [20, '#fff'], [9, '#ffd23f']]) { circ(120, 74, r); fs(c, 2.4); }
      P(120, 118, 120, 128); fs(null, 3);
      x.save(); x.translate(174, 50 + bob); x.rotate(-0.9); P(0, -6, 60, -6, 60, 6, 0, 6); fs('#ffd84a'); P(0, -6, -14, 0, 0, 6); fs('#e9c69a'); P(60, -6, 70, -6, 70, 6, 60, 6); fs('#f2a3b3'); x.restore();
      spark(84, 40, 6); spark(160, 108, 5); break;
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
      x.fillStyle = INK; x.font = '900 18px sans-serif'; x.textAlign = 'center'; x.fillText('♪', 34, 40 + bob); x.fillText('♫', 210, 36 - bob); break;
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
