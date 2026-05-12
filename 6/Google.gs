// Google Apps Script for Cloud Notepad
// 此 GAS 程式作為前端 index.html 的後端媒介

// 雲端資料夾 ID
const FOLDER_ID = '181DHXaslc6lOcRtz2ohfzQw864Zglppd';

/**
 * 主要執行函數 - 處理來自前端的請求
 * @param {Object} e - 來自 doGet/doPost 的 event 參數
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
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
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doGet 支持，允許 GET 請求
 */
function doGet(e) {
  return doPost(e);
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
