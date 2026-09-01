/**
 * My 探究ジャーナル — スプレッドシート連動バックエンド（Google Apps Script）
 * ------------------------------------------------------------------
 * このスクリプトを「My探究」スプレッドシートに紐づけ、ウェブアプリとして
 * デプロイすると、Vercel 上の静的フロントから読み書きできる API になります。
 *
 * 【役割】
 *   doGet  … 生徒1名分（学年+クラス+番号でキー）の各セッション行を読み取り
 *   doPost … 生徒の回答 / 先生コメントをその行に書き戻し（無ければ新規行を追加）
 *
 * スプレッドシートが唯一の正本（single source of truth）。DBは増やしません。
 *
 * ============ セットアップ（3ステップ）============
 *   1) このスプレッドシートで [拡張機能] → [Apps Script] を開き、
 *      Code.gs の中身をこのファイルで丸ごと置き換える。
 *   2) 下の SESSION_MAP の sheet 名を、実際のタブ名に合わせて直す。
 *      （タブ名はスプレッドシート下部のタブに表示されている文字列）
 *   3) [プロジェクトの設定] → スクリプト プロパティに WRITE_TOKEN を1つ登録。
 *      同じ値を フロント側 config.js の WRITE_TOKEN にも入れる。
 *      → [デプロイ] → [新しいデプロイ] → 種類「ウェブアプリ」
 *        ・実行するユーザー: 自分
 *        ・アクセスできるユーザー: 全員
 *        で公開し、発行された /exec URL を config.js の API_URL に貼る。
 * ==================================================
 */

// --- セッションID → タブ名 の対応（★実際のタブ名に直してください）---
// type は列レイアウトの種類（1=My探究①型[A/B] / 3=My探究③型[C/D]）。
// 読み書きは列番号で行うため type は将来の拡張用メモ。両型とも A〜N の14列。
var SESSION_MAP = {
  'A': { sheet: 'A', type: 1 },
  'B': { sheet: 'B', type: 1 },
  'C': { sheet: 'C', type: 3 },
  'D': { sheet: 'D', type: 3 }
};

