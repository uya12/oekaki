'use strict';

/* =====================================================
   ふしぎのマスのミニゲーム（2人で協力。とても難しい）
   - P1（ランナー・赤）：PCはキーボード（A・D／←→で動く、W・スペースで決定）。オンラインではホストのタップ
   - P2（サポーター・青）：PCはマウス。オンラインではゲストのタップ
   - ホストがゲームを動かし、ゲストには 60ms ごとにようすを送る（ゲストは操作をホストへ送る）
   - target：えんぴつのまと  catch：ハートキャッチ  cups：大王のカップあて
   - taiko：インクだいこ  guard：たからをまもれ  simon：おぼえて！大王のまね
   結果は tier：2 = 大成功 / 1 = 成功 / 0 = 失敗
   ===================================================== */
const MG_W = 480, MG_H = 300, MG_INK = '#24252b', P1C = '#e8305f', P2C = '#2a5bd7';
let miniStop = null, miniCtl = null, miniView = null, miniS = null; // miniS：いま遊んでいるミニゲームのようす（たしかめ用）
const mgNewCtl = () => ({ x: null, dir: 0, step: 0, press: false, pick: null });
function mgPaper(x) {
  x.fillStyle = '#f7f9fc'; x.fillRect(0, 0, MG_W, MG_H); x.strokeStyle = 'rgba(150,185,220,0.35)'; x.lineWidth = 1; x.beginPath();
  for (let i = 0; i <= MG_W; i += 24) { x.moveTo(i, 0); x.lineTo(i, MG_H); } for (let j = 0; j <= MG_H; j += 24) { x.moveTo(0, j); x.lineTo(MG_W, j); } x.stroke();
}
function mgText(x, s, X, Y, size = 20, col = MG_INK) { x.font = `900 ${size}px 'Zen Maru Gothic', sans-serif`; x.textAlign = 'center'; x.lineWidth = 5; x.strokeStyle = '#fff'; x.strokeText(s, X, Y); x.fillStyle = col; x.fillText(s, X, Y); }
function mgRR(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function mgHeart(x, cx, cy, s, col) { x.beginPath(); x.moveTo(cx, cy + s * 0.9); x.bezierCurveTo(cx - s * 1.4, cy - s * 0.2, cx - s * 0.6, cy - s * 1.3, cx, cy - s * 0.5); x.bezierCurveTo(cx + s * 0.6, cy - s * 1.3, cx + s * 1.4, cy - s * 0.2, cx, cy + s * 0.9); x.fillStyle = col; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2; x.stroke(); }
function mgLegend(x, S, p1, p2) { // 下に、だれがどう操作するか
  const on = S.online;
  x.font = "900 12px 'Zen Maru Gothic', sans-serif"; x.textAlign = 'left'; x.fillStyle = P1C; x.fillText(`P1 ランナー：${on ? 'ホストがタップ' : p1}`, 10, MG_H - 8);
  x.textAlign = 'right'; x.fillStyle = P2C; x.fillText(`P2 サポーター：${on ? 'ゲストがタップ' : p2}`, MG_W - 10, MG_H - 8);
}

const MG = {
  /* ---- えんぴつのまと：動く的に、2本のえんぴつを2人がそれぞれ止める（3回） ---- */
  target: {
    init: () => ({ t: 0, round: 0, zone: 240, zv: 1, p: [{ x: 60, ph: 0, stop: null }, { x: 420, ph: 0.6, stop: null }], score: 0, marks: [], msg: '', msgT: -9999, wait: 0, over: false, tier: 0 }),
    update(S, dt, C) {
      S.t += dt;
      const L = 50, R = 430, spd = 0.75 + S.round * 0.2; // 1コマで動く量が、黄色のはばより小さくなる速さ（とても難しいけど、ねらえば止められる）
      S.zone += S.zv * dt * (0.03 + S.round * 0.025); // 的も動く（だんだん速く）
      if (S.zone < 110) { S.zone = 110; S.zv = 1; } if (S.zone > 370) { S.zone = 370; S.zv = -1; }
      if (S.wait > 0) {
        S.wait -= dt;
        if (S.wait <= 0) { if (S.round >= 3) { S.over = true; S.tier = S.score >= 10 ? 2 : S.score >= 6 ? 1 : 0; } else S.p.forEach(q => { q.stop = null; }); }
        return;
      }
      S.p.forEach((q, i) => { if (q.stop == null) { q.ph += dt / 1000 * spd * (i ? 1.27 : 1); const f = q.ph % 2; q.x = L + (R - L) * (f < 1 ? f : 2 - f); } });
      for (const i of [0, 1]) if (C[i + 1].press && S.p[i].stop == null) { S.p[i].stop = S.p[i].x; SFX.pick(); }
      if (S.p[0].stop != null && S.p[1].stop != null) { // 2本とも止めたら点数
        const pts = S.p.map(q => { const d = Math.abs(q.stop - S.zone); return d <= 7 ? 2 : d <= 20 ? 1 : 0; });
        const add = pts[0] + pts[1] + (pts[0] === 2 && pts[1] === 2 ? 1 : 0); // 2人ともぴったりならボーナス
        S.score += add; S.round++; S.wait = 1000; S.msgT = S.t;
        S.msg = add >= 5 ? '2人ともぴったり！' : add >= 3 ? 'おしい！' : add > 0 ? 'うーん…' : 'ざんねん';
        S.marks.push([Math.round(S.p[0].stop - S.zone), Math.round(S.p[1].stop - S.zone)]);
      }
    },
    draw(S, x) {
      mgPaper(x); const BY = 150, L = 50, R = 430;
      mgText(x, `えんぴつのまと　${Math.min(S.round + 1, 3)}回目 / 3`, MG_W / 2, 30, 19); mgText(x, `とくてん ${S.score}`, MG_W - 60, 58, 15, '#5b3a9a');
      mgRR(x, L, BY - 14, R - L, 28, 14); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#c9f0d2'; x.fillRect(S.zone - 20, BY - 12, 40, 24); x.fillStyle = '#ffd23f'; x.fillRect(S.zone - 7, BY - 12, 14, 24);
      S.p.forEach((q, i) => { // P1 は上から、P2 は下から
        const px = q.stop != null ? q.stop : q.x, up = i === 0, col = up ? P1C : P2C;
        x.save(); x.translate(px, up ? BY - 16 : BY + 16); if (!up) x.scale(1, -1);
        x.fillStyle = up ? '#ffd84a' : '#9fd3f4'; x.strokeStyle = MG_INK; x.lineWidth = 2; x.beginPath(); x.moveTo(-7, -48); x.lineTo(7, -48); x.lineTo(7, -12); x.lineTo(0, 0); x.lineTo(-7, -12); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = col; x.fillRect(-7, -56, 14, 8); x.strokeRect(-7, -56, 14, 8); x.restore();
        if (q.stop != null) mgText(x, '止めた', px, up ? BY - 80 : BY + 96, 12, col);
      });
      x.font = "900 12px 'Zen Maru Gothic', sans-serif";
      S.marks.forEach(([a, b], k) => { x.textAlign = 'left'; x.fillStyle = '#5d6170'; x.fillText(`${k + 1}回目：P1 ${a > 0 ? '+' : ''}${a}　P2 ${b > 0 ? '+' : ''}${b}`, 12, 54 + k * 16); });
      if (S.t - S.msgT < 1000) mgText(x, S.msg, MG_W / 2, BY + 62, 24, S.msg.startsWith('2人') ? '#e0a100' : S.msg === 'おしい！' ? '#2a9d5c' : '#d1293f');
      else if (!S.over) mgText(x, '2人とも、黄色の真ん中で止めよう！（的も動く）', MG_W / 2, BY + 62, 14, '#5d6170');
      mgLegend(x, S, 'W・スペースで止める', 'クリックで止める');
    }
  },
  /* ---- ハートキャッチ：2つのかごで受け止める。金のハートは2人のかごをそろえないと取れない（15秒） ---- */
  catch: {
    init: () => ({ t: 0, dur: 15000, items: [], b: [{ x: 170 }, { x: 310 }], score: 0, next: 600, pops: [], id: 0, over: false, tier: 0 }),
    update(S, dt, C) {
      S.t += dt; const left = S.dur - S.t;
      S.b.forEach((b, i) => { const c = C[i + 1]; if (c.x != null) b.x += (c.x - b.x) * Math.min(1, 0.3 * dt / 16.7); else b.x += c.dir * 0.5 * dt; b.x = Math.max(32, Math.min(MG_W - 32, b.x)); });
      if (S.t >= S.next && left > 600) {
        const q = Math.random(), k = q < 0.34 ? 'crumb' : q < 0.43 ? 'gold' : q < 0.72 ? 'heart' : 'card';
        S.items.push({ i: ++S.id, x: Math.round(26 + Math.random() * (MG_W - 52)), y: -20, v: (0.2 + S.t / S.dur * 0.22 + Math.random() * 0.08) * (k === 'gold' ? 0.75 : 1), k });
        S.next = S.t + 190 + Math.random() * 170 - S.t / S.dur * 70;
      }
      const BY = MG_H - 56;
      for (const it of S.items) {
        it.y += it.v * dt;
        if (it.done || it.y < BY - 10) continue;
        const near = S.b.map(b => Math.abs(b.x - it.x) < 32);
        if (it.y <= BY + 12) {
          if (it.k === 'gold') { if (near[0] && near[1]) { it.done = 1; S.score += 5; S.pops.push({ x: it.x, y: BY - 20, s: '+5 2人で！', c: '#e0a100', t: S.t }); SFX.pick(); } }
          else if (near[0] || near[1]) { it.done = 1; const p = it.k === 'crumb' ? -3 : 1; S.score = Math.max(0, S.score + p); S.pops.push({ x: it.x, y: BY - 20, s: p > 0 ? '+1' : '−3', c: p > 0 ? '#2a9d5c' : '#d1293f', t: S.t }); if (p > 0) SFX.pick(); else SFX.hurt(); }
        } else if (it.k === 'gold' && !it.done) { it.done = 2; S.pops.push({ x: it.x, y: BY, s: '2人でそろえて！', c: '#d1293f', t: S.t }); }
      }
      S.items = S.items.filter(it => !it.done && it.y < MG_H + 30);
      S.pops = S.pops.filter(p => S.t - p.t < 700);
      if (left <= 0) { S.over = true; S.tier = S.score >= 30 ? 2 : S.score >= 16 ? 1 : 0; }
    },
    draw(S, x) {
      mgPaper(x); const BY = MG_H - 56;
      for (const it of S.items) {
        if (it.k === 'heart') mgHeart(x, it.x, it.y, 11, '#f27eb1');
        else if (it.k === 'gold') { mgHeart(x, it.x, it.y, 17, '#ffd23f'); mgText(x, '2人', it.x, it.y + 4, 11, '#8a5a00'); }
        else if (it.k === 'card') { mgRR(x, it.x - 10, it.y - 13, 20, 26, 3); x.fillStyle = '#ffe58a'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2; x.stroke(); }
        else { x.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, r = 11 + (k % 2) * 4; x.lineTo(it.x + Math.cos(a) * r, it.y + Math.sin(a) * r); } x.closePath(); x.fillStyle = '#9aa3b5'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2; x.stroke(); }
      }
      S.b.forEach((b, i) => {
        x.beginPath(); x.moveTo(b.x - 32, BY); x.lineTo(b.x + 32, BY); x.lineTo(b.x + 24, BY + 28); x.lineTo(b.x - 24, BY + 28); x.closePath(); x.fillStyle = i ? '#cfe0ff' : '#ffd8e2'; x.fill(); x.strokeStyle = i ? P2C : P1C; x.lineWidth = 3; x.stroke();
        mgText(x, i ? 'P2' : 'P1', b.x, BY + 20, 12, i ? P2C : P1C);
      });
      for (const p of S.pops) mgText(x, p.s, p.x, p.y - (S.t - p.t) / 25, 15, p.c);
      mgText(x, `ハートキャッチ　のこり ${Math.max(0, Math.ceil((S.dur - S.t) / 1000))}秒`, MG_W / 2, 28, 18); mgText(x, `とくてん ${S.score} / 30`, MG_W - 70, 54, 14, '#5b3a9a');
      if (S.t < 2200) mgText(x, '灰色の消しカスは −3。金のハートは2人のかごをそろえて！', MG_W / 2, MG_H / 2, 14, '#5d6170');
      mgLegend(x, S, 'A・D／←→で動かす', 'マウスで動かす');
    }
  },
  /* ---- 大王のカップあて：5つのカップ・2つの星。2人で1つずつ当てる ---- */
  cups: {
    init() {
      const st = []; while (st.length < 2) { const k = Math.floor(Math.random() * 5); if (!st.includes(k)) st.push(k); }
      const sw = []; for (let k = 0; k < 16; k++) { const a = Math.floor(Math.random() * 5); let b = Math.floor(Math.random() * 4); if (b >= a) b++; sw.push([a, b]); }
      return { t: 0, stars: st, sw, sel: [null, null], cur: 0, resT: null, over: false, tier: 0 };
    },
    dur: k => Math.max(140, 340 - k * 14),
    pos(S) { // いまのカップの位置（並んでいる場所の番号と、動いている途中のずれ）
      const p = [0, 1, 2, 3, 4]; let acc = 1700, mv = null;
      for (let k = 0; k < S.sw.length; k++) {
        const d = MG.cups.dur(k); if (S.t < acc) break;
        const [a, b] = S.sw[k], ca = p.indexOf(a), cb = p.indexOf(b);
        if (S.t < acc + d) { mv = { ca, cb, f: (S.t - acc) / d }; break; }
        p[ca] = b; p[cb] = a; acc += d;
      }
      return { p, mv, end: 1700 + S.sw.reduce((s, _, k) => s + MG.cups.dur(k), 0) };
    },
    cx: i => 56 + i * 92,
    update(S, dt, C) {
      S.t += dt; const { p, end } = MG.cups.pos(S);
      if (S.resT != null) { if (S.t - S.resT > 1500) S.over = true; return; }
      if (S.t < end + 100) return;
      const cupAt = ([X, Y]) => { for (let c = 0; c < 5; c++) if (Math.abs(X - MG.cups.cx(p[c])) < 40 && Math.abs(Y - 170) < 70) return c; return null; };
      const choose = (who, c) => { if (c == null || S.sel[who] != null || S.sel[1 - who] === c) return; S.sel[who] = c; SFX.pick(); };
      // P1：キーボードで選んでWで決定、またはタップ
      if (C[1].step) S.cur = (S.cur + C[1].step + 5) % 5;
      if (C[1].pick) choose(0, cupAt(C[1].pick)); else if (C[1].press) choose(0, p.indexOf(S.cur));
      if (C[2].pick) choose(1, cupAt(C[2].pick));
      if (S.sel[0] != null && S.sel[1] != null) { S.tier = S.sel.filter(c => S.stars.includes(c)).length; S.resT = S.t; }
    },
    draw(S, x) {
      mgPaper(x); const { p, mv, end } = MG.cups.pos(S), CY = 170, res = S.resT != null;
      const phase = S.t < 1500 ? 'show' : S.t < end + 100 ? 'shuffle' : res ? 'result' : 'pick', n = res ? S.tier : 0;
      mgText(x, '大王のカップあて', MG_W / 2, 28, 18);
      mgText(x, phase === 'show' ? '星は2つ！ よく見て…' : phase === 'shuffle' ? 'シャッフル中…' : phase === 'pick' ? '2人で1つずつ、星のカップをえらぼう' : n === 2 ? '2人とも当たり！' : n === 1 ? '1人だけ当たり…' : 'ふたりともはずれ…', MG_W / 2, 56, res ? 22 : 15, res ? (n === 2 ? '#e0a100' : n === 1 ? '#2a9d5c' : '#d1293f') : '#5d6170');
      mgRR(x, 14, 10, 46, 26, 6); x.fillStyle = '#fbe6ee'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2; x.stroke(); x.fillStyle = '#5b8def'; x.fillRect(14, 10, 14, 26); x.fillStyle = MG_INK; x.beginPath(); x.arc(40, 21, 2.3, 0, 7); x.arc(50, 21, 2.3, 0, 7); x.fill();
      for (let c = 0; c < 5; c++) {
        let cx = MG.cups.cx(p[c]), dy = 0;
        if (mv && (c === mv.ca || c === mv.cb)) { const to = c === mv.ca ? p[mv.cb] : p[mv.ca], e = (1 - Math.cos(mv.f * Math.PI)) / 2; cx = MG.cups.cx(p[c]) + (MG.cups.cx(to) - MG.cups.cx(p[c])) * e; dy = -Math.sin(mv.f * Math.PI) * 22 * (c === mv.ca ? 1 : -1); }
        const lift = phase === 'show' || (res && (S.stars.includes(c) || S.sel.includes(c))) ? 42 : 0, y = CY - lift + dy;
        if (S.stars.includes(c) && lift) { x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 6 : 14; x.lineTo(cx + Math.cos(a) * r, CY + 22 + Math.sin(a) * r); } x.closePath(); x.fillStyle = '#ffd23f'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2; x.stroke(); }
        x.beginPath(); x.moveTo(cx - 24, y - 26); x.lineTo(cx + 24, y - 26); x.lineTo(cx + 32, y + 36); x.lineTo(cx - 32, y + 36); x.closePath(); x.fillStyle = '#e8305f'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2.5; x.stroke();
        x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(cx - 17, y - 18, 7, 48);
        S.sel.forEach((s, w) => { if (s === c) { x.strokeStyle = w ? P2C : P1C; x.lineWidth = 4; x.strokeRect(cx - 38 + w * 4, y - 32 + w * 4, 76 - w * 8, 74 - w * 8); mgText(x, w ? 'P2' : 'P1', cx, y - 38, 13, w ? P2C : P1C); } });
        if (phase === 'pick' && !S.online && S.sel[0] == null && p[c] === S.cur) { x.setLineDash([5, 4]); x.strokeStyle = P1C; x.lineWidth = 2.5; x.strokeRect(cx - 36, y - 30, 72, 70); x.setLineDash([]); }
      }
      x.fillStyle = '#c9d2df'; x.fillRect(0, CY + 36, MG_W, 4);
      mgLegend(x, S, 'A・Dでえらんで W で決定', 'クリックでえらぶ');
    }
  },
  /* ---- インクだいこ：P1は赤の列、P2は青の列のノーツをたたく。金のノーツは2人同時に（約20秒） ---- */
  taiko: {
    init() {
      const notes = []; let tt = 1600, gap = 650;
      for (let k = 0; k < 34; k++) { const q = Math.random(); notes.push({ t: Math.round(tt), l: q < 0.2 ? 2 : q < 0.6 ? 0 : 1, h: [0, 0], miss: 0 }); tt += gap * (0.6 + Math.random() * 0.6); gap = Math.max(300, gap - 12); }
      return { t: 0, notes, hit: 0, need: notes.reduce((s, n) => s + (n.l === 2 ? 2 : 1), 0), pops: [], over: false, tier: 0, end: notes[notes.length - 1].t + 900 };
    },
    TRAVEL: 1150, LINE: 226,
    update(S, dt, C) {
      S.t += dt;
      for (const w of [0, 1]) if (C[w + 1].press) { // たたいた：いちばん近いノーツ
        let best = null, bd = 1e9;
        for (const n of S.notes) { if ((n.l !== w && n.l !== 2) || n.h[w] || n.miss) continue; const d = Math.abs(S.t - n.t); if (d < bd) { bd = d; best = n; } }
        if (best && bd <= 75) { best.h[w] = 1; S.hit++; S.pops.push({ x: w ? 310 : 170, s: bd <= 30 ? 'ぴったり' : 'よし', c: bd <= 30 ? '#e0a100' : '#2a9d5c', t: S.t }); SFX.pick(); }
        else { S.hit = Math.max(0, S.hit - 1); S.pops.push({ x: w ? 310 : 170, s: 'からうち −1', c: '#d1293f', t: S.t }); } // れんだはできない
      }
      for (const n of S.notes) if (!n.miss && S.t > n.t + 120) { const need = n.l === 2 ? [0, 1] : [n.l]; if (need.some(w => !n.h[w])) { n.miss = 1; for (const w of need) if (!n.h[w]) S.pops.push({ x: w ? 310 : 170, s: n.l === 2 ? 'そろえて！' : 'ミス', c: '#d1293f', t: S.t }); } }
      S.pops = S.pops.filter((p, i) => S.t - p.t < 600 && !S.pops.some((q, j) => j > i && q.x === p.x)); // 列ごとに、いちばん新しい表示だけ
      if (S.t > S.end) { S.over = true; const r = S.hit / S.need; S.tier = r >= 0.9 ? 2 : r >= 0.72 ? 1 : 0; }
    },
    draw(S, x) {
      mgPaper(x); const L = MG.taiko.LINE, T = MG.taiko.TRAVEL;
      mgText(x, 'インクだいこ', MG_W / 2, 26, 18); mgText(x, `${Math.round(S.hit / S.need * 100)}%（90%で大成功・からうちは−1）`, MG_W / 2, 50, 13, '#5b3a9a');
      for (const [lx, col, soft] of [[170, P1C, '#ffd8e2'], [310, P2C, '#cfe0ff']]) { x.fillStyle = soft; x.fillRect(lx - 34, 40, 68, MG_H - 70); x.beginPath(); x.arc(lx, L, 24, 0, Math.PI * 2); x.strokeStyle = col; x.lineWidth = 4; x.stroke(); }
      for (const n of S.notes) {
        const y = L - (n.t - S.t) / T * 190; if (y < 20 || y > MG_H) continue;
        const lanes = n.l === 2 ? [0, 1] : [n.l];
        if (n.l === 2) { x.fillStyle = '#ffd23f'; x.fillRect(170, y - 4, 140, 8); }
        for (const w of lanes) { if (n.h[w]) continue; x.beginPath(); x.arc(w ? 310 : 170, y, 18, 0, Math.PI * 2); x.fillStyle = n.l === 2 ? '#ffd23f' : w ? P2C : P1C; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2.5; x.stroke(); }
      }
      for (const p of S.pops) mgText(x, p.s, p.x, L - 40 - (S.t - p.t) / 20, 15, p.c);
      if (S.t < 1500) mgText(x, '線の円に来たらたたく！ 金のノーツは2人同時に', MG_W / 2, 120, 15, '#5d6170');
      mgLegend(x, S, 'W・スペースでたたく', 'クリックでたたく');
    }
  },
  /* ---- たからをまもれ：大王が投げる消しカスを、左右の盾で止める（20秒） ---- */
  guard: {
    init: () => ({ t: 0, dur: 20000, shots: [], pads: [{ x: 180 }, { x: 300 }], hits: 0, blocks: 0, next: 900, pops: [], over: false, tier: 0, id: 0 }),
    PY: 150, TX: 240, TY: 262,
    update(S, dt, C) {
      S.t += dt; const G = MG.guard, left = S.dur - S.t;
      S.pads.forEach((p, i) => { const c = C[i + 1]; if (c.x != null) p.x += (c.x - p.x) * Math.min(1, 0.3 * dt / 16.7); else p.x += c.dir * 0.45 * dt; p.x = i ? Math.max(245, Math.min(455, p.x)) : Math.max(25, Math.min(235, p.x)); });
      if (S.t >= S.next && left > 800) {
        const sx = 20 + Math.random() * 440, sy = -10, sp = (0.15 + S.t / S.dur * 0.17 + Math.random() * 0.05) * (S.t > 7000 && Math.random() < 0.3 ? 1.5 : 1), d = Math.hypot(G.TX - sx, G.TY - sy);
        S.shots.push({ i: ++S.id, x: sx, y: sy, vx: (G.TX - sx) / d * sp, vy: (G.TY - sy) / d * sp, py: sy });
        S.next = S.t + Math.max(230, 520 - S.t / S.dur * 300) * (0.7 + Math.random() * 0.6);
      }
      for (const s of S.shots) {
        s.py = s.y; s.x += s.vx * dt; s.y += s.vy * dt;
        if (!s.done && s.py < G.PY && s.y >= G.PY) { const w = s.x < 240 ? 0 : 1; if (Math.abs(s.x - S.pads[w].x) < 24) { s.done = 1; S.blocks++; S.pops.push({ x: s.x, y: G.PY - 14, s: 'ガード', c: w ? P2C : P1C, t: S.t }); SFX.pick(); } }
        if (!s.done && Math.hypot(s.x - G.TX, s.y - G.TY) < 22) { s.done = 2; S.hits++; S.pops.push({ x: G.TX, y: G.TY - 30, s: 'あたった！', c: '#d1293f', t: S.t }); SFX.hurt(); }
      }
      S.shots = S.shots.filter(s => !s.done && s.y < MG_H + 20);
      S.pops = S.pops.filter(p => S.t - p.t < 600);
      if (left <= 0) { S.over = true; S.tier = S.hits <= 1 ? 2 : S.hits <= 4 ? 1 : 0; }
    },
    draw(S, x) {
      mgPaper(x); const G = MG.guard;
      mgText(x, `たからをまもれ　のこり ${Math.max(0, Math.ceil((S.dur - S.t) / 1000))}秒`, MG_W / 2, 26, 18); mgText(x, `あたった ${S.hits}回（1回までで大成功）`, MG_W / 2, 50, 13, S.hits > 1 ? '#d1293f' : '#5b3a9a');
      x.setLineDash([4, 5]); x.strokeStyle = '#c9d2df'; x.lineWidth = 2; x.beginPath(); x.moveTo(240, G.PY - 40); x.lineTo(240, G.PY + 20); x.stroke(); x.setLineDash([]);
      mgRR(x, G.TX - 22, G.TY - 14, 44, 28, 5); x.fillStyle = '#d9ad7c'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2.5; x.stroke(); x.fillStyle = '#ffd23f'; x.fillRect(G.TX - 5, G.TY - 6, 10, 10);
      mgRR(x, 14, 8, 46, 26, 6); x.fillStyle = '#fbe6ee'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 2; x.stroke(); x.fillStyle = '#5b8def'; x.fillRect(14, 8, 14, 26);
      for (const s of S.shots) { x.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, r = 7 + (k % 2) * 3; x.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r); } x.closePath(); x.fillStyle = '#9aa3b5'; x.fill(); x.strokeStyle = MG_INK; x.lineWidth = 1.8; x.stroke(); }
      S.pads.forEach((p, i) => { mgRR(x, p.x - 24, G.PY - 5, 48, 10, 5); x.fillStyle = i ? '#cfe0ff' : '#ffd8e2'; x.fill(); x.strokeStyle = i ? P2C : P1C; x.lineWidth = 3; x.stroke(); mgText(x, i ? 'P2' : 'P1', p.x, G.PY + 22, 11, i ? P2C : P1C); });
      for (const p of S.pops) mgText(x, p.s, p.x, p.y - (S.t - p.t) / 25, 13, p.c);
      mgLegend(x, S, 'A・D／←→で左の盾', 'マウスで右の盾');
    }
  },
  /* ---- おぼえて！大王のまね：光った順番をおぼえて、2人で手分けしてたたく ---- */
  simon: {
    init: () => ({ t: 0, seq: [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)], ph: 'show', phT: 600, idx: 0, flash: -1, flashT: 0, best: 0, over: false, tier: 0, msg: '' }),
    PX: [96, 192, 288, 384], PY: 168,
    gap: S => Math.max(260, 470 - S.seq.length * 28),
    update(S, dt, C) {
      S.t += dt; const M = MG.simon;
      if (S.ph === 'show') { // 順番に光らせる
        const k = Math.floor((S.t - S.phT) / M.gap(S));
        S.flash = k >= 0 && k < S.seq.length && (S.t - S.phT) % M.gap(S) < M.gap(S) * 0.7 ? S.seq[k] : -1;
        if (k >= S.seq.length) { S.ph = 'input'; S.idx = 0; S.phT = S.t; S.flash = -1; }
        return;
      }
      if (S.ph === 'wait') { if (S.t > S.phT) { S.ph = 'show'; S.phT = S.t + 300; } return; }
      if (S.ph === 'end') { if (S.t > S.phT) S.over = true; return; }
      const presses = [];
      if (C[1].step) presses.push(C[1].step < 0 ? 0 : 1); // P1：A＝1つめ、D＝2つめ
      for (const w of [1, 2]) if (C[w].pick) { const [X, Y] = C[w].pick; M.PX.forEach((px, i) => { if (Math.hypot(X - px, Y - M.PY) < 44 && (w === 1 ? i < 2 : i >= 2)) presses.push(i); }); }
      for (const pad of presses) {
        S.flash = pad; S.flashT = S.t;
        if (pad === S.seq[S.idx]) {
          SFX.pick(); S.idx++;
          if (S.idx >= S.seq.length) { S.best = S.seq.length; if (S.seq.length >= 9) { S.ph = 'end'; S.phT = S.t + 1000; S.msg = '大成功！'; S.tier = 2; return; } S.seq.push(Math.floor(Math.random() * 4)); S.ph = 'wait'; S.phT = S.t + 700; S.msg = 'せいかい！'; return; }
        } else { SFX.hurt(); S.ph = 'end'; S.phT = S.t + 1200; S.tier = S.best >= 6 ? 1 : 0; S.msg = `まちがい…（${S.best}こまで）`; return; }
      }
      if (S.t - Math.max(S.phT, S.flashT) > 4000) { S.ph = 'end'; S.phT = S.t + 1200; S.tier = S.best >= 6 ? 1 : 0; S.msg = '時間切れ…'; }
      if (S.t - S.flashT > 220) S.flash = -1;
    },
    draw(S, x) {
      mgPaper(x); const M = MG.simon, cols = ['#e8305f', '#f2a65a', '#2a5bd7', '#33b06a'];
      mgText(x, `おぼえて！大王のまね　${S.seq.length}こ`, MG_W / 2, 26, 18); mgText(x, '9こ全部できたら大成功（6こで成功）', MG_W / 2, 50, 13, '#5b3a9a');
      M.PX.forEach((px, i) => {
        const on = S.flash === i; x.beginPath(); x.arc(px, M.PY, on ? 42 : 36, 0, Math.PI * 2); x.fillStyle = on ? cols[i] : '#fff'; x.fill(); x.strokeStyle = cols[i]; x.lineWidth = 6; x.stroke();
        mgText(x, i < 2 ? (S.online ? 'P1' : ['A', 'D'][i]) : 'P2', px, M.PY + 7, 18, on ? MG_INK : cols[i]);
      });
      mgText(x, S.ph === 'show' ? 'よく見て…' : S.ph === 'input' ? `たたいて！（${S.idx} / ${S.seq.length}）` : S.msg, MG_W / 2, 248, 17, S.ph === 'end' && S.tier === 0 ? '#d1293f' : '#5d6170');
      mgLegend(x, S, '左の2つ：A・D', '右の2つ：クリック');
    }
  }
};

