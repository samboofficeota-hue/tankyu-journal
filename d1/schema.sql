-- My 探究ジャーナル — Cloudflare D1 スキーマ
-- 1エントリ = 生徒(grade,cls,no) × セッション(A/B/C/D)。列は現行スプシの E〜M(col5..col13) + 先生コメント(col14)。
-- スプシと同じ「列番号」で持つことで、schema.js（質問↔列）とフロントの既存ロジックをそのまま使える。

DROP TABLE IF EXISTS entries;
CREATE TABLE entries (
  grade           TEXT NOT NULL,
  cls             TEXT NOT NULL,
  no              TEXT NOT NULL,
  session         TEXT NOT NULL,          -- 'A' | 'B' | 'C' | 'D'
  name            TEXT DEFAULT '',
  col5            TEXT DEFAULT '',
  col6            TEXT DEFAULT '',
  col7            TEXT DEFAULT '',
  col8            TEXT DEFAULT '',
  col9            TEXT DEFAULT '',
  col10           TEXT DEFAULT '',
  col11           TEXT DEFAULT '',
  col12           TEXT DEFAULT '',
  col13           TEXT DEFAULT '',
  teacher_comment TEXT DEFAULT '',        -- col14
  updated_at      TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (grade, cls, no, session)
);

-- 一覧・生徒検索の索引
CREATE INDEX IF NOT EXISTS idx_entries_class   ON entries (grade, cls, session, CAST(no AS INTEGER));
CREATE INDEX IF NOT EXISTS idx_entries_student ON entries (grade, cls, no);
