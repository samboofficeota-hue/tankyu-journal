/* My 探究ジャーナル — 先生ページ（ライブ読み取り＋コメント書き戻し） */
(function () {
  const $ = (s) => document.querySelector(s);
  const schema = window.JOURNAL_SCHEMA;
  const API = window.JournalAPI;

  let data = null;   // readStudent の結果（現在表示中の生徒）
  const commentDialog = $('#teacher-comment-dialog');

  function key() {
    return {
      grade: $('#grade-input').value.trim(),
      cls: $('#class-input').value.trim().toUpperCase(),
      no: $('#number-input').value.trim()
    };
  }
  function session() { return $('#lesson-select').value; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function sessionData(sid) {
    if (!data) return null;
    return data.sessions.find((s) => s.id === sid) || null;
  }

  function render() {
    const sid = session();
    const meta = schema.sessions[sid];
    const k = key();
    $('#teacher-session').textContent = meta.eyebrow;
    $('#teacher-title').textContent = meta.title;
    const nm = (data && data.student && data.student.name) || `${k.no}番`;
    $('#student-summary').textContent = `${k.grade}年 ${k.cls}組 ${k.no}番（${nm}）の記録です。生徒の言葉を読みながら、次の一歩につながるコメントを残します。`;
    $('#comment-target').textContent = `${k.grade}年 ${k.cls}組 ${k.no}番へのコメント`;

    const rec = $('#teacher-record');
    const sd = sessionData(sid);
    if (!sd || !sd.found) {
      rec.innerHTML = '<p class="empty-record">この回の記録はまだありません。</p>';
    } else {
      const fields = schema.fields[meta.type];
      let html = '';
      fields.forEach((f) => {
        if (f.step) { html += `<div class="form-section"><p class="section-label">${esc(f.step)}</p></div>`; return; }
        const val = sd.cells[f.col];
        html += `<article class="teacher-answer"><h3><span>${f.n}</span>${esc(f.label)}</h3><p>${val ? esc(val) : '<span class="unfilled">（未記入）</span>'}</p></article>`;
      });
      if (sd.teacherComment) {
        html += `<article class="teacher-answer teacher-existing-comment"><h3><span>◎</span>現在の先生コメント</h3><p>${esc(sd.teacherComment)}</p></article>`;
      }
      rec.innerHTML = html;
    }
    // コメント欄に既存コメントを流し込む
    $('#teacher-comment').value = (sd && sd.teacherComment) || '';
    $('#comment-status').textContent = '';
  }

  function load() {
    const k = key();
    if (!k.grade || !k.cls || !k.no) { alert('学年・組・番号を入力してください。'); return; }
    $('#teacher-load-status').hidden = false;
    $('#teacher-load-status').textContent = API.isLive() ? 'スプレッドシートから読み込み中…' : 'デモデータを表示中…';
    $('#teacher-record').innerHTML = '';
    API.readStudent(k).then((res) => {
      $('#teacher-load-status').hidden = true;
      if (!res || !res.ok) { $('#teacher-load-status').hidden = false; $('#teacher-load-status').textContent = '読み込み失敗：' + ((res && res.error) || ''); return; }
      data = res;
      render();
    }).catch((err) => { $('#teacher-load-status').hidden = false; $('#teacher-load-status').textContent = '通信エラー：' + err; });
  }

  // 番号の増減
  function step(dir) {
    const el = $('#number-input');
    const n = parseInt(el.value, 10);
    el.value = String(Math.max(1, (isNaN(n) ? 1 : n) + dir));
    load();
  }
  $('#previous-student').addEventListener('click', () => step(-1));
  $('#next-student').addEventListener('click', () => step(1));
  $('#load-student').addEventListener('click', load);
  $('#lesson-select').addEventListener('change', () => { if (data) render(); });
  ['#grade-input', '#class-input', '#number-input'].forEach((s) =>
    $(s).addEventListener('keydown', (e) => { if (e.key === 'Enter') load(); }));

  // コメント送付
  $('#open-comment').addEventListener('click', () => { if (!data) { alert('先に生徒を表示してください。'); return; } commentDialog.showModal(); });
  $('.close').addEventListener('click', () => commentDialog.close());
  $('#save-comment-draft').addEventListener('click', () => {
    localStorage.setItem(commentDraftKey(), $('#teacher-comment').value);
    $('#comment-status').textContent = '✓ 下書きを保存しました（この端末に）';
  });
  function commentDraftKey() { const k = key(); return `journal.tcomment.${k.grade}.${k.cls}.${k.no}.${session()}`; }

  $('#send-comment').addEventListener('click', () => {
    const k = key();
    const comment = $('#teacher-comment').value;
    const btn = $('#send-comment'); btn.disabled = true; btn.textContent = '送付中…';
    API.saveComment({ grade: k.grade, cls: k.cls, no: k.no, sessionId: session(), comment }).then((res) => {
      btn.disabled = false; btn.textContent = 'これで送付';
      if (res && res.ok) {
        const sd = sessionData(session()); if (sd) { sd.teacherComment = comment; sd.found = true; }
        localStorage.removeItem(commentDraftKey());
        render();
        $('#comment-status').textContent = API.isLive() ? '✓ コメントをスプレッドシートに送付しました' : '✓（デモ：実際には書き込まれていません）';
        setTimeout(() => commentDialog.close(), 1100);
      } else {
        $('#comment-status').textContent = '送付に失敗：' + ((res && res.error) || '不明なエラー');
      }
    }).catch((err) => { btn.disabled = false; btn.textContent = 'これで送付'; $('#comment-status').textContent = '通信エラー：' + err; });
  });

  // 初期表示（デモ生徒）
  load();
})();
