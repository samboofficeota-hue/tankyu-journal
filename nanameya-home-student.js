/**
 * ナナメの部屋 — 生徒の部屋メニュー（C1・C2／S3・S5・S6）
 * ------------------------------------------------------------------
 * ポータル → ログイン → ここ → 各画面。ログインの先の「家」にあたる画面。
 *
 * この画面が要る理由（docs/nanameya-entry.md §1）:
 *   ・予約したあと、自分の対話カードを見に行く場所が無かった
 *   ・C2「毎回リセット型」のゴール＝前回の続きから始める、の置き場が無かった
 *
 * ★見本データ（nanameya-data.js）で描画する。API化のときは、
 *   ログイン中の生徒の bookings だけを /api/nanameya/bookings から引く。
 */
const D = window.NANAMEYA_DATA;
const q = new URLSearchParams(location.search);

/* 保護者同意。モック確認用に ?consent=approved で切り替えられる */
const consentOK = (q.get('consent') || D.consent.status) === 'approved';

/* ログイン中の生徒。★暫定で学年・組・番号（nanameya-login-student.js の注意を参照） */
const who = (() => {
  try { return JSON.parse(sessionStorage.getItem('nanameya.student')) || null; } catch (_) { return null; }
})() || { grade: D.entry.grade, cls: D.entry.cls, no: D.entry.no };
document.querySelector('#who').textContent = `${who.grade}年${who.cls}組${who.no}番`;

document.querySelector('#consent-gate').hidden = consentOK;

/* ---- 日時の見せ方（対話カードと同じ書式）---- */
const t = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const when = (iso, min) => {
  const s = new Date(iso);
  const e = new Date(s.getTime() + min * 60000);
  return `${s.getMonth() + 1}月${s.getDate()}日（${'日月火水木金土'[s.getDay()]}） ${t(s)}〜${t(e)}`;
};

/* ---- 次の対話 と 前回の対話 ---- */
const next = D.bookings.find((b) => ['booked', 'reminded', 'live'].includes(b.status));
const last = D.bookings.find((b) => b.note_for_student);
const vname = (id) => D.volunteerName(id);

const cards = [];

if (next) {
  const soon = Date.now() >= new Date(next.starts_at).getTime() - 10 * 60000;
  cards.push(`
    <div class="home-card is-now">
      <div class="home-card-body">
        <span class="home-card-label">つぎの対話</span>
        <b class="home-card-title">${when(next.starts_at, next.duration_min)}　${vname(next.volunteer_id)} さん</b>
        <p class="home-card-desc">${soon
          ? 'そろそろです。静かなところで、ひとりで入ってください。'
          : '通話の入り口は、はじまる10分前にここに出ます。'}</p>
      </div>
      <a class="home-card-btn" href="./nanameya-session.html?b=${next.id}">
        ${soon ? 'はなしに行く' : '対話カードをひらく'} <span aria-hidden="true">→</span>
      </a>
    </div>`);
}

if (last) {
  cards.push(`
    <div class="home-card">
      <div class="home-card-body">
        <span class="home-card-label">まえの対話</span>
        <b class="home-card-title">${vname(last.volunteer_id)} さんと話したこと</b>
        <blockquote class="home-card-quote">${last.note_for_student}</blockquote>
        <p class="home-card-desc">
          次にジャーナルを書くとき、「次に挑戦すること」に写してみてください。写さなくてもかまいません。
        </p>
      </div>
      <a class="home-card-btn" href="./nanameya-session.html?state=after&b=${last.id}">もう一度読む <span aria-hidden="true">→</span></a>
    </div>`);
}

document.querySelector('#home-cards').innerHTML = cards.join('');

/* ---- 部屋のメニュー ---- */
const TILES = [
  { ico: '🔎', name: '大人をえらぶ', desc: '職業ではなく「どう迫るか」で選びます。',
    href: consentOK ? './nanameya.html?consent=approved' : './nanameya.html?consent=none' },
  { ico: '🗓', name: '予約している対話', desc: '日時の確認と、はじまる10分前の入り口。',
    href: next ? `./nanameya-session.html?b=${next.id}` : '' },
  { ico: '🏠', name: 'おうちの人の同意', desc: consentOK ? '同意ずみです。内容を確認できます。' : 'まだ同意が確認できていません。',
    href: '' }
];

document.querySelector('#home-menu').innerHTML = TILES.map((tl) => {
  const body = `<span class="menu-ico">${tl.ico}</span>
    <b class="menu-name">${tl.name}</b>
    <span class="menu-desc">${tl.desc}</span>`;
  return tl.href
    ? `<a class="menu-tile" href="${tl.href}">${body}<span class="menu-arrow">→</span></a>`
    : `<div class="menu-tile is-soon">${body}</div>`;
}).join('');

/* ---- S5: 通報導線（実装時は /api/nanameya/report へ POST）---- */
document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）エスラボ運営にすぐ知らせます。');
});
document.querySelector('#consent-start').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）保護者向けの説明ページをひらきます。');
});
