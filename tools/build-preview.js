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
    note: '2本柱の入り口。ジャーナル（学校・先生の管轄）とナナメの部屋（エスラボの管轄）は、ここから別々に入る。' },

  { id: 'login',       group: '探究ジャーナル（学校・先生）', page: 'login.html',
    label: 'ログイン（生徒）',
    note: '学年・組・番号でひらく。ここの「先生用ログイン →」はそのまま残す。ナナメの部屋への導線は置かない。' },
  { id: 'teacher',     group: '探究ジャーナル（学校・先生）', page: 'teacher.html',
    label: '先生メニュー（ログインの先）',
    note: 'ポータルの「探究ジャーナル（先生）」と、生徒ログイン画面の「先生用ログイン →」は、どちらもここに着く。' },
  { id: 'teacher-design',    group: '探究ジャーナル（学校・先生）', page: 'teacher-design.html',
    label: '授業の設計', note: '先生メニューの1枚目。' },
  { id: 'teacher-dashboard', group: '探究ジャーナル（学校・先生）', page: 'teacher-dashboard.html',
    label: 'ダッシュボード', note: 'クラスの進み・提出状況。D1で本番稼働中の画面。' },
  { id: 'teacher-comment',   group: '探究ジャーナル（学校・先生）', page: 'teacher-comment.html',
    label: 'コメント記入', note: '先生コメントはここで書く。このコメントはナナメの大人には渡さない。' },
  { id: 'teacher-ai',        group: '探究ジャーナル（学校・先生）', page: 'teacher-ai.html',
    label: 'AIを使って分析', note: 'クラス別ダイジェストをD1にキャッシュして投げる。' },

  { id: 'st-login',    group: 'ナナメの部屋（生徒）', page: 'nanameya-login-student.html',
    label: 'ログイン',
    note: '★暫定：ジャーナルと同じ学年・組・番号で入る（2026-09-05 判断）。個人情報保護は最後にまとめて対応する。' },
  { id: 'st-home',     group: 'ナナメの部屋（生徒）', page: 'nanameya-home-student.html', q: 'consent=none',
    label: '部屋のメニュー（同意まえ）',
    note: '保護者の同意が未取得なら、まず同意ゲートを出す。' },
  { id: 'st-home-ok',  group: 'ナナメの部屋（生徒）', page: 'nanameya-home-student.html', q: 'consent=approved',
    label: '部屋のメニュー（同意ずみ）',
    note: 'つぎの対話 → まえの対話 → できること の順。C2「前回の続きから始める」の置き場がここ。' },
  { id: 'list-locked', group: 'ナナメの部屋（生徒）', page: 'nanameya.html',          q: 'consent=none',
    label: '大人をえらぶ（同意まえ）',
    note: '保護者の同意が確認できるまで、予約ボタンそのものを出さない。' },
  { id: 'list',        group: 'ナナメの部屋（生徒）', page: 'nanameya.html',          q: 'consent=approved',
    label: '大人をえらぶ（同意ずみ）',
    note: '職業ではなく「迫り方」で絞る。「調べる」56%偏重を崩すための入り口。' },
  { id: 'book',        group: 'ナナメの部屋（生徒）', page: 'nanameya-book.html',     q: 'v=v2&consent=approved',
    label: '予約する',
    note: 'STEP2が肝。相手に渡る探究カードを生徒が同じ画面で確認し、同意して初めて枠を選べる。' },
  { id: 'sess-before', group: 'ナナメの部屋（生徒）', page: 'nanameya-session.html',  q: 'state=before',
    label: '対話カード（当日まで）',
    note: '通話リンクは出さない。時間外の接続とリンクの流出を防ぐため。部屋のメニューから来る。' },
  { id: 'sess-soon',   group: 'ナナメの部屋（生徒）', page: 'nanameya-session.html',  q: 'state=soon',
    label: '対話カード（10分前）',
    note: 'ここで初めて入り口が出る。「困ったときは」は押しやすい塗りに。' },
  { id: 'sess-after',  group: 'ナナメの部屋（生徒）', page: 'nanameya-session.html',  q: 'state=after&b=b3',
    label: '対話カード（おわり）',
    note: '一言はナナメの部屋に残るだけ。ジャーナルへは自動で書き戻さない（管轄が違う）。' },

  { id: 'vol-login',   group: 'ナナメの部屋（大人）', page: 'nanameya-login-volunteer.html',
    label: 'ログイン',
    note: 'メールのリンクで入る（方式は仮）。ログインできるのは承認済みの人だけ。審査中は生徒の記録を一切見られない。' },
  { id: 'vol-home',    group: 'ナナメの部屋（大人）', page: 'nanameya-home-volunteer.html',
    label: '部屋のメニュー',
    note: '未提出の議事録＝「あなたの番」が最上段。0件なら何も出さない（やることを少なく見せて燃え尽きを防ぐ）。' },
  { id: 'volunteer',   group: 'ナナメの部屋（大人）', page: 'nanameya-volunteer.html',
    label: '担当と空き枠',
    note: '未提出の議事録だけを「あなたの番」に。やることを常に少なく見せて燃え尽きを防ぐ。' },
  { id: 'brief',       group: 'ナナメの部屋（大人）', page: 'nanameya-brief.html', q: 'state=before',
    label: '探究カード',
    note: '許可リストの4ブロックだけ。●● は自動で伏せた個人情報。本名・組・番号・先生コメントは渡らない。' },
  { id: 'brief-exp',   group: 'ナナメの部屋（大人）', page: 'nanameya-brief.html', q: 'state=expired',
    label: '探究カード（期限切れ）',
    note: '対話の終了から24時間で開けなくなる。' },
  { id: 'note',        group: 'ナナメの部屋（大人）', page: 'nanameya-note.html',  q: 'b=b2',
    label: '議事録',
    note: '生徒向け1〜2行（120字）＋事務局向け。それぞれ誰が読むかを画面に書いてある。' },

  { id: 'admin',       group: 'ナナメの部屋（事務局）', page: 'nanameya-admin.html',
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
.pv{display:flex;flex-direction:column;min-height:100vh;background:var(--stage)}
.pv-bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:8px;
  padding:10px 18px;background:var(--shell-2);border-bottom:1px solid var(--shell-line)}
