const FOLDER_ID = '181DHXaslc6lOcRtz2ohfzQw864Zglppd';
const DEFAULT_FILE_NAME = '記事本.txt';

function doGet() {
  ensureNoteFile_();

  const html = `
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>雲端記事本</title>
    <style>
      :root {
        --bg-1: #0a0f1f;
        --bg-2: #121b2f;
        --card: rgba(13, 18, 30, 0.86);
        --line: rgba(106, 146, 255, 0.35);
        --text: #f2f6ff;
        --muted: #9fb0cc;
        --brand: #4f7cff;
        --brand-2: #28d7b4;
        --warn: #ffbf4d;
        --ok: #67d68d;
        --error: #ff7e7e;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 15% 15%, rgba(40, 215, 180, 0.2) 0%, transparent 48%),
          radial-gradient(circle at 90% 0%, rgba(79, 124, 255, 0.3) 0%, transparent 40%),
          linear-gradient(150deg, var(--bg-1), var(--bg-2));
      }

      .shell {
        width: min(960px, calc(100vw - 24px));
        margin: 18px auto;
        border: 1px solid var(--line);
        border-radius: 18px;
        overflow: hidden;
        background: var(--card);
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(10px);
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(120deg, rgba(79, 124, 255, 0.88), rgba(40, 215, 180, 0.78));
      }

      .brand {
        margin: 0;
        font-size: 30px;
        letter-spacing: 1px;
        font-weight: 800;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 700;
        color: #08211b;
        background: rgba(234, 255, 249, 0.9);
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--warn);
      }

      .dot.saved {
        background: var(--ok);
      }

      .dot.error {
        background: var(--error);
      }

      .workspace {
        padding: 16px;
      }

      .file-line {
        color: var(--muted);
        margin-bottom: 12px;
        font-size: 15px;
      }

      textarea {
        width: 100%;
        min-height: 460px;
        border-radius: 12px;
        border: 2px solid rgba(79, 124, 255, 0.75);
        background: rgba(255, 255, 255, 0.08);
        color: #f8fbff;
        resize: vertical;
        outline: none;
        padding: 16px;
        font-size: 18px;
        line-height: 1.55;
      }

      textarea:focus {
        border-color: #79c4ff;
        box-shadow: 0 0 0 4px rgba(121, 196, 255, 0.22);
      }

      textarea::placeholder {
        color: rgba(197, 213, 240, 0.75);
      }

      .footer {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding: 14px 16px 16px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .meta {
        color: var(--muted);
        font-size: 15px;
      }

      .save-btn {
        border: 0;
        border-radius: 10px;
        background: linear-gradient(120deg, #4f7cff, #28d7b4);
        color: #04152d;
        font-size: 20px;
        font-weight: 900;
        cursor: pointer;
        padding: 10px 26px;
        min-width: 132px;
        transition: transform 0.2s ease, filter 0.2s ease;
      }

      .save-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.08);
      }

      .save-btn:disabled {
        cursor: wait;
        opacity: 0.6;
        transform: none;
      }

      @media (max-width: 640px) {
        .brand {
          font-size: 24px;
        }

        textarea {
          min-height: 360px;
          font-size: 16px;
        }

        .save-btn {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <h1 class="brand">☁ 雲端記事本</h1>
        <div class="status-pill" id="statusPill">
          <span class="dot" id="statusDot"></span>
          <span id="statusText">載入中</span>
        </div>
      </header>

      <section class="workspace">
        <div class="file-line" id="fileName">檔案：讀取中...</div>
        <textarea id="editor" placeholder="開始輸入您的筆記..." spellcheck="false"></textarea>
      </section>

      <footer class="footer">
        <div class="meta" id="updatedAt">最後修改時間：--</div>
        <button class="save-btn" id="saveBtn">Save</button>
      </footer>
    </main>

    <script>
      const editor = document.getElementById('editor');
      const saveBtn = document.getElementById('saveBtn');
      const statusText = document.getElementById('statusText');
      const statusDot = document.getElementById('statusDot');
      const fileName = document.getElementById('fileName');
      const updatedAt = document.getElementById('updatedAt');

      let hasUnsavedChanges = false;
      let isSaving = false;

      function setStatus(text, state) {
        statusText.textContent = text;
        statusDot.classList.remove('saved', 'error');

        if (state === 'saved') {
          statusDot.classList.add('saved');
        } else if (state === 'error') {
          statusDot.classList.add('error');
        }
      }

      function updateSaveState() {
        saveBtn.disabled = isSaving;

        if (isSaving) {
          setStatus('儲存中', 'loading');
          return;
        }

        if (hasUnsavedChanges) {
          setStatus('未儲存', 'unsaved');
        } else {
          setStatus('已同步', 'saved');
        }
      }

      function loadNote() {
        google.script.run
          .withSuccessHandler((result) => {
            editor.value = result.content || '';
            fileName.textContent = '檔案：' + result.fileName;
            updatedAt.textContent = '最後修改時間：' + result.lastModified;
            hasUnsavedChanges = false;
            updateSaveState();
            editor.focus();
          })
          .withFailureHandler((err) => {
            setStatus('載入失敗', 'error');
            updatedAt.textContent = '最後修改時間：讀取失敗';
            alert('載入失敗：' + (err && err.message ? err.message : err));
          })
          .getNoteData();
      }

      function saveNote() {
        if (isSaving) return;

        isSaving = true;
        updateSaveState();

        google.script.run
          .withSuccessHandler((result) => {
            hasUnsavedChanges = false;
            isSaving = false;
            updatedAt.textContent = '最後修改時間：' + result.lastModified;
            updateSaveState();
          })
          .withFailureHandler((err) => {
            isSaving = false;
            updateSaveState();
            setStatus('儲存失敗', 'error');
            alert('儲存失敗：' + (err && err.message ? err.message : err));
          })
          .saveNote(editor.value);
      }

      editor.addEventListener('input', () => {
        if (!hasUnsavedChanges) {
          hasUnsavedChanges = true;
          updateSaveState();
        }
      });

      saveBtn.addEventListener('click', saveNote);

      window.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          saveNote();
        }
      });

      loadNote();
    </script>
  </body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('雲端記事本')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getNoteData() {
  const file = ensureNoteFile_();
  const content = file.getBlob().getDataAsString('UTF-8');

  return {
    fileId: file.getId(),
    fileName: file.getName(),
    content: content,
    lastModified: formatDate_(file.getLastUpdated())
  };
}

function saveNote(content) {
  const file = ensureNoteFile_();
  file.setContent(typeof content === 'string' ? content : '');

  const refreshed = DriveApp.getFileById(file.getId());

  return {
    fileId: refreshed.getId(),
    fileName: refreshed.getName(),
    lastModified: formatDate_(refreshed.getLastUpdated())
  };
}

function ensureNoteFile_() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(DEFAULT_FILE_NAME);

  if (files.hasNext()) {
    return files.next();
  }

  return folder.createFile(DEFAULT_FILE_NAME, '', MimeType.PLAIN_TEXT);
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd a hh:mm:ss');
}
