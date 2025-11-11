// =========================================================================
//         瑞宇水電 - 後台腳本 (v5.0) - [新增工作日誌]
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const requestsContainer = document.getElementById('requests-container');
    const returnsContainer = document.getElementById('returns-container');
    const logsContainer = document.getElementById('logs-container'); // **新增**
    const refreshBtn = document.getElementById('refresh-btn');
    const autoRefreshCheckbox = document.getElementById('auto-refresh-checkbox');
    const timerBar = document.querySelector('.timer-bar');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- 設定 ---
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQs_vTW2s2L-SyDhu3TRjhMAJiEQItmdR8a60GztLjUP4ZOLvYMQgbD5EgdRSRvgAV/exec';
    const REFRESH_INTERVAL = 15000;

    // --- 狀態 ---
    let autoRefreshInterval;
    let currentTab = 'requests';
    let isLoading = false;

    // =========================
    //      主要載入邏輯
    // =========================
    async function loadData(isTriggeredByUser = false) {
        if (isLoading) return;
        isLoading = true;
        if (isTriggeredByUser) resetTimer();
        
        // **更新：根據當前頁籤選擇容器**
        const container = 
            currentTab === 'requests' ? requestsContainer :
            currentTab === 'returns' ? returnsContainer :
            currentTab === 'logs' ? logsContainer : null;
        
        if (!container || !container.innerHTML || container.querySelector('.empty-state')) {
            if(container) container.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div><p>正在載入資料...</p></div>`;
        } else {
            loadingIndicator.classList.add('visible');
        }
        
        try {
            // **更新：根據當前頁籤選擇 action**
            const action = 
                currentTab === 'requests' ? 'getRequests' :
                currentTab === 'returns' ? 'getReturns' :
                'getWorkLogs';

            const response = await jsonpRequest(action);
            if (response.status === 'error') throw new Error(response.message);
            
            // **更新：根據當前頁籤選擇渲染函式**
            if (currentTab === 'requests') renderRequests(response);
            else if (currentTab === 'returns') renderReturns(response);
            else if (currentTab === 'logs') renderLogs(response);

        } catch (error) {
            console.error(`載入 ${currentTab} 失敗:`, error);
            container.innerHTML = `<div class="empty-state"><p>載入資料失敗: ${error.message}</p></div>`;
        } finally {
            isLoading = false;
            loadingIndicator.classList.remove('visible');
        }
    }

    // =========================
    //      請購單 (Requests)
    // =========================
    function renderRequests(requests) {
        const pendingRequests = requests.filter(req => req.items && req.items.some(item => item.status !== '完成'));
        if (pendingRequests.length === 0) {
            requestsContainer.innerHTML = '<div class="empty-state"><p>目前沒有待處理的請購單。</p></div>';
            return;
        }
        requestsContainer.innerHTML = pendingRequests.map(createRequestCardHTML).join('');
        attachRequestListeners();
    }

    function createRequestCardHTML(request) {
        return `
            <div class="request-card">
                <div class="card-header">
                    <div class="header-info">
                        <h2><span class="order-id">#${request.id}</span> - ${request.project}</h2>
                        <p>申請人: ${request.user} (${request.userPhone}) | 時間: ${request.timestamp}</p>
                    </div>
                    <div class="header-actions">
                        <button class="button-primary" data-order-id="${request.id}" data-action="complete-all" title="將此訂單的所有品項都標示為完成">全部完成</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-block">
                        <h3>運送資訊</h3>
                        <p><span class="label">地點:</span> ${request.deliveryAddress}</p>
                        <p><span class="label">日期:</span> ${request.deliveryDate}</p>
                        <p><span class="label">收件人:</span> ${request.recipientName} (${request.recipientPhone})</p>
                    </div>
                    <div class="info-block">
                        <h3>單一品項狀態管理</h3>
                        <table class="items-table">
                            <thead><tr><th>大分類</th><th>小分類</th><th>厚度</th><th>尺寸</th><th>數量</th><th>狀態</th></tr></thead>
                            <tbody>
                                ${request.items.map(item => `
                                    <tr class="status-${item.status}">
                                        <td>${item.category}</td>
                                        <td>${item.subcategory}</td>
                                        <td>${item.thickness}</td>
                                        <td>${item.size}</td>
                                        <td>${item.quantity} ${item.unit}</td>
                                        <td>
                                            <select class="status-select" data-order-id="${request.id}" data-item-name="${item.subcategory}">
                                                <option value="待處理" ${item.status === '待處理' ? 'selected' : ''}>待處理</option>
                                                <option value="完成" ${item.status === '完成' ? 'selected' : ''}>完成</option>
                                            </select>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    }

    async function updateOrderStatus(orderId, newStatus, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = '處理中...';
        try {
            const response = await postRequest('updateStatus', { id: orderId, newStatus });
            if (response.status !== 'success') throw new Error(response.message);
            loadData(true);
        } catch (error) {
            alert('更新訂單狀態失敗: ' + (error.message || '未知錯誤'));
            buttonElement.disabled = false;
            buttonElement.textContent = '全部完成';
        }
    }

    async function updateItemStatus(orderId, itemName, newStatus, selectElement) {
        selectElement.disabled = true;
        try {
            const response = await postRequest('updateItemStatus', { orderId, itemName, newStatus });
            if (response.status !== 'success') throw new Error(response.message);
            loadData(true);
        } catch (error) {
            alert('更新品項狀態失敗: ' + (error.message || '未知錯誤'));
            loadData(true);
        }
    }

    function attachRequestListeners() {
        document.querySelectorAll('#requests-container .status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const { orderId, itemName } = e.target.dataset;
                updateItemStatus(orderId, itemName, e.target.value, e.target);
            });
        });
        document.querySelectorAll('#requests-container [data-action="complete-all"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.dataset.orderId;
                if (confirm(`確定要將訂單 #${orderId} 的所有品項都標示為「完成」嗎？`)) {
                    updateOrderStatus(orderId, '完成', e.target);
                }
            });
        });
    }

    // =========================
    //      退貨單 (Returns)
    // =========================
    function renderReturns(returns) {
        const pendingReturns = returns.filter(ret => ret.items && ret.items.some(item => item.status !== '完成'));
        
        if (pendingReturns.length === 0) {
            returnsContainer.classList.add('is-empty');
            returnsContainer.innerHTML = '<div class="empty-state"><p>目前沒有待處理的退貨單。</p></div>';
            return;
        }
        
        returnsContainer.classList.remove('is-empty');
        returnsContainer.innerHTML = pendingReturns.map(createReturnCardHTML).join('');
        attachReturnListeners();
    }

    function createReturnCardHTML(ret) {
        return `
            <div class="request-card">
                <div class="card-header">
                    <div class="header-info">
                        <h2><span class="order-id">#${ret.id}</span> - ${ret.project}</h2>
                        <p>申請人: ${ret.user} | 時間: ${ret.timestamp}</p>
                    </div>
                    <div class="header-actions">
                        <button class="button-primary" data-return-id="${ret.id}" data-action="complete-all-return" title="將此退貨單的所有品項都標示為完成">全部完成</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-block">
                        <h3>品項狀態管理</h3>
                        <table class="items-table">
                            <thead><tr><th>品項名稱</th><th>數量</th><th>原因</th><th>狀態</th></tr></thead>
                            <tbody>
                                ${ret.items.map(item => `
                                    <tr class="status-${item.status}">
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>${item.reason || '無'}</td>
                                        <td>
                                            <select class="status-select return-status-select" data-return-id="${ret.id}" data-item-name="${item.name}">
                                                <option value="待處理" ${item.status === '待處理' ? 'selected' : ''}>待處理</option>
                                                <option value="完成" ${item.status === '完成' ? 'selected' : ''}>完成</option>
                                            </select>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    }

    async function updateReturnOrderStatus(returnId, newStatus, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = '處理中...';
        try {
            const response = await postRequest('updateReturnStatus', { id: returnId, newStatus });
            if (response.status !== 'success') throw new Error(response.message);
            loadData(true);
        } catch (error) {
            alert('更新退貨單狀態失敗: ' + (error.message || '未知錯誤'));
            buttonElement.disabled = false;
            buttonElement.textContent = '全部完成';
        }
    }

    async function updateReturnItemStatus(returnId, itemName, newStatus, selectElement) {
        selectElement.disabled = true;
        try {
            const response = await postRequest('updateReturnItemStatus', { returnId, itemName, newStatus });
            if (response.status !== 'success') throw new Error(response.message);
            loadData(true);
        } catch (error) {
            alert('更新退貨品項狀態失敗: ' + (error.message || '未知錯誤'));
            loadData(true);
        }
    }

    function attachReturnListeners() {
        document.querySelectorAll('#returns-container .return-status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const { returnId, itemName } = e.target.dataset;
                updateReturnItemStatus(returnId, itemName, e.target.value, e.target);
            });
        });
        document.querySelectorAll('#returns-container [data-action="complete-all-return"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const returnId = e.target.dataset.returnId;
                if (confirm(`確定要將退貨單 #${returnId} 的所有品項都標示為「完成」嗎？`)) {
                    updateReturnOrderStatus(returnId, '完成', e.target);
                }
            });
        });
    }

    // =========================
    //      工作日誌 (Logs)
    // =========================
    function renderLogs(logs) {
        if (logs.length === 0) {
            logsContainer.innerHTML = '<div class="empty-state"><p>目前沒有工作日誌。</p></div>';
            return;
        }
        logsContainer.innerHTML = logs.map(createLogCardHTML).join('');
    }

    function createLogCardHTML(log) {
        return `
            <div class="request-card">
                <div class="card-header">
                    <div class="header-info">
                        <h2><span class="order-id">#${log.id}</span> - ${log.project}</h2>
                        <p>記錄人: ${log.user} | 日期: ${log.date}</p>
                    </div>
                    <div class="header-actions">
                        ${log.folderUrl ? `<a href="${log.folderUrl}" target="_blank" class="button-secondary">查看照片資料夾</a>` : ''}
                    </div>
                </div>
                <div class="card-body-full">
                    <div class="info-grid">
                        <p><span class="label">時段:</span> ${log.timeSlot || '未填寫'}</p>
                        <p><span class="label">區別:</span> ${log.distinction || '未填寫'}</p>
                        <p><span class="label">樓層:</span> ${log.floor || '未填寫'}</p>
                        <p><span class="label">期數:</span> ${log.term || '未填寫'}</p>
                        <p><span class="label">工程項目:</span> ${log.engineeringItem || '未填寫'}</p>
                        <p><span class="label">當期完工:</span> ${log.isCompleted}</p>
                    </div>
                    <div class="log-content">
                        <h3>工作內容</h3>
                        <p>${log.content.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            </div>`;
    }


    // =========================
    //      通用功能
    // =========================
    function handleTabClick(e) {
        const targetTab = e.target.dataset.tab;
        if (targetTab === currentTab) return;
        tabs.forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${targetTab}-container`).classList.add('active');
        currentTab = targetTab;
        loadData(true);
    }

    function startAutoRefresh() {
        stopAutoRefresh();
        autoRefreshInterval = setInterval(() => loadData(false), REFRESH_INTERVAL);
        resetTimer();
        if (autoRefreshCheckbox.checked) timerBar.parentElement.style.display = 'block';
    }

    function stopAutoRefresh() {
        clearInterval(autoRefreshInterval);
        if (timerBar) timerBar.parentElement.style.display = 'none';
    }

    function resetTimer() {
        if (!autoRefreshCheckbox.checked || !timerBar) return;
        timerBar.style.transition = 'none';
        timerBar.style.transform = 'scaleX(0)';
        void timerBar.offsetWidth;
        timerBar.style.transition = `transform ${REFRESH_INTERVAL / 1000}s linear`;
        timerBar.style.transform = 'scaleX(1)';
    }

    async function jsonpRequest(action) {
        const url = `${APPS_SCRIPT_URL}?action=${action}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Fetch GET Error:", error);
            throw error;
        }
    }

    async function postRequest(action, payload) {
        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({ action, payload }),
            });
            return { status: 'success' }; // Assume success due to no-cors limitation
        } catch (error) {
            console.error("Fetch POST Error:", error);
            throw error;
        }
    }

    // --- 初始執行 ---
    tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
    refreshBtn.addEventListener('click', () => loadData(true));
    autoRefreshCheckbox.addEventListener('change', () => {
        if (autoRefreshCheckbox.checked) startAutoRefresh();
        else stopAutoRefresh();
    });

    loadData(true);
    startAutoRefresh();
});