.pv-tag{padding:3px 9px;border-radius:999px;background:var(--accent);color:var(--accent-ink);
  font-size:10px;font-weight:800;letter-spacing:.12em}
.pv-b{padding:6px 12px;border:1px solid var(--shell-line);border-radius:8px;cursor:pointer;
  background:transparent;color:var(--shell-ink);font:500 12px inherit;letter-spacing:.02em}
.pv-b:hover:not(:disabled){background:color-mix(in srgb,var(--accent) 14%,transparent)}
.pv-b:disabled{opacity:.35;cursor:default}
.pv-b:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pv-where{display:flex;align-items:baseline;gap:8px;min-width:0}
.pv-title{font-size:13px;font-weight:800;letter-spacing:.02em;white-space:nowrap}
.pv-file{color:var(--shell-faint);font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.pv-states{display:flex;flex-wrap:wrap;gap:3px;padding:3px;border-radius:999px;
  background:color-mix(in srgb,var(--shell-ink) 8%,transparent)}
.pv-states:empty{display:none}
.pv-chip{padding:5px 11px;border:0;border-radius:999px;cursor:pointer;background:transparent;
  color:var(--shell-muted);font:700 11px inherit}
.pv-chip[aria-pressed="true"]{background:var(--shell-2);color:var(--shell-ink)}
.pv-tools{margin-left:auto;display:flex;align-items:center;gap:10px}
.pv-jump{display:flex;align-items:center;gap:6px;color:var(--shell-faint);font-size:11px}
.pv-jump select{padding:5px 8px;border:1px solid var(--shell-line);border-radius:8px;
  background:var(--shell-2);color:var(--shell-ink);font:400 12px inherit;max-width:190px}
.pv-widths{display:flex;gap:3px;padding:3px;border-radius:999px;
  background:color-mix(in srgb,var(--shell-ink) 8%,transparent)}
.pv-w{padding:5px 12px;border:0;border-radius:999px;cursor:pointer;background:transparent;
  color:var(--shell-muted);font:700 11px inherit}
.pv-w[aria-pressed="true"]{background:var(--shell-2);color:var(--shell-ink)}
.pv-note{margin:12px 20px 0;padding:11px 15px;border-left:3px solid var(--accent);border-radius:0 8px 8px 0;
  background:color-mix(in srgb,var(--accent) 12%,transparent);font-size:13px;line-height:1.8;max-width:74ch}
.pv-caution{margin:8px 20px 0;color:var(--shell-faint);font-size:11px;line-height:1.8}
.pv-stage{flex:1;display:grid;place-items:start center;padding:14px 20px 30px;overflow:auto}
.pv-frame{width:100%;max-width:1180px;height:min(76vh,880px);border:1px solid var(--shell-line);
  border-radius:12px;background:#fff;box-shadow:0 18px 44px rgba(0,0,0,.18);transition:max-width .18s}
.pv-frame.is-mobile{max-width:400px}
iframe{width:100%;height:100%;border:0;border-radius:12px;display:block}
@media (max-width:720px){
  .pv-tools{margin-left:0;width:100%}
  .pv-frame{height:70vh}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<div class="pv">
  <header class="pv-bar">
    <span class="pv-tag">PREVIEW</span>
    <button type="button" class="pv-b" id="pv-back">← 戻る</button>
    <button type="button" class="pv-b" id="pv-home">⌂ ポータル</button>
    <span class="pv-where">
      <span class="pv-title" id="pv-title"></span>
      <span class="pv-file" id="pv-file"></span>
    </span>
    <span class="pv-states" id="pv-states"></span>
    <span class="pv-tools">
      <label class="pv-jump">直接ひらく
        <select id="pv-jump"></select>
      </label>
      <span class="pv-widths">
        <button type="button" class="pv-w" data-w="pc" aria-pressed="true">PC</button>
        <button type="button" class="pv-w" data-w="sp" aria-pressed="false">スマホ</button>
      </span>
    </span>
  </header>
  <p class="pv-note" id="pv-note"></p>
  <p class="pv-caution">画面の中はすべて見本データです（実在の生徒・ボランティアではありません）。ポータルから、本物のリンクをたどって移動できます。</p>
  <div class="pv-stage">
    <div class="pv-frame" id="pv-frame"><iframe id="pv-iframe" title="画面プレビュー"></iframe></div>
  </div>
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
  function pvGo(url) {
    if (!url) return;
    var u = url.indexOf('./') === 0 ? url.slice(2) : url;
    var parts = u.split('?');
    parent.postMessage({ pv: parts[0], q: parts[1] || '' }, '*');
  }
  /* ログイン等のフォーム送信。行き先はアプリ側の data-next をそのまま読む。
     見本なので入力チェックは通さず、そのまま次の画面へ進める。 */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.dataset || !f.dataset.next) return;
    e.preventDefault();
    e.stopPropagation();
    pvGo(f.dataset.next);
  }, true);
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

