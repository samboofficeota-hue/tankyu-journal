/* AIに相談（先生向け）— /api/chat（Claude Haiku 4.5）と対話 */
(function () {
  const chat = document.getElementById('ai-chat');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const send = document.getElementById('ai-send');
  const history = []; // {role:'user'|'assistant', content}
  const modelSel = document.getElementById('ai-model');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // 使えるモデル一覧を読み込む（比較・選択用）
  (async function loadModels() {
    try {
      const r = await fetch('/api/models');
      const d = await r.json();
      if (d && d.ok && d.models && d.models.length) {
        const prefer = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'];
        const def = prefer.find((m) => d.models.includes(m)) || d.models[0];
        modelSel.innerHTML = d.models.map((m) => `<option value="${esc(m)}"${m === def ? ' selected' : ''}>${esc(m)}</option>`).join('');
      } else {
        modelSel.innerHTML = '<option value="gpt-4o-mini">gpt-4o-mini</option>';
      }
    } catch (e) {
      modelSel.innerHTML = '<option value="gpt-4o-mini">gpt-4o-mini</option>';
    }
  })();

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

  function autoGrow() { input.style.height = 'auto'; input.style.height = Math.min(160, input.scrollHeight) + 'px'; }
  input.addEventListener('input', autoGrow);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    input.value = ''; autoGrow();
    send.disabled = true;
    const thinking = addMsg('bot', '考えています…', { thinking: true });
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, model: modelSel.value || undefined })
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

  input.focus();
})();
