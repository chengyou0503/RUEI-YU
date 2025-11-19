function doGet(e) {
  // logToSheet('doGet', { message: "函式被呼叫", eventObject: e });
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
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .withHeaders({'X-Frame-Options': 'SAMEORIGIN', 'Access-Control-Allow-Origin': '*'});
    }
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({'X-Frame-Options': 'SAMEORIGIN', 'Access-Control-Allow-Origin': '*'});
  } catch (error) {
    // logToSheet('doGet CATCH', { error: error.toString(), stack: error.stack });
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'doGet 處理失敗: ' + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({'X-Frame-Options': 'SAMEORIGIN', 'Access-Control-Allow-Origin': '*'});
  }
}

function doPost(e) {
  // logToSheet('doPost', { message: "函式被呼叫", eventObject: e });
  try {
    // 從 e.parameter 讀取 action 和 payload
    const action = e.parameter.action;
    const payload = JSON.parse(e.parameter.payload);
    
    switch(action) {
      // **新增：透過 POST 獲取資料的路由**
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
      case 'uploadImage': return uploadImage(payload);
      default: return createJsonResponse({ status: 'error', message: '無效的 POST action' });
    }
  } catch (error) {
    // logToSheet('doPost CATCH', { error: error.toString(), stack: error.stack, postData: e.postData ? e.postData.contents : null, parameter: e.parameter });
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
        category: row[10], 
        subcategory: row[11], 
        thickness: row[12], 
        size: row[13], 
        quantity: row[14], 
        unit: row[15], 
        status: row[16] || '待處理' 
      };
      if (!acc[id]) acc[id] = { id: id, timestamp: row[1], project: row[2], term: row[3], deliveryAddress: row[4], deliveryDate: row[5], user: row[6], userPhone: row[7], recipientName: row[8], recipientPhone: row[9], items: [] };
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
    
    // 新增過濾條件：只處理第一欄（ID）不為空的資料列
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
    address: row[3] // 新增地址欄位 (D欄)
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
      return [ newId, timestamp, payload.project, payload.term, payload.deliveryAddress, payload.deliveryDate, payload.user, userPhone, payload.recipientName, recipientPhone, item.category, item.subcategory, item.thickness, item.size, item.quantity, item.unit, "待處理" ];
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
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
    // logToSheet('submitWorkLog CATCH', { error: error.toString(), stack: error.stack, payload: payload });
    return createJsonResponse({ status: 'error', message: '提交工作日誌失敗: ' + error.toString() });
  }
}

function uploadImage(payload) {
  try {
    // 新增 project 參數
    const { fileData, fileName, date, project } = payload;
    if (!project) {
      throw new Error("缺少必要的 'project' 參數。");
    }

    const decodedData = Utilities.base64Decode(fileData.split(',')[1]);
    const blob = Utilities.newBlob(decodedData, MimeType.JPEG, fileName);

    const rootFolderId = "1i3mr6IRKwxJcp-qOV3Y9MUmmUTxbqiC3";
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    
    // 第一層：案場資料夾
    const projectFolder = getOrCreateFolder(rootFolder, project);
    // 第二層：日期資料夾
    const dateFolder = getOrCreateFolder(projectFolder, date);

    const file = dateFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return createJsonResponse({ 
      status: 'success', 
      url: file.getUrl(),
      folderUrl: dateFolder.getUrl() // 維持回傳最內層資料夾的 URL
    });
  } catch (error) {
    // logToSheet('uploadImage CATCH', { error: error.toString(), stack: error.stack });
    return createJsonResponse({ status: 'error', message: '圖片上傳失敗: ' + error.toString() });
  }
}

function updateStatus(payload) {
  try {
    const { id, newStatus } = payload;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const data = sheet.getDataRange().getValues();
    const idCol = 0;         // A 欄
    const statusCol = 16;    // Q 欄 (品項狀態) - 因新增期數而後移
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] == id) {
        // 更新儲存格時，使用 1-based 索引
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
  // 在函式開頭就記錄傳入的 payload，以便偵錯
  // logToSheet('updateItemStatus Start', { message: "函式開始執行", payload: payload });
  try {
    const { orderId, itemName, newStatus, thickness, size } = payload; // 新增 thickness 和 size
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("請購單");
    const data = sheet.getDataRange().getValues();
    
    const idCol = 0;         // A 欄
    const nameCol = 10;        // K 欄 (小分類)
    const thicknessCol = 11;   // L 欄 (厚度)
    const sizeCol = 12;        // M 欄 (尺寸)
    const statusCol = 16;      // Q 欄 (品項狀態) - 因新增期數而後移

    let updated = false; // 用於追蹤是否成功更新

    for (let i = 1; i < data.length; i++) {
      // 防禦性程式設計：移除字串前後可能存在的空格再進行比對
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
        // 找到唯一匹配的品項後，立即跳出迴圈
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
    const statusColumn = 8; // H 欄
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
      // **新增 .trim() 來移除空格**
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

// 新增：偵錯日誌函式
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
    // 如果連寫入日誌都失敗，就在內建日誌中記錄
    Logger.log(`無法寫入偵錯日誌工作表: ${e.toString()}`);
    Logger.log(`原始日誌內容: ${functionName} - ${JSON.stringify(details)}`);
  }
}
