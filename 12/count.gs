const COUNTER_KEY = 'page_views';

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  if (callback && !/^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid callback' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let count;
  try {
    const properties = PropertiesService.getScriptProperties();
    const storedCount = properties.getProperty(COUNTER_KEY);
    const previousCount = storedCount === null ? 0 : Number(storedCount);
    if ((storedCount !== null && !/^\d+$/.test(storedCount)) ||
        !Number.isSafeInteger(previousCount) || previousCount >= Number.MAX_SAFE_INTEGER) {
      throw new Error('Invalid stored counter value');
    }
    count = previousCount + 1;
    properties.setProperty(COUNTER_KEY, String(count));
  } finally {
    lock.releaseLock();
  }

  const result = JSON.stringify({ count: count });
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + result + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON);
}
