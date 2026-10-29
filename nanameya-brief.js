/**
 * 探究カード（C6 大人が対話の前／最中に読む画面）
 * ルールの正本は docs/nanameya-privacy.md、流れは docs/nanameya-flow.md。
 *
 * 本番では /api/nanameya/brief?booking=... がサーバー側でマスク済みのカードを返す。
 * ここではモックデータに nanameya-mask.js をかけて、同じ形を作っている。
 */
const D = window.NANAMEYA_DATA;
const MASK = window.NANAMEYA_MASK;
const q = new URLSearchParams(location.search);

const booking = D.booking;
const volunteer = D.volunteers.find((v) => v.id === booking.volunteer_id);
const startsAt = new Date(booking.starts_at);
const endsAt = new Date(startsAt.getTime() + booking.duration_min * 60 * 1000);

/* 状態：before（準備）/ soon（10分前〜）/ live（対話中）/ after（終了〜24h）/ expired
   ?state= で上書きできる（画面確認用） */
function currentState() {
  const forced = q.get('state');
  if (forced) return forced;
  const now = Date.now();
  if (now < startsAt.getTime() - 10 * 60 * 1000) return 'before';
  if (now < startsAt.getTime()) return 'soon';
  if (now < endsAt.getTime()) return 'live';
  if (now < endsAt.getTime() + 24 * 60 * 60 * 1000) return 'after';
  return 'expired';
}
const state = currentState();

const fmtTime = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const fmtDate = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;

/* ---- 対話の状態と入室ボタン ---- */
const STATUS = {
  before:  { tone: 'wait', badge: '予約ずみ',   note: '入室リンクは開始の10分前に出ます。' },
  soon:    { tone: 'go',   badge: 'まもなく',   note: '入室できます。' },
  live:    { tone: 'go',   badge: '対話中',     note: '15〜20分を目安に。' },
  after:   { tone: 'done', badge: '終了',       note: '議事録をお願いします（生徒向け1〜2行＋事務局向け）。' },
  expired: { tone: 'done', badge: '終了',       note: '閲覧できる期間が過ぎました。' }
};

function renderStatus() {
  const s = STATUS[state] || STATUS.before;
  const canEnter = state === 'soon' || state === 'live';
  document.querySelector('#brief-status').innerHTML = `
    <div class="brief-status-main">
      <span class="brief-badge is-${s.tone}">${s.badge}</span>
      <b class="brief-when">${fmtDate(startsAt)} ${fmtTime(startsAt)}〜${fmtTime(endsAt)}</b>
      <span class="brief-with">${volunteer ? volunteer.name + ' さん担当' : ''}</span>
    </div>
    <p class="brief-status-note">${s.note}</p>
    ${canEnter
      ? `<a class="brief-enter" href="${booking.meet_url}" target="_blank" rel="noopener">通話に入る <span aria-hidden="true">→</span></a>`
      : state === 'after'
        ? `<a class="brief-enter" href="./nanameya-note.html?b=${booking.id}">議事録を書く <span aria-hidden="true">→</span></a>`
        : `<span class="brief-enter is-locked">開始10分前になると入れます</span>`}`;
}

/* ---- 誰の記録か（学年＋ニックネームまで）---- */
function renderWho(brief) {
  document.querySelector('#brief-who').innerHTML = `
    <span class="brief-avatar" aria-hidden="true">🙂</span>
    <div>
      <b class="brief-nick">${brief.grade}年生・${brief.nickname} さん</b>
      <span class="brief-masked">学校名／組／出席番号／本名は表示していません</span>
    </div>
    <span class="brief-src">${brief.session}回の記録・${brief.updatedAt}</span>`;
}

/* ---- 探究の中身 ---- */
function renderBlocks(brief) {
  document.querySelector('#brief-blocks').innerHTML = brief.blocks.map((b) => `
    <article class="brief-block">
      <h2 class="brief-block-label">${b.label}</h2>
      ${b.body.split('\n').map((line) => `<p>${line}</p>`).join('')}
    </article>`).join('');
}

/* ---- 描画 ---- */
if (state === 'expired') {
  document.querySelector('#brief-expired').hidden = false;
  document.querySelector('#brief-who').hidden = true;
  document.querySelector('#brief-blocks').hidden = true;
  renderStatus();
} else {
  // ★ マスクはここではなく本番ではサーバー側。生データは大人に届けない。
  const brief = MASK.buildBrief(D.entry, { type: 1, nickname: booking.nickname });
  renderStatus();
  renderWho(brief);
  renderBlocks(brief);
}

document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）事務局にすぐ知らせます。\n記録の中に気になる記述があった場合もここから。');
});