/* ---------- ホスト（ひとりで遊ぶときも）：ゲームを動かす ---------- */
function startMini(kind, cv, done, opt = {}) { // opt.screen：遊ぶ画面（ふつうはごほうび画面）／opt.offline：1台で遊ぶ
  if (miniStop) miniStop();
  const G = MG[kind], x = cv.getContext('2d'), online = !opt.offline && rewardOnline(), scr = opt.screen || 'scr-reward';
  const S = miniS = G.init(); S.online = online;
  const C = miniCtl = { 1: mgNewCtl(), 2: mgNewCtl() };
  let alive = true, raf = 0, last = performance.now(), sent = 0;
  const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * MG_W, (e.clientY - r.top) / r.height * MG_H]; };
  const me = () => C[online ? 1 : opt.ptr ? opt.ptr() : 2]; // この画面の指・マウスは、オンラインなら P1、ひとりなら P2（れんしゅうでは切りかえられる）
  const onDown = e => { e.preventDefault(); const q = toCanvas(e), c = me(); c.x = q[0]; c.press = true; c.pick = q; };
  const onMove = e => { me().x = toCanvas(e)[0]; };
  const onKey = e => {
    const dn = e.type === 'keydown', c = C[1];
    if (['Space', 'Enter', 'KeyW', 'ArrowUp'].includes(e.code)) { e.preventDefault(); if (dn && !e.repeat) c.press = true; }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); c.dir = dn ? -1 : c.dir === -1 ? 0 : c.dir; if (dn && !e.repeat) c.step = -1; c.x = null; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); c.dir = dn ? 1 : c.dir === 1 ? 0 : c.dir; if (dn && !e.repeat) c.step = 1; c.x = null; }
  };
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const stop = () => { alive = false; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); if (miniStop === stop) miniStop = null; miniCtl = null; };
  miniStop = stop;
  const send = () => { if (online) netSend({ t: 'mg', k: kind, s: S }); };
  const loop = () => {
    if (!alive) return; if (curScreen !== scr) { stop(); return; } raf = requestAnimationFrame(loop); // 画面が変わったら止める
    const tm = performance.now(), dt = Math.min(50, tm - last); last = tm;
    G.update(S, dt, C);
    for (const k of [1, 2]) { C[k].press = false; C[k].pick = null; C[k].step = 0; }
    G.draw(S, x);
    if (tm - sent > 60) { sent = tm; send(); }
    if (S.over) { send(); stop(); setTimeout(() => done(S.tier), 1200); } // 結果を少し見せてから
  };
  raf = requestAnimationFrame(loop); // 画面の切りかえのあとで動きはじめる
}
// ゲストの操作がとどいたとき（P2）
function miniGuestInput(m) { if (!miniCtl) return; const c = miniCtl[2]; c.x = m.x; if (m.d) { c.press = true; c.pick = [m.x, m.y]; } }

