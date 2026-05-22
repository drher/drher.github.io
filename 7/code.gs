const LINE_CHANNEL_ACCESS_TOKEN = 'wvRx3SpKavpKXqu+VKsFPJp06vB+ti5bXy428wgTDUqdhmA700eivgp1JdZPmNkK49doDhECbl0rEzQSyvfC7cUy1J0TExUFzfhy6rvZc+lRfcXTWyMq8hw7UCekcgXV2ouQt62owiK929BVsWAcQgdB04t89/1O/w1cDnyilFU=';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Webhook payload is empty.');
      return ContentService.createTextOutput('ok');
    }

    const body = JSON.parse(e.postData.contents);
    const events = body.events || [];

    Logger.log('Incoming events count: %s', events.length);

    events.forEach(function(event) {
      try {
        if (!event.replyToken || !event.message) {
          Logger.log('Skip event without replyToken/message. type=%s', event.type || 'unknown');
          return;
        }

        const replyText = getEchoText_(event.message);
        replyMessage_(event.replyToken, replyText);
      } catch (innerErr) {
        Logger.log('Event handling failed: %s', innerErr && innerErr.message ? innerErr.message : innerErr);
      }
    });
  } catch (err) {
    Logger.log('doPost failed: %s', err && err.stack ? err.stack : err);
  }

  return ContentService.createTextOutput('ok');
}

function getEchoText_(message) {
  if (message.type === 'text') {
    return message.text || '';
  }

  return '收到你的訊息：' + message.type;
}

function replyMessage_(replyToken, text) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: [
      {
        type: 'text',
        text: text
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: {
      Authorization: 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log('LINE reply status=%s body=%s', statusCode, responseBody);

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('LINE reply failed. status=' + statusCode + ', body=' + responseBody);
  }
}

function testLineToken_() {
  const url = 'https://api.line.me/v2/bot/info';
  const options = {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log('LINE token test status=%s body=%s', statusCode, responseBody);

  return responseBody;
}
