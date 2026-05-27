// 安全起見，改從專案屬性讀取。若想先測試，也可以暫時換成新 Token 字串
const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN') || '你的新TOKEN';

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
        // 1. 檢查是否有 replyToken (大部份事件都有，除了 unfollow)
        if (!event.replyToken) {
          Logger.log('Skip event without replyToken. type=%s', event.type);
          return;
        }

        // 2. 根據事件類型處理
        if (event.type === 'message') {
          const replyText = getEchoText_(event.message);
          replyMessage_(event.replyToken, replyText);
        } else if (event.type === 'follow') {
          // 未來可以在這裡加：加好友的歡迎訊息
          replyMessage_(event.replyToken, '謝謝你加我為好友！');
        } else {
          Logger.log('Unhandled event type: %s', event.type);
        }

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
  return '收到你的訊息，類型是：' + message.type;
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

// 測試 Token 是否有效的工具
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
  Logger.log('LINE token test status=%s body=%s', response.getResponseCode(), response.getContentText());
  return response.getContentText();
}