// POST /api/chat  → D1の探究記録（事前生成ダイジェスト）だけを根拠に分析する先生向けAI（OpenAI / gpt-5.6-luna）
// 外部情報は使わない。APIキーは env.OPENAI_API_KEY。
import { json } from './_shared.js';
import { getClassDigest } from './_digest.js';

const MODEL = 'gpt-5.6-luna'; // UIでロック（既定）

// 選択された各クラスのダイジェスト（キャッシュ優先）を連結
async function buildRecords(env, grade, clsList) {
  if (!env.DB || !grade || !clsList.length) return { text: '', count: 0 };
  const parts = [];
  let count = 0;
  for (const c of clsList) {
    const d = await getClassDigest(env, grade, c);
    if (d.text) parts.push(d.text);
    count += d.count;
  }
  return { text: parts.join('\n'), count };
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.OPENAI_API_KEY) {
      return json({ ok: false, error: 'サーバーにAPIキー（OPENAI_API_KEY）が未設定です。Cloudflare Pagesの環境変数に追加して再デプロイしてください。' }, 503);
    }
    const body = await request.json().catch(() => ({}));
    const grade = body.grade ? String(body.grade) : '';
    // クラスは複数可（classes 配列 or 単一 cls）
    let clsList = Array.isArray(body.classes) ? body.classes : (body.cls ? [body.cls] : []);
    clsList = Array.from(new Set(clsList.map((c) => String(c).toUpperCase()).filter((c) => /^[A-Z]$/.test(c))));

    const src = Array.isArray(body.messages) ? body.messages : [];
    const history = src.slice(-40)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content == null ? '' : m.content) }))
      .filter((m) => m.content);
    if (!history.length) return json({ ok: false, error: 'messages が空です' }, 400);

    const rec = await buildRecords(env, grade, clsList);
    const dataBlock = rec.text || '（対象クラスの記録が読み込めませんでした。学年・組を確認してください）';

    const system = `あなたは中学校「探究学習（My探究）」の記録データを分析して、先生を支える相談相手です。

【最重要ルール（厳守）】
- 回答は必ず下の「探究記録データ」だけを根拠にします。外部の一般知識・ネット情報・推測は一切使いません。
- データに無いことを聞かれたら「記録にはありません」と正直に答えます。作り話をしません。
- 生徒個人を尊重し、良さと「次の一歩」を具体的に示します。日本語で簡潔に、要点は箇条書き。
- 番号や名前を挙げるときは、必ずデータにある表記を使います。

【分析対象】${grade || '?'}年 ${clsList.length ? clsList.join('・') : '?'}組（${rec.count}名）

【探究記録データ（要約）】※長い回答は末尾「…」で一部省略。番号・氏名・テーマは記録どおり。
${dataBlock}`;

    const model = (typeof body.model === 'string' && /^[a-zA-Z0-9][\w.:-]{1,60}$/.test(body.model)) ? body.model : MODEL;
    const messages = [{ role: 'system', content: system }, ...history];

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'authorization': 'Bearer ' + env.OPENAI_API_KEY, 'content-type': 'application/json' },
      // gpt-5.6系は推論トークンも max_completion_tokens に含むため大きめに確保（不足すると本文が空になる）
      body: JSON.stringify({ model, messages, max_completion_tokens: 8000 })
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
