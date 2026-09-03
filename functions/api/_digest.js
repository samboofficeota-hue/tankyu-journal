// クラス別ダイジェスト（コンパクト要約）の生成とキャッシュ（class_cache）
// 目的：チャットの毎回送信トークンを削り、推論に回す。決定的な出力でプロンプトキャッシュも効かせる。

const T1 = { 5: 'つぶやき', 6: '問い芽生え', 7: '深まった問い', 8: '目的', 9: '目標', 10: '領域', 11: '期待成果', 12: '他者参考', 13: 'テーマ' };
const T3 = { 5: 'テーマ', 7: '更新目標', 8: '研究', 9: '方法', 10: '準備', 11: '領域', 12: '場所', 13: 'メモ' };
const CAP = 120; // 各項目の最大文字数（長文はここで圧縮）

function trunc(v) {
  v = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  return v.length > CAP ? v.slice(0, CAP) + '…' : v;
}

// rows（1クラス分の全行）→ ダイジェスト文字列（生徒番号順・決定的）。行頭に「{cls}組」を付ける。
export function digestForClass(rows, cls) {
  const byNo = {};
  (rows || []).forEach((r) => {
    const s = byNo[r.no] || (byNo[r.no] = { no: r.no, name: r.name || '', sess: {} });
    s.sess[r.session] = r;
  });
  const order = Object.keys(byNo).sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
  const lines = [];
  order.forEach((no) => {
    const s = byNo[no];
    const body = [];
    ['A', 'B', 'C', 'D'].forEach((sid) => {
      const r = s.sess[sid];
      if (!r) return;
      const L = (sid === 'A' || sid === 'B') ? T1 : T3;
      const parts = [];
      Object.keys(L).forEach((c) => { const v = r['col' + c]; if (v) parts.push(`${L[c]}:${trunc(v)}`); });
      if (r.teacher_comment) parts.push(`先生ｺﾒﾝﾄ:${trunc(r.teacher_comment)}`);
      if (parts.length) body.push(`  [${sid}] ${parts.join(' / ')}`);
    });
    if (body.length) { lines.push(`■ ${cls}組 ${s.no}番${s.name ? ' ' + s.name : ''}`); lines.push(...body); }
  });
  return { text: lines.join('\n'), count: order.length };
}

// キャッシュ優先でクラスのダイジェストを返す。無ければ生成して保存。
export async function getClassDigest(env, grade, cls) {
  const key = `${grade}|${cls}`;
  try {
    const row = await env.DB.prepare('SELECT digest, students FROM class_cache WHERE scope_key=?').bind(key).first();
    if (row && typeof row.digest === 'string') return { text: row.digest, count: row.students || 0, cached: true };
  } catch (e) { /* テーブル未作成などは無視して再生成 */ }

  const { results } = await env.DB
    .prepare('SELECT * FROM entries WHERE grade=? AND cls=? ORDER BY CAST(no AS INTEGER), session')
    .bind(String(grade), String(cls)).all();
  const d = digestForClass(results || [], cls);
  try {
    await env.DB.prepare("INSERT OR REPLACE INTO class_cache (scope_key,digest,students,built_at) VALUES (?,?,?,datetime('now'))")
      .bind(key, d.text, d.count).run();
  } catch (e) { /* 保存失敗しても本文は返す */ }
  return { text: d.text, count: d.count, cached: false };
}

// 記録更新時にそのクラスのキャッシュを破棄（次回チャットで再生成）
export async function invalidateClassCache(env, grade, cls) {
  try { await env.DB.prepare('DELETE FROM class_cache WHERE scope_key=?').bind(`${grade}|${cls}`).run(); } catch (e) { /* noop */ }
}
