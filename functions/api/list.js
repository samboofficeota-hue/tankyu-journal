// GET /api/list?grade=&cls=&session=  → クラス一覧（未指定はフィルタなし）
// 一覧ビュー・エクスポートの共通データ源。番号順で返す。
import { norm, json } from './_shared.js';

export async function onRequestGet({ request, env }) {
  try {
    const u = new URL(request.url);
    const grade = norm(u.searchParams.get('grade'));
    const cls = norm(u.searchParams.get('cls')).toUpperCase();
    const session = norm(u.searchParams.get('session')).toUpperCase();

    const where = [];
    const binds = [];
    if (grade) { where.push('grade=?'); binds.push(grade); }
    if (cls) { where.push('cls=?'); binds.push(cls); }
    if (session) { where.push('session=?'); binds.push(session); }
    const sql = 'SELECT * FROM entries' +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY grade, cls, session, CAST(no AS INTEGER)';

    const { results } = await env.DB.prepare(sql).bind(...binds).all();
    return json({ ok: true, count: (results || []).length, rows: results || [] });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}
