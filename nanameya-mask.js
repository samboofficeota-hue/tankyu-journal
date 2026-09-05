/**
 * ナナメの部屋 — 大人に渡す「探究カード」の組み立てとマスク
 * ------------------------------------------------------------------
 * ルールの正本は docs/nanameya-privacy.md。
 *
 * ★重要：本番では同じ処理を Pages Functions 側（/api/nanameya/brief）で行い、
 *   name / cls / no / teacher_comment を**レスポンスに載せない**こと。
 *   画面で隠すだけだと通信内容には残るため、フロントのこのファイルは
 *   「モック用」と「表示直前の保険」の二重がけとして置いている。
 */
window.NANAMEYA_MASK = (() => {
  /* 許可リスト：探究カードに出す4ブロックと、その出どころの列。
     ここに無い列は渡さない（deny-list にしない）。 */
  const FIELDS = {
    1: [ // セッション A / B
      { key: 'theme',  label: 'いまの探究テーマ',            cols: [13] },
      { key: 'ask',    label: 'いまの問い',                  cols: [7] },
      { key: 'how',    label: 'どう迫ろうとしているか',      cols: [8, 9] },
      { key: 'unknown',label: 'まだわからないこと・次の一歩', cols: [11, 12] }
    ],
    3: [ // セッション C / D
      { key: 'theme',  label: 'いまの探究テーマ',            cols: [5] },
      { key: 'ask',    label: 'いまの問い',                  cols: [7] },
      { key: 'how',    label: 'どう迫ろうとしているか',      cols: [8, 9] },
      { key: 'unknown',label: 'まだわからないこと・次の一歩', cols: [10, 13] }
    ]
  };

  const REDACT = '●●●';

  /** 自由記述から個人情報を伏せる。name は生徒の実名（姓名を分解して消す）。 */
  function maskText(text, name) {
    if (!text) return '';
    let out = String(text);

    // 1) 生徒本人の氏名（姓・名それぞれ）。2文字以上のときだけ消す（誤爆防止）
    (name || '').split(/[\s　]+/).filter((p) => p.length >= 2)
      .forEach((part) => { out = out.split(part).join('●●'); });

    // 2) パターンで消せるもの
    out = out
      .replace(/https?:\/\/\S+/g, REDACT)                                   // URL
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, REDACT)                         // メール
      .replace(/@[A-Za-z0-9_]{2,}/g, REDACT)                                // SNSのID
      .replace(/0\d{1,4}-?\d{1,4}-?\d{3,4}/g, REDACT)                       // 電話番号
      .replace(/\d+丁目[\d-]*/g, REDACT)                                    // 住所
      .replace(/[一-鿿぀-ゟ゠-ヿ]{1,10}(小学校|中学校|高等学校|高校)/g, '●●学校');

    return out;
  }

  /**
   * 生徒1件分のエントリから、大人に見せるカードを組み立てる。
   * 戻り値には name / cls / no / teacher_comment を**含めない**。
   */
  function buildBrief(entry, opts) {
    const o = opts || {};
    const type = o.type || 1;
    const blocks = (FIELDS[type] || FIELDS[1]).map((f) => ({
      key: f.key,
      label: f.label,
      body: f.cols
        .map((c) => maskText(entry['col' + c], entry.name))
        .filter((t) => t && t.trim())
        .join('\n')
    })).filter((b) => b.body);

    return {
      grade: entry.grade,          // 学年だけ渡す
      nickname: o.nickname || '',  // 生徒が予約時に決める表示名
      session: entry.session,
      sessionLabel: o.sessionLabel || '',
      updatedAt: entry.updated_at || '',
      blocks
      // cls / no / name / teacher_comment は意図的に含めない
    };
  }

  return { FIELDS, maskText, buildBrief };
})();
