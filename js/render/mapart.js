'use strict';

/* =====================================================
   冒険のマップ：エリアのイラスト（マスの丸の中に描く）
   areaKey(st) でステージからエリアを決め、areaIconURL(key) で画像（dataURL）を返す（1回描いたら使い回す）
   ===================================================== */
const AREA_NAME = { meadow: '草原', forest: '森', canyon: '谷', cave: '洞くつ', icecave: 'こおりの洞くつ', sky: '空', castle: '城', mountain: '雪山', storm: '嵐' };
const areaKey = st => !st ? null : st.ice ? 'icecave' : AREA_NAME[st.bg] ? st.bg : null;
const areaIconCache = {};
function areaIconURL(key) {
  if (areaIconCache[key]) return areaIconCache[key];
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d'), INK = '#24252b';
  x.lineJoin = 'round'; x.lineCap = 'round';
  x.save(); x.beginPath(); x.arc(64, 64, 64, 0, Math.PI * 2); x.clip();
  const sky = (a, b) => { const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, S, S); };
  const P = (...p) => { x.beginPath(); x.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) x.lineTo(p[i], p[i + 1]); };
  const fs = (fill, lw = 3) => { if (fill) { x.fillStyle = fill; x.fill(); } x.strokeStyle = INK; x.lineWidth = lw; x.stroke(); };
  const circ = (cx, cy, r) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); };
  const cloud = (cx, cy, s, fill = '#fff') => { const l = [[0, 0, 12], [-12, 4, 9], [12, 4, 9]]; x.beginPath(); for (const [dx, dy, r] of l) { x.moveTo(cx + dx * s + r * s, cy + dy * s); x.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2); } x.strokeStyle = INK; x.lineWidth = 5; x.stroke(); x.fillStyle = fill; x.fill(); };
  const ground = (y, col, top) => { x.beginPath(); x.moveTo(-4, S + 4); x.lineTo(-4, y); x.quadraticCurveTo(40, y - (top || 6), 64, y); x.quadraticCurveTo(96, y + (top || 6), 132, y - 2); x.lineTo(132, S + 4); x.closePath(); fs(col); };
  const tree = (tx, ty, s, col) => { x.fillStyle = '#8a6a4a'; x.fillRect(tx - 3 * s, ty - 4 * s, 6 * s, 16 * s); x.strokeStyle = INK; x.lineWidth = 2.5; x.strokeRect(tx - 3 * s, ty - 4 * s, 6 * s, 16 * s); x.beginPath(); x.arc(tx, ty - 14 * s, 13 * s, 0, Math.PI * 2); x.arc(tx - 9 * s, ty - 6 * s, 9 * s, 0, Math.PI * 2); x.arc(tx + 9 * s, ty - 6 * s, 9 * s, 0, Math.PI * 2); x.strokeStyle = INK; x.lineWidth = 5; x.stroke(); x.fillStyle = col; x.fill(); };
  switch (key) {
    case 'meadow':
      sky('#8fcdf9', '#e2f3ff'); circ(98, 30, 13); fs('#ffe066'); cloud(36, 34, 0.9);
      ground(84, '#c9e8b4', 10); ground(98, '#93d06f', 6);
      for (const [fx, fy, c] of [[34, 108, '#fff'], [70, 114, '#ffc2d4'], [98, 106, '#ffe58a']]) { x.fillStyle = c; for (let a = 0; a < 5; a++) { circ(fx + Math.cos(a * 1.26) * 4, fy + Math.sin(a * 1.26) * 4, 3); x.fill(); } x.fillStyle = '#f2a65a'; circ(fx, fy, 2); x.fill(); }
      break;
    case 'forest':
      sky('#bfe0b0', '#e6f3d6'); tree(30, 78, 1.25, '#5fa65c'); tree(94, 74, 1.4, '#4f9a52'); tree(62, 92, 1.05, '#79bf6a');
      ground(104, '#86c06a', 4); x.fillStyle = '#e8305f'; x.beginPath(); x.ellipse(40, 112, 7, 5, 0, Math.PI, 0); x.fill();
      break;
    case 'canyon':
      sky('#ffb27a', '#ffe0b0'); circ(64, 70, 18); x.fillStyle = 'rgba(255,240,180,0.8)'; x.fill();
      P(-4, 40, 30, 46, 40, 74, 34, 132, -4, 132); x.closePath(); fs('#c98a58'); P(132, 30, 92, 40, 84, 70, 92, 132, 132, 132); x.closePath(); fs('#b97a4a');
      P(14, 60, 26, 62); P(104, 56, 116, 60); x.strokeStyle = 'rgba(36,37,43,.4)'; x.lineWidth = 2; x.stroke();
      x.save(); x.translate(62, 34); x.rotate(0.4); P(-9, -6, 6, -9, 10, 4, -2, 10, -10, 4); x.closePath(); fs('#9a8a7a'); x.restore();
      x.setLineDash([4, 5]); P(62, 50, 62, 110); x.strokeStyle = '#d1293f'; x.lineWidth = 2.5; x.stroke(); x.setLineDash([]);
      break;
    case 'cave': case 'icecave': {
      const ice = key === 'icecave';
      sky(ice ? '#2f4f7a' : '#3e3466', ice ? '#5e86b8' : '#6d63a0');
      for (let k = 0; k < 6; k++) { const tx = 8 + k * 23; P(tx - 9, -4, tx + 9, -4, tx, 22 + (k % 2) * 14); x.closePath(); fs(ice ? '#bfe8ff' : '#4a4078', 2.5); }
      ground(104, ice ? '#a9d8f0' : '#7f74b0', 3);
      const gl = x.createRadialGradient(64, 86, 2, 64, 86, 36); gl.addColorStop(0, ice ? 'rgba(200,245,255,.9)' : 'rgba(210,168,245,.8)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(20, 46, 88, 80);
      for (const [cx, h, a] of [[54, 22, -0.35], [64, 32, 0], [74, 20, 0.4]]) { x.save(); x.translate(cx, 106); x.rotate(a); P(-6, 0, -7, -h * 0.7, 0, -h, 7, -h * 0.7, 6, 0); x.closePath(); fs(ice ? '#e4f8ff' : '#d2a8f5', 2.5); x.restore(); }
      break;
    }
    case 'sky':
      sky('#6fb8f0', '#d8eeff'); cloud(30, 40, 0.9); cloud(98, 28, 0.7); cloud(84, 100, 1.2, '#f4faff');
      x.fillStyle = '#c99a68'; x.fillRect(22, 74, 46, 10); x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(22, 74, 46, 10);
      P(18, 79, 10, 79); P(72, 79, 80, 79); x.strokeStyle = '#2a5bd7'; x.lineWidth = 3; x.stroke();
      break;
    case 'castle':
      sky('#d98ab5', '#ffd3a8');
      x.fillStyle = '#b5aac9'; x.fillRect(22, 56, 84, 80); x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(22, 56, 84, 80);
      for (const tx of [22, 82]) { x.fillStyle = '#a99dc0'; x.fillRect(tx, 36, 24, 100); x.strokeRect(tx, 36, 24, 100); for (let k = 0; k < 3; k++) { x.fillStyle = '#a99dc0'; x.fillRect(tx + k * 9 - 1, 28, 6, 9); x.strokeRect(tx + k * 9 - 1, 28, 6, 9); } }
      x.beginPath(); x.moveTo(50, 136); x.lineTo(50, 98); x.arc(64, 98, 14, Math.PI, 0); x.lineTo(78, 136); fs('#3b2f55');
      P(94, 28, 94, 8); x.stroke(); P(94, 8, 112, 13, 94, 18); x.closePath(); fs('#e8305f', 2);
      x.fillStyle = '#ffd23f'; x.fillRect(30, 60, 8, 10); x.fillRect(90, 60, 8, 10);
      break;
    case 'mountain':
      sky('#9fd0f5', '#e8f5ff');
      P(-6, 118, 40, 40, 72, 92, 92, 56, 136, 118); x.closePath(); fs('#8aa0b8');
      P(28, 60, 40, 40, 52, 60, 46, 56, 40, 62, 34, 56); x.closePath(); fs('#fff', 2.5); P(82, 74, 92, 56, 104, 76, 98, 72, 92, 78, 86, 72); x.closePath(); fs('#fff', 2.5);
      ground(112, '#f4f8ff', 4);
      x.fillStyle = '#fff'; for (const [sx, sy] of [[20, 26], [64, 22], [104, 36], [56, 48], [112, 92]]) { circ(sx, sy, 3); x.fill(); x.strokeStyle = 'rgba(36,37,43,.35)'; x.lineWidth = 1; x.stroke(); }
      break;
    case 'storm':
      sky('#4b4a78', '#8a86b0');
      cloud(40, 34, 1.3, '#9a98b8'); cloud(94, 28, 1.1, '#8a88a8');
      x.strokeStyle = 'rgba(200,215,255,.7)'; x.lineWidth = 2; for (let k = 0; k < 7; k++) { P(14 + k * 17, 56 + (k % 3) * 8, 8 + k * 17, 74 + (k % 3) * 8); x.stroke(); }
      P(70, 46, 54, 82, 66, 82, 56, 112, 84, 70, 70, 70, 80, 46); x.closePath(); fs('#ffd23f', 3);
      ground(112, '#6b6893', 4);
      break;
    default: sky('#e3ecff', '#e3ecff');
  }
  x.restore();
  return (areaIconCache[key] = cv.toDataURL());
}
