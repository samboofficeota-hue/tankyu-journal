/**
 * 議事録（V2 / シナリオ1のステップ8）
 * 生徒向け（1〜2行・必須）と事務局向け（任意）の2パート。
 * 全文書き起こしはしない（docs/nanameya-flow.md 決めごとC）。
 */
const D = window.NANAMEYA_DATA;
const q = new URLSearchParams(location.search);
const booking = D.bookings.find((b) => b.id === q.get('b'))
  || D.bookings.find((b) => b.status === 'ended') || D.booking;

const startsAt = new Date(booking.starts_at);
const t = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const endsAt = new Date(startsAt.getTime() + booking.duration_min * 60000);

document.querySelector('#note-meta').innerHTML = `
  <b>${booking.grade}年生・${booking.nickname} さん</b>
  <span>${startsAt.getMonth() + 1}月${startsAt.getDate()}日 ${t(startsAt)}〜${t(endsAt)}</span>
  <a class="note-meta-link" href="./nanameya-brief.html?b=${booking.id}">探究カードを見返す</a>`;

const ta = document.querySelector('#note-student');
const count = document.querySelector('#note-count');
ta.addEventListener('input', () => { count.textContent = ta.value.length; });

document.querySelector('#note-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const held = document.querySelector('input[name="held"]:checked').value;
  const forStudent = ta.value.trim();
  if (held === 'held' && !forStudent) {
    alert('生徒に渡す一言を書いてください。1行でかまいません。');
    ta.focus();
    return;
  }
  alert('（モック）議事録を提出しました。\n'
      + '・生徒の「次に挑戦すること」に下書きとして入ります\n'
      + '・事務局の未確認一覧に届きます');
});

document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault(); alert('（モック）事務局にすぐ知らせます。');
});
