// Google Apps Script for Cloud Notepad - 完整版（前後端整合）
// 此 GAS 程式完整實現雲端記事本功能

// 雲端資料夾 ID
const FOLDER_ID = '181DHXaslc6lOcRtz2ohfzQw864Zglppd';

/**
 * 主要執行函數 - 返回 HTML 頁面（前端介面）
 */
function doGet(e) {
  const action = e.parameter ? e.parameter.action : null;
  
  // 如果是 API 調用，處理後端邏輯
  if (action) {
    const filename = e.parameter.filename;
    const content = e.parameter.content;
    
    let result = {};
    
    switch (action) {
      case 'readFile':
        result = readFile(filename);
        break;
      case 'writeFile':
        result = writeFile(filename, content);
        break;
      case 'fileExists':
        result = fileExists(filename);
        break;
      case 'createFile':
        result = createFile(filename);
        break;
      default:
        result = { success: false, message: '未知的操作' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 否則，返回 HTML 頁面
  const html = getHtmlTemplate();
  return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.EMULATED);
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
  return doGet(e);
}

/**
 * 讀取指定檔案的內容
 * @param {string} filename - 檔案名稱（例：記事本.txt）
 * @returns {Object} { success: boolean, content: string, message: string }
 */
function readFile(filename) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFilesByName(filename);
    
    if (!files.hasNext()) {
      // 檔案不存在，創建新檔案
      return createFile(filename);
    }
    
    // 如果有多個同名檔案，選擇最新修改的
    let latestFile = null;
    let latestTime = new Date(0);
    
    while (files.hasNext()) {
      const file = files.next();
      const fileTime = file.getLastUpdated();
      if (fileTime > latestTime) {
        latestTime = fileTime;
        latestFile = file;
      }
    }
    
    if (!latestFile) {
      return createFile(filename);
    }
    
    const content = latestFile.getBlob().getDataAsString('UTF-8');
    
    return {
      success: true,
      content: content,
      filename: filename,
      lastModified: latestFile.getLastUpdated().toISOString()
    };
  } catch (error) {
    Logger.log('readFile 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'readFile 失敗: ' + error.toString(),
      content: ''
    };
  }
}

/**
 * 寫入內容到指定檔案
 * @param {string} filename - 檔案名稱
 * @param {string} content - 要寫入的內容
 * @returns {Object} { success: boolean, message: string }
 */
function writeFile(filename, content) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFilesByName(filename);
    
    let file;
    
    // 清理重複檔案
    if (files.hasNext()) {
      file = files.next();
      
      // 將其他同名檔案移到回收站
      while (files.hasNext()) {
        const duplicateFile = files.next();
        duplicateFile.setTrashed(true);
      }
      
      // 直接更新檔案內容而非刪除重建
      file.setContent(content);
    } else {
      // 檔案不存在，創建新檔案
      file = folder.createFile(filename, content, MimeType.PLAIN_TEXT);
    }
    
    return {
      success: true,
      message: '檔案已保存',
      filename: filename,
      size: file.getSize(),
      lastModified: file.getLastUpdated().toISOString()
    };
  } catch (error) {
    Logger.log('writeFile 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'writeFile 失敗: ' + error.toString()
    };
  }
}

/**
 * 檢查檔案是否存在
 * @param {string} filename - 檔案名稱
 * @returns {Object} { success: boolean, exists: boolean }
 */
function fileExists(filename) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFilesByName(filename);
    
    return {
      success: true,
      exists: files.hasNext()
    };
  } catch (error) {
    Logger.log('fileExists 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'fileExists 失敗: ' + error.toString(),
      exists: false
    };
  }
}

/**
 * 創建新檔案
 * @param {string} filename - 檔案名稱
 * @returns {Object} { success: boolean, content: string, message: string }
 */
function createFile(filename) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(filename, '', MimeType.PLAIN_TEXT);
    
    return {
      success: true,
      content: '',
      filename: filename,
      message: '檔案已創建',
      created: true,
      lastModified: file.getLastUpdated().toISOString()
    };
  } catch (error) {
    Logger.log('createFile 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'createFile 失敗: ' + error.toString(),
      content: ''
    };
  }
}

/**
 * 列出資料夾中的所有 .txt 檔案
 * @returns {Object} { success: boolean, files: Array }
 */
function listFiles() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFiles();
    const fileList = [];
    
    while (files.hasNext()) {
      const file = files.next();
      fileList.push({
        name: file.getName(),
        size: file.getSize(),
        lastModified: file.getLastUpdated().toISOString()
      });
    }
    
    return {
      success: true,
      files: fileList,
      count: fileList.length
    };
  } catch (error) {
    Logger.log('listFiles 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'listFiles 失敗: ' + error.toString(),
      files: []
    };
  }
}

/**
 * 刪除指定檔案
 * @param {string} filename - 要刪除的檔案名稱
 * @returns {Object} { success: boolean, message: string }
 */
function deleteFile(filename) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFilesByName(filename);
    
    if (!files.hasNext()) {
      return {
        success: false,
        message: '檔案不存在'
      };
    }
    
    const file = files.next();
    file.setTrashed(true);
    
    return {
      success: true,
      message: '檔案已刪除'
    };
  } catch (error) {
    Logger.log('deleteFile 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'deleteFile 失敗: ' + error.toString()
    };
  }
}

/**
 * 測試函數 - 驗證連接是否正常
 * @returns {Object} { success: boolean, folder: string, folderName: string }
 */
function testConnection() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    return {
      success: true,
      folder: FOLDER_ID,
      folderName: folder.getName(),
      message: '連接成功'
    };
  } catch (error) {
    Logger.log('testConnection 錯誤: ' + error.toString());
    return {
      success: false,
      message: 'testConnection 失敗: ' + error.toString()
    };
  }
}

