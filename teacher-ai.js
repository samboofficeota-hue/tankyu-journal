/* AIを使って分析（先生向け）— D1の探究記録だけを根拠に /api/chat（gpt-5.6-luna固定）で対話 */
(function () {
  const chat = document.getElementById('ai-chat');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const send = document.getElementById('ai-send');
  const MODEL = 'gpt-5.6-luna'; // 固定（UIでロック）

  let curGrade = '1', curCls = 'A';
  let history = []; // {role, content}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function paintPicker() {
    document.querySelectorAll('#grade-seg button').forEach((b) => b.classList.toggle('active', b.dataset.grade === curGrade));
    document.querySelectorAll('#class-seg button').forEach((b) => {
      const isD = b.dataset.cls === 'D';
      b.hidden = isD && curGrade !== '1';           // D組は1年のみ
      b.classList.toggle('active', b.dataset.cls === curCls);
    });
  }

  function addMsg(role, text, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg ' + (role === 'user' ? 'ai-msg--me' : 'ai-msg--bot');
    const avatar = role === 'user' ? '' : '<div class="ai-avatar">✦</div>';
    const body = opts.raw ? text : esc(text).replace(/\n/g, '<br>');
    const tag = opts.model ? `<span class="ai-model-tag">${esc(opts.model)}</span>` : '';
    wrap.innerHTML = `${avatar}<div class="ai-bubble${opts.thinking ? ' is-thinking' : ''}">${body}${tag}</div>`;
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
    return wrap;
  }

  function intro() {
    chat.innerHTML = '';
    history = [];
    addMsg('bot', `<b>${curGrade}年${curCls}組</b>の探究記録を分析します。<br>` +
      '例：「このクラスの探究の傾向は？」「似たテーマの生徒は？」「まだ問いが深まっていない子は？」「◯番の子への次の声かけは？」<br>' +
      '<span class="ai-hint">※ 記録データだけを根拠にします（外部情報は使いません）</span>', { raw: true });
  }

  function autoGrow() { input.style.height = 'auto'; input.style.height = Math.min(160, input.scrollHeight) + 'px'; }
  input.addEventListener('input', autoGrow);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  // スコープ切替（学年/組）→ 会話をリセットして対象を変える
  document.querySelectorAll('#grade-seg button').forEach((b) => b.addEventListener('click', () => {
    curGrade = b.dataset.grade;
    if (curCls === 'D' && curGrade !== '1') curCls = 'A';
    paintPicker(); intro();
  }));
  document.querySelectorAll('#class-seg button').forEach((b) => b.addEventListener('click', () => {
    curCls = b.dataset.cls; paintPicker(); intro();
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    input.value = ''; autoGrow();
    send.disabled = true;
    const thinking = addMsg('bot', '記録を読んで考えています…', { thinking: true });
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, grade: curGrade, cls: curCls, model: MODEL })
      });
      const data = await r.json();
      thinking.remove();
      if (data && data.ok) {
        addMsg('bot', data.reply || '（応答が空でした）', { model: data.model });
        history.push({ role: 'assistant', content: data.reply || '' });
      } else {
        addMsg('bot', '⚠ ' + ((data && data.error) || 'エラーが発生しました'));
      }
    } catch (err) {
      thinking.remove();
      addMsg('bot', '⚠ 通信エラー：' + err);
    }
    send.disabled = false;
    input.focus();
  });

  paintPicker();
  intro();
  input.focus();
})();
