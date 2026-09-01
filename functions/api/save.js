// POST /api/save  → 回答 or 先生コメントを D1 に upsert
//   { action:'saveAnswers', grade,cls,no,name,sessionId, answers:{ "5":"...", ... } }
//   { action:'saveComment', grade,cls,no,sessionId, comment:"..." }
import { SESSIONS, ANSWER_COLS, norm, json } from './_shared.js';

async function ensureRow(env, grade, cls, no, session) {
  await env.DB.prepare(
    'INSERT OR IGNORE INTO entries (grade,cls,no,session) VALUES (?,?,?,?)'
  ).bind(grade, cls, no, session).run();
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const action = body.action;
    const grade = norm(body.grade);
    const cls = norm(body.cls).toUpperCase();
    const no = norm(body.no);
    const session = norm(body.sessionId);
    if (!grade || !cls || !no || !session) return json({ ok: false, error: 'grade / cls / no / sessionId が必要です' }, 400);
    if (!SESSIONS.includes(session)) return json({ ok: false, error: '未知の sessionId: ' + session }, 400);

    await ensureRow(env, grade, cls, no, session);

    if (action === 'saveComment') {
      await env.DB.prepare(
        "UPDATE entries SET teacher_comment=?, updated_at=datetime('now') WHERE grade=? AND cls=? AND no=? AND session=?"
      ).bind(String(body.comment == null ? '' : body.comment), grade, cls, no, session).run();
      return json({ ok: true, wrote: 'comment' });
    }

    if (action === 'saveAnswers') {
      const answers = body.answers || {};
      const sets = [];
      const vals = [];
      ANSWER_COLS.forEach((n) => {
        if (Object.prototype.hasOwnProperty.call(answers, String(n))) {
          sets.push(`col${n}=?`);
          vals.push(String(answers[String(n)] == null ? '' : answers[String(n)]));
        }
      });
      // 名前は空のときだけ埋める
      if (body.name) { sets.push("name=CASE WHEN name IS NULL OR name='' THEN ? ELSE name END"); vals.push(String(body.name)); }
      sets.push("updated_at=datetime('now')");
      const sql = `UPDATE entries SET ${sets.join(', ')} WHERE grade=? AND cls=? AND no=? AND session=?`;
      vals.push(grade, cls, no, session);
      await env.DB.prepare(sql).bind(...vals).run();
      return json({ ok: true, wrote: Object.keys(answers) });
    }

    return json({ ok: false, error: '未知の action: ' + action }, 400);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}
