/**
 * My 探究ジャーナル — フロント設定
 * ------------------------------------------------------------------
 * Apps Script ウェブアプリをデプロイしたら、その /exec URL を API_URL に、
 * スクリプトプロパティに登録したのと同じ値を WRITE_TOKEN に入れてください。
 *
 * API_URL が空のあいだは「デモモード」で動きます（架空の原宿外苑さんのデータ・
 * 書き込みは画面上だけ）。URL を入れた瞬間に、実スプレッドシート連動へ切り替わります。
 */
window.JOURNAL_CONFIG = {
  // Apps Script ウェブアプリの /exec URL
  API_URL: 'https://script.google.com/macros/s/AKfycbwIebgaDmmdbehtNJjXcMf5zzZdb9vdIRuBk7OdEUX9AVK1mlfV1T9f7uZangU-q8rz/exec',
  // Apps Script のスクリプトプロパティ WRITE_TOKEN と同じ文字列
  WRITE_TOKEN: 'tankyu'
};
