# Serverless Gemini API

這個資料夾提供一個 serverless 端點：`/api/gemini`。

## 需要的環境變數

- `GEMINI_API_KEY`: 你的 Google Gemini API Key

## 請求格式

`POST /api/gemini`

```json
{
  "model": "gemini-2.5-flash-preview-05-20",
  "contents": [
    { "role": "user", "parts": [{ "text": "你好" }] }
  ],
  "systemInstruction": {
    "parts": [{ "text": "你是一個助理" }]
  }
}
```

## 回應格式

```json
{
  "text": "模型回覆內容",
  "model": "gemini-2.5-flash-preview-05-20"
}
```

## 部署提醒

- 這個結構可直接用在 Vercel (根目錄含 `api/` 時會自動識別 Serverless Functions)。
- 若你仍使用 GitHub Pages 直接託管靜態頁，請把這個 `api/` 函式改部署到其他平台，然後在前端 Endpoint 填入該完整網址。

## 快速檢查

1. 先在你的 Serverless 平台設定環境變數 `GEMINI_API_KEY`。
2. 部署後，先用瀏覽器開啟 `https://你的後端網域/api/gemini`。
3. 若看到 JSON 且 `ok: true`，代表 API 路由可用。
4. 再回到聊天頁，把 Endpoint 設成 `https://你的後端網域/api/gemini`。

如果你前端放在 GitHub Pages，請勿使用相對路徑 `/api/gemini`，因為 GitHub Pages 只提供靜態託管，不會執行 Serverless 函式。
