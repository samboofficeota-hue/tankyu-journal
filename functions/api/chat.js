// POST /api/chat  → OpenAI Chat Completions で先生の相談相手AI
// APIキーは Cloudflare Pages の環境変数 OPENAI_API_KEY を使う（コードに書かない）
import { json } from './_shared.js';

const MODEL = 'gpt-4o-mini'; // 変更可（安価・高速）
const SYSTEM = `あなたは中学校の「探究学習（My探究）」を担当する先生を支える相談相手です。
先生が生徒の探究を見取り、問いを深め、次の一歩につながる声かけやコメントを考えるのを手伝います。

進め方：
- 日本語で、簡潔に、具体的に。要点は短い箇条書きで。
- 生徒を否定せず、良さを見つけて伸ばす姿勢。答えを与えるより「問い」を促す。
- コメント文の下書きを頼まれたら、そのまま使える温かく丁寧な文面を示す。
- 情報が足りないときは正直に伝え、確認の問いを返す。長すぎる説明は避ける。`;

export async function onRequestPost({ request, env }) {
  try {
    if (!env.OPENAI_API_KEY) {
      return json({ ok: false, error: 'サーバーにAPIキー（OPENAI_API_KEY）が未設定です。Cloudflare Pagesの環境変数に追加して再デプロイしてください。' }, 503);
    }
    const body = await request.json().catch(() => ({}));
    const src = Array.isArray(body.messages) ? body.messages : [];
    // role/content だけに正規化＋直近20往復に制限
    const history = src.slice(-40)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content == null ? '' : m.content) }))
      .filter((m) => m.content);
    if (!history.length) return json({ ok: false, error: 'messages が空です' }, 400);

    const messages = [{ role: 'system', content: body.system ? String(body.system) : SYSTEM }, ...history];

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + env.OPENAI_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json({ ok: false, error: (data && data.error && data.error.message) || ('OpenAI APIエラー ' + resp.status) }, 502);
    }
    const reply = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    return json({ ok: true, reply, model: MODEL });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}
