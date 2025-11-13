# 瑞宇水電 - 工作管理系統

這是一個為瑞宇水電客製化的內部工作管理系統，旨在簡化並數位化請購、退貨和工作日誌的流程。系統包含一個供員工使用的前端 App 和一個供管理者使用的後台 App。

## 專案概覽

本專案採用前後端分離的架構：

- **前端 (員工 App)**: 一個 React 單頁應用程式 (SPA)，讓員工可以在行動裝置或電腦上快速填寫請購單、退貨單與工作日誌。
- **管理後台 (後台 App)**: 一個 React 單頁應用程式，供管理人員審批請購單、退貨單，並查看所有工作日誌。
- **後端 (資料庫 & API)**: 使用 Google Apps Script (GAS) 搭配 Google Sheets 作為後端服務。GAS 負責處理所有資料的讀取、寫入和更新。**所有前端對資料的讀取和寫入請求，現在都統一透過 `doPost` 函式處理**，並以 Web App 的形式提供 API 給前後端呼叫。

---

## 技術棧

- **後端**:
  - [Google Apps Script](https://developers.google.com/apps-script) (JavaScript-based)
  - [Google Sheets](https://www.google.com/sheets/about/) (作為資料庫)
  - [Google Drive](https://www.google.com/drive/) (用於儲存工作日誌上傳的圖片)

- **前端 (員工 App & 後台 App)**:
  - [React](https://reactjs.org/)
  - [Material-UI (MUI)](https://mui.com/) (用於 UI 元件和響應式設計)
  - [GitHub Pages](https://pages.github.com/) (用於靜態網站託管)

- **CI/CD**:
  - [GitHub Actions](https://github.com/features/actions) (用於自動化建置與部署)

---

## 專案結構

```
.
├── .github/workflows/deploy.yml  # GitHub Actions 自動化部署設定檔
├── admin-app-react/              # 【新】React 管理後台原始碼
├── worker-app-react/             # React 員工 App 原始碼
├── code.gs                       # Google Apps Script 後端主程式
├── code1.gs                      # Google Apps Script 工作表初始化工具
└── README.md                     # 本文件
```

---

## 部署流程 (極度重要)

本專案的部署分為**後端**和**前端**兩部分，兩者是獨立的。

### **後端部署 (手動)**

後端 Google Apps Script (GAS) **必須手動部署**。當您修改了 `code.gs` 或 `code1.gs` 後，請嚴格遵循以下步驟：

1.  **複製程式碼**: 打開您本地的 `code.gs` 檔案，全選並複製所有內容。
2.  **貼到 GAS 編輯器**: 前往您的 [Google Apps Script 專案](https://script.google.com/home)，找到對應的專案，將剛剛複製的程式碼**完全覆蓋**掉雲端編輯器中的舊程式碼。
3.  **發布新版本**:
    - 在 GAS 編輯器頂部，點擊「**部署 (Deploy)**」。
    - 選擇「**新增部署作業 (New deployment)**」。
    - (重要) 在「選取類型」旁邊，點擊齒輪圖示，選擇「**網頁應用程式 (Web app)**」。
    - 填寫版本說明（例如："修正更新邏輯"）。
    - 點擊「**部署 (Deploy)**」。
4.  **取得新網址**: 部署成功後，GAS 會提供一個**新的網頁應用程式網址 (URL)**。**請務必複製這個新網址**。

### **前端部署 (半自動)**

前端的部署會在您將程式碼推送到 `master` 分支後由 GitHub Actions 自動完成。但如果後端部署產生了新的 URL，您需要先更新前端程式碼：

1.  **更新後端網址**:
    - 將您在上一步取得的**新 GAS 網址**，分別貼到以下兩個檔案中，替換掉舊的網址：
      - `worker-app-react/src/App.js` (找到 `SCRIPT_URL` 變數)
      - `admin-app-react/src/App.js` (找到 `APPS_SCRIPT_URL` 變數)
2.  **推送至 GitHub**:
    - 使用 `git add .`、`git commit` 和 `git push origin master` 將您的變更推送到 GitHub。
3.  **等待自動部署**: GitHub Actions 會自動被觸發，它會：
    - 分別建置 `worker-app-react` 和 `admin-app-react`。
    - 將建置好的靜態檔案部署到 `gh-pages` 分支。
    - 部署完成後，您的網站就會更新。

> **注意**: 部署後，由於瀏覽器快取，您可能需要**強制刷新** (Cmd+Shift+R 或 Ctrl+Shift+R) 才能看到最新的變更。

---

## 開發與修改方式

### **修改後端**

- 直接修改 `code.gs` 檔案。
- 修改完成後，請務必遵循上述的**後端部署流程**。

### **修改前端 (員工 App)**

- 進入 `worker-app-react` 資料夾 (`cd worker-app-react`)。
- 執行 `npm install` (僅第一次需要)。
- 執行 `npm start` 啟動本地開發伺服器。
- 修改 `src` 資料夾內的相關元件。
- 修改完成後，請遵循上述的**前端部署流程**。

### **修改管理後台**

- 進入 `admin-app-react` 資料夾 (`cd admin-app-react`)。
- 執行 `npm install` (僅第一次需要)。
- 執行 `npm start` 啟動本地開發伺服器。
- 修改 `src` 資料夾內的相關元件。
- 修改完成後，請遵循上述的**前端部署流程**。

---

## 注意事項

- **所有資料獲取已改為 POST 請求**: 為了徹底解決 Google Apps Script `GET` 請求的 CORS (跨來源資源共用) 問題，所有前端對後端資料的獲取（例如 `getRequests`, `getUsers` 等）現在都已改為透過 `POST` 請求發送，並在後端 `doPost` 函式中透過 `action: 'getData'` 和 `payload.sub_action` 進行路由。
- **Google Sheet 格式**: 在「請購單」工作表中，「尺寸」(M 欄) 的欄位格式**必須**設定為「**格式 -> 數字 -> 純文字**」，以防止 Google Sheet 自動將 "1/2" 這樣的尺寸轉換為日期格式。
- **偵錯模式**: `code.gs` 中包含了 `logToSheet` 函式，用於將偵錯資訊寫入「偵錯日誌」工作表。目前所有對 `logToSheet` 的呼叫都已被註解。若未來需要偵錯，只需在相關函式中取消對應的註解，並重新部署後端即可。
- **部署流程**: 請務必嚴格遵守部署流程。**忘記手動部署後端**或**忘記更新前端的後端網址**是導致功能異常最常見的原因。
- **專案相依性**: 在本地開發前，請確保您已安裝 [Node.js](https://nodejs.org/) (建議 v18 或以上版本)。

---

## AI 協作部署流程

本專案可以與 AI 助手（例如 Gemini CLI）協作進行開發與部署。

### 分支說明

- **`master`**: 這是主要的開發分支。所有手動或由 AI 進行的程式碼修改，都應該在這個分支上進行。當變更被推送到此分支後，會自動觸發 GitHub Actions 的前端部署流程。
- **`gh-pages`**: 這是一個自動產生的分支，**請絕對不要手動修改此分支**。它包含了前端應用程式建置後的靜態檔案，由 GitHub Actions 自動管理和更新。

### 協作步驟

當您請求 AI 進行功能修改或錯誤修復時，流程如下：

1.  **AI 修改程式碼**: 您提出需求後，AI 會在本地修改相關的專案檔案（例如 `code.gs`, `worker-app-react/src/...`, `admin-app-react/src/...`）。

2.  **AI 推送變更**: AI 會自動將這些修改 commit 並 push 到 `master` 分支。

3.  **使用者手動部署後端 (若有修改)**:
    - 如果 AI 修改了 `code.gs`，AI 會提醒您。
    - 您**必須**手動將 `code.gs` 的最新內容複製到 Google Apps Script 編輯器，並**部署一個新版本**。
    - 部署後，您會得到一個**新的 GAS 網址**。

4.  **使用者提供新網址給 AI**:
    - 您需要將上一步獲得的**新 GAS 網址**貼給 AI。

5.  **AI 更新前端網址並推送**:
    - AI 會自動將新的網址更新到 `worker-app-react/src/App.js` 和 `admin-app-react/src/App.js`。
    - AI 會再次將此變更推送到 `master` 分支。

6.  **自動部署完成**: GitHub Actions 會完成最後的前端部署。整個流程結束。

> **核心原則**: AI 負責修改和推送**本地程式碼**，而**使用者**負責執行**雲端操作**（部署 GAS）並提供必要的資訊（新的 URL）。
