/**
 * ナナメの部屋 — ナナメの大人の部屋メニュー（C6／V1〜V3）
 * ------------------------------------------------------------------
 * ポータル → ログイン → ここ → 各画面。
 * 並び順の根拠（docs/nanameya-entry.md §3）:
 *   C6の離脱要因は燃え尽き。だから「やること」＝未提出の議事録を最上段に置き、
 *   それが0件のときは何も出さない（やることが少なく見えることが設計の目的）。
 */
const D = window.NANAMEYA_DATA;
const me = D.me;
const meVol = D.volunteers.find((v) => v.id === me.volunteer_id);
document.querySelector('#who').textContent = meVol ? `${meVol.name} さん` : '';

const mine = D.bookings.filter((b) => b.volunteer_id === me.volunteer_id);
const todo = mine.filter((b) => b.status === 'ended');                          // 議事録が未提出
const next = mine.find((b) => ['booked', 'reminded', 'live'].includes(b.status));

const t = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const when = (iso, min) => {
  const s = new Date(iso);
  const e = new Date(s.getTime() + min * 60000);
  return `${s.getMonth() + 1}月${s.getDate()}日（${'日月火水木金土'[s.getDay()]}） ${t(s)}〜${t(e)}`;
};

const cards = [];

/* 1. あなたの番（未提出の議事録）。0件なら出さない */
todo.forEach((b) => {
  cards.push(`
    <div class="home-card is-todo">
      <div class="home-card-body">
        <span class="home-card-label">あなたの番</span>
        <b class="home-card-title">${b.nickname} さん（${b.grade}年）の議事録が未提出です</b>
        <p class="home-card-desc">${when(b.starts_at, b.duration_min)}の対話。生徒向けに1〜2行、事務局向けはひとことで。</p>
      </div>
      <a class="home-card-btn" href="./nanameya-note.html?b=${b.id}">議事録を書く <span aria-hidden="true">→</span></a>
    </div>`);
});

/* 2. 次の対話 */
if (next) {
  cards.push(`
    <div class="home-card is-now">
      <div class="home-card-body">
        <span class="home-card-label">つぎの対話</span>
        <b class="home-card-title">${when(next.starts_at, next.duration_min)}　${next.nickname} さん（${next.grade}年）</b>
        <p class="home-card-desc">はじまる前に、探究カードに目を通しておいてください。5分もかかりません。</p>
      </div>
      <a class="home-card-btn" href="./nanameya-brief.html?b=${next.id}">探究カードを読む <span aria-hidden="true">→</span></a>
    </div>`);
}

document.querySelector('#home-cards').innerHTML = cards.join('');

/* 3. メニュー */
const TILES = [
  { ico: '🗂', name: '担当と空き枠', desc: '担当している対話の一覧と、登録した空き枠。', href: './nanameya-volunteer.html' },
  { ico: '🗓', name: '空いている時間を出す', desc: 'カレンダーの空きから、話せる枠を出します。', href: './nanameya-volunteer.html' },
  { ico: '📄', name: '自分の登録内容・行動規範', desc: 'プロフィールと、署名した行動規範を確認します。', href: '' },
  { ico: '🛟', name: '運営に連絡', desc: '気になることがあれば、いつでも事務局へ。', href: '' }
];

document.querySelector('#home-menu').innerHTML = TILES.map((tl) => {
  const body = `<span class="menu-ico">${tl.ico}</span>
    <b class="menu-name">${tl.name}</b>
    <span class="menu-desc">${tl.desc}</span>`;
  return tl.href
    ? `<a class="menu-tile" href="${tl.href}">${body}<span class="menu-arrow">→</span></a>`
    : `<div class="menu-tile is-soon">${body}</div>`;
}).join('');

document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）エスラボ事務局にエスカレーションします。');
});
