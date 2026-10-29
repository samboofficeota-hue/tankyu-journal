/**
 * ナナメの大人（C6）の画面：空き枠の登録（V0-5/S1）と担当一覧・事後メモ（V1〜V3）
 * 未提出の議事録を一番上に出す（燃え尽きを防ぐため、やることは常に少なく見せる）。
 */
const D = window.NANAMEYA_DATA;
const me = D.me;

const t = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const fmt = (iso, min) => {
  const d = new Date(iso), e = new Date(new Date(iso).getTime() + min * 60000);
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}） ${t(d)}〜${t(e)}`;
};

/* ---- 自分の状態（審査中は生徒の記録が一切見えない）---- */
const STATE = {
  reviewing: { label: '審査中',       tone: 'wait', note: '事務局が確認しています。生徒の記録はまだ見られません。' },
  training:  { label: '研修待ち',     tone: 'wait', note: '行動規範への署名と研修が終わると、空き枠を出せます。' },
  trial:     { label: '慣らし運用中', tone: 'wait', note: 'はじめの数回は事務局が同席します。' },
  active:    { label: '活動中',       tone: 'go',   note: 'カレンダーはつながっています。' },
  paused:    { label: '一時停止中',   tone: 'done', note: '事務局が確認中です。新しい予約は入りません。' }
};
const st = STATE[me.status] || STATE.reviewing;
document.querySelector('#vol-state').innerHTML = `
  <span class="brief-badge is-${st.tone}">${st.label}</span>
  <b class="vol-me">${D.volunteerName(me.volunteer_id)} さん</b>
  <span class="vol-state-note">${st.note}</span>
  <span class="vol-cal">${me.calendar_connected ? '📅 Googleカレンダー連携ずみ' : '📅 カレンダー未接続'}</span>`;

/* ---- 担当の予約 ---- */
const mine = D.bookings.filter((b) => b.volunteer_id === me.volunteer_id);
const todo = mine.filter((b) => b.status === 'ended');                       // 議事録が未提出
const next = mine.filter((b) => ['booked', 'reminded', 'live'].includes(b.status));
const done = mine.filter((b) => ['noted', 'closed', 'no_show', 'cancelled', 'reported'].includes(b.status));

const BADGE = { booked: '予約ずみ', reminded: 'まもなく', live: '対話中', ended: '議事録がまだ',
                noted: '提出ずみ', closed: '完了', no_show: '来なかった', cancelled: 'キャンセル',
                reported: '事務局が対応中' };

function row(b, action) {
  return `<article class="vol-item">
    <div class="vol-item-main">
      <b>${fmt(b.starts_at, b.duration_min)}</b>
      <span class="vol-item-who">${b.grade}年生・${b.nickname} さん</span>
    </div>
    <span class="vol-item-badge">${BADGE[b.status] || b.status}</span>
    ${action}
  </article>`;
}

const canSeeRecords = me.status === 'trial' || me.status === 'active';
const briefLink = (b) => canSeeRecords
  ? `<a class="vol-item-btn" href="./nanameya-brief.html?b=${b.id}">探究カードを読む</a>`
  : `<span class="vol-item-btn is-locked">承認されると読めます</span>`;

document.querySelector('#vol-todo').innerHTML = todo.length
  ? todo.map((b) => row(b, `<a class="vol-item-btn is-primary" href="./nanameya-note.html?b=${b.id}">議事録を書く</a>`)).join('')
  : '<p class="vol-empty">いまやることはありません。</p>';

document.querySelector('#vol-next').innerHTML = next.length
  ? next.map((b) => row(b, briefLink(b))).join('')
  : '<p class="vol-empty">予約はまだ入っていません。</p>';

document.querySelector('#vol-done').innerHTML = done.length
  ? done.map((b) => row(b, '')).join('')
  : '<p class="vol-empty">まだありません。</p>';

/* ---- 空き枠（TimeRex に委譲）---- */
const timerex = (window.JOURNAL_CONFIG || {}).TIMEREX_URL;
document.querySelector('#vol-slots').innerHTML = `
  ${D.slots.map((s) => `
    <div class="vol-slot${s.taken ? ' is-taken' : ''}">
      <b>${fmt(s.starts_at, s.duration_min)}</b>
      <span>${s.taken ? '予約が入りました' : '空いています'}</span>
    </div>`).join('')}
  <a class="vol-slot-add" href="${timerex || '#'}" ${timerex ? 'target="_blank" rel="noopener"' : ''}>
    ＋ 空いている時間を追加する${timerex ? '' : '（TimeRex の登録後に有効になります）'}
  </a>`;

document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）事務局にすぐ知らせます。\n生徒の様子が気になったときも、ここから。');
});
