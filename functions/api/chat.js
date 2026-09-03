// POST /api/chat  → D1の探究記録だけを根拠に分析する先生向けAI（OpenAI / gpt-5.6-luna）
// 外部情報は使わない。APIキーは env.OPENAI_API_KEY。
import { json } from './_shared.js';

const MODEL = 'gpt-5.6-luna'; // UIでロック（既定）

// 列→設問ラベル（A/B=My探究①型 / C/D=My探究③型）
const T1 = { 5: '初めのつぶやき', 6: '問いの芽生え', 7: '一歩深まった問い', 8: '目的', 9: '目標(調査分析)', 10: '関係領域', 11: '期待する成果', 12: '他者から参考', 13: '探究テーマ' };
const T3 = { 5: '今の探究テーマ', 7: '更新した目標', 8: '研究すること', 9: '方法', 10: '事前準備', 11: '関係領域', 12: '活動場所', 13: 'メモ' };

async function buildRecords(env, grade, cls) {
  if (!env.DB || !grade || !cls) return { text: '', count: 0 };
  const { results } = await env.DB
    .prepare('SELECT * FROM entries WHERE grade=? AND cls=? ORDER BY CAST(no AS INTEGER), session')
    .bind(String(grade), String(cls).toUpperCase()).all();
  if (!results || !results.length) return { text: '', count: 0 };

  const byNo = {};
  results.forEach((r) => {
    const s = byNo[r.no] || (byNo[r.no] = { no: r.no, name: r.name || '', sess: {} });
    s.sess[r.session] = r;
  });
  const lines = [];
  Object.values(byNo).forEach((s) => {
    const header = `■ ${s.no}番${s.name ? ' ' + s.name : ''}`;
    const body = [];
    ['A', 'B', 'C', 'D'].forEach((sid) => {
      const r = s.sess[sid];
      if (!r) return;
      const L = (sid === 'A' || sid === 'B') ? T1 : T3;
      const parts = [];
      Object.keys(L).forEach((c) => { const v = r['col' + c]; if (v) parts.push(`${L[c]}:${v}`); });
      if (r.teacher_comment) parts.push(`先生コメント:${r.teacher_comment}`);
      if (parts.length) body.push(`  [${sid}回] ${parts.join(' / ')}`);
    });
    if (body.length) { lines.push(header); lines.push(...body); }
  });
  return { text: lines.join('\n'), count: Object.keys(byNo).length };
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.OPENAI_API_KEY) {
      return json({ ok: false, error: 'サーバーにAPIキー（OPENAI_API_KEY）が未設定です。Cloudflare Pagesの環境変数に追加して再デプロイしてください。' }, 503);
    }
    const body = await request.json().catch(() => ({}));
    const grade = body.grade ? String(body.grade) : '';
    const cls = body.cls ? String(body.cls).toUpperCase() : '';

    const src = Array.isArray(body.messages) ? body.messages : [];
    const history = src.slice(-40)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content == null ? '' : m.content) }))
      .filter((m) => m.content);
    if (!history.length) return json({ ok: false, error: 'messages が空です' }, 400);

    const rec = await buildRecords(env, grade, cls);
    const dataBlock = rec.text || '（対象クラスの記録が読み込めませんでした。学年・組を確認してください）';

    const system = `あなたは中学校「探究学習（My探究）」の記録データを分析して、先生を支える相談相手です。

【最重要ルール（厳守）】
- 回答は必ず下の「探究記録データ」だけを根拠にします。外部の一般知識・ネット情報・推測は一切使いません。
- データに無いことを聞かれたら「記録にはありません」と正直に答えます。作り話をしません。
- 生徒個人を尊重し、良さと「次の一歩」を具体的に示します。日本語で簡潔に、要点は箇条書き。
- 番号や名前を挙げるときは、必ずデータにある表記を使います。

【分析対象】${grade || '?'}年${cls || '?'}組（${rec.count}名）

【探究記録データ】
${dataBlock}`;

    const model = (typeof body.model === 'string' && /^[a-zA-Z0-9][\w.:-]{1,60}$/.test(body.model)) ? body.model : MODEL;
    const messages = [{ role: 'system', content: system }, ...history];

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'authorization': 'Bearer ' + env.OPENAI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages, max_completion_tokens: 1024 })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json({ ok: false, error: (data && data.error && data.error.message) || ('OpenAI APIエラー ' + resp.status) }, 502);
    }
    const reply = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    return json({ ok: true, reply, model: (data.model || model), students: rec.count });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}
