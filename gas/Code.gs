function doGet(e) {
  const SPREADSHEET_ID = '1Jd9n-MKq4HCrbH-JGTwLGox1OyJtBmtZTCkMnLeE6SY';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  const scenesMap = {};

  if (lastRow > 1) {
    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    values.forEach((row, index) => {
      const sceneName = row[0] ? String(row[0]).trim() : 'その他';
      const text = row[1] ? String(row[1]) : '';

      if (text) {
        if (!scenesMap[sceneName]) scenesMap[sceneName] = [];
        scenesMap[sceneName].push({ id: 'msg_' + index, text });
      }
    });
  }

  const groupedData = Object.keys(scenesMap).map(scene => ({
    scene,
    items: scenesMap[scene]
  }));

  // GitHub Pages loads this read-only response as JSONP to avoid CORS restrictions.
  if (e && e.parameter && e.parameter.data === '1') {
    const safeJson = JSON.stringify(groupedData)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');

    return ContentService
      .createTextOutput('window.receiveTanuData(' + safeJson + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Keep the existing Apps Script page working at the original URL.
  const htmlOutput = HtmlService.createTemplateFromFile('Index');
  htmlOutput.groupedData = groupedData;

  return htmlOutput.evaluate()
    .setTitle('tanu枠コメントコピペツール')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
