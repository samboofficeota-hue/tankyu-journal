/**
 * 事務局（C4）の管理画面：E2 平常・E3 有事、そしてシナリオ1のステップ10。
 * ended（議事録が未提出）と noted（未確認）を最上位に出す。
 */
const D = window.NANAMEYA_DATA;

const t = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const fmt = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${t(d)}`;
};

const B = D.bookings;
const unsubmitted = B.filter((b) => b.status === 'ended');     // 大人が書いていない
const unchecked   = B.filter((b) => b.status === 'noted');     // 事務局が見ていない
const reported    = B.filter((b) => b.status === 'reported');
const noShow      = B.filter((b) => b.status === 'no_show');
const noConsent   = 0; // 同意なしで発生した予約。0が目標（システムで止めているため）

/* ---- KPI ---- */
document.querySelector('#adm-kpis').innerHTML = [
  { n: unsubmitted.length, label: '議事録が未提出', tone: unsubmitted.length ? 'warn' : 'ok' },
  { n: unchecked.length,   label: '未確認の議事録', tone: unchecked.length ? 'warn' : 'ok' },
  { n: reported.length,    label: '通報',           tone: reported.length ? 'alert' : 'ok' },
  { n: noConsent,          label: '同意なしの予約', tone: noConsent ? 'alert' : 'ok' }
].map((k) => `
  <article class="adm-kpi is-${k.tone}">
    <strong>${k.n}</strong>
    <span>${k.label}</span>
  </article>`).join('');

/* ---- 対応が要るもの（通報・無断キャンセル）---- */
function alertRow(b, kind) {
  const rep = D.reports.find((r) => r.booking_id === b.id);
  return `<article class="adm-item is-${kind}">
    <div>
      <b>${kind === 'reported' ? '🚨 通報' : '⚠️ 生徒が来なかった'}</b>
      <span class="adm-item-sub">${fmt(b.starts_at)}　${b.grade}年生・${b.nickname} さん　/　${D.volunteerName(b.volunteer_id)} さん</span>
      ${rep ? `<p class="adm-item-body">${fmt(rep.at)} に${rep.from === 'student' ? '生徒' : '大人'}が押しました。${rep.body}</p>` : ''}
      ${b.note_for_office ? `<p class="adm-item-body">${b.note_for_office}</p>` : ''}
    </div>
    <div class="adm-item-actions">
      ${kind === 'reported' ? '<button type="button" class="adm-btn is-danger">この大人の活動を止める</button>' : ''}
      <button type="button" class="adm-btn">対応を記録する</button>
    </div>
  </article>`;
}
const alerts = reported.map((b) => alertRow(b, 'reported')).concat(noShow.map((b) => alertRow(b, 'no_show')));
document.querySelector('#adm-alert').innerHTML = alerts.length
  ? alerts.join('') : '<p class="vol-empty">いまは何もありません。</p>';

/* ---- 議事録の受信箱 ---- */
function inboxRow(b, kind) {
  const late = Math.floor((Date.now() - new Date(b.starts_at).getTime()) / 3600000);
  return `<article class="adm-item is-${kind}">
    <div>
      <b>${kind === 'unsubmitted' ? '未提出' : '未確認'}</b>
      <span class="adm-item-sub">${fmt(b.starts_at)}（${late}時間前）　${b.grade}年生・${b.nickname} さん　/　${D.volunteerName(b.volunteer_id)} さん</span>
      ${b.note_for_student ? `<p class="adm-item-body"><span class="adm-tag">生徒へ</span>${b.note_for_student}</p>` : ''}
      ${b.note_for_office ? `<p class="adm-item-body"><span class="adm-tag is-office">事務局へ</span>${b.note_for_office}</p>` : ''}
    </div>
    <div class="adm-item-actions">
      ${kind === 'unsubmitted'
        ? '<button type="button" class="adm-btn">催促する</button>'
        : '<button type="button" class="adm-btn is-primary">確認してクローズ</button>'}
    </div>
  </article>`;
}
document.querySelector('#adm-inbox').innerHTML =
  (unsubmitted.map((b) => inboxRow(b, 'unsubmitted'))
    .concat(unchecked.map((b) => inboxRow(b, 'unchecked'))).join(''))
  || '<p class="vol-empty">たまっているものはありません。</p>';

/* ---- 予約の一覧 ---- */
const LABEL = { booked: '予約ずみ', reminded: 'まもなく', live: '対話中', ended: '議事録が未提出',
                noted: '未確認', closed: '完了', no_show: '来なかった', cancelled: 'キャンセル',
                reported: '通報あり' };
document.querySelector('#adm-all').innerHTML = `
  <div class="adm-row is-head"><span>日時</span><span>生徒</span><span>大人</span><span>状態</span></div>
  ${B.slice().sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at)).map((b) => `
    <div class="adm-row">
      <span>${fmt(b.starts_at)}</span>
      <span>${b.grade}年生・${b.nickname}</span>
      <span>${D.volunteerName(b.volunteer_id)}</span>
      <span class="adm-status is-${b.status}">${LABEL[b.status] || b.status}</span>
    </div>`).join('')}`;

document.querySelectorAll('.adm-btn').forEach((btn) => {
  btn.addEventListener('click', () => alert('（モック）' + btn.textContent.trim() + ' を実行します。\n実装時は対応した人と時刻を記録に残します。'));
});