/* ---- プレビューの外枠（アプリの一部ではない） ----
   サイドメニューは廃止した。移動は本物のリンクをたどる（ポータル起点）。
   ここに残すのは「戻る／ポータル／見本の状態／直接ひらく」の4つだけ。 */
const jumpEl = document.getElementById('pv-jump');
[...new Set(SCREENS.map((s) => s.group))].forEach((g) => {
  const og = document.createElement('optgroup');
  og.label = g;
  SCREENS.filter((s) => s.group === g).forEach((s) => {
    const o = document.createElement('option');
    o.value = s.id; o.textContent = s.label;
    og.appendChild(o);
  });
  jumpEl.appendChild(og);
});
jumpEl.addEventListener('change', () => go(jumpEl.value));

const navStack = [];
let currentId = null;

/* 「大人をえらぶ（同意まえ）」から「同意まえ」だけを取り出す */
function stateLabel(v) {
  const m = v.label.match(/（([^）]+)）\s*$/);
  return m ? m[1] : v.label;
}

function draw(id) {
  const s = SCREENS.find((x) => x.id === id) || SCREENS[0];
  currentId = s.id;
  document.getElementById('pv-title').textContent = s.label;
  document.getElementById('pv-file').textContent = s.page + (s.q ? '?' + s.q : '');
  document.getElementById('pv-note').textContent = s.note;
  document.getElementById('pv-back').disabled = navStack.length === 0;
  jumpEl.value = s.id;

  /* 同じファイルに見本の状態が複数あるときだけ、切り替えを出す */
  const variants = SCREENS.filter((x) => x.page === s.page);
  document.getElementById('pv-states').innerHTML = variants.length < 2 ? ''
    : variants.map((v) => '<button type="button" class="pv-chip" data-id="' + v.id
        + '" aria-pressed="' + (v.id === s.id) + '">' + stateLabel(v) + '</button>').join('');

  document.getElementById('pv-iframe').srcdoc = docFor(s);
}

function go(id) {
  if (currentId && id !== currentId) navStack.push(currentId);
  draw(id);
}

document.getElementById('pv-states').addEventListener('click', (e) => {
  const b = e.target.closest('.pv-chip');
  if (b) go(b.dataset.id);
});
document.getElementById('pv-back').addEventListener('click', () => {
  const prev = navStack.pop();
  if (prev) draw(prev);
});
document.getElementById('pv-home').addEventListener('click', () => go(SCREENS[0].id));

document.querySelectorAll('.pv-w').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.pv-w').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.getElementById('pv-frame').classList.toggle('is-mobile', b.dataset.w === 'sp');
  });
});

/* 画面の中のリンクを押したら、対応する画面へ（本物の導線をそのままたどる） */
addEventListener('message', (e) => {
  const file = e.data && e.data.pv;
  if (!file) return;
  const hit = SCREENS.find((s) => s.page === file && (!e.data.q || s.q === e.data.q))
           || SCREENS.find((s) => s.page === file);
  if (hit) go(hit.id);
});

draw(SCREENS[0].id);
</script>
`;
}
