/**
 * プレビューの組み立て
 * ------------------------------------------------------------------
 * 実ファイル（*.html / *.js / *.css）をそのまま読み、1枚の preview.html に束ねる。
 * 各画面は iframe(srcdoc) の独立ドキュメントとして開くので、CSSもIDも本物と同じ。
 * 画面を直したら `node tools/build-preview.js` で作り直す。
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const CSS = ['style.css', 'design-refresh.css', 'theme.css'].map(read).join('\n');
const SHARED = ['config.js', 'nanameya-data.js', 'nanameya-mask.js'].map(read).join('\n;\n');

/** プレビューに並べる画面。query は本物と同じクエリ文字列。 */
const SCREENS = [
  { id: 'portal',      group: '入り口',  page: 'portal.html',            label: 'エスラボ ポータル',
    note: '2本柱。ジャーナル（学校・先生）とナナメの部屋（エスラボ）は、ここから別々に入る。' },
  { id: 'login',       group: '入り口',  page: 'login.html',             label: 'ジャーナル（参考）',
    note: '学校・先生の管轄。ナナメの部屋への導線は置かず、ポータルへ戻るリンクだけ。' },

  { id: 'list-locked', group: '生徒',    page: 'nanameya.html',          q: 'consent=none',
    label: '大人をえらぶ（同意まえ）',
    note: '保護者の同意が確認できるまで、予約ボタンそのものを出さない。' },
  { id: 'list',        group: '生徒',    page: 'nanameya.html',          q: 'consent=approved',
    label: '大人をえらぶ（同意ずみ）',
    note: '職業ではなく「迫り方」で絞る。「調べる」56%偏重を崩すための入り口。' },
  { id: 'book',        group: '生徒',    page: 'nanameya-book.html',     q: 'v=v2&consent=approved',
    label: '予約する',
    note: 'STEP2が肝。相手に渡る探究カードを生徒が同じ画面で確認し、同意して初めて枠を選べる。' },
  { id: 'sess-before', group: '生徒',    page: 'nanameya-session.html',  q: 'state=before',
    label: '対話カード（当日まで）',
    note: '通話リンクは出さない。時間外の接続とリンクの流出を防ぐため。' },
  { id: 'sess-soon',   group: '生徒',    page: 'nanameya-session.html',  q: 'state=soon',
    label: '対話カード（10分前）',
    note: 'ここで初めて入り口が出る。「困ったときは」は押しやすい塗りに。' },
  { id: 'sess-after',  group: '生徒',    page: 'nanameya-session.html',  q: 'state=after&b=b3',
    label: '対話カード（おわり）',
    note: '一言はナナメの部屋に残るだけ。ジャーナルへは自動で書き戻さない（管轄が違う）。' },

  { id: 'volunteer',   group: 'ナナメの大人', page: 'nanameya-volunteer.html',
    label: '担当と空き枠',
    note: '未提出の議事録だけを「あなたの番」に。やることを常に少なく見せて燃え尽きを防ぐ。' },
  { id: 'brief',       group: 'ナナメの大人', page: 'nanameya-brief.html', q: 'state=before',
    label: '探究カード',
    note: '許可リストの4ブロックだけ。●● は自動で伏せた個人情報。本名・組・番号・先生コメントは渡らない。' },
  { id: 'brief-exp',   group: 'ナナメの大人', page: 'nanameya-brief.html', q: 'state=expired',
    label: '探究カード（期限切れ）',
    note: '対話の終了から24時間で開けなくなる。' },
  { id: 'note',        group: 'ナナメの大人', page: 'nanameya-note.html',  q: 'b=b2',
    label: '議事録',
    note: '生徒向け1〜2行（120字）＋事務局向け。それぞれ誰が読むかを画面に書いてある。' },

  { id: 'admin',       group: '事務局',  page: 'nanameya-admin.html',
    label: '事務局',
    note: '止まっているものが上。未提出→未確認の順、通報は最上段。同意なしの予約は0が目標。' }
];

/** 画面ごとの <body> の中身と body クラス、専用スクリプトを取り出す */
function extract(page) {
  const html = read(page);
  const m = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/);
  const bodyClass = (m[1].match(/class="([^"]*)"/) || [, ''])[1];
  let inner = m[2];
  const scripts = [];
  inner = inner.replace(/<script src="\.\/([^"]+)"><\/script>/g, (_, f) => {
    if (!['config.js', 'nanameya-data.js', 'nanameya-mask.js'].includes(f)) scripts.push(f);
    return '';
  });
  return { bodyClass, inner, script: scripts.map(read).join('\n;\n') };
}

const built = SCREENS.map((s) => {
  const { bodyClass, inner, script } = extract(s.page);
  return { ...s, bodyClass, inner, script };
});

const data = JSON.stringify(built.map((s) => ({
  id: s.id, group: s.group, label: s.label, note: s.note, page: s.page,
  q: s.q || '', bodyClass: s.bodyClass, inner: s.inner, script: s.script
})));

