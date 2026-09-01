const loginForm = document.querySelector('#student-login');
const message = document.querySelector('#login-message');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const grade = document.querySelector('#grade').value.trim();
  const className = document.querySelector('#class').value.trim().toUpperCase();
  const number = document.querySelector('#number').value.trim();

  if (!grade || !className || !number) {
    message.textContent = '学年・組・番号をすべて入力してください。';
    return;
  }

  // デモモード（API未接続）では、原宿外苑さん以外は中身が空になる旨を案内
  if (!(window.JournalAPI && window.JournalAPI.isLive())) {
    const isDemo = grade === '9' && className === 'A' && number === '47';
    if (!isDemo) {
      message.textContent = 'デモ表示中です。中身のあるサンプルは 9年 A組 47番 でお試しください。';
      // それでも進めるように、少し待ってから遷移
    }
  }

  sessionStorage.setItem('journal.student', JSON.stringify({ grade, cls: className, no: number }));
  window.location.href = './student.html';
});
