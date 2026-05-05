const FOLDER_ID = "181DHXaslc6lOcRtz2ohfzQw864Zglppd";
const FILE_NAME = "文件.txt";

function getOrCreateFile() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(FILE_NAME);
  if (files.hasNext()) return files.next();
  return folder.createFile(FILE_NAME, "", MimeType.PLAIN_TEXT);
}

function doGet(e) {
  const content = getOrCreateFile().getBlob().getDataAsString("UTF-8");
  return ContentService.createTextOutput(content)
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  getOrCreateFile().setContent(e.postData.contents);
  return ContentService.createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT);
}