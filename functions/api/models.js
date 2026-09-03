// GET /api/models  → この鍵で使えるチャット系モデルの一覧（比較・選択用）
import { json } from './_shared.js';

export async function onRequestGet({ env }) {
  try {
    if (!env.OPENAI_API_KEY) return json({ ok: false, error: 'OPENAI_API_KEY が未設定です' }, 503);
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { authorization: 'Bearer ' + env.OPENAI_API_KEY }
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return json({ ok: false, error: (d && d.error && d.error.message) || ('OpenAI APIエラー ' + r.status) }, 502);

    const ids = (d.data || []).map((m) => m.id)
      // チャット系のみ（gpt- / o1,o3,o4… / chatgpt-）
      .filter((id) => /^(gpt-|o[0-9]|chatgpt-)/.test(id))
      // 非テキスト・特殊用途を除外
      .filter((id) => !/(audio|realtime|transcribe|tts|image|embedding|moderation|search|instruct)/i.test(id))
      .sort();

    return json({ ok: true, models: Array.from(new Set(ids)) });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}
