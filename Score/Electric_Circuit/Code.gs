const SPREADSHEET_ID = '1PdiO0QQIYgSC31k1ZpY2KJNESRCUAh3sd1Z2WKdla9Q';
const HEADER_SCAN_ROWS = 20;
const RESEND_DELAY_SECONDS = 120;
const GENERIC_RESPONSE = '若此 Email 已登記且資料唯一，成績將寄送至該信箱。';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('電路學成績查詢')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function sendGrades(emailAddress) {
  const email = normalizeEmail_(emailAddress);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return GENERIC_RESPONSE;
  }

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
  if (matchingRows.length !== 1 || !reserveEmailSend_(email)) {
    return GENERIC_RESPONSE;
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

  const plainText = fields.map((field) => field.label + ': ' + field.value).join('\n');
  const htmlRows = fields.map((field) =>
    '<tr><th style="text-align:left;padding:10px;border-bottom:1px solid #d5d9d2">' +
    escapeHtml_(field.label) + '</th><td style="padding:10px;border-bottom:1px solid #d5d9d2">' +
    escapeHtml_(field.value) + '</td></tr>'
  ).join('');

  MailApp.sendEmail({
    to: email,
    subject: '電路學個人成績',
    body: '以下是您的成績：\n\n' + plainText,
    htmlBody: '<p>以下是您的成績：</p><table style="border-collapse:collapse">' +
      htmlRows + '</table>',
    name: '電路學成績查詢'
  });

  return GENERIC_RESPONSE;
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

function reserveEmailSend_(email) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email);
  const key = 'grade-email-' + Utilities.base64EncodeWebSafe(digest);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const cache = CacheService.getScriptCache();
    if (cache.get(key)) {
      return false;
    }
    cache.put(key, 'sent', RESEND_DELAY_SECONDS);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}