/**
 * 返回 HTML 範本 - 前端介面
 */
function getHtmlTemplate() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>雲端記事本</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: '微軟正黑體', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 900px;
            display: flex;
            flex-direction: column;
            height: 80vh;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }
        
        .header-info {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .status {
            font-size: 14px;
            padding: 5px 12px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse 2s infinite;
        }
        
        .status-indicator.unsaved {
            background: #fbbf24;
            animation: pulse-warn 1s infinite;
        }
        
        .status-indicator.error {
            background: #ef4444;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes pulse-warn {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 20px;
        }
        
        .editor-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .filename {
            font-size: 12px;
            color: #666;
            font-weight: 600;
        }
        
        .editor {
            flex: 1;
            padding: 15px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.6;
            resize: none;
            outline: none;
            transition: border-color 0.3s;
        }
        
        .editor:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
            border-radius: 0 0 12px 12px;
        }
        
        .info-text {
            font-size: 13px;
            color: #666;
        }
        
        .save-btn {
            padding: 10px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .save-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .save-btn:active {
            transform: translateY(0);
        }
        
        .save-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .loading {
            display: none;
            font-size: 13px;
            color: #667eea;
            font-weight: 600;
        }
        
        .loading.show {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>☁️ 雲端記事本</h1>
            <div class="header-info">
                <div class="status">
                    <div class="status-indicator" id="statusIndicator"></div>
                    <span id="statusText">已就緒</span>
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="editor-wrapper">
                <div class="filename">📄 記事本.txt</div>
                <textarea id="editor" class="editor" placeholder="開始輸入您的筆記..."></textarea>
            </div>
        </div>
        
        <div class="footer">
            <div>
                <div class="info-text" id="infoText">載入中...</div>
                <div class="loading" id="loadingText">正在保存...</div>
            </div>
            <button class="save-btn" id="saveBtn" onclick="saveNote()">💾 Save</button>
        </div>
    </div>

    <script>
        const editor = document.getElementById('editor');
        const saveBtn = document.getElementById('saveBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const infoText = document.getElementById('infoText');
        const loadingText = document.getElementById('loadingText');
        
        let isModified = false;
        let isLoading = false;
        
        // 監聽編輯內容變更
        editor.addEventListener('input', () => {
            isModified = true;
            updateStatus('unsaved', '未保存');
        });
        
        // 初始化：載入記事本.txt 內容
        async function initializeNote() {
            try {
                updateStatus('loading', '載入中...');
                const result = await callGAS('readFile', { filename: '記事本.txt' });
                
                if (result.success) {
                    editor.value = result.content || '';
                    isModified = false;
                    updateStatus('saved', '已就緒');
                    
                    if (result.lastModified) {
                        infoText.textContent = '最後修改時間：' + new Date(result.lastModified).toLocaleString('zh-TW');
                    } else {
                        infoText.textContent = '✨ 已自動創建新檔案';
                    }
                } else {
                    throw new Error(result.message || '載入失敗');
                }
            } catch (error) {
                console.error('初始化失敗:', error);
                updateStatus('error', '載入失敗');
                infoText.textContent = '❌ ' + error.message;
            }
        }
        
        // 保存筆記
        async function saveNote() {
            if (!isModified) {
                statusText.textContent = '沒有變更';
                return;
            }
            
            try {
                saveBtn.disabled = true;
                updateStatus('loading', '保存中...');
                loadingText.classList.add('show');
                
                const result = await callGAS('writeFile', {
                    filename: '記事本.txt',
                    content: editor.value
                });
                
                if (result.success) {
                    isModified = false;
                    updateStatus('saved', '已保存');
                    infoText.textContent = '最後修改時間：' + new Date().toLocaleString('zh-TW');
                    loadingText.classList.remove('show');
                    
                    // 3秒後恢復就緒狀態
                    setTimeout(() => {
                        if (!isModified) {
                            updateStatus('saved', '已就緒');
                        }
                    }, 3000);
                } else {
                    throw new Error(result.message || '保存失敗');
                }
            } catch (error) {
                console.error('保存失敗:', error);
                updateStatus('error', '保存失敗');
                infoText.textContent = '錯誤：' + error.message;
                loadingText.classList.remove('show');
            } finally {
                saveBtn.disabled = false;
            }
        }
        
        // 調用 GAS 函數（使用 google.script.run）
        function callGAS(functionName, params = {}) {
            return new Promise((resolve, reject) => {
                try {
                    if (functionName === 'readFile' || functionName === 'createFile' || functionName === 'fileExists') {
                        google.script.run
                            .withSuccessHandler(resolve)
                            .withFailureHandler(reject)
                            [functionName](params.filename);
                    } else if (functionName === 'writeFile') {
                        google.script.run
                            .withSuccessHandler(resolve)
                            .withFailureHandler(reject)
                            [functionName](params.filename, params.content);
                    } else {
                        reject(new Error('未知的函數：' + functionName));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }
        
        // 更新狀態指示器
        function updateStatus(status, text) {
            statusText.textContent = text;
            statusIndicator.className = 'status-indicator';
            
            if (status === 'saved') {
                statusIndicator.classList.remove('unsaved', 'error');
            } else if (status === 'unsaved') {
                statusIndicator.classList.add('unsaved');
            } else if (status === 'error') {
                statusIndicator.classList.add('error');
            } else if (status === 'loading') {
                statusIndicator.classList.remove('unsaved', 'error');
            }
        }
        
        // 快速鍵支持
        document.addEventListener('keydown', (e) => {
            // Ctrl+S 或 Cmd+S 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveNote();
            }
        });
        
        // 頁面載入時初始化
        window.addEventListener('load', initializeNote);
    </script>
</body>
</html>`;
}
