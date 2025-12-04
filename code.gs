function doGet(e) {
  // // logToSheet('doGet', { message: "函式被呼叫", eventObject: e });
  try {
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
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // logToSheet('doGet CATCH', { error: error.toString(), stack: error.stack });
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'doGet 處理失敗: ' + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // // logToSheet('doPost', { message: "函式被呼叫", eventObject: e });
  try {
    const action = e.parameter.action;
    const payload = JSON.parse(e.parameter.payload);
    
    switch(action) {
      case 'getData':
        const subAction = payload.sub_action;
        let data;
        switch(subAction) {
          case 'getRequests': data = getRequests(); break;
          case 'getReturns': data = getReturns(); break;
          case 'getUsers': data = getUsers(); break;
          case 'getProjects': data = getProjects(); break;
          case 'getItems': data = getItems(); break;
          case 'getWorkLogs': data = getWorkLogs(); break;
          default: data = { status: 'error', message: '無效的 getData sub_action' };
        }
        return createJsonResponse(data);

      case 'submitRequest': return submitRequest(payload);
      case 'updateStatus': return updateStatus(payload);
      case 'updateItemStatus': return updateItemStatus(payload);
      case 'submitReturnRequest': return submitReturnRequest(payload);
      case 'updateReturnStatus': return updateReturnStatus(payload);
      case 'updateReturnItemStatus': return updateReturnItemStatus(payload);
      case 'submitWorkLog': return submitWorkLog(payload);
      case 'updateWorkLog': return updateWorkLog(payload);
      case 'uploadImage': return uploadImage(payload);
      case 'uploadImages': return uploadImages(payload);
      default: return createJsonResponse({ status: 'error', message: '無效的 POST action' });
    }
  } catch (error) {
    // logToSheet('doPost CATCH', { error: error.toString(), stack: error.stack, postData: e.postData ? e.postData.contents : null, parameter: e.parameter });
    return createJsonResponse({ status: 'error', message: 'POST 請求處理失敗: ' + error.toString() });
  }
}

function getRequests() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const values = sheet.getDataRange().getDisplayValues();
    values.shift(); 
    if (values.length === 0) return [];
    const requestsById = values.reduce((acc, row) => {
      const id = row[0];
      if (!id) return acc;
            // 根據 code1.gs 的最終定義，修正所有品項的索引
            const item = { 
              category: row[11],       // L 欄: 大分類
              subcategory: row[12],    // M 欄: 小分類
              thickness: row[13],      // N 欄: 厚度
              size: row[14],           // O 欄: 尺寸
              quantity: row[15],       // P 欄: 數量
              unit: row[16],           // Q 欄: 單位
              status: row[17] || '待處理' // R 欄: 品項狀態
            };      if (!acc[id]) {
        acc[id] = { 
          id: id,
          timestamp: row[1],
          project: row[2],
          term: row[3],
          engineeringItem: row[4],
          deliveryAddress: row[5],
          deliveryDate: row[6],
          user: row[7],
          userPhone: row[8],
          recipientName: row[9],
          recipientPhone: row[10],
          items: [] 
        };
      }
      acc[id].items.push(item);
      return acc;
    }, {});
    return Object.values(requestsById).sort((a, b) => b.id - a.id);
  } catch (error) { 
    // logToSheet('getRequests CATCH', { error: error.toString(), stack: error.stack });
    return { status: 'error', message: '讀取請購單資料時發生錯誤: ' + error.toString() }; 
  }
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
  } catch (error) { 
    // logToSheet('getReturns CATCH', { error: error.toString(), stack: error.stack });
    return { status: 'error', message: '讀取退貨單資料時發生錯誤: ' + error.toString() }; 
  }
}

function getWorkLogs() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("工作日誌");
    const values = sheet.getDataRange().getDisplayValues();
    values.shift(); 
    if (values.length === 0) return [];
    const filteredValues = values.filter(row => row[0] && row[0].toString().trim() !== '');
    const logs = filteredValues.map(row => ({
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
    // logToSheet('getWorkLogs CATCH', { error: error.toString(), stack: error.stack });
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
    engineeringItem: row[2],
    address: row[3]
  })); 
}

function getItems() { return getSheetData("品項", (row) => ({ category: row[0], subcategory: row[1], imageUrl: row[2], thickness: row[3], size: row[4], unit: row[5] })); }

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
      return [ newId, timestamp, payload.project, payload.term, payload.engineeringItem, payload.deliveryAddress, payload.deliveryDate, payload.user, userPhone, payload.recipientName, recipientPhone, item.category, item.subcategory, item.thickness, item.size, item.quantity, item.unit, "待處理" ];
    });
    const startRow = sheet.getLastRow() + 1;
    const newRange = sheet.getRange(startRow, 1, newRows.length, newRows[0].length);
    newRange.setValues(newRows);

    // 強制將尺寸欄位(O欄, 第15欄)的格式設為純文字
    sheet.getRange(startRow, 15, newRows.length, 1).setNumberFormat('@');

    lock.releaseLock();
    return createJsonResponse({ status: 'success', message: '請購單已成功送出', id: newId });
  } catch (error) { 
    // logToSheet('submitRequest CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '提交失敗: ' + error.toString() }); 
  }
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
  } catch (error) { 
    // logToSheet('submitReturnRequest CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '提交退貨申請失敗: ' + error.toString() }); 
  }
}

