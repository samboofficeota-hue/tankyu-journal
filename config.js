/**
 * My 探究ジャーナル — フロント設定（Cloudflare Pages + D1 版）
 * ------------------------------------------------------------------
 * バックエンドは同一オリジンの Pages Functions（/api/*）→ D1。
 * 通常はこのままでOK（API_BASE は同じサイトの /api を指す）。
 *
 * PORTAL_URL は「エスラボ ポータルへ戻る」リンクの行き先。同じサイト内の
 * portal.html が既定。別サイトにポータルを置いたら、ここを絶対URLに変える。
 *
 * DEMO を true にすると、バックエンド無しでも架空の原宿外苑さんのデータで
 * 画面確認できます（書き込みは画面上だけ）。
 */
window.JOURNAL_CONFIG = {
  API_BASE: '/api',
  PORTAL_URL: './portal.html',
  DEMO: false
};
