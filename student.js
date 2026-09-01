/* My 探究ジャーナル — 生徒ページ（A〜D を1枚で切り替え・スプシ連動） */
(function () {
  const $ = (s) => document.querySelector(s);
  const schema = window.JOURNAL_SCHEMA;
  const API = window.JournalAPI;

  const student = JSON.parse(sessionStorage.getItem('journal.student') || 'null');
  if (!student) { window.location.href = './login.html'; return; }

  let data = null;            // readStudent の結果
  let current = schema.order[0];
  let dirty = false;

  const form = $('#journal-form');
  const memoryDialog = $('#memory-dialog');
  const submitDialog = $('#submit-dialog');
  const feedbackDialog = $('#teacher-feedback-dialog');

  // --- ヘッダー（生徒情報・回タブ）---
  $('#student-identity').innerHTML =
    `<span>${esc(student.grade)}年 ${esc(student.cls)}組</span><b>${esc(student.no)}番</b><strong id="student-name-label">…</strong>`;

  function buildSteps() {
    const ol = $('#session-steps');
    ol.innerHTML = schema.order.map((sid) =>
      `<li class="${sid === current ? 'active' : ''}"><button type="button" data-session="${sid}"${sid === current ? ' aria-current="page"' : ''}>${sid}</button></li>`
    ).join('');
    ol.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.session === current) return;
      if (dirty && !confirm('保存していない下書きがあります。移動しますか？')) return;
      current = b.dataset.session;
      buildSteps();
      renderSession();
    }));
  }

  function sessionData(sid) {
    if (!data) return { cells: {}, teacherComment: '', found: false };
    return data.sessions.find((s) => s.id === sid) || { cells: {}, teacherComment: '', found: false };
  }

  function renderSession() {
    const meta = schema.sessions[current];
    const sd = sessionData(current);
    $('#session-eyebrow').textContent = meta.eyebrow;
    $('#session-title').textContent = meta.title;
    $('#session-intro').innerHTML = meta.intro;

    // 先生コメント
    const trigger = $('#teacher-comment-trigger');
    if (sd.teacherComment) {
      trigger.hidden = false;
      trigger.onclick = () => { $('#teacher-feedback-text').textContent = sd.teacherComment; feedbackDialog.showModal(); };
    } else { trigger.hidden = true; }

    // フォーム生成
    const fields = schema.fields[meta.type];
    let html = '';
    fields.forEach((f) => {
      if (f.step) {
        html += `<div class="form-section"><p class="section-label">${esc(f.step)}</p>${f.note ? `<p class="section-note">${esc(f.note)}</p>` : ''}</div>`;
        return;
      }
      const val = esc(sd.cells[f.col] || '');
      const req = f.required ? ' <em>必須</em>' : '';
      const help = f.help ? `<p class="help">${esc(f.help)}</p>` : '';
      const input = f.long
        ? `<textarea data-col="${f.col}" ${f.required ? 'required' : ''}>${val}</textarea>`
        : `<input class="short-answer" data-col="${f.col}" ${f.required ? 'required' : ''} value="${val}" />`;
      html += `<fieldset class="question"><legend><span>${f.n}</span> ${esc(f.label)}${req}</legend>${help}${input}</fieldset>`;
    });

    html += `<div class="actions">
        <p id="save-status" aria-live="polite">${sd.found ? '前回までの記録を表示しています' : 'まだ記録がありません'}</p>
        <button type="button" class="secondary" id="save-draft">下書き保存</button>
        <button type="submit" class="primary">提出する</button>
      </div>`;
    form.innerHTML = html;
    dirty = false;

    form.querySelectorAll('textarea,input').forEach((el) => el.addEventListener('input', () => {
      dirty = true; $('#save-status').textContent = '未保存の変更があります';
    }));
    $('#save-draft').addEventListener('click', saveDraft);
  }

  function collectAnswers() {
    const answers = {};
    form.querySelectorAll('[data-col]').forEach((el) => { answers[el.dataset.col] = el.value; });
    return answers;
  }

  // 下書きはローカル保存（提出まではスプシに書かない）
  function saveDraft() {
    const answers = collectAnswers();
    localStorage.setItem(draftKey(), JSON.stringify(answers));
    dirty = false;
    $('#save-status').textContent = '✓ 下書きを保存しました（この端末に）';
  }
  function draftKey() { return `journal.draft.${student.grade}.${student.cls}.${student.no}.${current}`; }

  function restoreDraft() {
    const raw = localStorage.getItem(draftKey());
    if (!raw) return;
    try {
      const answers = JSON.parse(raw);
      form.querySelectorAll('[data-col]').forEach((el) => {
        if (answers[el.dataset.col] != null && answers[el.dataset.col] !== '') el.value = answers[el.dataset.col];
      });
    } catch (e) {}
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = '提出中…';
    API.saveAnswers({
      grade: student.grade, cls: student.cls, no: student.no, name: data && data.student && data.student.name,
      sessionId: current, answers: collectAnswers()
    }).then((res) => {
      btn.disabled = false; btn.textContent = '提出する';
      if (res && res.ok) {
        localStorage.removeItem(draftKey());
        // ローカルの data も更新
        const sd = sessionData(current); sd.cells = collectAnswers(); sd.found = true;
        $('#submit-body').textContent = API.isLive()
          ? '今日の記録がスプレッドシートに届きました。先生にも共有されます。'
          : '（デモ表示：実際のスプレッドシートには書き込まれていません）';
        submitDialog.showModal();
      } else {
        alert('保存に失敗しました：' + ((res && res.error) || '不明なエラー'));
      }
    }).catch((err) => {
      btn.disabled = false; btn.textContent = '提出する';
      alert('通信エラー：' + err);
    });
  });

  document.querySelectorAll('.close, .close-dialog').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

  // 印刷（A4タテ）時：テキストエリアを中身の高さまで伸ばして、回答が切れないようにする
  function fitTextareasForPrint() {
    form.querySelectorAll('textarea').forEach((t) => { t.dataset._h = t.style.height; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; });
  }
  function restoreTextareas() {
    form.querySelectorAll('textarea').forEach((t) => { t.style.height = t.dataset._h || ''; });
  }
  window.addEventListener('beforeprint', fitTextareasForPrint);
  window.addEventListener('afterprint', restoreTextareas);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // --- 初期ロード ---
  buildSteps();
  $('#load-status').hidden = false;
  $('#load-status').textContent = API.isLive() ? 'スプレッドシートから読み込み中…' : 'デモデータを表示中…';
  API.readStudent({ grade: student.grade, cls: student.cls, no: student.no })
    .then((res) => {
      $('#load-status').hidden = true;
      if (!res || !res.ok) { $('#load-status').hidden = false; $('#load-status').textContent = '読み込みに失敗しました：' + ((res && res.error) || ''); return; }
      data = res;
      const nm = (res.student && res.student.name) || '';
      $('#student-name-label').textContent = nm || `${student.no}番`;
      renderSession();
      restoreDraft();
    })
    .catch((err) => { $('#load-status').hidden = false; $('#load-status').textContent = '通信エラー：' + err; });
})();
