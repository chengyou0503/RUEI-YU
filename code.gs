// =========================================================================
//         瑞宇水電 - 後端邏輯 (v12.0) - [新增照片資料夾連結功能]
// =========================================================================

// =========================
//      主要 Web App 介面
// =========================

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  let data;
  switch(action) {
    case 'getRequests': data = getRequests(); break;
    case 'getReturns': data = getReturns(); break;
    case 'getUsers': data = getUsers(); break;
    case 'getProjects': data = getProjects(); break;
    case 'getItems': data = getItems(); break;
    case 'getWorkLogs': data = getWorkLogs(); break;
    default: data = { status: 'error', message: '無效的 GET action' };
  }
  if (callback) return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const payload = contents.payload;
    
    let response;
    switch(action) {
      case 'submitRequest': response = submitRequest(payload); break;
      case 'updateStatus': response = updateStatus(payload); break;
      case 'updateItemStatus': response = updateItemStatus(payload); break;
      case 'submitReturnRequest': response = submitReturnRequest(payload); break;
      case 'updateReturnStatus': response = updateReturnStatus(payload); break;
      case 'updateReturnItemStatus': response = updateReturnItemStatus(payload); break;
      case 'submitWorkLog': response = submitWorkLog(payload); break;
      case 'uploadImage': response = uploadImage(payload); break;
      default: response = createJsonResponse({ status: 'error', message: '無效的 POST action' });
    }
    return response;
  } catch (error) {
    Logger.log('POST Error: ' + error.toString() + ' | Request Data: ' + (e.postData ? e.postData.contents : JSON.stringify(e.parameter)));
    return createJsonResponse({ status: 'error', message: 'POST 請求處理失敗: ' + error.toString() });
  }
}

// =========================
//      GET 動作 (資料讀取)
// =========================

function getRequests() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const values = sheet.getDataRange().getDisplayValues();
    values.shift(); 
    if (values.length === 0) return [];
    const requestsById = values.reduce((acc, row) => {
      const id = row[0];
      if (!id) return acc;
      const item = { 
        category: row[9], 
        subcategory: row[10], 
        thickness: row[11], 
        size: row[12], 
        quantity: row[13], 
        unit: row[14], 
        status: row[15] || '待處理' 
      };
      if (!acc[id]) acc[id] = { id: id, timestamp: row[1], project: row[2], deliveryAddress: row[3], deliveryDate: row[4], user: row[5], userPhone: row[6], recipientName: row[7], recipientPhone: row[8], items: [] };
      acc[id].items.push(item);
      return acc;
    }, {});
    return Object.values(requestsById).sort((a, b) => b.id - a.id);
  } catch (error) { Logger.log('getRequests Error: ' + error.toString()); return { status: 'error', message: '讀取請購單資料時發生錯誤: ' + error.toString() }; }
}

function getReturns() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("退貨單");
    const values = sheet.getDataRange().getDisplayValues();
    values.shift();
    if (values.length === 0) return [];
    const returnsById = values.reduce((acc, row) => {
      const id = row[0];
      if (!id) return acc;
      const item = { name: row[4], quantity: row[5], reason: row[6] || '', status: row[7] || '待處理' };
      if (!acc[id]) acc[id] = { id: id, timestamp: row[1], project: row[2], user: row[3], items: [] };
      acc[id].items.push(item);
      return acc;
    }, {});
    return Object.values(returnsById).sort((a, b) => b.id - a.id);
  } catch (error) { Logger.log('getReturns Error: ' + error.toString()); return { status: 'error', message: '讀取退貨單資料時發生錯誤: ' + error.toString() }; }
}

function getWorkLogs() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("工作日誌");
    const values = sheet.getDataRange().getDisplayValues();
    values.shift(); 
    if (values.length === 0) return [];
    const logs = values.map(row => ({
      id: row[0],
      timestamp: row[1],
      date: row[2],
      user: row[3],
      project: row[4],
      timeSlot: row[5],
      distinction: row[6],
      floor: row[7],
      term: row[8],
      engineeringItem: row[9],
      isCompleted: row[10],
      content: row[11],
      photoUrls: row[12] ? row[12].split(',').map(url => url.trim()) : [],
      folderUrl: row[13] || ''
    }));
    return logs.sort((a, b) => b.id - a.id);
  } catch (error) {
    Logger.log('getWorkLogs Error: ' + error.toString());
    return { status: 'error', message: '讀取工作日誌資料時發生錯誤: ' + error.toString() };
  }
}

function getUsers() { 
  return getSheetData("使用者", (row) => ({
    applicant: row[0],
    applicantPhone: row[1],
    recipient: row[2],
    recipientPhone: row[3]
  })); 
}

function getProjects() { 
  return getSheetData("專案", (row) => ({
    projectName: row[0],
    term: row[1],
    engineeringItem: row[2]
  })); 
}

function getItems() { return getSheetData("品項", (row) => ({ category: row[0], subcategory: row[1], imageUrl: row[2], thickness: row[3], size: row[4], unit: row[5] })); }

// =========================
//      POST 動作 (資料寫入/更新)
// =========================

function submitRequest(payload) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    const newId = getNextId(sheet);
    const timestamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
    const newRows = payload.items.map(item => {
      const userPhone = `'${payload.userPhone}`;
      const recipientPhone = `'${payload.recipientPhone}`;
      return [ newId, timestamp, payload.project, payload.deliveryAddress, payload.deliveryDate, payload.user, userPhone, payload.recipientName, recipientPhone, item.category, item.subcategory, item.thickness, item.size, item.quantity, item.unit, "待處理" ];
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    lock.releaseLock();
    return createJsonResponse({ status: 'success', message: '請購單已成功送出', id: newId });
  } catch (error) { Logger.log('submitRequest Error: ' + error.toString()); return createJsonResponse({ status: 'error', message: '提交失敗: ' + error.toString() }); }
}

