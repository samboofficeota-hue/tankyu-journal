/* My 探究ジャーナル — 先生ダッシュボード（クラスの状況を可視化） */
(function () {
  const $ = (s) => document.querySelector(s);
  const schema = window.JOURNAL_SCHEMA;
  const API = window.JournalAPI;

  let curGrade = '1', curCls = 'A', current = 'A', classRows = [];
  const ANS = [5, 6, 7, 8, 9, 10, 11, 12, 13];
  const hasContent = (r) => ANS.some((c) => (r['col' + c] || '') !== '');
  const hasComment = (r) => (r.teacher_comment || '') !== '';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function paintTabs() {
    $('#session-steps').querySelectorAll('button').forEach((b) => b.parentElement.classList.toggle('active', b.dataset.session === current));
  }
  function paintPicker() {
    document.querySelectorAll('#grade-seg button').forEach((b) => b.classList.toggle('active', b.dataset.grade === curGrade));
    document.querySelectorAll('#class-seg button').forEach((b) => {
      const isD = b.dataset.cls === 'D';
      b.hidden = isD && curGrade !== '1';
      b.classList.toggle('active', b.dataset.cls === curCls);
    });
  }

  function load() {
    $('#dash-status').hidden = false;
    $('#dash-status').textContent = API.isLive() ? '読み込み中…' : 'デモ表示中…';
    API.listClass({ grade: curGrade, cls: curCls }).then((res) => {
      $('#dash-status').hidden = true;
      classRows = (res && res.rows) ? res.rows : [];
      render();
    }).catch((e) => { $('#dash-status').hidden = false; $('#dash-status').textContent = '読み込み失敗：' + e; });
  }

  function bar(pct) { return `<div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>`; }

  function render() {
    $('#dash-title').textContent = `${curGrade}年 ${curCls}組`;
    $('#dash-eyebrow').textContent = `DASHBOARD ・ SESSION ${current}`;

    const bySession = { A: [], B: [], C: [], D: [] };
    classRows.forEach((r) => { if (bySession[r.session]) bySession[r.session].push(r); });
    const students = new Set(classRows.map((r) => r.no));

    const sess = bySession[current] || [];
    const total = sess.length;
    const filled = sess.filter(hasContent).length;
    const notFilled = total - filled;
    const commented = sess.filter(hasComment).length;

    // KPIタイル
    const kpis = [
      ['在籍', students.size, '人', 'teal'],
      ['記入済み', filled, '人', 'teal'],
      ['未記入', notFilled, '人', 'gray'],
      ['コメント済み', commented, '人', 'coral']
    ];
    $('#kpi-row').innerHTML = kpis.map(([lb, v, u, c]) =>
      `<article class="kpi kpi--${c}"><span class="kpi-label">${lb}</span><strong class="kpi-val">${v}<small>${u}</small></strong></article>`).join('');

    // 進捗バー
    const pct = total ? Math.round(filled / total * 100) : 0;
    $('#progress').innerHTML = `${bar(pct)}<div class="bar-legend"><b>${pct}%</b> 記入済み（${filled} / ${total}）　·　コメント ${commented}件</div>`;

    // 回ごと
    $('#session-bars').innerHTML = schema.order.map((sid) => {
      const s = bySession[sid] || [];
      const f = s.filter(hasContent).length, t = s.length, p = t ? Math.round(f / t * 100) : 0;
      return `<div class="sbar${sid === current ? ' is-active' : ''}"><span class="sbar-name">${sid}</span>${bar(p)}<span class="sbar-num">${f}/${t}</span></div>`;
    }).join('');

    // 生徒チップ（番号順）
    const sorted = sess.slice().sort((a, b) => (parseInt(a.no, 10) || 0) - (parseInt(b.no, 10) || 0));
    $('#roster-grid').innerHTML = sorted.length ? sorted.map((r) => {
      const st = hasContent(r) ? (hasComment(r) ? 'commented' : 'filled') : 'empty';
      const lbl = st === 'commented' ? 'コメント済み' : st === 'filled' ? '記入済み' : '未記入';
      return `<div class="rchip rchip--${st}" title="${esc(r.name || '')}"><span class="rchip-no">${esc(r.no)}</span><span class="rchip-st">${lbl}</span></div>`;
    }).join('') : '<p class="peers-note">この回の記録はまだありません。</p>';
  }

  // 操作
  $('#session-steps').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { current = b.dataset.session; paintTabs(); render(); }));
  document.querySelectorAll('#grade-seg button').forEach((b) => b.addEventListener('click', () => {
    curGrade = b.dataset.grade;
    if (curCls === 'D' && curGrade !== '1') curCls = 'A';
    paintPicker(); load();
  }));
  document.querySelectorAll('#class-seg button').forEach((b) => b.addEventListener('click', () => { curCls = b.dataset.cls; paintPicker(); load(); }));

  // 初期表示
  paintTabs();
  paintPicker();
  load();
})();