fs.writeFileSync(path.join(root, 'preview.html'), render(data), 'utf8');
console.log('preview.html を書き出しました（画面 ' + built.length + '枚）');

function render(dataJson) {
  return `<title>ナナメの部屋 画面プレビュー</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&display=swap" rel="stylesheet" />
<style>
:root{
  --shell:#12211F; --shell-2:#1B302C; --shell-line:#2B453F;
  --shell-ink:#EAF2F0; --shell-muted:#93AAA4; --shell-faint:#6B837D;
  --accent:#4DD3BB; --accent-ink:#0A3C34; --amber:#F6C445;
  --stage:#0B1817;
}
:root:not([data-theme="dark"]){
  --shell:#F2F5F4; --shell-2:#FFFFFF; --shell-line:#DDE5E3;
  --shell-ink:#12211F; --shell-muted:#5B6670; --shell-faint:#8A939C;
  --accent:#0F8472; --accent-ink:#FFFFFF; --stage:#E6ECEA;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --shell:#12211F; --shell-2:#1B302C; --shell-line:#2B453F;
    --shell-ink:#EAF2F0; --shell-muted:#93AAA4; --shell-faint:#6B837D;
    --accent:#4DD3BB; --accent-ink:#0A3C34; --stage:#0B1817;
  }
}
:root[data-theme="dark"]{
  --shell:#12211F; --shell-2:#1B302C; --shell-line:#2B453F;
  --shell-ink:#EAF2F0; --shell-muted:#93AAA4; --shell-faint:#6B837D;
  --accent:#4DD3BB; --accent-ink:#0A3C34; --stage:#0B1817;
}
*{box-sizing:border-box}
body{margin:0;background:var(--shell);color:var(--shell-ink);
  font:400 14px/1.7 "Noto Sans JP",system-ui,-apple-system,"Hiragino Kaku Gothic ProN",sans-serif;
  letter-spacing:.02em}
.pv{display:grid;grid-template-columns:284px minmax(0,1fr);min-height:100vh}
.pv-side{border-right:1px solid var(--shell-line);background:var(--shell-2);
  padding:26px 20px 40px;display:flex;flex-direction:column;gap:22px}
.pv-brand{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:800;letter-spacing:.04em}
.pv-mark{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;
  background:var(--accent);color:var(--accent-ink);font-size:13px}
.pv-sub{margin:0;color:var(--shell-muted);font-size:12px;line-height:1.85}
.pv-sub b{color:var(--shell-ink)}
.pv-groups{display:flex;flex-direction:column;gap:18px}
.pv-group h2{margin:0 0 7px;font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--shell-faint)}
.pv-nav{display:flex;flex-direction:column;gap:2px}
.pv-btn{display:block;width:100%;text-align:left;padding:9px 12px;border:0;border-radius:8px;cursor:pointer;
  background:transparent;color:var(--shell-ink);font:400 13px/1.5 inherit;letter-spacing:.02em}
.pv-btn:hover{background:color-mix(in srgb,var(--accent) 14%,transparent)}
.pv-btn[aria-current="true"]{background:var(--accent);color:var(--accent-ink);font-weight:700}
.pv-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pv-foot{margin-top:auto;color:var(--shell-faint);font-size:11px;line-height:1.9}
.pv-main{display:flex;flex-direction:column;min-width:0;background:var(--stage)}
.pv-bar{display:flex;flex-wrap:wrap;align-items:baseline;gap:12px;padding:22px 28px 0}
.pv-title{margin:0;font-size:19px;font-weight:800;letter-spacing:.02em;text-wrap:balance}
.pv-file{color:var(--shell-faint);font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.pv-widths{margin-left:auto;display:flex;gap:3px;padding:3px;border-radius:999px;
  background:color-mix(in srgb,var(--shell-ink) 8%,transparent)}
.pv-w{padding:6px 13px;border:0;border-radius:999px;cursor:pointer;background:transparent;
  color:var(--shell-muted);font:700 11px inherit}
.pv-w[aria-pressed="true"]{background:var(--shell-2);color:var(--shell-ink)}
.pv-note{margin:8px 28px 0;padding:11px 15px;border-left:3px solid var(--accent);border-radius:0 8px 8px 0;
  background:color-mix(in srgb,var(--accent) 12%,transparent);font-size:13px;line-height:1.8;max-width:74ch}
.pv-stage{flex:1;display:grid;place-items:start center;padding:20px 28px 34px;overflow:auto}
.pv-frame{width:100%;max-width:1180px;height:min(78vh,880px);border:1px solid var(--shell-line);
  border-radius:12px;background:#fff;box-shadow:0 18px 44px rgba(0,0,0,.18);transition:max-width .18s}
.pv-frame.is-mobile{max-width:400px}
iframe{width:100%;height:100%;border:0;border-radius:12px;display:block}
@media (max-width:900px){
  .pv{grid-template-columns:1fr}
  .pv-side{border-right:0;border-bottom:1px solid var(--shell-line)}
  .pv-frame{height:70vh}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<div class="pv">
  <aside class="pv-side">
    <div class="pv-brand"><span class="pv-mark">✦</span> ナナメの部屋</div>
    <p class="pv-sub">
      エスラボの対話プログラムの画面プレビューです。<b>データはすべて見本</b>で、
      実在の生徒・ボランティアのものではありません。左から画面を選んでください。
    </p>
    <div class="pv-groups" id="pv-groups"></div>
    <p class="pv-foot">
      シナリオ1（空き枠の登録 → 予約 → 対話 → 議事録が事務局へ）の全画面。<br />
      本物のHTML／CSS／JSをそのまま表示しています。
    </p>
  </aside>

  <main class="pv-main">
    <div class="pv-bar">
      <h1 class="pv-title" id="pv-title"></h1>
      <span class="pv-file" id="pv-file"></span>
      <div class="pv-widths">
        <button type="button" class="pv-w" data-w="pc" aria-pressed="true">PC</button>
        <button type="button" class="pv-w" data-w="sp" aria-pressed="false">スマホ</button>
      </div>
    </div>
    <p class="pv-note" id="pv-note"></p>
    <div class="pv-stage">
      <div class="pv-frame" id="pv-frame"><iframe id="pv-iframe" title="画面プレビュー"></iframe></div>
    </div>
  </main>
</div>

<script>
const SCREENS = ${dataJson};
const CSS = ${JSON.stringify(CSS)};
const SHARED = ${JSON.stringify(SHARED)};

/* iframe の中で使う小道具：alert の代わりの通知と、画面間リンクの受け渡し */
const SHIM = \`
  window.__notice = function (msg) {
    var el = document.getElementById('__notice') || (function () {
      var d = document.createElement('div'); d.id = '__notice';
      d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;'
        + 'max-width:min(92vw,520px);padding:14px 18px;border-radius:12px;background:#12211F;color:#fff;'
        + 'font:400 13px/1.8 inherit;white-space:pre-wrap;box-shadow:0 12px 32px rgba(0,0,0,.3)';
      d.addEventListener('click', function () { d.remove(); });
      document.body.appendChild(d); return d;
    })();
    el.textContent = msg + '\\\\n（見本の動きです。押すと消えます）';
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || /^(#|https?:)/.test(href)) return;
    e.preventDefault();
    parent.postMessage({ pv: href.replace(/^\\\\.\\\\//, '').split('?')[0], q: (href.split('?')[1] || '') }, '*');
  });
\`;

function docFor(s) {
  const script = SHIM + '\\n' + s.script
    .split('location.search').join(JSON.stringify('?' + s.q))
    .split('alert(').join('window.__notice(');
  // フォントは描画をブロックしないよう、読み込み後に足す
  const fontJs = "var l=document.createElement('link');l.rel='stylesheet';"
    + "l.href='https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap';"
    + "document.head.appendChild(l);";
  return '<!doctype html><html lang="ja"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<style>' + CSS + '</style></head><body class="' + s.bodyClass + '">'
    + s.inner
    + '<' + 'script>' + SHARED + '<' + '/script>'
    + '<' + 'script>' + script + '<' + '/script>'
    + '<' + 'script>' + fontJs + '<' + '/script>'
    + '</body></html>';
}

const groupsEl = document.getElementById('pv-groups');
const order = [];
[...new Set(SCREENS.map((s) => s.group))].forEach((g) => {
  const wrap = document.createElement('div');
  wrap.className = 'pv-group';
  wrap.innerHTML = '<h2>' + g + '</h2><div class="pv-nav"></div>';
  const nav = wrap.querySelector('.pv-nav');
  SCREENS.filter((s) => s.group === g).forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pv-btn'; b.textContent = s.label;
    b.dataset.id = s.id;
    b.addEventListener('click', () => show(s.id));
    nav.appendChild(b); order.push(b);
  });
  groupsEl.appendChild(wrap);
});

function show(id) {
  const s = SCREENS.find((x) => x.id === id) || SCREENS[0];
  order.forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === s.id)));
  document.getElementById('pv-title').textContent = s.label;
  document.getElementById('pv-file').textContent = s.page + (s.q ? '?' + s.q : '');
  document.getElementById('pv-note').textContent = s.note;
  document.getElementById('pv-iframe').srcdoc = docFor(s);
}

document.querySelectorAll('.pv-w').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.pv-w').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.getElementById('pv-frame').classList.toggle('is-mobile', b.dataset.w === 'sp');
  });
});

/* 画面の中のリンクを押したら、対応する画面に切り替える */
addEventListener('message', (e) => {
  const file = e.data && e.data.pv;
  if (!file) return;
  const hit = SCREENS.find((s) => s.page === file && (!e.data.q || s.q === e.data.q))
           || SCREENS.find((s) => s.page === file);
  if (hit) show(hit.id);
});

show(SCREENS[0].id);
</script>
`;
}
