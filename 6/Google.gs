const FOLDER_ID = '181DHXaslc6lOcRtz2ohfzQw864Zglppd';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  const fileId = e && e.parameter && e.parameter.fileId;

  try {
    if (action === 'list') {
      return jsonOutput({ ok: true, notes: listFiles_() });
    }

    if (action === 'load' && fileId) {
      return jsonOutput({ ok: true, ...loadFile_(fileId) });
    }

    return jsonOutput({ ok: false, error: 'Unsupported GET action.' });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const action = payload.action;

    if (action === 'saveAs') {
      return jsonOutput({ ok: true, ...saveAs_(payload) });
    }

    if (action === 'save') {
      return jsonOutput({ ok: true, ...save_(payload) });
    }

    if (action === 'delete') {
      return jsonOutput({ ok: true, ...deleteFile_(payload.fileId) });
    }

    return jsonOutput({ ok: false, error: 'Unsupported POST action.' });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function listFiles_() {
  const folder = getTargetFolder_();
  const files = folder.getFiles();
  const notes = [];

  while (files.hasNext()) {
    const file = files.next();
    notes.push({
      fileId: file.getId(),
      title: file.getName(),
      updatedAt: file.getLastUpdated().toISOString(),
      content: file.getMimeType() === MimeType.PLAIN_TEXT ? file.getBlob().getDataAsString() : ''
    });
  }

  notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return notes;
}

function loadFile_(fileId) {
  const file = DriveApp.getFileById(fileId);
  validateFolderAccess_(file);

  return {
    fileId: file.getId(),
    title: file.getName(),
    content: file.getBlob().getDataAsString(),
    updatedAt: file.getLastUpdated().toISOString()
  };
}

function save_(payload) {
  if (!payload.fileId) {
    return saveAs_(payload);
  }

  const file = DriveApp.getFileById(payload.fileId);
  validateFolderAccess_(file);
  file.setContent(payload.content || '');

  if (payload.title && payload.title !== file.getName()) {
    file.setName(payload.title);
  }

  return {
    fileId: file.getId(),
    title: file.getName(),
    updatedAt: file.getLastUpdated().toISOString(),
    message: 'Saved.'
  };
}

function saveAs_(payload) {
  const folder = getTargetFolder_();
  const title = normalizeTitle_(payload.title || 'untitled.txt');
  const file = folder.createFile(title, payload.content || '', MimeType.PLAIN_TEXT);

  return {
    fileId: file.getId(),
    title: file.getName(),
    updatedAt: file.getLastUpdated().toISOString(),
    message: 'Saved as new file.'
  };
}

function deleteFile_(fileId) {
  const file = DriveApp.getFileById(fileId);
  validateFolderAccess_(file);
  file.setTrashed(true);

  return {
    fileId: fileId,
    message: 'Deleted.'
  };
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return e && e.parameter ? e.parameter : {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Invalid JSON payload.');
  }
}

function getTargetFolder_() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function validateFolderAccess_(file) {
  const parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === FOLDER_ID) {
      return;
    }
  }
  throw new Error('The selected file is not inside the configured folder.');
}

function normalizeTitle_(title) {
  const clean = String(title || '').trim();
  if (!clean) {
    return 'untitled.txt';
  }
  return clean;
}

function jsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