/* ---------- ゲスト：ホストから届いたようすを描き、操作を送る ---------- */
function startMiniView(kind, cv) {
  if (miniStop) miniStop();
  const x = cv.getContext('2d'); let alive = true, raf = 0, lastMove = 0;
  miniView = { kind, S: null };
  const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * MG_W, (e.clientY - r.top) / r.height * MG_H]; };
  const onDown = e => { e.preventDefault(); const [X, Y] = toCanvas(e); netSend({ t: 'mgin', x: Math.round(X), y: Math.round(Y), d: 1 }); };
  const onMove = e => { const tm = performance.now(); if (tm - lastMove < 40) return; lastMove = tm; const [X, Y] = toCanvas(e); netSend({ t: 'mgin', x: Math.round(X), y: Math.round(Y), d: 0 }); };
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
  const stop = () => { alive = false; cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove); if (miniStop === stop) miniStop = null; miniView = null; };
  miniStop = stop;
  const loop = () => {
    if (!alive) return; if (curScreen !== 'scr-reward') { stop(); return; } raf = requestAnimationFrame(loop);
    if (miniView && miniView.S) MG[kind].draw(miniView.S, x);
    else { mgPaper(x); mgText(x, 'まもなく始まります…', MG_W / 2, MG_H / 2, 18, '#5d6170'); }
  };
  raf = requestAnimationFrame(loop);
}
function miniGuestState(m) { if (miniView && miniView.kind === m.k) miniView.S = m.s; }

