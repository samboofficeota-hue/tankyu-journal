/**
 * My 探究ジャーナル — フロント設定（Cloudflare Pages + D1 版）
 * ------------------------------------------------------------------
 * バックエンドは同一オリジンの Pages Functions（/api/*）→ D1。
 * 通常はこのままでOK（API_BASE は同じサイトの /api を指す）。
 *
 * DEMO を true にすると、バックエンド無しでも架空の原宿外苑さんのデータで
 * 画面確認できます（書き込みは画面上だけ）。
 */
window.JOURNAL_CONFIG = {
  API_BASE: '/api',
  DEMO: false
};
