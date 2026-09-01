// GET /api/read?grade=&cls=&no=  → 生徒1名分の全セッション
import { SESSIONS, rowToCells, norm, json } from './_shared.js';

export async function onRequestGet({ request, env }) {
  try {
    const u = new URL(request.url);
    const grade = norm(u.searchParams.get('grade'));
    const cls = norm(u.searchParams.get('cls')).toUpperCase();
    const no = norm(u.searchParams.get('no'));
    if (!grade || !cls || !no) return json({ ok: false, error: 'grade / cls / no を指定してください' }, 400);

    const { results } = await env.DB
      .prepare('SELECT * FROM entries WHERE grade=? AND cls=? AND no=?')
      .bind(grade, cls, no).all();

    const byId = {};
    let name = '';
    (results || []).forEach((r) => { byId[r.session] = r; if (!name && r.name) name = r.name; });

    const sessions = SESSIONS.map((sid) => {
      const r = byId[sid];
      return { id: sid, found: !!r, cells: rowToCells(r), teacherComment: (r && r.teacher_comment) || '' };
    });

    return json({ ok: true, student: { grade, cls, no, name }, sessions });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}
