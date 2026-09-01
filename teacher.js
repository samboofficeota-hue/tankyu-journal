/* My 探究ジャーナル — 先生ページ（コメント記入）
   ヘッダーは生徒に寄せる：A〜Dタブ＋学年/組/番号。左右の半透明ナビ＋スワイプで生徒送り。 */
(function () {
  const $ = (s) => document.querySelector(s);
  const schema = window.JOURNAL_SCHEMA;
  const API = window.JournalAPI;

  let data = null;          // 現在表示中の生徒（全セッション）
  let current = 'A';        // 表示中の回
  const commentDialog = $('#teacher-comment-dialog');

  let curGrade = '1', curCls = 'A';
  function key() {
    return { grade: curGrade, cls: curCls, no: $('#number-input').value.trim() };
  }
  // 学年/組のセグメントボタン（D組は1年のみ）
  function paintPicker() {
    document.querySelectorAll('#grade-seg button').forEach((b) => b.classList.toggle('active', b.dataset.grade === curGrade));
    document.querySelectorAll('#class-seg button').forEach((b) => {
      const isD = b.dataset.cls === 'D';
      b.hidden = isD && curGrade !== '1';
      b.classList.toggle('active', b.dataset.cls === curCls);
    });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function sessionData(sid) { return data ? (data.sessions.find((s) => s.id === sid) || null) : null; }

  // A〜Dタブ（生徒と同じ見た目。クリックで回を切替）
  function paintTabs() {
    $('#session-steps').querySelectorAll('button').forEach((b) => {
      b.parentElement.classList.toggle('active', b.dataset.session === current);
    });
  }
  $('#session-steps').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    current = b.dataset.session; paintTabs(); render();
  }));

  function render() {
    const meta = schema.sessions[current];
    const k = key();
    $('#teacher-session').textContent = meta.eyebrow;
    $('#teacher-title').textContent = meta.title;
    const nm = (data && data.student && data.student.name) || '（お名前）';
    $('#student-summary').textContent = `${k.grade}年 ${k.cls}組 ${k.no}番（${nm}）の記録です。生徒の言葉を読みながら、次の一歩につながるコメントを残します。`;
    $('#comment-target').textContent = `${k.grade}年 ${k.cls}組 ${k.no}番へのコメント`;

    const rec = $('#teacher-record');
    const sd = sessionData(current);
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
        html += `<article class="teacher-answer teacher-existing-comment"><h3><span>◎</span>現在のコメント</h3><p>${esc(sd.teacherComment)}</p></article>`;
      }
      rec.innerHTML = html;
    }
    $('#teacher-comment').value = (sd && sd.teacherComment) || '';
    $('#comment-status').textContent = '';
  }

  function load() {
    const k = key();
    if (!k.grade || !k.cls || !k.no) return;
    $('#teacher-load-status').hidden = false;
    $('#teacher-load-status').textContent = API.isLive() ? '読み込み中…' : 'デモ表示中…';
    $('#teacher-record').innerHTML = '';
    API.readStudent(k).then((res) => {
      $('#teacher-load-status').hidden = true;
      if (!res || !res.ok) { $('#teacher-load-status').hidden = false; $('#teacher-load-status').textContent = '読み込み失敗：' + ((res && res.error) || ''); return; }
      data = res; render();
    }).catch((err) => { $('#teacher-load-status').hidden = false; $('#teacher-load-status').textContent = '通信エラー：' + err; });
  }

  // 生徒送り（番号 ±1）
  function stepStudent(dir) {
    const el = $('#number-input');
    const n = parseInt(el.value, 10);
    el.value = String(Math.max(1, (isNaN(n) ? 1 : n) + dir));
    load();
  }

  // 学年/組ボタンで読み込み
  document.querySelectorAll('#grade-seg button').forEach((b) => b.addEventListener('click', () => {
    curGrade = b.dataset.grade;
    if (curCls === 'D' && curGrade !== '1') curCls = 'A';  // D組は1年のみ→他学年ならAへ
    paintPicker(); load();
  }));
  document.querySelectorAll('#class-seg button').forEach((b) => b.addEventListener('click', () => {
    curCls = b.dataset.cls; paintPicker(); load();
  }));
  $('#number-input').addEventListener('change', load);
  $('#number-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') load(); });

  // 左右の半透明ナビ
  $('#float-previous').addEventListener('click', () => stepStudent(-1));
  $('#float-next').addEventListener('click', () => stepStudent(1));

  // スワイプ（左→次 / 右→前）
  const swipeArea = document.querySelector('main');
  let touchX = null, touchY = null;
  swipeArea.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; touchY = e.changedTouches[0].clientY; }, { passive: true });
  swipeArea.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepStudent(dx < 0 ? 1 : -1);
    touchX = touchY = null;
  }, { passive: true });

  // コメント入力
  $('#open-comment').addEventListener('click', () => { if (!data) { alert('先に生徒を表示してください。'); return; } commentDialog.showModal(); });
  $('#teacher-comment-dialog .close').addEventListener('click', () => commentDialog.close());
  function commentDraftKey() { const k = key(); return `journal.tcomment.${k.grade}.${k.cls}.${k.no}.${current}`; }
  $('#save-comment-draft').addEventListener('click', () => {
    localStorage.setItem(commentDraftKey(), $('#teacher-comment').value);
    $('#comment-status').textContent = '✓ 下書きを保存しました（この端末に）';
  });
  $('#send-comment').addEventListener('click', () => {
    const k = key();
    const comment = $('#teacher-comment').value;
    const btn = $('#send-comment'); btn.disabled = true; btn.textContent = '送付中…';
    API.saveComment({ grade: k.grade, cls: k.cls, no: k.no, sessionId: current, comment }).then((res) => {
      btn.disabled = false; btn.textContent = 'これで送付';
      if (res && res.ok) {
        const sd = sessionData(current); if (sd) { sd.teacherComment = comment; sd.found = true; }
        localStorage.removeItem(commentDraftKey());
        render();
        $('#comment-status').textContent = API.isLive() ? '✓ コメントを送付しました' : '✓（デモ：書き込まれていません）';
        setTimeout(() => commentDialog.close(), 1100);
      } else { $('#comment-status').textContent = '送付に失敗：' + ((res && res.error) || '不明なエラー'); }
    }).catch((err) => { btn.disabled = false; btn.textContent = 'これで送付'; $('#comment-status').textContent = '通信エラー：' + err; });
  });

  // 初期表示
  paintTabs();
  paintPicker();
  load();
})();
