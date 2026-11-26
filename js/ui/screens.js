'use strict';

/* =====================================================
   画面の切り替え
   ===================================================== */
let curScreen = 'scr-title';
function show(id) {
  curScreen = id;
  document.body.classList.toggle('ingame', id === 'scr-game');
  document.body.classList.toggle('scroll-ok', id === 'scr-deck'); // カードを選ぶ画面は、もとのままスクロールして選ぶ
  document.body.classList.toggle('ev-wide', id === 'scr-minidbg' || id === 'scr-reward' && $('#scr-reward').classList.contains('ev-mode')); // ふしぎのマスは画面のはばいっぱいに
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
  musicForScreen(id);
  if (NET.role === 'host' && NET.open) netOnHostScreen(id);
  if (NET.vsMode && (id === 'scr-draw' || id === 'scr-deck')) netFixTexts();
  if ((id === 'scr-draw' || id === 'scr-deck') && typeof updateSetupNav === 'function') updateSetupNav();
  if (typeof updateOrientGuide === 'function') updateOrientGuide();
  if (typeof fitWatch === 'function') fitWatch();
}
$('#btnStart').addEventListener('click', () => { SFX.init(); startFree(); });

/* ---------- どの画面も、スクロールせずに1画面に収める ----------
   画面の高さ・はばに入りきらないときは、中身を少しだけ縮める（zoom）。ゲーム中の画面はべつに合わせる */
const FIT_MIN = 0.45;
// data-fit のついた欄は、その欄の中で入りきるように中身を縮める
function fitBox(el) {
  const kids = [...el.children]; if (!kids.length || !el.clientHeight) return;
  const set = z => { kids.forEach(c => { c.style.zoom = z === 1 ? '' : z; }); };
  const fits = z => { set(z); return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1; };
  let best = 1;
  if (!fits(1)) { let lo = FIT_MIN, hi = 1; for (let k = 0; k < 7; k++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; } best = Math.floor(lo * 100) / 100; }
  set(best);
}
function fitScreen() {
  const el = document.querySelector('.screen.active');
  const rc = document.querySelector('#result:not(.hidden) .result-card'); if (rc) fitBox(rc); // ステージの結果も、カードの中に収める
  if (!el || el.id === 'scr-game' || el.id === 'scr-deck' || !el.clientHeight) return;
  el.querySelectorAll('[data-fit]').forEach(fitBox);
  const kids = [...el.children], cur = parseFloat(el.dataset.fz || '1');
  const set = z => { kids.forEach(c => { c.style.zoom = z === 1 ? '' : z; }); };
  const fits = z => { set(z); return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1; };
  let best = 1;
  if (!fits(1)) { // 入りきる、いちばん大きい倍率をさがす
    let lo = FIT_MIN, hi = 1;
    for (let k = 0; k < 7; k++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    best = Math.floor(lo * 100) / 100;
  }
  set(best); if (best !== cur) el.dataset.fz = best;
}
let fitRaf = 0;
const fitSoon = () => { if (!fitRaf) fitRaf = requestAnimationFrame(() => { fitRaf = 0; fitScreen(); }); };
const fitRO = typeof ResizeObserver === 'function' ? new ResizeObserver(fitSoon) : null;
function fitWatch() {
  if (!fitRO) return; fitRO.disconnect();
  const el = document.querySelector('.screen.active'); if (!el || el.id === 'scr-game' || el.id === 'scr-deck') return;
  delete el.dataset.fz; [...el.children].forEach(c => { c.style.zoom = ''; fitRO.observe(c); }); fitRO.observe(el);
  fitSoon();
}
new MutationObserver(fitSoon).observe(document.getElementById('app'), { childList: true, subtree: true, characterData: true });
new MutationObserver(fitSoon).observe(document.getElementById('result'), { attributes: true, attributeFilter: ['class'] });
window.addEventListener('resize', fitSoon);
