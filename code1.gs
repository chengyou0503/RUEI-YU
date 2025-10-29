// =========================================================================
//         瑞宇水電 - 工作表初始化工具 (v1.2)
// =========================================================================

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('🛠️ 專案設定')
      .addItem('初始化/更新工作表', 'setupSpreadsheet')
      .addToUi();
}

function setupSpreadsheet() {
  const ui = SpreadsheetApp.getUi();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetsToSetup = {
    "請購單": ["單號", "時間", "專案名稱", "送貨地點", "送貨日期", "申請人", "申請人電話", "收件人", "收件人電話", "品項名稱", "數量", "單位", "品項狀態"],
    // **升級：支援多品項退貨**
    "退貨單": ["退貨單號", "時間", "專案名稱", "申請人", "品項名稱", "數量", "退貨原因", "狀態"],
    "使用者": ["姓名"],
    "專案": ["專案名稱"],
    "品項": ["大分類", "小分類", "圖片URL", "厚度", "尺寸", "單位"]
  };

  let createdCount = 0;
  let updatedCount = 0;

  for (const sheetName in sheetsToSetup) {
    const headers = sheetsToSetup[sheetName];
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setFontWeight("bold").setBackground("#e0e0e0");
      sheet.setFrozenRows(1);
      Logger.log(`已成功建立工作表: ${sheetName}`);
      createdCount++;
    } else {
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      const currentHeaders = headerRange.getValues()[0];
      if (JSON.stringify(currentHeaders) !== JSON.stringify(headers)) {
        headerRange.setValues([headers]);
        headerRange.setFontWeight("bold").setBackground("#e0e0e0");
        sheet.setFrozenRows(1);
        Logger.log(`已更新工作表 "${sheetName}" 的標頭。`);
        updatedCount++;
      }
    }
  }
  
  if (createdCount > 0 || updatedCount > 0) {
    ui.alert('設定完成', `成功建立了 ${createdCount} 個新工作表，並更新了 ${updatedCount} 個現有工作表的標頭。`, ui.ButtonSet.OK);
  } else {
    ui.alert('無需設定', '所有必要的工作表都已經存在且標頭已是最新。', ui.ButtonSet.OK);
  }
}