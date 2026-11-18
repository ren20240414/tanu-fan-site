// 共通の Code.gs から content=story のときに呼び出す、物語タブ専用ハンドラー。
function getStoryResponse(e) {
  const SPREADSHEET_ID = '1Jd9n-MKq4HCrbH-JGTwLGox1OyJtBmtZTCkMnLeE6SY';
  const SHEET_NAME = '⚔これまでの物語';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return storyJsonp_(e, { items: [], error: '指定したシートが見つかりません。' });
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return storyJsonp_(e, { items: [] });

  const headers = values[0].map(value => String(value).trim());
  const column = name => headers.indexOf(name);
  const items = values.slice(1).map((row, index) => {
    const cell = name => {
      const columnIndex = column(name);
      return columnIndex < 0 ? '' : row[columnIndex];
    };
    return {
      event_id: storyText_(cell('event_id')) || 'row-' + (index + 2),
      start_date: storyDate_(cell('イベント開始日')),
      end_date: storyDate_(cell('イベント終了日')),
      title: storyText_(cell('イベント名')),
      event_type: storyText_(cell('イベント種別')),
      result: storyText_(cell('結果・実績')),
      venue: storyText_(cell('会場')),
      co_stars: storyText_(cell('共演者')),
      image_url: storyText_(cell('画像URL')),
      related_url: storyText_(cell('関連URL')),
      publish_status: storyText_(cell('公開状態')),
      display_order: storyText_(cell('表示順'))
    };
  }).filter(item => item.publish_status === '公開' && item.title);

  items.sort((a, b) => {
    const orderA = Number(a.display_order);
    const orderB = Number(b.display_order);
    const hasOrderA = a.display_order !== '' && Number.isFinite(orderA);
    const hasOrderB = b.display_order !== '' && Number.isFinite(orderB);
    if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB;
    if (hasOrderA !== hasOrderB) return hasOrderA ? -1 : 1;
    return String(b.start_date).localeCompare(String(a.start_date));
  });

  return storyJsonp_(e, { items });
}

function storyText_(value) {
  return value == null ? '' : String(value).trim();
}

function storyDate_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).trim();
}

function storyJsonp_(e, payload) {
  const callback = e && e.parameter && e.parameter.callback;
  const callbackName = /^[A-Za-z_$][\w$]*$/.test(callback || '') ? callback : 'receiveTanuStory';
  const json = JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return ContentService.createTextOutput(callbackName + '(' + json + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
