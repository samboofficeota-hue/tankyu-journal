/**
 * API クライアント（Cloudflare Pages Functions + D1 / デモフォールバック共用）
 * window.JournalAPI として公開。
 *   JournalAPI.isLive()                    … 実バックエンド接続か（DEMO=false）
 *   JournalAPI.readStudent({grade,cls,no}) … 生徒1名分の全セッション
 *   JournalAPI.saveAnswers({...})          … 回答を保存
 *   JournalAPI.saveComment({...})          … 先生コメントを保存
 */
(function () {
  var cfg = window.JOURNAL_CONFIG || {};
  var BASE = (cfg.API_BASE || '/api').replace(/\/$/, '');
  var DEMO = !!cfg.DEMO;

  function isLive() { return !DEMO; }

  // ---- デモデータ（DEMO=true 時）----
  var DEMO_DATA = {
    student: { grade: '9', cls: 'A', no: '47', name: '原宿 外苑' },
    sessions: {
      A: { 5: 'Mrs.GREEN APPLEの曲が好き！', 6: 'なぜミセスの曲はみんなに人気なんだろう？', 7: '使われている歌詞の言葉が心に響くのかもしれない', 8: '本探究では、ミセスの曲の魅力を明らかにする。', 9: 'みんなが好きなミセスの歌詞を調査する。', 10: '音楽、国語、社会', 11: '人気曲の共通点がわかり、流行に敏感になるかも', 12: '調査方法についていろいろな方法を知りたい', 13: '流行の曲はどうして流行っているのか', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' },
      B: { 5: 'Mrs.GREEN APPLEの曲が好き！', 6: 'なぜミセスの曲はみんなに人気なんだろう？', 7: '使われている歌詞の言葉が心に響くのかもしれない', 8: '本探究では、ミセスの曲の魅力を明らかにする。', 9: 'みんなが好きなミセスの歌詞を調査する。', 10: '音楽、国語、社会', 11: '人気曲の共通点がわかり、流行に敏感になるかも', 12: '調査方法についていろいろな方法を知りたい', 13: '流行の曲はどうして流行っているのか', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' },
      C: { 5: '℃流行の曲予測', 7: '心に響く歌詞・フレーズを調査しランキング形式にする', 8: '「心に響く歌詞・フレーズ」とは何か明確にする', 9: '「好きな歌とその歌詞」について50人くらいに聞く。また、ネットで情報収集する。', 10: 'アンケートをFormで集めたい。ラボの先生に許可をもらっておく。', 11: '音楽、国語、社会、数学', 12: '音楽室', 13: 'Form作成、許可をもらう、Excelの使い方', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' },
      D: { 5: '℃流行の曲予測', 7: '心に響く歌詞・フレーズを調査しランキング形式にする', 8: '「心に響く歌詞・フレーズ」とは何か明確にする', 9: '「好きな歌とその歌詞」について50人くらいに聞く。また、ネットで情報収集する。', 10: 'アンケートをFormで集めたい。ラボの先生に許可をもらっておく。', 11: '音楽、国語、社会、数学', 12: '音楽室', 13: 'Form作成、許可をもらう、Excelの使い方', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' }
    }
  };

  function demoRead(key) {
    var match = (String(key.grade) === '9' && String(key.cls).toUpperCase() === 'A' && String(key.no) === '47');
    var order = (window.JOURNAL_SCHEMA && window.JOURNAL_SCHEMA.order) || ['A', 'B', 'C', 'D'];
    var sessions = order.map(function (sid) {
      var cells = (match && DEMO_DATA.sessions[sid]) ? DEMO_DATA.sessions[sid] : {};
      return { id: sid, found: match, cells: cells, teacherComment: cells[14] || '' };
    });
    return Promise.resolve({ ok: true, demo: true, student: match ? DEMO_DATA.student : { grade: key.grade, cls: key.cls, no: key.no, name: '' }, sessions: sessions });
  }

  function readStudent(key) {
    if (DEMO) return demoRead(key);
    var url = BASE + '/read?grade=' + encodeURIComponent(key.grade) +
      '&cls=' + encodeURIComponent(key.cls) + '&no=' + encodeURIComponent(key.no);
    return fetch(url, { method: 'GET', headers: { 'accept': 'application/json' } })
      .then(function (r) { return r.json(); });
  }

  function post(payload) {
    if (DEMO) return Promise.resolve({ ok: true, demo: true });
    return fetch(BASE + '/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  function saveAnswers(o) {
    return post({ action: 'saveAnswers', grade: o.grade, cls: o.cls, no: o.no, name: o.name || '', sessionId: o.sessionId, answers: o.answers });
  }
  function saveComment(o) {
    return post({ action: 'saveComment', grade: o.grade, cls: o.cls, no: o.no, sessionId: o.sessionId, comment: o.comment });
  }

  window.JournalAPI = { isLive: isLive, readStudent: readStudent, saveAnswers: saveAnswers, saveComment: saveComment };
})();