/* ---------- デバッグ：ミニゲームのれんしゅう画面 ---------- */
const MDBG = { kind: 'target', back: 'scr-title', ptr: 2 };
const MINI_LIST = () => Object.keys(EVENTS).filter(id => EVENTS[id].mini && MG[EVENTS[id].mini]);
function mdbgPlay(id) {
  MDBG.kind = id; MDBG.n = (MDBG.n || 0) + 1; const E = EVENTS[id], n = MDBG.n;
  $$('#mdbgPick .btn').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  $('#mdbgDesc').textContent = (E.opts && E.opts[0] && E.opts[0].desc) || '';
  $('#mdbgRes').textContent = ''; $('#mdbgRes').className = 'mdbg-res';
  SFX.init();
  startMini(E.mini, $('#mdbgCv'), tier => {
    if (curScreen !== 'scr-minidbg' || MDBG.n !== n) return; // とちゅうで別のゲームにしたときは出さない
    $('#mdbgRes').textContent = `けっか：${['失敗', '成功', '大成功'][tier]}`; $('#mdbgRes').className = 'mdbg-res t' + tier;
  }, { screen: 'scr-minidbg', offline: true, ptr: () => MDBG.ptr });
}
function openMiniDebug() {
  if (curScreen === 'scr-game' || curScreen === 'scr-minidbg') return;
  if (NET.role) { netToast('オンライン中は、れんしゅうできません', 3000); return; }
  MDBG.back = curScreen;
  $('#mdbgPick').innerHTML = MINI_LIST().map(id => `<button class="btn sm" data-id="${id}">${EVENTS[id].mark} ${EVENTS[id].title}</button>`).join('');
  $$('#mdbgPick .btn').forEach(b => b.addEventListener('click', () => { b.blur(); mdbgPlay(b.dataset.id); }));
  show('scr-minidbg'); mdbgPlay(MINI_LIST().includes(MDBG.kind) ? MDBG.kind : MINI_LIST()[0]);
}
$('#btnDbgMini').addEventListener('click', e => { e.currentTarget.blur(); openMiniDebug(); });
const mdbgPtrUI = () => { $('#mdbgPtr').textContent = `マウス・タップで動かす：P${MDBG.ptr}`; $('#mdbgPtr').classList.toggle('p1', MDBG.ptr === 1); };
$('#mdbgPtr').addEventListener('click', e => { e.currentTarget.blur(); MDBG.ptr = 3 - MDBG.ptr; mdbgPtrUI(); });
mdbgPtrUI();
$('#mdbgRetry').addEventListener('click', e => { e.currentTarget.blur(); mdbgPlay(MDBG.kind); });
$('#mdbgBack').addEventListener('click', () => { // もとの画面へ（ごほうび画面は作り直す）
  MDBG.n++; if (miniStop) miniStop();
  const run = typeof curRun === 'function' && COOP ? curRun() : null;
  if (MDBG.back === 'scr-reward') { if (run && run.pending) showReward(); else show('scr-story'); }
  else show(MDBG.back);
});
