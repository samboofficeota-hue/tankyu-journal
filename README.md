# My 探究ジャーナル

中学校の「My探究」の記録を、授業回ごとに分かれた表計算入力から、
**個人の探究の変化を感じられる記録体験**に置き換えるWebアプリです。

バックエンドは **Cloudflare Pages + D1（エッジSQLite）**。
静的フロントと同一オリジンの Pages Functions（`/api/*`）が D1 を直接読み書きします。
Apps Script + スプレッドシート版（旧）は読み取り5〜6秒と遅かったため、D1 に移行しました。

```
生徒/先生 ── ブラウザ ──▶ Cloudflare Pages（静的 + /api Functions）──▶ D1（SQLite・エッジ）
```

- 生徒フロー: `login.html`（学年/組/番号）→ `student.html`（A〜Dを1枚で切替・提出でD1へ保存）
- 先生フロー: `teacher.html`（生徒を選んで読取り→先生コメントをD1へ保存）
- データ: 現行スプレッドシート「原外中_探究シート_加工用」の4タブ（0626/0629/0703/0714＝セッションA/B/C/D）を **d1/seed.sql に取り込み済み**（683行・176名）。以後は D1 が正本。

---

## データモデル

`entries` テーブル（`d1/schema.sql`）: 1行 = 生徒(grade,cls,no) × セッション(A/B/C/D)。
列は現行スプシの E〜M を `col5`〜`col13`、先生コメントを `teacher_comment` として保持。
質問と列の対応はフロントの `schema.js`。主キー = (grade, cls, no, session)。

| API | 用途 |
|---|---|
| `GET /api/read?grade&cls&no` | 生徒1名分の全セッション |
| `POST /api/save` | 回答 / 先生コメントの保存（upsert） |
| `GET /api/list?grade&cls&session` | クラス一覧（未指定はフィルタなし） |
| `GET /api/export?grade&cls&session` | 一覧を CSV でダウンロード（Excel想定・A3印刷用） |

---

## ローカルで動かす

```bash
# 1) ローカルD1にスキーマ＋種データを投入（.wrangler/state に永続）
wrangler d1 execute tankyu-journal --local --persist-to=.wrangler/state --file=d1/schema.sql
wrangler d1 execute tankyu-journal --local --persist-to=.wrangler/state --file=d1/seed.sql

# 2) Pages + Functions + ローカルD1 を起動
wrangler pages dev . --persist-to=.wrangler/state --d1 DB=tankyu-journal-local
```

`http://localhost:8788/` を開く。`config.js` の `DEMO:true` にすると D1 無しでも画面確認できます。

> ローカルの `--d1 DB=` の値は wrangler.toml の `database_id`（ローカルは `tankyu-journal-local`）と揃えること。揃えないと空のDBを開いて `no such table` になります。

---

## 本番デプロイ（Cloudflare）

`wrangler login`（初回のみ・自分のCloudflareアカウント）のあと:

```bash
# 1) D1 を作成 → 出力された database_id を wrangler.toml に貼る
wrangler d1 create tankyu-journal

# 2) 本番D1にスキーマ＋種データを投入
wrangler d1 execute tankyu-journal --remote --file=d1/schema.sql
wrangler d1 execute tankyu-journal --remote --file=d1/seed.sql

# 3a) 直接デプロイする場合
wrangler pages deploy .
```

**3b) GitHub連携で自動デプロイする場合（推奨）**
Cloudflare ダッシュボード → Pages → Create → Connect to Git → このリポジトリ →
Build output directory = `/`（ビルド不要）。デプロイ後、
**Settings → Functions → D1 database bindings** に `DB` → `tankyu-journal` を追加して再デプロイ。
以後は `git push` で自動デプロイ。

> 旧 Vercel デプロイ（tankyu-journal.vercel.app）は、`/api` を持たないため移行後は使いません。Cloudflare Pages 側を本番にしたら Vercel 連携は外してください。

---

## セキュリティ・運用メモ

- 公開URLは基本だれでも開けます（実在生徒の回答が載る前提）。限定公開は Cloudflare Access で被せられます。
- `/api/save` は現状オープン（同一オリジンのみ）。本番運用では Cloudflare Access や簡易トークンでの保護を検討。
- 一覧の A3 印刷は、①`/api/export` の CSV を Excel で開いて印刷、②（今後）印刷専用HTMLビュー、のどちらか。

## ファイル構成

```
index.html          /（login へ転送）
login/student/teacher(.html/.js)  画面
config.js           API_BASE / DEMO
schema.js           セッション定義と質問→列マッピング
api.js              API クライアント（/api・デモフォールバック付き）
functions/api/*.js  Pages Functions（read/save/list/export + _shared）
d1/schema.sql       D1 スキーマ
d1/seed.sql         現行スプシからの投入データ（683行）
wrangler.toml       Pages + D1 バインド設定（★database_id を本番値に）
_legacy/            旧クリックプロトタイプ / 旧Apps Script・Vercel構成（対象外）
```
