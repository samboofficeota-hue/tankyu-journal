/**
 * ナナメの部屋トップ（S2 選ぶ / S3 同意ゲート）
 * モックデータ（nanameya-data.js）で描画する。API に差し替えるときは
 * loadData() の中だけを /api/nanameya/volunteers 等に置き換える。
 */
const DATA = window.NANAMEYA_DATA;
const params = new URLSearchParams(location.search);

// 保護者同意の状態。モック確認用に ?consent=approved で切り替えられる
const consentStatus = params.get('consent') || DATA.consent.status;
const consentOK = consentStatus === 'approved';

const approachRow = document.querySelector('#approach-row');
const peopleGrid = document.querySelector('#people-grid');
const peopleEmpty = document.querySelector('#people-empty');
let current = 'all';

/* ---- S3: 同意ゲート（未同意なら予約導線を出さない） ---- */
document.querySelector('#consent-gate').hidden = consentOK;

/* ---- 迫り方チップ ---- */
function renderApproaches() {
  const all = [{ key: 'all', label: 'ぜんぶ', ico: '✦' }, ...DATA.approaches];
  approachRow.innerHTML = all.map((a) => `
    <button type="button" class="approach-chip${a.key === current ? ' selected' : ''}"
            data-key="${a.key}" aria-pressed="${a.key === current}">
      <span class="approach-ico" aria-hidden="true">${a.ico}</span>${a.label}
    </button>`).join('');
}

approachRow.addEventListener('click', (e) => {
  const chip = e.target.closest('.approach-chip');
  if (!chip) return;
  current = chip.dataset.key;
  renderApproaches();
  renderPeople();
});

/* ---- ナナメの大人カード ---- */
function approachLabel(key) {
  const a = DATA.approaches.find((x) => x.key === key);
  return a ? `${a.ico} ${a.label}` : '';
}

function renderPeople() {
  const list = current === 'all'
    ? DATA.volunteers
    : DATA.volunteers.filter((v) => v.approach === current);

  peopleEmpty.hidden = list.length > 0;
  peopleGrid.innerHTML = list.map((v) => `
    <article class="person-card">
      <div class="person-head">
        <span class="person-avatar" aria-hidden="true">${v.avatar}</span>
        <div>
          <b class="person-name">${v.name}</b>
          <span class="person-title">${v.title}</span>
        </div>
        <span class="person-approach">${approachLabel(v.approach)}</span>
      </div>
      <p class="person-voice">「${v.voice}」</p>
      <p class="person-intro">${v.intro}</p>
      <ul class="person-tags">${v.interests.map((t) => `<li>${t}</li>`).join('')}</ul>
      ${consentOK
        ? `<a class="person-book" href="./nanameya-book.html?v=${v.id}">この人と話す <span aria-hidden="true">→</span></a>`
        : `<span class="person-locked">おうちの人の同意が確認できると予約できます</span>`}
    </article>`).join('');
}

renderApproaches();
renderPeople();

/* ---- S5: 困ったときは（実装時は /api/nanameya/report へ POST）---- */
document.querySelector('#help-fab').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）エスラボ運営にすぐ知らせます。\n実装時はこのボタンで運営へ即時通知が飛びます。');
});

document.querySelector('#consent-start').addEventListener('click', (e) => {
  e.preventDefault();
  alert('（モック）保護者向けの説明ページをひらきます。\n同意の取得方法は学校との合意待ちのため、導線だけ用意しています。');
});
