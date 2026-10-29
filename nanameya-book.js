/**
 * 予約（C1・C2 生徒／S3 同意ゲート・S4 予約）
 * 生徒が「相手に何が渡るか」を同じ画面で確認してから確定する（docs/nanameya-privacy.md 3章）。
 */
const D = window.NANAMEYA_DATA;
const MASK = window.NANAMEYA_MASK;
const q = new URLSearchParams(location.search);

const volunteer = D.volunteers.find((v) => v.id === q.get('v')) || D.volunteers[0];
const consentOK = (q.get('consent') || D.consent.status) === 'approved';
const approach = D.approaches.find((a) => a.key === volunteer.approach);

/* ---- 選んだ大人 ---- */
document.querySelector('#book-person').innerHTML = `
  <span class="person-avatar" aria-hidden="true">${volunteer.avatar}</span>
  <div class="book-person-body">
    <b class="book-person-name">${volunteer.name}</b>
    <span class="person-title">${volunteer.title}</span>
    <span class="person-approach">${approach ? approach.ico + ' ' + approach.label : ''}</span>
    <p class="person-voice">「${volunteer.voice}」</p>
    <p class="person-intro">${volunteer.intro}</p>
  </div>`;

document.querySelector('#consent-gate').hidden = consentOK;
document.querySelector('#book-flow').hidden = !consentOK;

if (consentOK) {
  /* ---- 相手に渡るカードのプレビュー（探究カードと同じ組み立て）---- */
  const nickInput = document.querySelector('#book-nick');
  function renderPreview() {
    const brief = MASK.buildBrief(D.entry, { type: 1, nickname: nickInput.value || '（未入力）' });
    document.querySelector('#book-preview').innerHTML = `
      <div class="book-preview-head">
        <b>${brief.grade}年生・${brief.nickname} さん</b>
        <span>${brief.session}回の記録</span>
      </div>
      ${brief.blocks.map((b) => `
        <div class="book-preview-block">
          <span class="book-preview-label">${b.label}</span>
          ${b.body.split('\n').map((l) => `<p>${l}</p>`).join('')}
        </div>`).join('')}`;
  }
  nickInput.addEventListener('input', renderPreview);
  renderPreview();

  /* ---- 空き枠。TimeRex 未登録のあいだはプレースホルダを出す ---- */
  const timerex = (window.JOURNAL_CONFIG || {}).TIMEREX_URL;
  const agree = document.querySelector('#book-agree');
  const slotsEl = document.querySelector('#book-slots');

  const fmt = (iso, min) => {
    const d = new Date(iso);
    const e = new Date(d.getTime() + min * 60000);
    const t = (x) => `${x.getHours()}:${String(x.getMinutes()).padStart(2, '0')}`;
    return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}） ${t(d)}〜${t(e)}`;
  };

  function renderSlots() {
    if (timerex) {
      slotsEl.innerHTML = `<iframe class="book-timerex" src="${timerex}" title="空き枠を選ぶ"></iframe>`;
      return;
    }
    const open = D.slots.filter((s) => !s.taken);
    slotsEl.innerHTML = `
      <p class="book-slots-note">※ いまは見本です。TimeRex の予約カレンダーをここに埋め込みます。</p>
      ${open.map((s) => `
        <button type="button" class="book-slot" data-id="${s.id}" ${agree.checked ? '' : 'disabled'}>
          <b>${fmt(s.starts_at, s.duration_min)}</b>
          <span>${s.duration_min}分</span>
        </button>`).join('')}
      ${agree.checked ? '' : '<p class="book-slots-lock">2 の同意にチェックを入れると選べます</p>'}`;
  }
  agree.addEventListener('change', renderSlots);
  renderSlots();

  slotsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.book-slot');
    if (!btn) return;
    alert('（モック）ここで予約が確定します。\n確定すると TimeRex から Webhook が届き、'
        + 'アプリ側の bookings に保存されます。\n通話リンクは、はじまる10分前にジャーナルに出ます。');
  });
}

document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault(); alert('（モック）エスラボ運営にすぐ知らせます。');
});
document.querySelector('#consent-start').addEventListener('click', (e) => {
  e.preventDefault(); alert('（モック）保護者向けの説明ページをひらきます。');
});
