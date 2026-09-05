/**
 * ナナメの部屋 — モックデータ（画面設計用）
 * ------------------------------------------------------------------
 * ここにあるのは、生徒の一覧画面に並ぶ「ナナメの大人のプロフィール」。
 * docs/nanameya.md の登場人物6人（C1〜C6）とは別物で、C6 三浦いずみだけが
 * この一覧にも載っている（C5 谷口さとしは審査中のためまだ載らない）。
 * 実装が進んだら D1 の volunteers / consents テーブル＋ /api/nanameya/* に
 * 差し替える。差し替えやすいよう、キー名はそのままテーブル列名にする想定。
 */
/* 日付ヘルパ：dayOffset日後の h:m を ISO で返す（モックの日時づくり用） */
function at(dayOffset, h, m) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

window.NANAMEYA_DATA = {
  /* 迫り方＝一覧の絞り込み軸。「調べる」偏重を崩すのが目的なので、
     職業ではなく迫り方で選ばせる。 */
  approaches: [
    { key: 'make',    label: 'つくってみる', ico: '🔧' },
    { key: 'ask',     label: '聞いてみる',   ico: '🎤' },
    { key: 'observe', label: '観察する',     ico: '🌱' },
    { key: 'meet',    label: '当事者に会う', ico: '🤝' },
    { key: 'count',   label: '数えて比べる', ico: '📊' },
    { key: 'try',     label: '小さく試す',   ico: '🧪' }
  ],

  /* ナナメの大人。photo_url は R2 に置く想定。今は avatar（絵文字）で代用。 */
  volunteers: [
    { id: 'v1', name: '大村 健一',   title: '町工場の職人',            avatar: '🔧',
      approach: 'make',
      interests: ['ものづくり', '機械', '修理'],
      voice: 'わからないときは、まず小さく作ってみる。',
      intro: '金属加工の工場を40年やっています。図面どおりに作れないことのほうが多くて、そのたびに考え直してきました。うまくいかない話が好きです。' },

    { id: 'v2', name: '三浦 いずみ', title: '元新聞記者・まちの編集者', avatar: '🎤',
      approach: 'ask',
      interests: ['地域', '人の話', '書くこと'],
      voice: '聞きに行くと、調べても出てこない話が出てくる。',
      intro: '20年ほど記者をして、いまは地域の小さな冊子を作っています。「誰に聞けばいいか」を一緒に考えるのが得意です。' },

    { id: 'v3', name: '佐久間 亮',   title: '農家',                    avatar: '🌱',
      approach: 'observe',
      interests: ['食', '自然', '天気'],
      voice: '毎日おなじ場所を見ていると、違いに気づく。',
      intro: '野菜を作っています。畑は答えを教えてくれないので、ひたすら見て記録します。観察のしかたなら話せます。' },

    { id: 'v4', name: '東 かおり',   title: '看護師',                  avatar: '🤝',
      approach: 'meet',
      interests: ['健康', '福祉', 'ケア'],
      voice: '当事者に会うと、問いの立て方が変わる。',
      intro: '病院と訪問看護で働いてきました。人に会うときの作法や、聞いてはいけないことの線引きも一緒に考えられます。' },

    { id: 'v5', name: '西野 拓',     title: 'データ分析',              avatar: '📊',
      approach: 'count',
      interests: ['数字', '統計', '調査'],
      voice: '数えてみると、思い込みが崩れることがある。',
      intro: '会社で数字を扱う仕事をしています。むずかしい統計ではなく、「何を数えれば言えるのか」から一緒に考えます。' },

    { id: 'v6', name: '北原 みなみ', title: 'カフェ店主',              avatar: '🧪',
      approach: 'try',
      interests: ['商売', 'お店', '企画'],
      voice: '1回やってみると、次の問いが出てくる。',
      intro: '小さな店をやっています。思いつきを1回だけ試してみる、というやり方をたくさんしてきました。失敗の話ができます。' }
  ],

  /* 予約（シナリオ1）。実装時は D1 bookings から引く。
     日時は相対で作り、10分前解禁・24時間で閲覧終了の挙動を確認できるようにしている。
     状態は docs/nanameya-flow.md 4章：
     booked → reminded → live → ended → noted → closed（＋cancelled / no_show / reported） */
  bookings: [
    { id: 'b1', timerex_id: 'trx_0001', volunteer_id: 'v2', nickname: 'みなと', grade: '1',
      starts_at: at(0, 16, 30), duration_min: 20, meet_url: 'https://meet.google.com/xxx-xxxx-xxx',
      status: 'reminded' },

    { id: 'b2', timerex_id: 'trx_0002', volunteer_id: 'v2', nickname: 'ひなの', grade: '2',
      starts_at: at(-1, 16, 0), duration_min: 20, meet_url: '',
      status: 'ended' },                       // ← 議事録が未提出。事務局の受信箱で最上位

    { id: 'b3', timerex_id: 'trx_0003', volunteer_id: 'v1', nickname: 'そら', grade: '1',
      starts_at: at(-2, 17, 0), duration_min: 15, meet_url: '',
      status: 'noted',                          // ← 提出済み・事務局が未確認
      note_for_student: '商店街のお店に「いつから続いているか」だけ聞いてみる。まず1軒。',
      note_for_office: '実施。落ち着いて話せていた。特に気になることはなし。',
      noted_at: at(-2, 17, 30) },

    { id: 'b4', timerex_id: 'trx_0004', volunteer_id: 'v3', nickname: 'かい', grade: '2',
      starts_at: at(-4, 16, 30), duration_min: 20, meet_url: '',
      status: 'closed',
      note_for_student: '毎日おなじ時間に写真を1枚だけ撮ってみる。1週間分ならべる。',
      note_for_office: '実施。次回も継続したいとのこと。',
      noted_at: at(-4, 17, 0), closed_at: at(-3, 9, 0) },

    { id: 'b5', timerex_id: 'trx_0005', volunteer_id: 'v5', nickname: 'りん', grade: '1',
      starts_at: at(-1, 15, 30), duration_min: 15, meet_url: '',
      status: 'no_show' },

    { id: 'b6', timerex_id: 'trx_0006', volunteer_id: 'v4', nickname: 'あお', grade: '3',
      starts_at: at(-5, 16, 0), duration_min: 20, meet_url: '',
      status: 'reported',
      note_for_office: '対話中に「困ったときは」が押された。事務局が対応中。' }
  ],

  /* 通報（S5 → E3）。誰が・いつ・何をしたかを追えるようにする */
  reports: [
    { id: 'r1', booking_id: 'b6', from: 'student', at: at(-5, 16, 12),
      body: '（生徒がボタンを押した。本文は任意）',
      handled_at: '', handled_by: '' }
  ],

  /* ログイン中のナナメの大人（C6）。実装時は認証から引く */
  me: {
    volunteer_id: 'v2',
    status: 'active',            // 'reviewing' | 'training' | 'trial' | 'active' | 'paused'
    calendar_connected: true,
    trial_remaining: 0           // 運営同席つきの残り回数（0で通常運用）
  },

  /* 大人が登録した空き枠（TimeRex に委譲する部分。ここでは表示用のモック） */
  slots: [
    { id: 's1', starts_at: at(0, 16, 30), duration_min: 20, taken: true  },
    { id: 's2', starts_at: at(1, 16, 30), duration_min: 20, taken: false },
    { id: 's3', starts_at: at(1, 17, 0),  duration_min: 20, taken: false },
    { id: 's4', starts_at: at(3, 16, 0),  duration_min: 20, taken: false }
  ],

  /* 生徒の直近の記録（マスク前の生データ）。
     ★本番では、この生データが大人のブラウザに届くことは無い。
       /api/nanameya/brief がサーバー側でマスクしてから返す。
       ここではマスクが効いていることを画面で確かめるために、
       わざと個人情報を混ぜたモックを置いている。 */
  entry: {
    grade: '1', cls: 'B', no: '12', session: 'B',
    name: '佐藤 みなと',
    updated_at: '2026-06-29 14:20',
    col7:  'もしかして、パンの味じゃなくて、店の人との会話が理由なのかもしれない。',
    col8:  '原宿外苑中学校の近くの商店街で、20年以上つづいているお店が何をしているのかを明らかにしたい。',
    col9:  'ネットで調べる。お店の人にも聞いてみたいけど、聞き方がわからない。',
    col11: '商店街のお店がなくなっていく理由が、少しわかるかもしれない。',
    col12: '佐藤のおばさんがパン屋で働いているので聞いてみたい。連絡先は 03-1234-5678。',
    col13: 'なぜ商店街のパン屋さんは残っているのか',
    teacher_comment: '着眼点がいいですね。次は実際に足を運んでみましょう。'
  },

  /* 保護者同意（S3のゲート）。実装時は D1 consents テーブル＋生徒IDで引く。
     モックでは画面上のスイッチで切り替えて、両方の状態を確認できるようにする。 */
  consent: { status: 'none' } // 'none' | 'pending' | 'approved'
};

/* 画面から使いやすいように：注目している1件と、大人の名前引き */
window.NANAMEYA_DATA.booking = window.NANAMEYA_DATA.bookings[0];
window.NANAMEYA_DATA.volunteerName = (id) => {
  const v = window.NANAMEYA_DATA.volunteers.find((x) => x.id === id);
  return v ? v.name : '（不明）';
};
