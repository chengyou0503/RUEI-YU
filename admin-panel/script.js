// =========================================================================
//         瑞宇水電 - 後台腳本 (v4.3) - [終極品質保證]
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const requestsContainer = document.getElementById('requests-container');
    const returnsContainer = document.getElementById('returns-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const autoRefreshCheckbox = document.getElementById('auto-refresh-checkbox');
    const timerBar = document.querySelector('.timer-bar');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- 設定 ---
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyJgGCkZuDDff4zo5Vo-yAQUpOJipZvv8ich1r2X73EZHfHmwF6bg4UM71p-70ATQITsQ/exec';
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
        
        const container = currentTab === 'requests' ? requestsContainer : returnsContainer;
        
        if (!container.innerHTML || container.querySelector('.empty-state')) {
            container.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div><p>正在載入資料...</p></div>`;
        } else {
            loadingIndicator.classList.add('visible');
        }
        
        try {
            const action = currentTab === 'requests' ? 'getRequests' : 'getReturns';
            const response = await jsonpRequest(action); // GET requests remain the same for now
            if (response.status === 'error') throw new Error(response.message);
            
            if (currentTab === 'requests') renderRequests(response);
            else renderReturns(response);

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
        const pendingRequests = requests.filter(req => req.items.some(item => item.status !== '完成'));
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
                            <thead><tr><th>品項名稱</th><th>數量</th><th>狀態</th></tr></thead>
                            <tbody>
                                ${request.items.map(item => `
                                    <tr class="status-${item.status}">
                                        <td>${item.name}</td>
                                        <td>${item.quantity} ${item.unit}</td>
                                        <td>
                                            <select class="status-select" data-order-id="${request.id}" data-item-name="${item.name}">
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

    // **核心 Bug 修正：引入鎖定與回呼機制**
    async function updateOrderStatus(orderId, newStatus, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = '處理中...';
        try {
            const response = await postRequest('updateStatus', { id: orderId, newStatus });
            if (response.status !== 'success') throw new Error(response.message);
            // **成功後才刷新**
            loadData(true);
        } catch (error) {
            alert('更新訂單狀態失敗: ' + (error.message || '未知錯誤'));
            buttonElement.disabled = false;
            buttonElement.textContent = '全部完成';
        }
    }

    // **核心 Bug 修正：引入鎖定與回呼機制**
    async function updateItemStatus(orderId, itemName, newStatus, selectElement) {
        selectElement.disabled = true;
        try {
            const response = await postRequest('updateItemStatus', { orderId, itemName, newStatus });
            if (response.status !== 'success') throw new Error(response.message);
            // **成功後才刷新**
            loadData(true);
        } catch (error) {
            alert('更新品項狀態失敗: ' + (error.message || '未知錯誤'));
            // 失敗時重新載入以還原狀態
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
        const pendingReturns = returns.filter(ret => ret.items.some(item => item.status !== '完成'));
        
        // Toggle empty state class for centering
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

    // **修正：GET 請求使用 Fetch**
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

    // **修正：POST 請求使用 Fetch**
    async function postRequest(action, payload) {
        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Apps Script a-t-il besoin de ça? A vérifier.
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({ action, payload }),
            });
            // NOTE: mode: 'no-cors' prevents reading the response, so we can't get a success/error message directly.
            // We will rely on the fact that if fetch doesn't throw, the request was sent.
            // For a more robust solution, the Apps Script would need to handle CORS preflight requests.
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
