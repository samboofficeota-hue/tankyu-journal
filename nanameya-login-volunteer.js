/**
 * ナナメの部屋 — ナナメの大人のログイン（C6）
 * ------------------------------------------------------------------
 * 大人はメールアドレスを持っているので、パスワードレス（メールのリンク）で入る。
 * ★方式は仮。太田さんの判断待ち（docs/nanameya-entry.md §6-1・§9-4）。
 *
 * 実装時の必須条件:
 *   ・ログインできるのは status が 'active' の人だけ。
 *     審査中（C5）は入れない＝どの生徒の記録も見えない（docs/nanameya-privacy.md §4）
 *   ・リンクは短時間で失効させる（担当する生徒の探究カードに触れられる鍵になるため）
 */
const form = document.querySelector('#naname-volunteer-login');
const message = document.querySelector('#login-message');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim();
  if (!email) {
    message.textContent = 'メールアドレスを入れてください。';
    return;
  }
  /* モックなので、そのまま部屋へ入る。
     実装時はここで /api/nanameya/login にPOSTし、メールのリンクを踏んで戻ってくる */
  window.location.href = form.dataset.next;
});
