const SPREADSHEET_ID = '1PdiO0QQIYgSC31k1ZpY2KJNESRCUAh3sd1Z2WKdla9Q';
const HEADER_SCAN_ROWS = 20;

function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '';

  return template.evaluate()
    .setTitle('電路學成績查詢')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getMyGrades(idToken) {
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clientId) {
    throw new Error('系統尚未設定 Google OAuth Client ID，請聯絡管理員。');
  }

  const email = verifyGoogleIdToken_(idToken, clientId);
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  if (!sheet) {
    throw new Error('成績試算表中沒有可讀取的工作表。');
  }

  const values = sheet.getDataRange().getDisplayValues();
  const headerInfo = findHeaderRow_(values);
  if (!headerInfo) {
    throw new Error('找不到包含 Email 欄位的標題列。');
  }

  const headers = values[headerInfo.rowIndex];
  const matchingRows = values.slice(headerInfo.rowIndex + 1).filter((row) =>
    normalizeEmail_(row[headerInfo.emailIndex]) === email
  );

  if (matchingRows.length === 0) {
    throw new Error('成績資料中找不到此 Gmail，請確認登記的 Email 是否正確。');
  }
  if (matchingRows.length > 1) {
    throw new Error('此 Gmail 對應到多筆資料，請聯絡管理員確認成績表。');
  }

  const row = matchingRows[0];
  const fields = headers.reduce((result, header, index) => {
    const label = String(header || '').trim();
    if (label && index !== headerInfo.emailIndex) {
      result.push({
        label: label,
        value: String(row[index] || '').trim() || '—'
      });
    }
    return result;
  }, []);

  return { email: email, fields: fields };
}

function verifyGoogleIdToken_(idToken, clientId) {
  if (typeof idToken !== 'string' || !idToken) {
    throw new Error('登入憑證無效，請重新登入。');
  }

  const response = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) {
    throw new Error('Google 登入驗證失敗，請重新登入。');
  }

  const claims = JSON.parse(response.getContentText());
  const issuer = claims.iss;
  if (claims.aud !== clientId ||
      (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') ||
      String(claims.email_verified).toLowerCase() !== 'true' ||
      !claims.email) {
    throw new Error('無法確認此 Google 帳號，請使用已驗證的 Gmail 登入。');
  }

  return normalizeEmail_(claims.email);
}

function findHeaderRow_(values) {
  const emailHeaders = ['email', 'e-mail', 'gmail', '電子郵件', '電子信箱'];
  const scanLimit = Math.min(values.length, HEADER_SCAN_ROWS);

  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const normalized = values[rowIndex].map(normalizeHeader_);
    const emailIndex = normalized.findIndex((header) => emailHeaders.indexOf(header) !== -1);
    if (emailIndex !== -1) {
      return { rowIndex: rowIndex, emailIndex: emailIndex };
    }
  }

  return null;
}

function normalizeHeader_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}