/**
 * API クライアント（スプレッドシート連動 / デモフォールバック共用）
 * window.JournalAPI として公開。
 *   JournalAPI.isLive()                       … 実連動モードか
 *   JournalAPI.readStudent({grade,cls,no})    … 生徒1名分の全セッションを取得
 *   JournalAPI.saveAnswers({...})             … 回答を書き戻し
 *   JournalAPI.saveComment({...})             … 先生コメントを書き戻し
 */
(function () {
  var cfg = window.JOURNAL_CONFIG || {};
  var API_URL = (cfg.API_URL || '').trim();
  var TOKEN = (cfg.WRITE_TOKEN || '').trim();

  function isLive() { return !!API_URL; }

  // ---- デモデータ（API_URL 未設定時）----
  // cells は 1始まり列番号→値。実スプレッドシートの原宿外苑さんの行に対応。
  var DEMO = {
    student: { grade: '9', cls: 'A', no: '47', name: '原宿 外苑' },
    sessions: {
      A: { 5: 'Mrs.GREEN APPLEの曲が好き！', 6: 'なぜミセスの曲はみんなに人気なんだろう？', 7: '使われている歌詞の言葉が心に響くのかもしれない', 8: '本探究では、ミセスの曲の魅力を明らかにする。', 9: 'みんなが好きなミセスの歌詞を調査する。', 10: '音楽、国語、社会', 11: '人気曲の共通点がわかり、流行に敏感になるかも', 12: '調査方法についていろいろな方法を知りたい', 13: '流行の曲はどうして流行っているのか', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' },
      B: { 5: 'Mrs.GREEN APPLEの曲が好き！', 6: 'なぜミセスの曲はみんなに人気なんだろう？', 7: '使われている歌詞の言葉が心に響くのかもしれない', 8: '本探究では、ミセスの曲の魅力を明らかにする。', 9: 'みんなが好きなミセスの歌詞を調査する。', 10: '音楽、国語、社会', 11: '人気曲の共通点がわかり、流行に敏感になるかも', 12: '調査方法についていろいろな方法を知りたい', 13: '流行の曲はどうして流行っているのか', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' },
      C: { 5: '℃流行の曲予測', 7: '心に響く歌詞・フレーズを調査しランキング形式にする', 8: '「心に響く歌詞・フレーズ」とは何か明確にする', 9: '「好きな歌とその歌詞」について50人くらいに聞く。また、ネットで情報収集する。', 10: 'アンケートをFormで集めたい。ラボの先生に許可をもらっておく。', 11: '音楽、国語、社会、数学', 12: '音楽室', 13: 'Form作成、許可をもらう、Excelの使い方', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' },
      D: { 5: '℃流行の曲予測', 7: '心に響く歌詞・フレーズを調査しランキング形式にする', 8: '「心に響く歌詞・フレーズ」とは何か明確にする', 9: '「好きな歌とその歌詞」について50人くらいに聞く。また、ネットで情報収集する。', 10: 'アンケートをFormで集めたい。ラボの先生に許可をもらっておく。', 11: '音楽、国語、社会、数学', 12: '音楽室', 13: 'Form作成、許可をもらう、Excelの使い方', 14: '人間が好む特定のリズムがあるのではないか？音楽で実験してみてはどうか（◎◎）' }
    }
  };

  function cellsToObj(arr) {
    var o = {};
    (arr || []).forEach(function (v, i) { if (v !== '' && v != null) o[i + 1] = v; });
    return o;
  }

  function demoRead(key) {
    var match = (String(key.grade) === '9' && String(key.cls).toUpperCase() === 'A' && String(key.no) === '47');
    var order = (window.JOURNAL_SCHEMA && window.JOURNAL_SCHEMA.order) || ['A', 'B', 'C', 'D'];
    var sessions = order.map(function (sid) {
      var cells = (match && DEMO.sessions[sid]) ? DEMO.sessions[sid] : {};
      return { id: sid, found: match, cells: cells, teacherComment: cells[14] || '' };
    });
    return Promise.resolve({
      ok: true,
      demo: true,
      student: match ? DEMO.student : { grade: key.grade, cls: key.cls, no: key.no, name: '' },
      sessions: sessions
    });
  }

  function readStudent(key) {
    if (!isLive()) return demoRead(key);
    var url = API_URL + '?action=read&grade=' + encodeURIComponent(key.grade) +
      '&cls=' + encodeURIComponent(key.cls) + '&no=' + encodeURIComponent(key.no);
    return fetch(url, { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        // Apps Script は cells を配列で返す → 列オブジェクトに正規化
        if (data && data.sessions) {
          data.sessions = data.sessions.map(function (s) {
            return {
              id: s.id, found: s.found,
              cells: Array.isArray(s.cells) ? cellsToObj(s.cells) : (s.cells || {}),
              teacherComment: s.teacherComment || ''
            };
          });
        }
        return data;
      });
  }

  function post(payload) {
    if (!isLive()) return Promise.resolve({ ok: true, demo: true });
    payload.token = TOKEN;
    return fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // プリフライト回避
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