function submitWorkLog(payload) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("工作日誌");
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    
    // Check if payload is an array (batch submission) or single object
    const entries = Array.isArray(payload) ? payload : [payload];
    const newIds = [];

    entries.forEach(entry => {
        const newId = getNextId(sheet);
        const timestamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
        const newRow = [
          newId,
          timestamp,
          entry.date,
          entry.user,
          entry.project,
          entry.timeSlot,
          entry.distinction,
          entry.floor,
          entry.term,
          entry.engineeringItem || '',
          entry.isCompleted,
          entry.content,
          entry.photoUrls ? entry.photoUrls.join(', ') : '',
          entry.folderUrl || ''
        ];
        sheet.appendRow(newRow);
        newIds.push(newId);
    });

    lock.releaseLock();
    return createJsonResponse({ status: 'success', message: '工作日誌已成功送出', ids: newIds });
  } catch (error) {
    // logToSheet('submitWorkLog CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '提交工作日誌失敗: ' + error.toString() });
  }
}

function updateWorkLog(payload) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("工作日誌");
    const data = sheet.getDataRange().getValues();
    const idCol = 0;
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] == payload.id) {
        const row = i + 1;
        const updates = [
          [
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
          ]
        ];
        // Update columns C (3) to N (14) -> 12 columns
        sheet.getRange(row, 3, 1, 12).setValues(updates);
        updated = true;
        break;
      }
    }

    if (updated) {
      return createJsonResponse({ status: 'success', message: '工作日誌已成功更新' });
    } else {
      return createJsonResponse({ status: 'error', message: `找不到工作日誌 ID: ${payload.id}` });
    }
  } catch (error) {
    return createJsonResponse({ status: 'error', message: '更新工作日誌失敗: ' + error.toString() });
  }
}

function uploadImage(payload) {
  try {
    const { fileData, fileName, date, project } = payload;
    if (!project) {
      throw new Error("缺少必要的 'project' 參數。");
    }
    const decodedData = Utilities.base64Decode(fileData.split(',')[1]);
    const blob = Utilities.newBlob(decodedData, MimeType.JPEG, fileName);
    const rootFolderId = "1i3mr6IRKwxJcp-qOV3Y9MUmmUTxbqiC3";
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const projectFolder = getOrCreateFolder(rootFolder, project);
    const dateFolder = getOrCreateFolder(projectFolder, date);
    const file = dateFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return createJsonResponse({ 
      status: 'success', 
      url: file.getUrl(),
      folderUrl: dateFolder.getUrl()
    });
  } catch (error) {
    // logToSheet('uploadImage CATCH', { error: error.toString(), stack: error.stack });
    return createJsonResponse({ status: 'error', message: '圖片上傳失敗: ' + error.toString() });
  }
}

function uploadImages(payload) {
  try {
    const { files, date, project, term } = payload; // Added term
    if (!project) throw new Error("缺少必要的 'project' 參數。");
    if (!files || !Array.isArray(files) || files.length === 0) return createJsonResponse({ status: 'success', urls: [], folderUrl: '' });

    const rootFolderId = "1i3mr6IRKwxJcp-qOV3Y9MUmmUTxbqiC3";
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const projectFolder = getOrCreateFolder(rootFolder, project);
    
    // Use Term folder if provided, otherwise fallback to Date folder
    const targetFolderName = term ? term : date;
    const targetFolder = getOrCreateFolder(projectFolder, targetFolderName);
    
    const urls = [];
    
    files.forEach(file => {
        const decodedData = Utilities.base64Decode(file.fileData.split(',')[1]);
        const blob = Utilities.newBlob(decodedData, MimeType.JPEG, file.fileName);
        const driveFile = targetFolder.createFile(blob);
        driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        urls.push(driveFile.getUrl());
    });

    return createJsonResponse({ 
      status: 'success', 
      urls: urls,
      folderUrl: targetFolder.getUrl()
    });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: '批次圖片上傳失敗: ' + error.toString() });
  }
}

function updateStatus(payload) {
  // logToSheet('updateStatus Start', { message: "函式開始執行", payload: payload });
  try {
    const { id, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const data = sheet.getDataRange().getValues();
    const idCol = 0;
    const statusCol = 17;
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] == id) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        updated = true;
      }
    }
    if (updated) {
      return createJsonResponse({ status: 'success', message: '訂單狀態已成功更新' });
    } else {
      return createJsonResponse({ status: 'error', message: `找不到訂單 ID: ${id}` });
    }
  } catch (error) { 
    // logToSheet('updateStatus CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '更新訂單狀態失敗: ' + error.toString() }); 
  }
}

