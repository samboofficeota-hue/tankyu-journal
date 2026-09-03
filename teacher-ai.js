/* AIに相談（先生向け）— /api/chat（Claude Haiku 4.5）と対話 */
(function () {
  const chat = document.getElementById('ai-chat');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const send = document.getElementById('ai-send');
  const history = []; // {role:'user'|'assistant', content}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function addMsg(role, text, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg ' + (role === 'user' ? 'ai-msg--me' : 'ai-msg--bot');
    const avatar = role === 'user' ? '' : '<div class="ai-avatar">✦</div>';
    wrap.innerHTML = `${avatar}<div class="ai-bubble${opts.thinking ? ' is-thinking' : ''}">${opts.raw ? text : esc(text).replace(/\n/g, '<br>')}</div>`;
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
        body: JSON.stringify({ messages: history })
      });
      const data = await r.json();
      thinking.remove();
      if (data && data.ok) {
        addMsg('bot', data.reply || '（応答が空でした）');
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
