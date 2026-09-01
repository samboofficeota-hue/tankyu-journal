// 共有ユーティリティ（Cloudflare Pages Functions / D1）
export const SESSIONS = ['A', 'B', 'C', 'D'];
export const ANSWER_COLS = [5, 6, 7, 8, 9, 10, 11, 12, 13]; // col5..col13
export const ALL_COLS = ['col5', 'col6', 'col7', 'col8', 'col9', 'col10', 'col11', 'col12', 'col13'];

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' }
  });
}

// row(D1) → cells オブジェクト { "5": "...", ... }（空は省く）
export function rowToCells(row) {
  const cells = {};
  if (!row) return cells;
  ANSWER_COLS.forEach((n) => {
    const v = row['col' + n];
    if (v != null && v !== '') cells[n] = v;
  });
  return cells;
}

export function norm(v) { return String(v == null ? '' : v).trim(); }
