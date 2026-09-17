const COUNTER_KEY = 'salf_page_views';
const INITIAL_COUNT = 1024;

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let count;
  try {
    const properties = PropertiesService.getScriptProperties();
    count = Number(properties.getProperty(COUNTER_KEY) || INITIAL_COUNT - 1) + 1;
    properties.setProperty(COUNTER_KEY, String(count));
  } finally {
    lock.releaseLock();
  }

  const result = JSON.stringify({ count: count });
  const callback = e && e.parameter && e.parameter.callback;
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + result + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON);
}