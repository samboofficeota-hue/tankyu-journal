/**
 * 生徒の対話カード（S5 対話・S6 つながる）
 * 通話リンクは開始10分前まで出さない（docs/nanameya-flow.md 決めごとA）。
 */
const D = window.NANAMEYA_DATA;
const q = new URLSearchParams(location.search);

const booking = D.bookings.find((b) => b.id === q.get('b')) || D.booking;
const volunteer = D.volunteers.find((v) => v.id === booking.volunteer_id);
const startsAt = new Date(booking.starts_at);
const endsAt = new Date(startsAt.getTime() + booking.duration_min * 60000);

function currentState() {
  const forced = q.get('state');
  if (forced) return forced;
  const now = Date.now();
  if (now < startsAt.getTime() - 10 * 60000) return 'before';
  if (now < startsAt.getTime()) return 'soon';
  if (now < endsAt.getTime()) return 'live';
  return 'after';
}
const state = currentState();

const t = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const day = `${startsAt.getMonth() + 1}月${startsAt.getDate()}日（${'日月火水木金土'[startsAt.getDay()]}）`;

const COPY = {
  before: { badge: '予約ずみ', lead: 'その日になったら、ここに入り口が出ます。準備はいりません。',
            note: '通話のリンクは、はじまる10分前に出ます。' },
  soon:   { badge: 'まもなく', lead: 'そろそろです。静かなところで、ひとりで入ってください。',
            note: 'カメラは出しても出さなくても大丈夫です。' },
  live:   { badge: '対話中',   lead: 'いま話しています。', note: '' },
  after:  { badge: 'おわり',   lead: 'おつかれさま。話したことは下に残しておきます。', note: '' }
};
const c = COPY[state] || COPY.before;
document.querySelector('#sess-title').textContent =
  state === 'after' ? 'おわった対話' : state === 'live' ? '対話中' : '予約している対話';
const canEnter = state === 'soon' || state === 'live';

document.querySelector('#sess-card').innerHTML = `
  <div class="sess-head">
    <span class="brief-badge is-${state === 'after' ? 'done' : canEnter ? 'go' : 'wait'}">${c.badge}</span>
    <b class="brief-when">${day} ${t(startsAt)}〜${t(endsAt)}</b>
  </div>
  <div class="sess-who">
    <span class="person-avatar" aria-hidden="true">${volunteer ? volunteer.avatar : '🙂'}</span>
    <div>
      <b>${volunteer ? volunteer.name : ''} さん</b>
      <span class="person-title">${volunteer ? volunteer.title : ''}</span>
    </div>
  </div>
  <p class="sess-lead">${c.lead}</p>
  ${canEnter
    ? `<a class="sess-enter" href="${booking.meet_url}" target="_blank" rel="noopener">はなしに行く <span aria-hidden="true">→</span></a>`
    : state === 'after' ? ''
    : `<span class="sess-enter is-locked">🔒 はじまる10分前に、ここに入り口が出ます</span>`}
  ${c.note ? `<p class="sess-note-small">${c.note}</p>` : ''}`;

/* S6: 対話のあと、大人の一言が「次に挑戦すること」の下書きになる */
if (state === 'after') {
  const draft = booking.note_for_student
    || '商店街のお店に「いつから続いているか」だけ聞いてみる。まず1軒。';
  const el = document.querySelector('#sess-note');
  el.hidden = false;
  el.innerHTML = `
    <h2 class="sess-note-title">${volunteer ? volunteer.name : ''} さんからの一言</h2>
    <blockquote class="sess-quote" id="sess-draft">${draft}</blockquote>
    <p class="sess-note-desc">
      次にジャーナルを書くとき、「次に挑戦すること」にこれを写してみてください。
      そのままでも、書きかえても、やめてもかまいません。
    </p>
    <button type="button" class="sess-enter" id="sess-copy">この一言をコピーする</button>
    <p class="sess-note-small">
      ナナメの部屋はエスラボ、ジャーナルは学校のもの。
      ここで話したことが自動でジャーナルに入ることはありません。
    </p>`;
  document.querySelector('#sess-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(draft); } catch (_) { /* 失敗しても下に文は出ている */ }
    document.querySelector('#sess-copy').textContent = 'コピーしました';
  });
}

document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）エスラボ運営にすぐ知らせます。\nいやな思いをしたときは、話している最中でも押して大丈夫です。');
});