var DATA_START_ROW = 4;   // 1〜3行目はヘッダー、4行目からデータ
var TOTAL_COLS     = 14;  // A〜N
var COMMENT_COL    = 14;  // N列 = 先生コメント欄（1始まり）
var KEY_GRADE_COL  = 1;   // A列 学年
var KEY_CLASS_COL  = 2;   // B列 クラス
var KEY_NO_COL     = 3;   // C列 番号
var NAME_COL       = 4;   // D列 名前

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.action === 'meta') return json_(buildMeta_());
    // 既定: read（生徒1名分）
    var grade = String(p.grade || '').trim();
    var cls   = String(p.cls || '').trim().toUpperCase();
    var no    = String(p.no || '').trim();
    if (!grade || !cls || !no) return json_({ ok: false, error: 'grade / cls / no を指定してください' });
    return json_(readStudent_(grade, cls, no));
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    // プリフライト回避のため、フロントは Content-Type: text/plain で JSON を送る
    var body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);

    if (String(body.token || '') !== getWriteToken_()) {
      return json_({ ok: false, error: '書き込みトークンが一致しません' });
    }
    var grade = String(body.grade || '').trim();
    var cls   = String(body.cls || '').trim().toUpperCase();
    var no    = String(body.no || '').trim();
    var sessionId = String(body.sessionId || '').trim();
    if (!grade || !cls || !no || !sessionId) {
      return json_({ ok: false, error: 'grade / cls / no / sessionId が必要です' });
    }
    var map = SESSION_MAP[sessionId];
    if (!map) return json_({ ok: false, error: '未知の sessionId: ' + sessionId });
    var sheet = SpreadsheetApp.getActive().getSheetByName(map.sheet);
    if (!sheet) return json_({ ok: false, error: 'タブが見つかりません: ' + map.sheet });

    var rowIndex = findOrCreateRow_(sheet, grade, cls, no);

    if (body.action === 'saveComment') {
      sheet.getRange(rowIndex, COMMENT_COL).setValue(String(body.comment == null ? '' : body.comment));
      return json_({ ok: true, wrote: 'comment', row: rowIndex });
    }

    if (body.action === 'saveAnswers') {
      var answers = body.answers || {}; // { "5": "文字列", "6": "..." }  キーは1始まりの列番号
      var wrote = [];
      Object.keys(answers).forEach(function (colStr) {
        var col = parseInt(colStr, 10);
        if (col >= 5 && col <= TOTAL_COLS && col !== COMMENT_COL) { // A〜Dのキー列と先生コメント列は生徒からは書けない
          sheet.getRange(rowIndex, col).setValue(String(answers[colStr] == null ? '' : answers[colStr]));
          wrote.push(col);
        }
      });
      // 名前は空のときだけ埋める（既存の名前は上書きしない）
      if (body.name) {
        var nameCell = sheet.getRange(rowIndex, NAME_COL);
        if (!String(nameCell.getValue()).trim()) nameCell.setValue(String(body.name));
      }
      return json_({ ok: true, wrote: wrote, row: rowIndex });
    }

    return json_({ ok: false, error: '未知の action: ' + body.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// --- 生徒1名分を全セッション読む ---
function readStudent_(grade, cls, no) {
  var ss = SpreadsheetApp.getActive();
  var sessions = [];
  var studentName = '';
  Object.keys(SESSION_MAP).forEach(function (sid) {
    var map = SESSION_MAP[sid];
    var sheet = ss.getSheetByName(map.sheet);
    var entry = { id: sid, type: map.type, found: false, cells: [], teacherComment: '' };
    if (sheet) {
      var row = findRow_(sheet, grade, cls, no);
      if (row > 0) {
        var values = sheet.getRange(row, 1, 1, TOTAL_COLS).getValues()[0];
        entry.found = true;
        entry.cells = values.map(function (v) { return v == null ? '' : String(v); });
        entry.teacherComment = entry.cells[COMMENT_COL - 1] || '';
        if (!studentName && entry.cells[NAME_COL - 1]) studentName = entry.cells[NAME_COL - 1];
      }
    }
    sessions.push(entry);
  });
  return {
    ok: true,
    student: { grade: grade, cls: cls, no: no, name: studentName },
    sessions: sessions
  };
}

function buildMeta_() {
  var ss = SpreadsheetApp.getActive();
  var out = { ok: true, sessions: [] };
  Object.keys(SESSION_MAP).forEach(function (sid) {
    var map = SESSION_MAP[sid];
    var sheet = ss.getSheetByName(map.sheet);
    out.sessions.push({
      id: sid, sheet: map.sheet, type: map.type,
      exists: !!sheet,
      rows: sheet ? Math.max(0, sheet.getLastRow() - DATA_START_ROW + 1) : 0
    });
  });
  return out;
}

// --- 行検索（学年+クラス+番号の完全一致）---
function findRow_(sheet, grade, cls, no) {
  var last = sheet.getLastRow();
  if (last < DATA_START_ROW) return -1;
  var keys = sheet.getRange(DATA_START_ROW, 1, last - DATA_START_ROW + 1, 3).getValues();
  for (var i = 0; i < keys.length; i++) {
    var g = String(keys[i][0]).trim();
    var c = String(keys[i][1]).trim().toUpperCase();
    var n = String(keys[i][2]).trim();
    if (g === String(grade).trim() && c === String(cls).trim().toUpperCase() && n === String(no).trim()) {
      return DATA_START_ROW + i;
    }
  }
  return -1;
}

function findOrCreateRow_(sheet, grade, cls, no) {
  var row = findRow_(sheet, grade, cls, no);
  if (row > 0) return row;
  var newRow = Math.max(sheet.getLastRow() + 1, DATA_START_ROW);
  sheet.getRange(newRow, KEY_GRADE_COL).setValue(grade);
  sheet.getRange(newRow, KEY_CLASS_COL).setValue(cls);
  sheet.getRange(newRow, KEY_NO_COL).setValue(no);
  return newRow;
}

function getWriteToken_() {
  return PropertiesService.getScriptProperties().getProperty('WRITE_TOKEN') || '';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
