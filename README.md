# My 探究ジャーナル

中学校の「My探究」の記録を、授業回ごとに分かれた表計算入力から、
**個人の探究の変化を感じられる記録体験**に置き換えるWebアプリのMVPです。

Googleスプレッドシート（実データの正本）と **双方向で同期** します。
Vercel 上の静的フロント（このリポジトリ）が、スプレッドシートに紐づけた
Google Apps Script のウェブアプリを叩いて、読み取り・書き戻しをします。

```
生徒/先生 ── ブラウザ ──▶ Vercel(静的HTML/JS) ──fetch──▶ Apps Script Web App ──▶ Google Spreadsheet（正本）
```

- スプレッドシート: `1ObFt46FF6IB4M9ldHWDVlzofwq6ZzrvgWxKSPhZ0PxU`
- 生徒フロー: `login.html`（学年/組/番号）→ `student.html`（A〜Dを1枚で切替・提出でスプシへ書き戻し）
- 先生フロー: `teacher.html`（生徒を選んで読取り→先生コメントをスプシへ書き戻し）

---

## 画面とデータの対応

| 画面 | スプシのタブ | 列レイアウト |
|---|---|---|
| セッション A / B | My探究①型のタブ | A〜N（14列）。E〜M が回答、N が先生コメント |
| セッション C / D | My探究③型のタブ | A〜N（14列）。E,G〜M が回答、N が先生コメント |

- キー = A列 学年 / B列 クラス / C列 番号（この3つで生徒の行を特定）
- データ開始行 = 4行目（1〜3行目はヘッダー）
- 質問と列の対応は `schema.js`、列そのものの読み書きは `apps-script/Code.gs`

---

## セットアップ（順番どおりに）

### ① Apps Script をデプロイして API URL を得る

1. 対象スプレッドシートを開き、**拡張機能 → Apps Script**。
2. `Code.gs` の中身を、このリポジトリの `apps-script/Code.gs` で丸ごと置き換える。
3. 先頭の `SESSION_MAP` の `sheet:` を、**実際のタブ名**に直す。
   （例：タブ名が「6/26」なら `'A': { sheet: '6/26', type: 1 }`）
4. **プロジェクトの設定（歯車）→ スクリプト プロパティ** に
   `WRITE_TOKEN` = 任意の合言葉（例：長めのランダム文字列）を1つ登録。
5. **デプロイ → 新しいデプロイ → 種類「ウェブアプリ」**
   - 実行するユーザー: **自分**
   - アクセスできるユーザー: **全員**
   - デプロイ。初回は権限承認が出るので許可する。
6. 発行された **ウェブアプリ URL（`https://script.google.com/macros/s/……/exec`）** を控える。

> タブ名が合っているかは、ブラウザで `……/exec?action=meta` を開くと確認できます
> （各セッションの `exists` と `rows` が返ります）。

### ② フロントに URL とトークンを設定

`config.js` を編集：

```js
window.JOURNAL_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/……/exec',
  WRITE_TOKEN: 'Apps Scriptに登録したのと同じ合言葉'
};
```

`API_URL` が空のあいだは **デモモード**（架空の 9年A組47番 原宿外苑さん・書き込みは画面上だけ）で動きます。URL を入れると実スプレッドシート連動に切り替わります。

### ③ GitHub → Vercel で公開

1. このフォルダは単独の Git リポジトリです。GitHub に push 済み。
2. [Vercel](https://vercel.com/new) で **Import Git Repository** → このリポジトリを選択。
3. Framework Preset は **Other**（ビルド不要の静的サイト）。そのまま Deploy。
4. 以後は `git push` するたびに自動デプロイされます。

---

## ローカルで試す

```bash
npx serve .    # または: python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/`（→ login に転送）。

---

## セキュリティ・運用メモ

- 公開 URL は基本だれでも開けます。**実在生徒の回答が載る前提**での運用です。
  名前は伏せる運用にしていますが、限定公開が必要なら Vercel の
  Password Protection か Cloudflare Access 等を別途かけてください。
- 書き戻しは `WRITE_TOKEN` で最低限ガードしていますが、フロントに埋め込む都合上
  「秘密」ではありません（いたずら書き込みの敷居を上げる程度）。本番運用では
  Apps Script 側でのレート制限・変更履歴（スプシの版履歴）併用を推奨。
- Apps Script の POST はプリフライト回避のため `Content-Type: text/plain` で送っています。

## ファイル構成

```
index.html         /（login へ転送）
login.html/.js     学年・組・番号でログイン
student.html/.js   生徒ページ（A〜D・提出でスプシ書き戻し）
teacher.html/.js   先生ページ（読取り＋コメント書き戻し）
config.js          API_URL / WRITE_TOKEN（★要設定）
schema.js          セッション定義と質問→列マッピング
api.js             API クライアント（デモフォールバック付き）
style.css /        デザイン
design-refresh.css
apps-script/Code.gs スプレッドシート側バックエンド（★スプシに貼る）
_legacy/           旧クリックプロトタイプ（デプロイ対象外）
```
