// =========================================================================
//         師傅端 App - 前端邏輯 (v8.4) - [側滑式購物車]
// =========================================================================

function jsonpUsersCallback(data) {}
function jsonpProjectsCallback(data) {}
function jsonpItemsCallback(data) {}

document.addEventListener('DOMContentLoaded', () => {
    // --- ！！！ 唯一的客製化設定！！！ ---
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4PxrlIHzEoTp5OCngM4_oN27pF1jq0-sN-pdOgUmKHWT4ypHlHiTLq5Bs98fI6isxMQ/exec'; 
    
    // --- DOM 元素 ---
    const steps = document.querySelectorAll('.step');
    const headerTitle = document.getElementById('header-title');
    const userSelect = document.getElementById('user-select');
    const projectSelect = document.getElementById('project-select');
    const deliveryAddressInput = document.getElementById('delivery-address');
    const deliveryDateInput = document.getElementById('delivery-date');
    const userPhoneInput = document.getElementById('user-phone');
    const recipientNameInput = document.getElementById('recipient-name');
    const recipientPhoneInput = document.getElementById('recipient-phone');
    const cartBtn = document.getElementById('cart-btn');
    const cartCount = document.getElementById('cart-count');
    const cartSidePanel = document.getElementById('cart-side-panel');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemList = document.getElementById('cart-item-list');
    
    // --- 按鈕 ---
    const loginBtn = document.getElementById('login-btn');
    const selectProjectBtn = document.getElementById('select-project-btn');
    const goToPreviewBtn = document.getElementById('go-to-preview-btn');
    const goToPreviewFromCartBtn = document.getElementById('go-to-preview-from-cart-btn');
    const submitRequestBtn = document.getElementById('submit-request-btn');
    const newRequestBtn = document.getElementById('new-request-btn');
    const backToLoginFromMenuBtn = document.getElementById('back-to-login-from-menu-btn');
    const backToMainMenuBtn = document.getElementById('back-to-main-menu-btn');
    const backToProjectBtn = document.getElementById('back-to-project-btn');
    const backToMaterialsBtn = document.getElementById('back-to-materials-btn');
    const goToOrderBtn = document.getElementById('go-to-order-btn');
    const goToReturnBtn = document.getElementById('go-to-return-btn');
    const goToLogBtn = document.getElementById('go-to-log-btn');

    // --- 品項選擇區 ---
    const searchMaterialsInput = document.getElementById('search-materials');
    const breadcrumb = document.getElementById('breadcrumb');
    const categorySelection = document.getElementById('category-selection');
    const subcategorySelection = document.getElementById('subcategory-selection');
    const thicknessSelection = document.getElementById('thickness-selection');
    const sizeSelection = document.getElementById('size-selection');
    const selectionContainers = [categorySelection, subcategorySelection, thicknessSelection, sizeSelection];

    // --- 預覽區 ---
    const previewItemList = document.getElementById('preview-item-list');

    // --- 狀態變數 ---
    let allItems = [];
    let currentStep = 0;
    let currentUser = '';
    let currentProject = '';
    let deliveryAddress = '';
    let deliveryDate = '';
    let cart = []; // { id: '...', quantity: X, ...other_props }
    let selectionState = {};
    let currentSelectionLevel = 0; // 0: category, 1: subcategory, 2: thickness, 3: size
    let isSearching = false;

    // --- JSONP 回呼 ---
    window.jsonpUsersCallback = function(users) { populateSelect(userSelect, users, "請選擇姓名"); loginBtn.disabled = false; };
    window.jsonpProjectsCallback = function(projects) { 
        populateSelect(projectSelect, projects, "請選擇專案"); 
        selectProjectBtn.disabled = false; 
    };
    window.jsonpItemsCallback = function(items) { 
        if (items && items.status === 'error') {
            alert(`品項載入失敗: ${items.message}`);
            return;
        }
        allItems = items; 
        renderCurrentStep(); 
    };

    // --- 資料載入 ---
    function loadData(action, callbackName) {
        const script = document.createElement('script');
        script.id = `jsonp-${action}`;
        script.src = `${APPS_SCRIPT_URL}?action=${action}&callback=${callbackName}`;
        script.onerror = () => alert(`載入 ${action} 失敗，請檢查網路或 Apps Script 網址。`);
        document.head.appendChild(script);
        script.remove();
    }

    // --- 核心邏輯 ---
    async function submitRequest() {
        if (cart.length === 0) return alert('購物車是空的！');
        if (!userPhone || !recipientName || !recipientPhone) return alert('請填寫完整的收貨資訊。');

        submitRequestBtn.disabled = true;
        submitRequestBtn.textContent = '傳送中...';
        
        const payload = {
            project: currentProject, deliveryAddress, deliveryDate, user: currentUser,
            userPhone, recipientName, recipientPhone,
            items: cart.map(({ id, ...rest }) => rest)
        };

        try {
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST', mode: 'no-cors',
                body: JSON.stringify({ action: 'submitRequest', payload }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            navigateTo(4); // Success screen
        } catch (error) {
            alert('送出失敗，請檢查網路連線。');
        } finally {
            submitRequestBtn.disabled = false;
            submitRequestBtn.textContent = '確認送出';
        }
    }

    // --- 畫面渲染 ---
    function renderCurrentStep() {
        const searchTerm = searchMaterialsInput.value.trim();
        isSearching = searchTerm.length > 0;

        if (isSearching) {
            selectionContainers.forEach(c => c.style.display = 'none');
            sizeSelection.style.display = 'block';
            breadcrumb.style.display = 'none';
            renderSearchResults(searchTerm);
        } else {
            breadcrumb.style.display = 'block';
            selectionContainers.forEach((container, index) => {
                container.style.display = index === currentSelectionLevel ? (container.classList.contains('selection-grid') ? 'grid' : 'block') : 'none';
                if (index === currentSelectionLevel) container.innerHTML = '';
            });
            updateBreadcrumb();

            switch (currentSelectionLevel) {
                case 0: renderCategories(); break;
                case 1: renderSubcategories(); break;
                case 2: renderThicknesses(); break;
                case 3: renderSizes(); break;
            }
        }
    }

    function renderCategories() {
        const categories = [...new Set(allItems.map(item => item.category))];
        categories.forEach(category => {
            const card = createCard(category, null, 0, () => {
                selectionState.category = category;
                currentSelectionLevel = 1;
                renderCurrentStep();
            });
            categorySelection.appendChild(card);
        });
    }

    function renderSubcategories() {
        const items = allItems.filter(item => item.category === selectionState.category);
        const subcategories = [...new Set(items.map(item => item.subcategory))];
        subcategories.forEach(subcategory => {
            const firstItem = items.find(item => item.subcategory === subcategory);
            const card = createCard(subcategory, firstItem.imageUrl, 1, () => {
                selectionState.subcategory = subcategory;
                currentSelectionLevel = 2;
                renderCurrentStep();
            });
            subcategorySelection.appendChild(card);
        });
    }

    function renderThicknesses() {
        const items = allItems.filter(item => item.category === selectionState.category && item.subcategory === selectionState.subcategory);
        const thicknesses = [...new Set(items.map(item => item.thickness))];
        thicknesses.forEach(thickness => {
            const card = createCard(thickness, null, 2, () => {
                selectionState.thickness = thickness;
                currentSelectionLevel = 3;
                renderCurrentStep();
            });
            thicknessSelection.appendChild(card);
        });
    }

    function renderSizes(itemsToRender) {
        const items = itemsToRender || allItems.filter(item => 
            item.category === selectionState.category && 
            item.subcategory === selectionState.subcategory && 
            item.thickness === selectionState.thickness
        );
        
        sizeSelection.innerHTML = '';
        if (items.length === 0) {
            sizeSelection.innerHTML = '<li class="loading-state">無符合品項</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            const itemId = `${item.category}-${item.subcategory}-${item.thickness}-${item.size}`;
            const cartItem = cart.find(ci => ci.id === itemId);
            const quantity = cartItem ? cartItem.quantity : 0;
            const displayName = isSearching ? `${item.category} > ${item.subcategory} > ${item.thickness} > ${item.size}` : item.size;

            li.innerHTML = `
                <span>${displayName} (${item.unit})</span>
                <div class="quantity-control">
                    <button class="btn-minus" data-item-id="${itemId}">-</button>
                    <input type="number" class="quantity-input" value="${quantity}" min="0" data-item-id="${itemId}">
                    <button class="btn-plus" data-item-id="${itemId}">+</button>
                </div>`;
            sizeSelection.appendChild(li);
        });
    }
    
    function renderSearchResults(searchTerm) {
        const lowerCaseTerm = searchTerm.toLowerCase();
        const results = allItems.filter(item => 
            Object.values(item).some(val => 
                String(val).toLowerCase().includes(lowerCaseTerm)
            )
        );
        renderSizes(results);
    }

    function createCard(title, imageUrl, level, onClick) {
        const card = document.createElement('div');
        card.className = 'card';
        let innerHTML = '';
        if (imageUrl && level === 1) {
            innerHTML += `<img src="${imageUrl}" alt="${title}" class="card-image" onerror="this.style.display='none'">`;
        }
        innerHTML += `<div class="card-title">${title}</div>`;
        card.innerHTML = innerHTML;
        card.addEventListener('click', onClick);
        return card;
    }

    function updateBreadcrumb() {
        breadcrumb.innerHTML = '';
        const path = ['大分類', '小分類', '厚度', '尺寸'];
        for (let i = 0; i < currentSelectionLevel; i++) {
            const key = Object.keys(selectionState)[i];
            const value = selectionState[key];
            const span = document.createElement('span');
            span.textContent = `${value} > `;
            span.onclick = () => {
                currentSelectionLevel = i;
                selectionState = Object.fromEntries(Object.entries(selectionState).slice(0, i));
                renderCurrentStep();
            };
            breadcrumb.appendChild(span);
        }
        breadcrumb.innerHTML += path[currentSelectionLevel];
    }

    function renderCart() {
        cartItemList.innerHTML = '';
        if (cart.length === 0) {
            cartItemList.innerHTML = '<li class="loading-state">購物車是空的</li>';
            cartCount.textContent = '0';
            return;
        }
        cart.forEach(cartItem => {
            const li = document.createElement('li');
            const itemName = `${cartItem.category} > ${cartItem.subcategory} > ${cartItem.thickness} > ${cartItem.size}`;
            li.innerHTML = `
                <div class="cart-item-details">
                    <span class="cart-item-name">${itemName} (${cartItem.unit})</span>
                </div>
                <div class="quantity-control">
                    <button class="btn-minus" data-item-id="${cartItem.id}">-</button>
                    <input type="number" class="quantity-input" value="${cartItem.quantity}" min="0" data-item-id="${cartItem.id}">
                    <button class="btn-plus" data-item-id="${cartItem.id}">+</button>
                </div>`;
            cartItemList.appendChild(li);
        });
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function renderPreview() {
        previewItemList.innerHTML = '';
        if (cart.length === 0) {
            previewItemList.innerHTML = '<li class="loading-state">沒有任何品項</li>';
            return;
        }
        cart.forEach(cartItem => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="preview-item-name">${cartItem.subcategory} (${cartItem.quantity} ${cartItem.unit})</div>
                <div class="preview-item-details">${cartItem.category} / ${cartItem.thickness} / ${cartItem.size}</div>`;
            previewItemList.appendChild(li);
        });
    }

    function updateCart(itemId, change) {
        let cartItem = cart.find(ci => ci.id === itemId);
        const originalItem = allItems.find(item => `${item.category}-${item.subcategory}-${item.thickness}-${item.size}` === itemId);

        if (!originalItem) return;

        if (!cartItem && change > 0) {
            cart.push({ ...originalItem, id: itemId, quantity: change });
        } else if (cartItem) {
            cartItem.quantity += change;
        }
        
        cart = cart.filter(ci => ci.quantity > 0);
        
        if (isSearching) {
            renderSearchResults(searchMaterialsInput.value);
        } else if (currentSelectionLevel === 3) {
            renderSizes();
        }
        renderCart();
    }

    // --- 導航 ---
    function navigateTo(stepIndex) {
        const titles = ["身份驗證", "主選單", "施工專案", "選擇品項", "預覽與確認", "送出成功"];
        headerTitle.textContent = titles[stepIndex] || "工地請料 App";
        
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        
        currentStep = stepIndex;
    }
    
    function toggleCart(open) {
        if (open) {
            renderCart();
            cartSidePanel.classList.add('open');
            cartOverlay.classList.add('open');
        } else {
            cartSidePanel.classList.remove('open');
            cartOverlay.classList.remove('open');
        }
    }

    // --- 事件綁定 ---
    searchMaterialsInput.addEventListener('input', () => renderCurrentStep());
    loginBtn.addEventListener('click', () => { currentUser = userSelect.value; if(currentUser) navigateTo(1); });
    goToOrderBtn.addEventListener('click', () => navigateTo(2));
    selectProjectBtn.addEventListener('click', () => {
        currentProject = projectSelect.value;
        deliveryAddress = deliveryAddressInput.value.trim();
        deliveryDate = deliveryDateInput.value;
        if (currentProject && deliveryAddress && deliveryDate) {
            navigateTo(3);
        } else {
            alert('請選擇專案、填寫送貨地點和日期。');
        }
    });
    
    goToPreviewBtn.addEventListener('click', () => {
        renderPreview();
        navigateTo(4);
    });
    
    goToPreviewFromCartBtn.addEventListener('click', () => {
        toggleCart(false);
        renderPreview();
        navigateTo(4);
    });

    submitRequestBtn.addEventListener('click', submitRequest);
    newRequestBtn.addEventListener('click', () => {
        cart = [];
        selectionState = {};
        currentSelectionLevel = 0;
        searchMaterialsInput.value = '';
        renderCurrentStep();
        renderCart();
        navigateTo(1); // 回主選單
    });

    // --- 返回按鈕 ---
    backToLoginFromMenuBtn.addEventListener('click', () => navigateTo(0));
    backToMainMenuBtn.addEventListener('click', () => navigateTo(1));
    backToProjectBtn.addEventListener('click', () => {
        if (isSearching) {
            searchMaterialsInput.value = '';
            renderCurrentStep();
        } else if (currentSelectionLevel > 0) {
            currentSelectionLevel--;
            const key = Object.keys(selectionState)[currentSelectionLevel];
            delete selectionState[key];
            renderCurrentStep();
        } else {
            navigateTo(2);
        }
    });
    backToMaterialsBtn.addEventListener('click', () => navigateTo(3));

    // --- 品項/購物車選擇事件代理 ---
    const listClickHandler = (e) => {
        const itemId = e.target.dataset.itemId;
        if (!itemId) return;
        if (e.target.matches('.btn-plus')) updateCart(itemId, 1);
        if (e.target.matches('.btn-minus')) updateCart(itemId, -1);
    };
    const listChangeHandler = (e) => {
        const itemId = e.target.dataset.itemId;
        if (!itemId || !e.target.matches('.quantity-input')) return;
        const newQuantity = parseInt(e.target.value, 10);
        if (!isNaN(newQuantity)) {
            const cartItem = cart.find(ci => ci.id === itemId);
            if (cartItem) {
                cartItem.quantity = newQuantity;
            } else if (newQuantity > 0) {
                const originalItem = allItems.find(item => `${item.category}-${item.subcategory}-${item.thickness}-${item.size}` === itemId);
                if (originalItem) cart.push({ ...originalItem, id: itemId, quantity: newQuantity });
            }
            cart = cart.filter(ci => ci.quantity > 0);
            renderCart();
        }
    };
    sizeSelection.addEventListener('click', listClickHandler);
    sizeSelection.addEventListener('change', listChangeHandler);
    cartItemList.addEventListener('click', listClickHandler);
    cartItemList.addEventListener('change', listChangeHandler);
    
    // --- 購物車 ---
    cartBtn.addEventListener('click', () => toggleCart(true));
    closeCartBtn.addEventListener('click', () => toggleCart(false));
    cartOverlay.addEventListener('click', () => toggleCart(false));

    // --- 其他 ---
    goToLogBtn.addEventListener('click', () => alert('工作日誌功能開發中...'));
    function populateSelect(select, options, defaultText) {
        select.innerHTML = `<option value="">-- ${defaultText} --</option>`;
        if (Array.isArray(options)) {
            options.forEach(opt => select.innerHTML += `<option value="${opt}">${opt}</option>`);
        }
    }

    // --- 程式初始執行 ---
    loadData('getUsers', 'jsonpUsersCallback');
    loadData('getProjects', 'jsonpProjectsCallback');
    loadData('getItems', 'jsonpItemsCallback');
});