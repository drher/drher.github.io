const MODEL_ALIASES = {
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20': 'gemini-2.5-flash',
  'gemini-2.0-flash': 'gemini-2.0-flash'
};

function resolveModel(value) {
  if (typeof value !== 'string') {
    return 'gemini-2.0-flash';
  }

  return MODEL_ALIASES[value] || 'gemini-2.0-flash';
}

function withCors(headers = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...headers
  };
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: withCors({ 'Content-Type': 'application/json; charset=utf-8' }),
    body: JSON.stringify(payload)
  };
}

function sendNodeResponse(res, response) {
  Object.entries(response.headers).forEach(([key, value]) => res.setHeader(key, value));
  res.status(response.statusCode).send(response.body);
}

function normalizeContents(contents) {
  if (!Array.isArray(contents)) {
    return [];
  }

  return contents
    .map((item) => {
      const role = item && item.role === 'user' ? 'user' : 'model';
      const text = item && item.parts && item.parts[0] && typeof item.parts[0].text === 'string'
        ? item.parts[0].text
        : '';

      if (!text.trim()) {
        return null;
      }

      return {
        role,
        parts: [{ text }]
      };
    })
    .filter(Boolean)
    .slice(-40);
}

function extractText(data) {
  const candidate = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
  const parts = candidate && candidate.content && Array.isArray(candidate.content.parts)
    ? candidate.content.parts
    : [];

  return parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

async function handlePost(reqBody) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return jsonResponse(500, {
      error: {
        message: '伺服器尚未設定 GEMINI_API_KEY。'
      }
    });
  }

  const model = resolveModel(reqBody.model);
  const contents = normalizeContents(reqBody.contents);

  if (!contents.length) {
    return jsonResponse(400, {
      error: {
        message: '缺少有效的對話內容。'
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 2048
        },
        systemInstruction: reqBody.systemInstruction
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data && data.error && data.error.message
      ? data.error.message
      : 'Gemini 服務回傳錯誤。';

    return jsonResponse(response.status, {
      error: {
        message,
        status: response.status
      }
    });
  }

  const text = extractText(data);

  if (!text) {
    return jsonResponse(502, {
      error: {
        message: '模型沒有回傳可顯示的文字內容。'
      }
    });
  }

  return jsonResponse(200, {
    text,
    model
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    const headers = withCors();
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    sendNodeResponse(
      res,
      jsonResponse(200, {
        ok: true,
        service: 'gemini-proxy',
        message: 'API 可用，請以 POST 呼叫此端點。',
        accepts: ['POST'],
        hasApiKey: Boolean(process.env.GEMINI_API_KEY)
      })
    );
    return;
  }

  if (req.method !== 'POST') {
    const response = jsonResponse(405, {
      error: {
        message: '僅支援 POST。若你在瀏覽器直接開啟此網址，請改用前端頁面送出 POST。'
      }
    });
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    sendNodeResponse(res, response);
    return;
  }

  try {
    let reqBody = req.body;
    if (typeof reqBody === 'string') {
      try {
        reqBody = JSON.parse(reqBody);
      } catch (error) {
        reqBody = {};
      }
    }

    const response = await handlePost(reqBody || {});
    sendNodeResponse(res, response);
  } catch (error) {
    const fallback = jsonResponse(500, {
      error: {
        message: error instanceof Error ? error.message : '伺服器發生未預期錯誤。'
      }
    });

    sendNodeResponse(res, fallback);
  }
}
