'use strict';

/* =====================================================
   デッキ編成画面
   ===================================================== */
let deckFilter = 'all';
const cardEls = {};
function iconCanvas(cv, id, W, H) {
  const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  if (!id) return;
  ctx.scale(cv.width / W, cv.height / H); drawCardIcon(ctx, id, W, H);
}
function buildDeckScreen() {
  const tabs = $('#catTabs');
  [['all', 'すべて', null], ...Object.entries(CATS).map(([k, v]) => [k, v.name, v.color])].forEach(([k, label, col]) => {
    const b = document.createElement('button'); b.className = 'btn' + (k === 'all' ? ' on' : ''); b.dataset.cat = k;
    b.innerHTML = (col ? `<i style="--c:${col}"></i>` : '') + label + `<small style="opacity:.6">${k === 'all' ? CARDS.length : CARDS.filter(c => c.cat === k).length}</small>`;
    b.addEventListener('click', () => { deckFilter = k; $$('#catTabs .btn').forEach(x => x.classList.toggle('on', x.dataset.cat === k)); refreshDeckUI(); });
    tabs.appendChild(b);
  });
  const grid = $('#cardGrid');
  CARDS.forEach(c => {
    const b = document.createElement('button'); b.className = 'card'; b.style.setProperty('--cat', CATS[c.cat].color);
    b.innerHTML = `<span class="stripe"></span><span class="badge"></span><canvas class="ic" width="208" height="128"></canvas><span class="cat">${CATS[c.cat].name}</span><span class="nm"><span>${c.name}</span><span class="cost">${c.costLabel}</span></span><span class="ds">${c.desc}</span>`;
    b.setAttribute('aria-label', `${c.name} コスト${c.costLabel} ${c.desc}`);
    b.addEventListener('click', () => { toggleCard(c.id); deckInfo(c); });
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') deckInfo(c); });
    b.title = c.desc;
    grid.appendChild(b); cardEls[c.id] = b;
    iconCanvas(b.querySelector('canvas'), c.id, 104, 64);
  });
  const slots = $('#deckSlots');
  for (let i = 0; i < DECK_MAX; i++) {
    const s = document.createElement('button'); s.className = 'slot';
    s.innerHTML = `<span class="n">${i + 1}</span><canvas width="96" height="64"></canvas><span class="sn">空き</span>`;
    s.addEventListener('click', () => { if (DECK[i]) { DECK.splice(i, 1); refreshDeckUI(); } });
    slots.appendChild(s);
  }
}
function toggleCard(id) {
  const i = DECK.indexOf(id);
  if (i >= 0) DECK.splice(i, 1);
  else if (DECK.length >= DECK_MAX) { $('#deckHint').textContent = '8枚までです。枠をクリックで外せます'; return; }
  else if (catFull(DECK, CARD[id].cat)) { const nm = CATS[CARD[id].cat].name; $('#deckHint').textContent = `${nm}は${CAT_MAX[CARD[id].cat]}枚までです。ほかの${nm}を外してから選んでください`; return; }
  else DECK.push(id);
  refreshDeckUI();
}
// カードの説明（小さいカードでは説明をかくすので、ここに出す）
function deckInfo(c) { $('#deckInfo').innerHTML = `<b>${c.name}</b>（${CATS[c.cat].name}・コスト${c.costLabel}）${c.desc}`; }
/* カード一覧を、スクロールせずに入る大きさにならべる */
function fitDeckGrid() {
  const grid = $('#cardGrid'); if (!grid || curScreen !== 'scr-deck') return;
  const vis = CARDS.filter(c => !cardEls[c.id].hidden).length, W = grid.clientWidth, H = grid.clientHeight; if (!vis || !W || !H) return;
  const g = document.body.classList.contains('mobile') ? 4 : 8;
  let best = null;
  for (let cols = 1; cols <= vis; cols++) {
    const rows = Math.ceil(vis / cols), cw = (W - g * (cols - 1)) / cols, ch = (H - g * (rows - 1)) / rows;
    if (cw < 30 || ch < 28) continue;
    const s = Math.min(cw, ch * 1.25); // 少し横長のカードがいちばん見やすい
    if (!best || s > best.s) best = { cols, rows, cw, ch, s };
  }
  if (!best) return;
  const ch = Math.min(best.ch, best.cw * 1.35);
  grid.style.gridTemplateColumns = `repeat(${best.cols}, minmax(0,1fr))`; grid.style.gridAutoRows = `${Math.floor(ch)}px`; grid.style.gap = `${g}px`;
  const mode = ch >= 175 && best.cw >= 140 ? 'full' : ch >= 92 && best.cw >= 84 ? 'mid' : 'tiny';
  grid.dataset.mode = mode;
  const text = mode === 'full' ? 0 : mode === 'mid' ? 38 : 22; // 名前などの文字の高さ
  const icw = mode === 'full' ? 104 : Math.max(24, Math.min(104, best.cw * 0.82, (ch - text - 14) * 1.625));
  grid.style.setProperty('--icw', `${Math.floor(icw)}px`);
}
if (typeof ResizeObserver === 'function') new ResizeObserver(() => fitDeckGrid()).observe($('#cardGrid'));
function refreshDeckUI() {
  CARDS.forEach(c => {
    const el = cardEls[c.id], i = DECK.indexOf(c.id);
    el.classList.toggle('sel', i >= 0); el.classList.toggle('full', DECK.length >= DECK_MAX || (i < 0 && catFull(DECK, c.cat)));
    el.querySelector('.badge').textContent = i >= 0 ? i + 1 : '';
    el.hidden = deckFilter !== 'all' && c.cat !== deckFilter;
    el.setAttribute('aria-pressed', String(i >= 0));
  });
  $$('#deckSlots .slot').forEach((s, i) => {
    const id = DECK[i];
    s.classList.toggle('filled', !!id);
    s.querySelector('.sn').textContent = id ? CARD[id].name : '空き';
    iconCanvas(s.querySelector('canvas'), id, 48, 32);
  });
  fitDeckGrid();
  $('#deckCount').textContent = DECK.length;
  $('#btnDeckGo').disabled = DECK.length === 0;
  $('#deckHint').textContent = DECK.length ? `枠をクリックで外せます（特殊 ${catCount(DECK, 'special')}/${CAT_MAX.special}枚）` : `カードを1枚以上選んでください（特殊は${CAT_MAX.special}枚まで）`;
}
$('#btnDeckPreset').addEventListener('click', () => { DECK = PRESET.slice(); refreshDeckUI(); });
$('#btnDeckClear').addEventListener('click', () => { DECK = []; refreshDeckUI(); });
$('#btnDeckRandom').addEventListener('click', () => {
  const pens = CARDS.filter(c => c.cat === 'pen').map(c => c.id), rest = CARDS.filter(c => c.cat !== 'pen').map(c => c.id);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = []; for (const id of shuffle(rest)) { if (pick.length >= 6) break; if (catFull(pick, CARD[id].cat)) continue; pick.push(id); }
  DECK = [...shuffle(pens).slice(0, 2), ...pick];
  refreshDeckUI();
});
$('#btnDeckGo').addEventListener('click', () => deckGo());
