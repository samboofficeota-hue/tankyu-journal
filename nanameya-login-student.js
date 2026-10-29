/**
 * ナナメの部屋 — 生徒のログイン（S1）
 * ------------------------------------------------------------------
 * ★暫定仕様：ジャーナルと同じ「学年・組・番号」で入る（2026-09-05 太田さんの判断）。
 *   個人情報保護の対応は最後にまとめて行う方針のため、いまは認証をかけていない。
 *
 * ⚠️ この方式のまま本番に出さないこと。
 *    番号は他人のものでも入力できる ＝ 他人になりすまして予約でき、
 *    その生徒の探究カードが外部の大人に渡る。
 *    まとめ対応のときに docs/nanameya-entry.md §5 の方式へ差し替える:
 *      A 招待コード＋PIN（エスラボが名簿を持たずに済む・推奨）
 *      B 学校のGoogleアカウント（SSO）
 *    あわせて docs/nanameya-flow.md §5 の bookings の主キーも見直す。
 */
const form = document.querySelector('#naname-student-login');
const message = document.querySelector('#login-message');
const gradeSel = document.querySelector('#grade');
const classSel = document.querySelector('#class');

/* 組の選択肢：D組は1年のみ（ジャーナル側 login.js と同じ） */
const CLASSES = { '1': ['A', 'B', 'C', 'D'], '2': ['A', 'B', 'C'], '3': ['A', 'B', 'C'] };

function fillClasses() {
  const list = CLASSES[gradeSel.value] || [];
  classSel.innerHTML = '<option value="" disabled selected>―</option>' +
    list.map((c) => `<option value="${c}">${c}</option>`).join('');
  classSel.disabled = !gradeSel.value;
}
gradeSel.addEventListener('change', fillClasses);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const grade = gradeSel.value.trim();
  const cls = classSel.value.trim().toUpperCase();
  const no = document.querySelector('#number').value.trim();

  if (!grade || !cls || !no) {
    message.textContent = '学年・組・番号をすべて選んでください。';
    return;
  }

  /* ★ここが暫定。本番では、この3つを鍵にしないこと（冒頭の注意を参照） */
  sessionStorage.setItem('nanameya.student', JSON.stringify({ grade, cls, no }));
  window.location.href = form.dataset.next;
});
