// GET /api/export?grade=&cls=&session=  → 一覧を CSV でダウンロード（Excel想定・BOM付き）
// session 必須（列見出しがセッション型で変わるため）。grade/cls は任意フィルタ。
import { norm } from './_shared.js';

// セッション型ごとの列見出し（col5..col13）
const HEADERS = {
  1: { // A / B
    5: '初めのつぶやき', 6: '問いの芽生え', 7: '一歩深まった問い', 8: '目的（何を明らかに）',
    9: '目標（調査・分析）', 10: '関係する領域', 11: 'この探究が進むと', 12: '他者から参考に', 13: '探究テーマ'
  },
  3: { // C / D
    5: '今の探究テーマ', 7: '更新した目標', 8: '研究すること', 9: '方法', 10: '事前準備',
    11: '関係する領域', 12: '活動場所', 13: 'メモ'
  }
};
const TYPE = { A: 1, B: 1, C: 3, D: 3 };

function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const grade = norm(u.searchParams.get('grade'));
  const cls = norm(u.searchParams.get('cls')).toUpperCase();
  const session = norm(u.searchParams.get('session')).toUpperCase();
  if (!session || !TYPE[session]) {
    return new Response('session（A/B/C/D）を指定してください', { status: 400 });
  }

  const where = ['session=?'];
  const binds = [session];
  if (grade) { where.push('grade=?'); binds.push(grade); }
  if (cls) { where.push('cls=?'); binds.push(cls); }
  const sql = 'SELECT * FROM entries WHERE ' + where.join(' AND ') +
    ' ORDER BY grade, cls, CAST(no AS INTEGER)';
  const { results } = await env.DB.prepare(sql).bind(...binds).all();

  const cols = Object.keys(HEADERS[TYPE[session]]).map(Number); // 出力する列番号
  const head = ['学年', '組', '番号', '名前', ...cols.map((n) => HEADERS[TYPE[session]][n]), '先生コメント', '更新日時'];
  const lines = [head.map(csvCell).join(',')];
  (results || []).forEach((r) => {
    const row = [r.grade, r.cls, r.no, r.name, ...cols.map((n) => r['col' + n]), r.teacher_comment, r.updated_at];
    lines.push(row.map(csvCell).join(','));
  });

  const bom = '﻿'; // Excelで文字化けしないように
  const fname = `my-tankyu_${session}${grade ? '_' + grade : ''}${cls ? cls : ''}.csv`;
  return new Response(bom + lines.join('\r\n'), {
    headers: {
      'content-type': 'text/csv;charset=utf-8',
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fname)}`,
      'cache-control': 'no-store'
    }
  });
}
