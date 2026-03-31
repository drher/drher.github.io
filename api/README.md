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
