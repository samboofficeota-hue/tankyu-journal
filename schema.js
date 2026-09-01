/**
 * セッション定義（A〜D）と、質問→スプレッドシート列（1始まり）の対応。
 * 生徒ページ・先生ページの両方がこの定義を使ってフォームを組み立てます。
 * col は Apps Script 側の列番号（A=1 … N=14）と一致させること。
 *
 * type 1 = My探究①型（セッション A / B）
 * type 3 = My探究③型（セッション C / D＝サイクル計画）
 */
window.JOURNAL_SCHEMA = {
  order: ['A', 'B', 'C', 'D'],

  sessions: {
    A: {
      type: 1,
      eyebrow: 'SESSION A　6月26日',
      title: 'Ａ　「好き」を、探究の問いへ',
      intro: 'いきなり立派なテーマを決めなくて大丈夫。<br /><strong>好きなこと → 気になること → こうかもしれない</strong>を、順番に置いてみよう。'
    },
    B: {
      type: 1,
      eyebrow: 'SESSION B　6月29日',
      title: 'Ｂ　問いを、探究の形へ',
      intro: '前回の言葉を見返しながら、いまの探究の言葉に更新しよう。変わっても、変わらなくても大丈夫。'
    },
    C: {
      type: 3,
      eyebrow: 'SESSION C　7月3日',
      title: 'Ｃ　計画を、最初の行動へ',
      intro: 'サイクル活動Ⅰに向けて、目標と方法を「実際に動けるくらい」具体的にしよう。'
    },
    D: {
      type: 3,
      eyebrow: 'SESSION D　7月14日',
      title: 'Ｄ　計画を、最初の行動へ',
      intro: 'サイクル活動Ⅰに向けた計画の仕上げ。場所と最初の一歩まで決めておこう。'
    }
  },

  // 質問セット（type ごと）。col = スプレッドシートの列番号（1始まり）。
  fields: {
    1: [
      { step: 'STEP 1　いま心にあること', note: '正解はありません。書けるところから、短くても大丈夫。' },
      { col: 5,  n: '01', label: '初めのつぶやき', help: 'いま好きなこと、気になっていることを、そのまま書こう。', required: true, long: true },
      { col: 6,  n: '02', label: '問いの芽生え', help: '「なんで？」と思ったことを、問いの形にしてみよう。', required: true, long: true },
      { col: 7,  n: '03', label: '一歩深まった問い', help: '「もしかして…」をつけて、今の仮説を書いてみよう。', required: true, long: true },
      { step: 'STEP 2　探究の輪郭をつくる', note: 'まだ変わって大丈夫。今の時点で、進みたい方向を置いておこう。' },
      { col: 8,  n: '04', label: '何をどこまで明らかにしたい？【目的】', help: '', required: true, long: true },
      { col: 9,  n: '05', label: 'そのために、どんな調査・分析をする？【目標】', help: '', required: true, long: true },
      { col: 10, n: '06', label: '関係しそうな領域は？', help: '教科名でも、気になる分野でもOK。', required: false, long: false },
      { step: 'STEP 3　次へつなげる', note: '探究は、今日の答えで終わりません。次の一歩の種を残そう。' },
      { col: 11, n: '07', label: 'この探究が進むと、何が起きそう？', help: '', required: false, long: true },
      { col: 12, n: '08', label: '他者の意見から、参考にしたいことは？', help: '', required: false, long: true },
      { col: 13, n: '09', label: '今の私の探究テーマ', help: '最後に、今の問いを短いテーマにしてみよう。あとから何度変えても大丈夫。', required: true, long: true }
    ],
    3: [
      { step: 'STEP 1　目標を更新する', note: '今のテーマと目標を確認しよう。' },
      { col: 5,  n: '01', label: '今の探究テーマ', help: 'My探究を通して調べたい・分析したいこと。', required: true, long: true },
      { col: 7,  n: '02', label: '更新した目標', help: '', required: true, long: true },
      { col: 8,  n: '03', label: '目的・目標に迫るために研究すること', help: '', required: true, long: true },
      { step: 'STEP 2　方法を具体化する', note: '実際に動けるくらい、計画を具体的にしよう。' },
      { col: 9,  n: '04', label: 'どんな方法で確かめる？', help: '課題を解決するための具体的なやり方。', required: true, long: true },
      { col: 10, n: '05', label: '事前に準備しておくことは？', help: '持ち込みや、申請しておきたいものなど。', required: false, long: true },
      { col: 11, n: '06', label: '関係する領域は？', help: '教科名等。', required: false, long: false },
      { step: 'STEP 3　動き出す準備をする', note: '場所と最初の一歩を決めよう。' },
      { col: 12, n: '07', label: '次回の活動場所は？（ラボ）', help: '', required: false, long: false },
      { col: 13, n: '08', label: 'サイクルⅠに向けてメモしておきたいことは？', help: '', required: false, long: true }
    ]
  }
};