function submitReturnRequest(payload) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("退貨單");
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    const newId = getNextId(sheet);
    const timestamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
    const newRows = payload.returnCart.map(item => {
      return [ newId, timestamp, payload.project, payload.user, item.name, item.quantity, item.reason || '', '待處理' ];
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    lock.releaseLock();
    return createJsonResponse({ status: 'success', message: '退貨單已成功送出', id: newId });
  } catch (error) { Logger.log('submitReturnRequest Error: ' + error.toString()); return createJsonResponse({ status: 'error', message: '提交退貨申請失敗: ' + error.toString() }); }
}

function submitWorkLog(payload) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("工作日誌");
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    
    const newId = getNextId(sheet);
    const timestamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
    
    const newRow = [
      newId,
      timestamp,
      payload.date,
      payload.user,
      payload.project,
      payload.timeSlot,
      payload.distinction,
      payload.floor,
      payload.term,
      payload.engineeringItem || '',
      payload.isCompleted,
      payload.content,
      payload.photoUrls ? payload.photoUrls.join(', ') : '',
      payload.folderUrl || ''
    ];
    
    sheet.appendRow(newRow);
    
    lock.releaseLock();
    return createJsonResponse({ status: 'success', message: '工作日誌已成功送出', id: newId });
  } catch (error) {
    Logger.log('submitWorkLog Error: ' + error.toString());
    return createJsonResponse({ status: 'error', message: '提交工作日誌失敗: ' + error.toString() });
  }
}

function uploadImage(payload) {
  try {
    const { fileData, fileName, date } = payload;
    const decodedData = Utilities.base64Decode(fileData.split(',')[1]);
    const blob = Utilities.newBlob(decodedData, MimeType.JPEG, fileName);

    const rootFolderId = "1i3mr6IRKwxJcp-qOV3Y9MUmmUTxbqiC3";
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const dateFolder = getOrCreateFolder(rootFolder, date);

    const file = dateFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return createJsonResponse({ 
      status: 'success', 
      url: file.getUrl(),
      folderUrl: dateFolder.getUrl()
    });
  } catch (error) {
    Logger.log('uploadImage Error: ' + error.toString());
    return createJsonResponse({ status: 'error', message: '圖片上傳失敗: ' + error.toString() });
  }
}

function updateStatus(payload) {
  try {
    const { id, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const data = sheet.getDataRange().getValues();
    const statusColumn = 16; // P 欄
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, statusColumn).setValue(newStatus);
        updated = true;
      }
    }
    if (updated) return createJsonResponse({ status: 'success' });
    return createJsonResponse({ status: 'error', message: `找不到訂單 ID: ${id}` });
  } catch (error) { Logger.log('updateStatus Error: ' + error.toString()); return createJsonResponse({ status: 'error', message: '更新訂單狀態失敗: ' + error.toString() }); }
}

function updateItemStatus(payload) {
  try {
    const { orderId, itemName, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const data = sheet.getDataRange().getValues();
    const idCol = 0, nameCol = 10, statusCol = 16;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] == orderId && data[i][nameCol] == itemName) {
        sheet.getRange(i + 1, statusCol).setValue(newStatus);
        return createJsonResponse({ status: 'success' });
      }
    }
    return createJsonResponse({ status: 'error', message: `在訂單 ${orderId} 中找不到品項: ${itemName}` });
  } catch (error) { Logger.log('updateItemStatus Error: ' + error.toString()); return createJsonResponse({ status: 'error', message: '更新品項狀態失敗: ' + error.toString() }); }
}

function updateReturnStatus(payload) {
  try {
    const { id, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("退貨單");
    const data = sheet.getDataRange().getValues();
    const statusColumn = 8; // H 欄
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, statusColumn).setValue(newStatus);
        updated = true;
      }
    }
    if (updated) return createJsonResponse({ status: 'success' });
    return createJsonResponse({ status: 'error', message: `找不到退貨單 ID: ${id}` });
  } catch (error) { Logger.log('updateReturnStatus Error: ' + error.toString()); return createJsonResponse({ status: 'error', message: '更新退貨單狀態失敗: ' + error.toString() }); }
}

function updateReturnItemStatus(payload) {
  try {
    const { returnId, itemName, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("退貨單");
    const data = sheet.getDataRange().getValues();
    const idCol = 0, nameCol = 4, statusCol = 7; 
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] == returnId && data[i][nameCol] == itemName) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        return createJsonResponse({ status: 'success' });
      }
    }
    return createJsonResponse({ status: 'error', message: `在退貨單 ${returnId} 中找不到品項: ${itemName}` });
  } catch (error) {
    Logger.log('updateReturnItemStatus Error: ' + error.toString());
    return createJsonResponse({ status: 'error', message: '更新退貨品項狀態失敗: ' + error.toString() });
  }
}

// =========================
//      輔助函式
// =========================
function getSheetData(sheetName, rowMapping) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getDisplayValues();
    values.shift();
    return values.filter(row => row && row[0] && row[0].trim() !== "").map(rowMapping);
  } catch (error) { Logger.log(`getSheetData Error (${sheetName}): ` + error.toString()); return { status: 'error', message: `讀取 '${sheetName}' 資料表時發生錯誤: ` + error.toString() }; }
}

function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

function createJsonResponse(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function getNextId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return 1;
  const aColValues = sheet.getRange("A1:A" + lastRow).getValues().flat().filter(String);
  if (aColValues.length <= 1) return 1;
  const lastId = aColValues[aColValues.length - 1];
  return !isNaN(parseInt(lastId)) ? parseInt(lastId) + 1 : 1;
}

