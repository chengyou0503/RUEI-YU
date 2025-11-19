# 瑞宇水電 - 內部管理系統

這是一個為瑞宇水電客製化的內部管理系統，旨在簡化請購、退貨和工作日誌的流程。系統包含兩個前端應用程式和一個後端 API。

## 專案結構

-   `/worker-app-react`: 員工使用的前端應用程式，用於提交請購單、退貨單和工作日誌。
-   `/admin-app-react`: 管理人員使用的前端應用程式，用於審批請購單和退貨單。
-   `/code.gs`: Google Apps Script 後端，處理所有業務邏輯並與 Google Sheets 互動。
-   `/code1.gs`: 用於定義 Google Sheets 的資料結構。

## 使用技術

-   **前端**:
    -   [React](https://reactjs.org/) (使用 [Vite](https://vitejs.dev/) 進行建置)
    -   [Material-UI](https://mui.com/) (用於 UI 元件和樣式)
-   **後端**:
    -   [Google Apps Script](https://developers.google.com/apps-script)
-   **資料庫**:
    -   [Google Sheets](https://www.google.com/sheets/about/)
-   **部署**:
    -   前端應用程式透過 [GitHub Actions](https://github.com/features/actions) 自動部署到 [GitHub Pages](https://pages.github.com/)。
    -   後端 API 需要手動部署到 Google Apps Script。

## 部署流程

### 前端

1.  對 `worker-app-react` 或 `admin-app-react` 目錄下的程式碼進行修改。
2.  將變更推送到 `master` 分支。
3.  GitHub Actions 會自動觸發，建置前端應用程式並將其部署到 `gh-pages` 分支。
4.  部署完成後，即可透過對應的 GitHub Pages URL 存取最新的應用程式。

### 後端

1.  修改根目錄下的 `code.gs` 檔案。
2.  手動將 `code.gs` 的**完整內容**複製到您的 Google Apps Script 專案中。
3.  在 Apps Script 編輯器中，點擊「部署」 > 「新增部署作業」。
4.  選擇「網頁應用程式」類型，並確保其設定為對所有人開放存取。
5.  點擊「部署」後，會產生一個**新的網頁應用程式 URL**。
6.  **非常重要**: 您必須將這個**新的 URL** 提供給開發者，以更新前端應用程式 (`worker-app-react/src/App.js` 和 `admin-app-react/src/App.js`) 中的 `APPS_SCRIPT_URL` 常數。
7.  重複前端的部署流程，以使新的後端 URL 生效。

## 目前狀態

系統核心功能（請購、退貨、工作日誌、審批）皆已完成並可正常運作。管理後台的 UI/UX 已經過美化，提升了操作體驗。