function updateItemStatus(payload) {
  // logToSheet('updateItemStatus Start', { message: "函式開始執行", payload: payload });
  try {
    const { orderId, itemName, newStatus, thickness, size } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const data = sheet.getDataRange().getValues();
    // 根據 code1.gs 的最終定義，修正所有比對用的索引
    const idCol = 0;         // A 欄
    const nameCol = 12;        // M 欄 (小分類)
    const thicknessCol = 13;   // N 欄 (厚度)
    const sizeCol = 14;        // O 欄 (尺寸)
    const statusCol = 17;      // R 欄 (品項狀態)
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      const sheetItemName = data[i][nameCol] ? data[i][nameCol].toString().trim() : '';
      const payloadItemName = itemName ? itemName.toString().trim() : '';
      const sheetThickness = data[i][thicknessCol] ? data[i][thicknessCol].toString().trim() : '';
      const payloadThickness = thickness ? thickness.toString().trim() : '';
      const sheetSize = data[i][sizeCol] ? data[i][sizeCol].toString().trim() : '';
      const payloadSize = size ? size.toString().trim() : '';
      if (data[i][idCol] == orderId && 
          sheetItemName == payloadItemName &&
          sheetThickness == payloadThickness &&
          sheetSize == payloadSize) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        updated = true;
        break; 
      }
    }
    if (updated) {
      // logToSheet('updateItemStatus Success', { message: "成功找到並更新品項", payload: payload });
      return createJsonResponse({ status: 'success', message: '品項狀態已成功更新' });
    } else {
      // logToSheet('updateItemStatus Failure', { 
      //   message: "找不到匹配的品項來更新", 
      //   payload: payload,
      //   sheetDataPreview: data.slice(1, 6)
      // });
      return createJsonResponse({ status: 'error', message: `在訂單 ${orderId} 中找不到品項: '${itemName}' (${thickness}, ${size})` });
    }
  } catch (error) { 
    // logToSheet('updateItemStatus CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '更新品項狀態失敗: ' + error.toString() }); 
  }
}

function updateReturnStatus(payload) {
  // logToSheet('updateReturnStatus Start', { message: "函式開始執行", payload: payload });
  try {
    const { id, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("退貨單");
    const data = sheet.getDataRange().getValues();
    const statusColumn = 8;
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.getRange(i + 1, statusColumn).setValue(newStatus);
        updated = true;
      }
    }
    if (updated) {
      // logToSheet('updateReturnStatus Success', { message: "成功找到並更新退貨單", payload: payload });
      return createJsonResponse({ status: 'success' });
    }
    // logToSheet('updateReturnStatus Failure', { message: `找不到退貨單 ID: ${id}`, payload: payload });
    return createJsonResponse({ status: 'error', message: `找不到退貨單 ID: ${id}` });
  } catch (error) { 
    // logToSheet('updateReturnStatus CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '更新退貨單狀態失敗: ' + error.toString() }); 
  }
}

function updateReturnItemStatus(payload) {
  try {
    const { returnId, itemName, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("退貨單");
    const data = sheet.getDataRange().getValues();
    const idCol = 0, nameCol = 4, statusCol = 7; 
    for (let i = 1; i < data.length; i++) {
      const sheetItemName = data[i][nameCol] ? data[i][nameCol].toString().trim() : '';
      const payloadItemName = itemName ? itemName.toString().trim() : '';
      if (data[i][idCol] == returnId && sheetItemName == payloadItemName) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        return createJsonResponse({ status: 'success' });
      }
    }
    return createJsonResponse({ status: 'error', message: `在退貨單 ${returnId} 中找不到品項: ${itemName}` });
  } catch (error) {
    // logToSheet('updateReturnItemStatus CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '更新退貨品項狀態失敗: ' + error.toString() });
  }
}

function getSheetData(sheetName, rowMapping) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getDisplayValues();
    values.shift();
    return values.filter(row => row && row[0] && row[0].trim() !== "").map(rowMapping);
  } catch (error) { 
    // logToSheet('getSheetData CATCH', { error: error.toString(), stack: error.stack, sheetName: sheetName });
    return { status: 'error', message: `讀取 '${sheetName}' 資料表時發生錯誤: ` + error.toString() }; 
  }
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

function logToSheet(functionName, details) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = spreadsheet.getSheetByName("偵錯日誌");
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet("偵錯日誌");
      logSheet.appendRow(["時間戳", "函式名稱", "詳細資訊"]);
      logSheet.setFrozenRows(1);
    }
    const timestamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
    const detailsString = JSON.stringify(details, null, 2);
    logSheet.appendRow([timestamp, functionName, detailsString]);
  } catch (e) {
    Logger.log(`無法寫入偵錯日誌工作表: ${e.toString()}`);
    Logger.log(`原始日誌內容: ${functionName} - ${JSON.stringify(details)}`);
  }
}
