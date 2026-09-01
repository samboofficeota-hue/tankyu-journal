const loginForm = document.querySelector('#student-login');
const message = document.querySelector('#login-message');
const gradeSel = document.querySelector('#grade');
const classSel = document.querySelector('#class');

// 組の選択肢：D組は1年のみ
const CLASSES = { '1': ['A', 'B', 'C', 'D'], '2': ['A', 'B', 'C'], '3': ['A', 'B', 'C'] };

function fillClasses() {
  const g = gradeSel.value;
  const list = CLASSES[g] || [];
  classSel.innerHTML = '<option value="" disabled selected>―</option>' +
    list.map((c) => `<option value="${c}">${c}</option>`).join('');
  classSel.disabled = !g;
}
gradeSel.addEventListener('change', fillClasses);

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const grade = gradeSel.value.trim();
  const className = classSel.value.trim().toUpperCase();
  const number = document.querySelector('#number').value.trim();

  if (!grade || !className || !number) {
    message.textContent = '学年・組・番号をすべて選んでください。';
    return;
  }

  sessionStorage.setItem('journal.student', JSON.stringify({ grade, cls: className, no: number }));
  window.location.href = './student.html';
});
