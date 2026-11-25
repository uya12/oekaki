'use strict';

/* =====================================================
   冒険のふしぎのマス：イベント
   - いいことだけ・えらぶもの（リスクとごほうび）・悪いことしか起きないもの
   - のろい（run.curse）は「次のステージだけ」：ステージをクリアするまで続く
       hp：はじめのHPが減る（0.3 = 30%へる）／time：制限時間がへる（秒）／cpu：大王が強い（倍）／energy0：エネルギー0から
   - run.maxHpDown：最大HPがずっと減る
   ===================================================== */
const pickOne = a => a.length ? a[Math.floor(Math.random() * a.length)] : null;
// 小さな部品（どれも、起きたことの文を返す。できないときは null）
const EV = {
  newCards: run => SUPPORT_DECK.filter(id => !run.deck.includes(id)),
  upCards: run => run.deck.filter(id => CARD_UP[id] && ((run.ups || {})[id] || 0) < UP_MAX),
  downCards: run => run.deck.filter(id => (run.ups || {})[id] > 0),
  boostable: run => Object.keys(RUN_UP).filter(k => (run.boosts[k] || 0) < 3),
  addCard(run) { const id = pickOne(EV.newCards(run)); if (!id) return null; applyReward(run, { type: 'card', id }); return `「${CARD[id].name}」を手に入れた`; },
  upCard(run) { const id = pickOne(EV.upCards(run)); if (!id) return null; const lv = ((run.ups || {})[id] || 0) + 1; applyReward(run, { type: 'up', id, lv }); return `「${CARD[id].name}」が ${stars(lv)} になった`; },
  addBoost(run) { const k = pickOne(EV.boostable(run)); if (!k) return null; const had = run.boosts[k] || 0; run.boosts[k] = had + 1; return had ? `ランナーの「${BOOSTS[k].name}」が ${stars(had)} になった` : `ランナーが「${BOOSTS[k].name}」を身につけた`; },
  loseCard(run) { // 最初の3枚より少なくはならない
    if (run.deck.length <= 3) return null;
    const id = pickOne(run.deck.filter(c => !START_DECK.includes(c))) || pickOne(run.deck); if (!id) return null;
    run.deck = run.deck.filter(c => c !== id); if (run.ups) delete run.ups[id]; return `「${CARD[id].name}」をなくしてしまった`;
  },
  downCard(run) { const id = pickOne(EV.downCards(run)); if (!id) return null; run.ups[id]--; return `「${CARD[id].name}」の★が1つへった`; },
  loseBoost(run) { const k = pickOne(Object.keys(run.boosts).filter(k => run.boosts[k] > 0 && BOOSTS[k].who === 'runner')); if (!k) return null; run.boosts[k]--; if (!run.boosts[k]) delete run.boosts[k]; return `ランナーの「${BOOSTS[k].name}」が弱くなった`; },
  curse(run, c) {
    const cu = run.curse = run.curse || {}, out = [];
    if (c.hp) { cu.hp = Math.min(0.6, (cu.hp || 0) + c.hp); out.push(`はじめにHPが最大HPの${Math.round(c.hp * 100)}%へる`); }
    if (c.time) { cu.time = Math.min(60, (cu.time || 0) + c.time); out.push(`制限時間が${c.time}秒へる`); }
    if (c.cpu) { cu.cpu = Math.min(1.6, (cu.cpu || 1) * c.cpu); out.push('消しゴム大王が強い'); }
    if (c.energy0) { cu.energy0 = true; out.push('エネルギーが0から'); }
    return `のろい（次のステージだけ）：${out.join('・')}`;
  },
  heal(run, pct) { const h = healRun(run, runMaxHp(run) * pct); return h > 0 ? `HPが ${h} 回復した` : null; }, // 満タンなら null
  maxHpDown(run, n) { run.maxHpDown = Math.min(60, (run.maxHpDown || 0) + n); return `ランナーの最大HPがずっと ${n} へった`; }
};
const evLines = (...a) => a.filter(Boolean).map(t => /[。！？」]$/.test(t) ? t : t + '。').join('');
// イベントの一覧。opts がないものは、入ったとたんに起きる。cond：出てくる条件
const EVENTS = {
  // ---- いいことだけ ----
  inkpool: { title: 'ふしぎなインクだまり', mark: '💧', good: 1, cond: r => EV.newCards(r).length, text: 'インクの中から、何か出てきた！', act: r => ({ text: evLines(EV.addCard(r)) }) },
  sharpener: { title: 'えんぴつけずり', mark: '✎', good: 1, cond: r => EV.upCards(r).length, text: '道ばたのえんぴつけずりで、カードをとがらせた！', act: r => ({ text: evLines(EV.upCard(r)) }) },
  spring: { title: 'げんきの泉', mark: '♥', good: 1, cond: r => EV.boostable(r).length, text: '泉の水を飲んだ！', act: r => ({ text: evLines(EV.heal(r, 0.3), EV.addBoost(r)) }) },
  dropped: { title: '大王の落とし物', mark: '宝', good: 1, text: '消しゴム大王が、たからばこを落としていった。ごほうびを2枚えらべる！', act: () => ({ text: 'ごほうびを2枚えらぼう。', treasure: 2 }) },
  // ---- えらぶ（リスクとごほうび） ----
  vending: { title: 'あやしい自動はんばいき', mark: '¥', text: '「HPとひきかえに、カードを売ります」と書いてある…',
    opts: [{ label: 'HPで買う', desc: 'カードを1枚もらう。のろい：次のステージ、はじめのHPが30%へる', act: r => ({ text: evLines(EV.addCard(r) || EV.upCard(r), EV.curse(r, { hp: 0.3 })) }) },
      { label: '立ち去る', desc: '何もしない', act: () => ({ text: '気味が悪いので、そっと立ち去った。' }) }] },
  cursedbox: { title: 'のろいのたからばこ', mark: '☠', text: '黒いたからばこがある。開けると、何かがおこりそうだ…',
    opts: [{ label: '開ける', desc: 'ごほうびを2枚えらべる。のろい：次のステージは消しゴム大王が強い', act: r => ({ text: evLines('たからばこを開けた', EV.curse(r, { cpu: 1.3 })) + ' ごほうびを2枚えらぼう。', treasure: 2 }) },
      { label: '開けない', desc: '何もしない', act: () => ({ text: '開けないでおいた。' }) }] },
  lost: { title: '迷子のラクガキ', mark: '?', text: '小さなラクガキが泣いている。道に迷ったらしい。',
    opts: [{ label: '送っていく', desc: 'ランナーの強化を1つもらう。のろい：次のステージ、制限時間が20秒へる', act: r => ({ text: evLines('ラクガキを家まで送った。お礼をもらった', EV.addBoost(r) || EV.upCard(r), EV.curse(r, { time: 20 })) }) },
      { label: '道を教えるだけ', desc: '何もしない', act: () => ({ text: '道を教えてあげた。ラクガキは手をふって帰っていった。' }) }] },
  dice: { title: 'サイコロの神さま', mark: '🎲', text: '「ふってみるか？ 運がよければいいことがあるぞ」',
    opts: [{ label: 'ふる', desc: '半分の確率で、カードのアップグレード2つ。外れると、カードを1枚なくす', act: r => Math.random() < 0.5
      ? ({ text: evLines('当たり！', EV.upCard(r) || EV.addBoost(r), EV.upCard(r) || EV.addBoost(r)) })
      : ({ text: evLines('外れ…', EV.loseCard(r) || EV.curse(r, { hp: 0.3 })) }) },
      { label: 'やめておく', desc: '何もしない', act: () => ({ text: '「つまらんやつじゃ」と神さまは消えた。' }) }] },
  eraserbite: { title: '消しゴムのかけら', mark: '◇', text: '光る消しゴムのかけらが落ちている。体にふれると力がわいてくる…でも、体が少し消えそうだ。',
    opts: [{ label: '体にとりこむ', desc: 'カードのアップグレード2つ。ずっと最大HPが10へる', act: r => ({ text: evLines(EV.upCard(r) || EV.addBoost(r), EV.upCard(r) || EV.addBoost(r), EV.maxHpDown(r, 10)) }) },
      { label: 'さわらない', desc: '何もしない', act: () => ({ text: 'あぶないので、さわらないでおいた。' }) }] },
  bookstore: { title: '古い本屋', mark: '本', cond: r => r.deck.length > 3 && EV.newCards(r).length >= 2, text: '「そのカード1枚と、うちのカード2枚を交換しないかい？」',
    opts: [{ label: '交換する', desc: '持っているカードを1枚手放して、新しいカードを2枚もらう', act: r => ({ text: evLines(EV.loseCard(r), EV.addCard(r), EV.addCard(r)) }) },
      { label: '断る', desc: '何もしない', act: () => ({ text: '「またおいで」' }) }] },
  nap: { title: 'ふかふかの雲', mark: '☁', text: 'ふかふかの雲がある。ひと眠りしたら気持ちよさそうだ。',
    opts: [{ label: '昼寝する', desc: 'ランナーの強化を1つもらう。のろい：次のステージ、エネルギーが0から', act: r => ({ text: evLines('ぐっすり眠った', EV.addBoost(r) || EV.upCard(r), EV.curse(r, { energy0: true })) }) },
      { label: 'がまんする', desc: '何もしない', act: () => ({ text: '眠いのをがまんして先へ進んだ。' }) }] },
  mirror: { title: '鏡のラクガキ', mark: '鏡', text: '鏡の中のランナーが、勝負をいどんできた！',
    opts: [{ label: '勝負する', desc: '7割の確率で、ランナーの強化2つ。負けると、のろい：次のステージ、はじめのHPが50%へる', act: r => Math.random() < 0.7
      ? ({ text: evLines('勝った！', EV.addBoost(r) || EV.upCard(r), EV.addBoost(r) || EV.upCard(r)) })
      : ({ text: evLines('負けてしまった…', EV.curse(r, { hp: 0.5 })) }) },
      { label: 'にげる', desc: '何もしない', act: () => ({ text: '鏡に布をかけて、にげた。' }) }] },
  // ---- ミニゲーム（2人で協力。とても難しい。tier：2 大成功 / 1 成功 / 0 失敗） ----
  target: { title: 'えんぴつのまと', mark: '◎', mini: 'target', text: '動く的に、2本のえんぴつ。「2人とも真ん中で止められたら、カードをとがらせてあげよう」',
    opts: [{ label: '2人であそぶ', desc: '動く的に、P1・P2がそれぞれえんぴつを止める（3回）。大成功：アップグレード2つ／成功：1つ', act: () => ({ play: 'target' }) }, { label: 'やめておく', desc: '何もしない', act: () => ({ text: '的あてはやめておいた。' }) }],
    result: (r, t) => t === 2 ? ({ text: evLines('大成功！', EV.upCard(r) || EV.addBoost(r), EV.upCard(r) || EV.addBoost(r)) }) : t === 1 ? ({ text: evLines('成功！', EV.upCard(r) || EV.addBoost(r)) }) : ({ text: 'ざんねん…何ももらえなかった。' }) },
  catch: { title: 'ハートキャッチ', mark: '♥', mini: 'catch', text: '空からハートとカードがどしゃぶり！ 2つのかごで受け止めよう。金のハートは2人のかごをそろえないと取れない。',
    opts: [{ label: '2人であそぶ', desc: '15秒で30点めざす（消しカスは−3）。大成功：ごほうび2枚＋HP回復／成功：HP回復', act: () => ({ play: 'catch' }) }, { label: 'やめておく', desc: '何もしない', act: () => ({ text: 'ぬれないように、木のかげで待った。' }) }],
    result: (r, t) => t === 2 ? ({ text: evLines('大成功！', EV.heal(r, 0.2)) + ' ごほうびを2枚えらぼう。', treasure: 2 }) : t === 1 ? ({ text: evLines('成功！', EV.heal(r, 0.3) || EV.upCard(r) || EV.addBoost(r)) }) : ({ text: 'ざんねん…あまり受け止められなかった。' }) },
  cups: { title: '大王のカップあて', mark: '?', mini: 'cups', text: '消しゴム大王「ケシシ…5つのカップのどれかに、星が2つ。2人とも当てられるかな？ はずれたら、のろいをかけてやる！」',
    opts: [{ label: '2人で勝負する', desc: '2人とも当たり：ごほうび2枚／1人だけ：ごほうび1枚／2人ともはずれ：のろい（次のステージ、はじめにHPが最大HPの25%へる）', act: () => ({ play: 'cups' }) }, { label: 'ことわる', desc: '何もしない', act: () => ({ text: '「つまらんのう」と大王は去っていった。' }) }],
    result: (r, t) => t === 2 ? ({ text: '2人とも当たり！ 大王はくやしそうだ。ごほうびを2枚えらぼう。', treasure: 2 }) : t === 1 ? ({ text: '1人だけ当たり！ ごほうびを1枚えらぼう。', treasure: 1 }) : ({ text: evLines('ふたりともはずれ…大王に笑われた', EV.curse(r, { hp: 0.25 })) }) },
  // ---- 悪いことしか起きない（えらべるのは、どちらの悪いことにするか） ----
  swamp: { title: 'インクの沼', mark: '〰', text: '道がインクの沼でふさがれている！ どうやって進む？',
    opts: [{ label: '泳いでわたる', desc: 'のろい：次のステージ、はじめのHPが40%へる', act: r => ({ text: evLines('インクまみれになった', EV.curse(r, { hp: 0.4 })) }) },
      { label: '遠回りする', desc: 'のろい：次のステージ、制限時間が25秒へる', act: r => ({ text: evLines('ずいぶん遠回りした', EV.curse(r, { time: 25 })) }) }] },
  trap: { title: '大王のわな', mark: '!', text: '消しゴム大王のわなにかかった！',
    act: r => ({ text: evLines(EV.downCard(r) || EV.loseBoost(r) || EV.curse(r, { hp: 0.3 })) }) },
  thief: { title: '消しカスどろぼう', mark: '盗', cond: r => r.deck.length > 3, text: '消しカスのどろぼうがあらわれた！',
    opts: [{ label: 'カードをわたす', desc: '持っているカードを1枚なくす', act: r => ({ text: evLines(EV.loseCard(r)) }) },
      { label: '追いはらう', desc: 'のろい：次のステージは消しゴム大王が強い・はじめのHPが20%へる', act: r => ({ text: evLines('どろぼうは「おぼえてろ！」とにげていった', EV.curse(r, { cpu: 1.2, hp: 0.2 })) }) }] }
};
// ふしぎのマスに入ったとき：イベントを1つえらぶ（いいこと・えらぶ・悪いこと が、だいたい 3：5：2）
function runEvent(run) {
  const ok = Object.keys(EVENTS).filter(id => !EVENTS[id].cond || EVENTS[id].cond(run));
  const good = ok.filter(id => EVENTS[id].good), bad = ok.filter(id => ['swamp', 'trap', 'thief'].includes(id)), mini = ok.filter(id => EVENTS[id].mini);
  const choice = ok.filter(id => !good.includes(id) && !bad.includes(id) && !mini.includes(id));
  const q = Math.random(), pool = q < 0.25 ? good : q < 0.45 ? mini : q < 0.82 ? choice : bad;
  const id = pickOne(pool.length ? pool : ok), E = EVENTS[id];
  if (!E.opts) { const res = E.act(run); return { id, title: E.title, mark: E.mark, text: E.text + ' ' + res.text, done: true, treasure: res.treasure, card: res.card }; }
  return { id, title: E.title, mark: E.mark, text: E.text, opts: E.opts.map(o => ({ label: o.label, desc: o.desc })) };
}
// えらんだ選択肢を実行する
function resolveEvent(run, i) {
  const ev = run.evt, E = ev && EVENTS[ev.id]; if (!E || !E.opts || !E.opts[i] || ev.done) return null;
  const res = E.opts[i].act(run);
  if (res.play) { run.evt = Object.assign({}, ev, { playing: res.play }); return run.evt; } // ミニゲームをあそぶ
  run.evt = { id: ev.id, title: ev.title, mark: ev.mark, text: res.text, done: true, picked: E.opts[i].label, treasure: res.treasure };
  return run.evt;
}
// ミニゲームが終わったとき（tier：2 大成功 / 1 成功 / 0 失敗）
function finishMini(run, tier) {
  const ev = run.evt, E = ev && EVENTS[ev.id]; if (!E || !E.result || ev.done) return null;
  const res = E.result(run, tier);
  run.evt = { id: ev.id, title: ev.title, mark: ev.mark, text: res.text, done: true, picked: ['失敗', '成功', '大成功'][tier], treasure: res.treasure };
  return run.evt;
}
// のろい・最大HPダウンの表示
function curseSummary(run) {
  const c = run && run.curse, out = [];
  if (c) {
    if (c.hp) out.push(`はじめのHP −${Math.round(c.hp * 100)}%`);
    if (c.time) out.push(`制限時間 −${c.time}秒`);
    if (c.cpu && c.cpu > 1) out.push(`大王が強い ×${c.cpu.toFixed(2)}`);
    if (c.energy0) out.push('エネルギー0から');
  }
  const chips = out.length ? `<span class="rw-chip curse">☠ のろい（次のステージ）：${out.join('・')}</span>` : '';
  return chips + (run && run.maxHpDown ? `<span class="rw-chip curse">最大HP −${run.maxHpDown}（ずっと）</span>` : '');
}
const runCurse = () => inRun() && curRun().curse || null;
