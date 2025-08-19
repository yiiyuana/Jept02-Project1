const standardCategories = ['餐飲', '交通', '購物', '娛樂', '教育', '醫療', '居家', '其他'];
        const incomeCategories = ['薪資', '投資收益', '禮金', '獎金', '其他'];
        const investmentCategories = ['股票', '加密貨幣', '基金', '黃金', '房地產', '其他投資'];


        // 交易資料加入 isRecurring 屬性 (預設為 false)
        // 新增 investmentDetails 物件用於存放投資相關資訊
        let mockTransactions = [
            { id: 1, type: 'income', category: '薪資', amount: 50000, date: '2025-07-25', description: '七月薪資', isRecurring: true, recurringOriginalId: null, investmentDetails: null },
            { id: 2, type: 'expense', category: '餐飲', amount: 350, date: '2025-07-26', description: '午餐便當', isRecurring: false, recurringOriginalId: null, investmentDetails: null },
            { id: 3, type: 'investment', category: '股票', amount: 10000, date: '2025-07-26', description: '買入台積電', isRecurring: false, recurringOriginalId: null, investmentDetails: { assetName: '台積電', quantity: 100, purchasePrice: 100.25, currency: 'TWD', isRegularInvestment: true } }, // 範例投資交易
            { id: 4, type: 'income', category: '投資收益', amount: 1200, date: '2025-07-27', description: '股票股利', isRecurring: false, recurringOriginalId: null, investmentDetails: null },
            { id: 5, type: 'expense', category: '購物', amount: 800, date: '2025-07-27', description: '書本', isRecurring: false, recurringOriginalId: null, investmentDetails: null },
            { id: 6, type: 'expense', category: '餐飲', amount: 200, date: '2025-07-28', description: '晚餐', isRecurring: false, recurringOriginalId: null, investmentDetails: null },
            { id: 7, type: 'expense', category: '娛樂', amount: 600, date: '2025-07-29', description: '電影票', isRecurring: false, recurringOriginalId: null, investmentDetails: null },
            { id: 8, type: 'expense', category: '居家', amount: 1500, date: '2025-07-29', description: '水電費', isRecurring: true, recurringOriginalId: null, investmentDetails: null },
            { id: 9, type: 'income', category: '其他', amount: 500, date: '2025-07-30', description: '朋友還錢', isRecurring: false, recurringOriginalId: null, investmentDetails: null },
            { id: 10, type: 'expense', category: '餐飲', amount: 450, date: '2025-07-30', description: '聚餐', isRecurring: false, recurringOriginalId: null, investmentDetails: null },
            { id: 11, type: 'investment', category: '加密貨幣', amount: 30000, date: '2025-07-28', description: '買入比特幣', isRecurring: false, recurringOriginalId: null, investmentDetails: { assetName: 'BTC', quantity: 0.005, purchasePrice: 600000, currency: 'USD', isRegularInvestment: false } } // 新增一個外幣範例
        ];

        let nextTransactionId = Math.max(...mockTransactions.map(t => t.id)) + 1;
        if (nextTransactionId === -Infinity || isNaN(nextTransactionId)) nextTransactionId = 1; // 如果沒有交易，從1開始

        // 債務資料
        let mockDebts = [
            { id: 1, name: '信用卡帳單', originalAmount: 15000, paidAmount: 5000, dueDate: '2025-08-10', frequency: 'monthly', status: 'active', description: '上月刷卡消費', nextPaymentDate: '2025-08-10' },
            { id: 2, name: '房屋貸款', originalAmount: 3000000, paidAmount: 100000, dueDate: '2025-08-05', frequency: 'monthly', status: 'active', description: '每月房貸', nextPaymentDate: '2025-08-05' },
            { id: 3, name: '學貸', originalAmount: 100000, paidAmount: 100000, dueDate: '2025-07-01', frequency: 'one-time', status: 'paid', description: '大學學貸', nextPaymentDate: null }
        ];

        let nextDebtId = Math.max(...mockDebts.map(d => d.id)) + 1;
        if (nextDebtId === -Infinity || isNaN(nextDebtId)) nextDebtId = 1;

        // --- Tab 切換功能 ---
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');

                // 當切換到不同分頁時，重新載入該分頁的資料
                if (targetTab === 'dashboard') {
                    checkAndGenerateRecurringTransactions(); // 在顯示儀表板前檢查並生成
                    renderDashboard();
                } else if (targetTab === 'add-transaction') {
                    populateCategoriesForAddTransaction();
                    handleTransactionTypeChange(); // 初始化新增交易頁面的表單狀態
                } else if (targetTab === 'history') {
                    checkAndGenerateRecurringTransactions(); // 在顯示交易紀錄前檢查並生成
                    populateCategoriesForFilter();
                    fetchTransactions(); // 重新載入交易紀錄
                } else if (targetTab === 'debt-management') {
                    renderAllDebtsTable();
                    document.getElementById('debtDueDate').valueAsDate = new Date(); // 新增債務預設日期
                }
            });
        });

        // --- 儀表板功能 (dashboard.js 邏輯) ---
        // 定義所有圖表的上下文 (Canvas Rendering Context)
        const expenseChartCtx = document.getElementById('expenseChart').getContext('2d');
        const investmentPortfolioChartCtx = document.getElementById('investmentPortfolioChart').getContext('2d');

        // 圖表切換相關元素
        const prevChartButton = document.getElementById('prevChart');
        const nextChartButton = document.getElementById('nextChart');
        const expenseChartCanvas = document.getElementById('expenseChart');
        const investmentPortfolioChartCanvas = document.getElementById('investmentPortfolioChart');

        // 圖表列表和當前索引
        const charts = [
            { id: 'expenseChart', name: '支出分佈', render: renderExpenseChart, canvas: expenseChartCanvas },
            { id: 'investmentPortfolioChart', name: '持股比例', render: renderInvestmentPortfolioChart, canvas: investmentPortfolioChartCanvas }
        ];
        let currentChartIndex = 0; // 預設顯示支出圓餅圖

        // 全局 Chart 實例，用於銷毀
        let myExpenseChart = null;
        let myInvestmentPortfolioChart = null;

        // 交易內容切換相關元素
        const prevTransactionContentButton = document.getElementById('prevTransactionContent');
        const nextTransactionContentButton = document.getElementById('nextTransactionContent');
        const recentTransactionListDiv = document.getElementById('recentTransactionList');
        const portfolioDetailsDiv = document.getElementById('portfolioDetails');
        const portfolioTableBody = document.getElementById('portfolioTableBody'); // 持股明細表格的 tbody
        const upcomingDebtsDetailsDiv = document.getElementById('upcomingDebtsDetails'); // 即將到期債務 Div

        // 交易內容列表和當前索引 (新增 upcomingDebtsDetails)
        const transactionContents = [
            { id: 'recentTransactionList', name: '近期交易', render: renderRecentTransactions, element: recentTransactionListDiv },
            { id: 'portfolioDetails', name: '持股明細', render: renderPortfolioDetails, element: portfolioDetailsDiv },
            { id: 'upcomingDebtsDetails', name: '即將到期債務', render: renderUpcomingDebts, element: upcomingDebtsDetailsDiv }
        ];
        let currentTransactionContentIndex = 0; // 預設顯示近期交易


        function renderDashboard() {
            const totalIncomeEl = document.getElementById('totalIncome');
            const totalExpenseEl = document.getElementById('totalExpense');
            const totalInvestmentEl = document.getElementById('totalInvestment');
            const balanceEl = document.getElementById('balance');
            const totalAssetsEl = document.getElementById('totalAssets'); // 新增總資產
            const totalDebtEl = document.getElementById('totalDebt'); // 新增總債務

            let totalIncome = 0;
            let totalExpense = 0;
            let totalInvestment = 0;
            let totalDebt = 0;

            mockTransactions.forEach(t => {
                if (t.type === 'income') {
                    totalIncome += t.amount;
                } else if (t.type === 'expense') {
                    totalExpense += t.amount;
                } else if (t.type === 'investment') {
                    totalInvestment += t.amount;
                }
            });

            // 計算總債務 (只計算狀態為 active 的債務的尚欠金額)
            mockDebts.forEach(d => {
                if (d.status === 'active') {
                    totalDebt += (d.originalAmount - d.paidAmount);
                }
            });

            // 總資產 = 總收入 - 總支出 - 總投資 - 總債務 (簡化計算)
            const totalAssets = totalIncome - totalExpense - totalInvestment - totalDebt;


            // 格式化數字為不帶小數點和千位數分隔
            totalIncomeEl.textContent = Math.round(totalIncome).toLocaleString('zh-TW');
            totalExpenseEl.textContent = Math.round(totalExpense).toLocaleString('zh-TW');
            totalInvestmentEl.textContent = Math.round(totalInvestment).toLocaleString('zh-TW');
            balanceEl.textContent = Math.round(totalIncome - totalExpense - totalInvestment).toLocaleString('zh-TW'); // 結餘
            totalAssetsEl.textContent = Math.round(totalAssets).toLocaleString('zh-TW'); // 顯示總資產
            totalDebtEl.textContent = Math.round(totalDebt).toLocaleString('zh-TW'); // 顯示總債務


            // 呼叫顯示當前交易內容的函數
            showCurrentTransactionContent();

            // 呼叫顯示當前圖表的函數
            showCurrentChart();
        }

        // 顯示當前交易內容的函數
        function showCurrentTransactionContent() {
            // 隱藏所有內容元素
            transactionContents.forEach(content => {
                content.element.classList.remove('active-transaction-content');
                content.element.classList.add('hidden-transaction-content');
            });

            // 顯示當前選中的內容元素
            const currentContent = transactionContents[currentTransactionContentIndex];
            currentContent.element.classList.remove('hidden-transaction-content');
            currentContent.element.classList.add('active-transaction-content');

            // 更新標題
            document.querySelector('.recent-transactions h2').textContent = `近期活動 (${currentContent.name})`;

            // 渲染當前內容
            currentContent.render();
        }


        // 渲染近期交易列表 (從 renderDashboard 中拆分出來)
        function renderRecentTransactions() {
            const recentTransactionListEl = document.getElementById('recentTransactionList');
            recentTransactionListEl.innerHTML = ''; // 清空現有內容

            const sortedTransactions = [...mockTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
            const recentFiveTransactions = sortedTransactions.slice(0, 5);

            if (recentFiveTransactions.length > 0) {
                recentFiveTransactions.forEach(t => {
                    const transactionItem = document.createElement('div');
                    transactionItem.classList.add('transaction-item', t.type);
                    // 檢查是否是原始固定收支或由固定收支產生
                    if (t.isRecurring || (t.investmentDetails && t.investmentDetails.isRegularInvestment) || t.recurringOriginalId !== null) {
                        transactionItem.classList.add('recurring');
                    }
                    let descriptionText = t.description || '無說明';
                    let recurringFlag = '';
                    if (t.type === 'investment' && t.investmentDetails && t.investmentDetails.assetName) {
                        descriptionText = t.investmentDetails.assetName + (t.description ? ` (${t.description})` : '');
                        if (t.investmentDetails.isRegularInvestment) {
                            recurringFlag = '(定期定額)';
                        }
                    } else {
                        if (t.isRecurring) {
                            recurringFlag = '(固定)';
                        }
                    }

                    transactionItem.innerHTML = `
                        <span>${t.date} - ${t.category} (${descriptionText}) ${recurringFlag}</span>
                        <span>${t.type === 'income' ? '+' : (t.type === 'expense' || t.type === 'investment' ? '-' : '')} NT$ ${Math.round(t.amount).toLocaleString('zh-TW')}</span>
                    `;
                    recentTransactionListEl.appendChild(transactionItem);
                });
            } else {
                recentTransactionListEl.innerHTML = '<p>目前沒有近期交易。</p>';
            }
        }


        // 渲染持股明細 (新增函數)
        function renderPortfolioDetails() {
            const portfolio = {}; // 存放每個標的的總數量和總投入成本

            mockTransactions.forEach(t => {
                if (t.type === 'investment' && t.investmentDetails && t.investmentDetails.assetName) {
                    const assetName = t.investmentDetails.assetName;
                    const quantity = t.investmentDetails.quantity || 0;
                    const amount = t.amount; // 交易的總金額 (已換算為台幣整數)

                    if (!portfolio[assetName]) {
                        portfolio[assetName] = {
                            totalQuantity: 0,
                            totalInvestmentAmount: 0 // 總投入台幣金額
                        };
                    }
                    portfolio[assetName].totalQuantity += quantity;
                    portfolio[assetName].totalInvestmentAmount += amount;
                }
            });

            portfolioTableBody.innerHTML = ''; // 清空表格內容

            const assetNames = Object.keys(portfolio);

            if (assetNames.length > 0) {
                assetNames.forEach(assetName => {
                    const data = portfolio[assetName];
                    const averageCostPerUnit = data.totalQuantity > 0 ? (data.totalInvestmentAmount / data.totalQuantity) : 0;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${assetName}</td>
                        <td>${data.totalQuantity.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>
                        <td>NT$ ${Math.round(averageCostPerUnit).toLocaleString('zh-TW')}</td>
                        <td>NT$ ${Math.round(data.totalInvestmentAmount).toLocaleString('zh-TW')}</td>
                        <td>待連結市場數據</td>
                        <td>待連結市場數據</td>
                    `;
                    portfolioTableBody.appendChild(row);
                });
            } else {
                portfolioTableBody.innerHTML = '<tr><td colspan="6">沒有持股數據。</td></tr>';
            }
        }

        // 渲染即將到期債務 (新增函數)
        function renderUpcomingDebts() {
            const upcomingDebtsListEl = document.getElementById('upcomingDebtsList');
            upcomingDebtsListEl.innerHTML = ''; // 清空現有內容

            const today = new Date();
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(today.getDate() + 30);

            const relevantDebts = mockDebts.filter(d =>
                d.status === 'active' &&
                d.nextPaymentDate &&
                new Date(d.nextPaymentDate) >= today &&
                new Date(d.nextPaymentDate) <= thirtyDaysLater
            ).sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)); // 按日期升序

            if (relevantDebts.length > 0) {
                relevantDebts.forEach(debt => {
                    const remainingAmount = debt.originalAmount - debt.paidAmount;
                    const debtItem = document.createElement('div');
                    debtItem.classList.add('debt-item');
                    // 添加逾期樣式
                    if (new Date(debt.nextPaymentDate) < today) {
                        debtItem.classList.add('status-overdue');
                    }
                    debtItem.innerHTML = `
                        <div class="debt-item-info">
                            <strong>${debt.name}</strong>
                            <span>尚欠：NT$ ${Math.round(remainingAmount).toLocaleString('zh-TW')}</span>
                            <span>下次還款日：${debt.nextPaymentDate}</span>
                        </div>
                        <div class="debt-item-actions">
                            <button class="record-payment-btn" data-id="${debt.id}">記錄還款</button>
                            <button class="clear-debt-btn" data-id="${debt.id}">清償</button>
                        </div>
                    `;
                    upcomingDebtsListEl.appendChild(debtItem);
                });
            } else {
                upcomingDebtsListEl.innerHTML = '<p>近期沒有應還債務。</p>';
            }
        }


        // 綁定交易內容切換按鈕事件
        prevTransactionContentButton.addEventListener('click', () => {
            currentTransactionContentIndex = (currentTransactionContentIndex - 1 + transactionContents.length) % transactionContents.length;
            showCurrentTransactionContent();
        });

        nextTransactionContentButton.addEventListener('click', () => {
            currentTransactionContentIndex = (currentTransactionContentIndex + 1) % transactionContents.length;
            showCurrentTransactionContent();
        });


        // 顯示當前圖表的函數
        function showCurrentChart() {
            // 銷毀所有圖表實例以避免重疊和內存洩漏
            if (myExpenseChart) myExpenseChart.destroy();
            if (myInvestmentPortfolioChart) myInvestmentPortfolioChart.destroy();

            // 隱藏所有 canvas
            charts.forEach(chart => {
                chart.canvas.classList.remove('active-chart');
                chart.canvas.classList.add('hidden-chart');
            });

            // 顯示當前選中的 canvas
            const currentChart = charts[currentChartIndex];
            currentChart.canvas.classList.remove('hidden-chart');
            currentChart.canvas.classList.add('active-chart');

            // 更新標題
            document.querySelector('.charts h2').textContent = `財務分析 (${currentChart.name})`;

            // 渲染當前圖表
            currentChart.render();
        }

        // 渲染支出圓餅圖 (從 renderDashboard 中拆分出來)
        function renderExpenseChart() {
            const categorySummary = {};
            mockTransactions.forEach(t => {
                if (t.type === 'expense') {
                    if (categorySummary[t.category]) {
                        categorySummary[t.category] += t.amount;
                    } else {
                        categorySummary[t.category] = t.amount;
                    }
                }
            });

            const chartLabels = Object.keys(categorySummary);
            const chartData = Object.values(categorySummary);
            const backgroundColors = [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(199, 199, 199, 0.7)',
                'rgba(83, 102, 255, 0.7)',
                'rgba(40, 200, 100, 0.7)',
                'rgba(200, 80, 40, 0.7)'
            ];

            // 銷毀舊的圖表實例
            if (myExpenseChart) myExpenseChart.destroy();

            if (chartLabels.length > 0) {
                myExpenseChart = new Chart(expenseChartCtx, {
                    type: 'pie',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: '支出分佈',
                            data: chartData,
                            backgroundColor: backgroundColors.slice(0, chartLabels.length),
                            borderColor: 'white',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed !== null) {
                                            const total = context.dataset.data.reduce((acc, current) => acc + current, 0);
                                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(2) : 0;
                                            label += `NT$ ${Math.round(context.parsed).toLocaleString('zh-TW')} (${percentage}%)`;
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                // 如果沒有數據，清空 canvas
                expenseChartCtx.clearRect(0, 0, expenseChartCtx.canvas.width, expenseChartCtx.canvas.height);
            }
        }

        // 渲染持股比例圖 (新增函數)
        function renderInvestmentPortfolioChart() {
            const portfolioSummary = {}; // 存放每個資產的總投入成本

            mockTransactions.forEach(t => {
                if (t.type === 'investment' && t.investmentDetails && t.investmentDetails.assetName) {
                    const assetName = t.investmentDetails.assetName;
                    // 這裡使用交易的 `amount` 作為投入成本，因為它已經是整數化的台幣金額
                    if (portfolioSummary[assetName]) {
                        portfolioSummary[assetName] += t.amount;
                    } else {
                        portfolioSummary[assetName] = t.amount;
                    }
                }
            });

            const chartLabels = Object.keys(portfolioSummary);
            const chartData = Object.values(portfolioSummary);
            const backgroundColors = [
                'rgba(255, 159, 64, 0.7)',  // 橘色
                'rgba(75, 192, 192, 0.7)',  // 淺綠
                'rgba(54, 162, 235, 0.7)',  // 藍色
                'rgba(153, 102, 255, 0.7)', // 紫色
                'rgba(255, 99, 132, 0.7)',  // 紅色
                'rgba(255, 206, 86, 0.7)',  // 黃色
                'rgba(199, 199, 199, 0.7)', // 灰色
                'rgba(100, 149, 237, 0.7)', // 康乃馨藍
                'rgba(60, 179, 113, 0.7)',  // 海綠色
                'rgba(218, 112, 214, 0.7)'  // 蘭花紫
            ];

            // 銷毀舊的圖表實例
            if (myInvestmentPortfolioChart) myInvestmentPortfolioChart.destroy();

            if (chartLabels.length > 0) {
                myInvestmentPortfolioChart = new Chart(investmentPortfolioChartCtx, {
                    type: 'pie',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: '持股比例 (依投入成本)',
                            data: chartData,
                            backgroundColor: backgroundColors.slice(0, chartLabels.length),
                            borderColor: 'white',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed !== null) {
                                            const total = context.dataset.data.reduce((acc, current) => acc + current, 0);
                                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(2) : 0;
                                            label += `NT$ ${Math.round(context.parsed).toLocaleString('zh-TW')} (${percentage}%)`;
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                // 如果沒有投資數據，清空 canvas
                investmentPortfolioChartCtx.clearRect(0, 0, investmentPortfolioChartCtx.canvas.width, investmentPortfolioChartCtx.canvas.height);
            }
        }

        // 綁定按鈕事件
        prevChartButton.addEventListener('click', () => {
            currentChartIndex = (currentChartIndex - 1 + charts.length) % charts.length;
            showCurrentChart();
        });

        nextChartButton.addEventListener('click', () => {
            currentChartIndex = (currentChartIndex + 1) % charts.length;
            showCurrentChart();
        });


        // --- 新增交易功能 (addTransaction.js 邏輯) ---
        const addTransactionForm = document.getElementById('addTransactionForm');
        const addTransactionMessage = document.getElementById('addTransactionMessage');
        const transactionTypeSelect = document.getElementById('type');
        const addCategorySelect = document.getElementById('category');
        const addDescriptionTextarea = document.getElementById('description');
        const addIsRecurringCheckbox = document.getElementById('isRecurring');
        const addIsRecurringLabel = document.getElementById('isRecurringLabel');
        const investmentFieldsDiv = document.getElementById('investmentFields');
        const assetNameInput = document.getElementById('assetName');
        const quantityInput = document.getElementById('quantity');
        const purchasePriceInput = document.getElementById('purchasePrice');

        // 幣別相關元素
        const investmentCurrencySelect = document.getElementById('investmentCurrency');
        const purchasePriceCurrencyDisplay = document.getElementById('purchasePriceCurrencyDisplay');
        const currencyExchangeHint = document.getElementById('currencyExchangeHint'); // 取得提示訊息元素

        // 監聽幣別選擇變化，更新提示 (新增交易頁面)
        investmentCurrencySelect.addEventListener('change', () => {
            purchasePriceCurrencyDisplay.textContent = ` (${investmentCurrencySelect.value})`;
            if (investmentCurrencySelect.value === 'TWD') {
                currencyExchangeHint.style.display = 'none';
            } else {
                currencyExchangeHint.style.display = 'block';
            }
        });


        // 動態調整分類和欄位
        function handleTransactionTypeChange() {
            const selectedType = transactionTypeSelect.value;
            addCategorySelect.innerHTML = '<option value="">請選擇</option>'; // 清空現有選項

            if (selectedType === 'income') {
                incomeCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    addCategorySelect.appendChild(option);
                });
                investmentFieldsDiv.style.display = 'none'; // 隱藏投資欄位
                addDescriptionTextarea.placeholder = ''; // 清除 placeholder
                addIsRecurringLabel.textContent = '是否為固定收支 (每月自動計算)';
                addIsRecurringCheckbox.name = 'isRecurring';
                addIsRecurringCheckbox.checked = false; // 重設為未勾選
                addIsRecurringCheckbox.disabled = false; // 啟用
            } else if (selectedType === 'expense') {
                standardCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    addCategorySelect.appendChild(option);
                });
                investmentFieldsDiv.style.display = 'none'; // 隱藏投資欄位
                addDescriptionTextarea.placeholder = ''; // 清除 placeholder
                addIsRecurringLabel.textContent = '是否為固定收支 (每月自動計算)';
                addIsRecurringCheckbox.name = 'isRecurring';
                addIsRecurringCheckbox.checked = false; // 重設為未勾選
                addIsRecurringCheckbox.disabled = false; // 啟用
            } else if (selectedType === 'investment') {
                investmentCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    addCategorySelect.appendChild(option);
                });
                investmentFieldsDiv.style.display = 'block'; // 顯示投資欄位

                // 設定幣別選擇器預設值並觸發顯示更新
                investmentCurrencySelect.value = 'TWD'; // 預設為台幣
                purchasePriceCurrencyDisplay.textContent = ' (TWD)';
                currencyExchangeHint.style.display = 'none'; // TWD 預設隱藏提示

                addDescriptionTextarea.placeholder = '額外備註 (例如：交易平台、長期目標)'; // 投資說明建議
                addIsRecurringLabel.textContent = '是否定期定額 (每月自動投資)';
                addIsRecurringCheckbox.name = 'isRegularInvestment'; // 修改名稱
                addIsRecurringCheckbox.checked = false; // 重設為未勾選
                addIsRecurringCheckbox.disabled = false; // 啟用
            }
        }

        // 初始化新增交易頁面的分類和欄位
        function populateCategoriesForAddTransaction() {
             // 確保每次進入時，選擇器都在初始狀態
            transactionTypeSelect.value = 'expense'; // 預設為支出
            handleTransactionTypeChange(); // 根據預設值初始化表單
            // 設定日期預設為今天
            document.getElementById('date').valueAsDate = new Date();
            addIsRecurringCheckbox.checked = false; // 預設取消勾選
        }


        transactionTypeSelect.addEventListener('change', handleTransactionTypeChange);


        addTransactionForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const type = transactionTypeSelect.value;
            const category = addCategorySelect.value;
            // 將金額轉換為整數
            const amount = Math.round(parseFloat(document.getElementById('amount').value));
            const date = document.getElementById('date').value;
            const description = addDescriptionTextarea.value;
            let isRecurring = false;
            let investmentDetails = null;

            if (type === 'investment') {
                isRecurring = addIsRecurringCheckbox.checked; // 對於投資，isRecurring 變為 isRegularInvestment
                investmentDetails = {
                    assetName: assetNameInput.value,
                    quantity: parseFloat(quantityInput.value) || 0, // 允許小數
                    purchasePrice: parseFloat(purchasePriceInput.value) || 0, // 允許小數
                    currency: investmentCurrencySelect.value, // 新增幣別欄位
                    isRegularInvestment: isRecurring // 儲存這個狀態
                };

                // 投資類型下，標的名稱為必填
                if (!investmentDetails.assetName) {
                    showMessage('投資類型請填寫標的名稱。', 'error', addTransactionMessage);
                    return;
                }
                if (isNaN(investmentDetails.quantity) || investmentDetails.quantity < 0) { // 數量可以為0 (例如，買入總金額，數量還未確定)
                     showMessage('購買數量不能為負數。', 'error', addTransactionMessage);
                     return;
                }
                if (isNaN(investmentDetails.purchasePrice) || investmentDetails.purchasePrice < 0) { // 價格可以為0 (例如，贈與)
                     showMessage('購買價格不能為負數。', 'error', addTransactionMessage);
                     return;
                }

            } else {
                isRecurring = addIsRecurringCheckbox.checked; // 對於收入/支出，isRecurring 仍為固定收支
            }

            if (amount <= 0 || isNaN(amount)) {
                showMessage('金額必須大於零。', 'error', addTransactionMessage);
                return;
            }
            if (!category) {
                showMessage('請選擇分類。', 'error', addTransactionMessage);
                return;
            }

            const newTransaction = {
                id: nextTransactionId++,
                type,
                category,
                amount, // 已是整數
                date,
                description,
                isRecurring: isRecurring, // 這裡統一使用 isRecurring，但在投資類型下其意義是 isRegularInvestment
                recurringOriginalId: null, // 新增的交易，如果是固定收支，它就是原始記錄
                investmentDetails: investmentDetails // 存放投資詳細資訊
            };

            mockTransactions.push(newTransaction);
            mockTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)); // 保持排序

            showMessage('交易新增成功！', 'success', addTransactionMessage);
            addTransactionForm.reset(); // 清空表單
            document.getElementById('date').valueAsDate = new Date(); // 重設日期為今天
            handleTransactionTypeChange(); // 重設表單狀態到預設 (支出)

            // 新增後自動切換到儀表板並更新數據
            document.querySelector('.tab-button[data-tab="dashboard"]').click();
        });

        function showMessage(msg, type, element) {
            element.textContent = msg;
            element.className = `message ${type}`;
            element.style.display = 'block';
            setTimeout(() => {
                element.style.display = 'none';
            }, 3000);
        }

        // --- 交易紀錄功能 (history.js 邏輯) ---
        const filterCategorySelect = document.getElementById('filterCategory');
        const transactionTableBody = document.getElementById('transactionTableBody');
        const noTransactionsMessage = document.getElementById('noTransactionsMessage');
        const filterTypeSelect = document.getElementById('filterType');

        function populateCategoriesForFilter() {
            filterCategorySelect.innerHTML = '<option value="all">所有</option>';
            const selectedFilterType = filterTypeSelect.value;
            let categoriesToPopulate = [];

            if (selectedFilterType === 'all') {
                categoriesToPopulate = [...new Set([...standardCategories, ...incomeCategories, ...investmentCategories])];
            } else if (selectedFilterType === 'income') {
                categoriesToPopulate = incomeCategories;
            } else if (selectedFilterType === 'expense') {
                categoriesToPopulate = standardCategories;
            } else if (selectedFilterType === 'investment') {
                categoriesToPopulate = investmentCategories;
            }

            categoriesToPopulate.sort().forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                filterCategorySelect.appendChild(option);
            });
        }
        filterTypeSelect.addEventListener('change', populateCategoriesForFilter);


        document.getElementById('applyFilters').addEventListener('click', fetchTransactions);

        function renderTransactionTable(transactionsToRender) {
            transactionTableBody.innerHTML = ''; // 清空現有內容

            if (transactionsToRender.length > 0) {
                noTransactionsMessage.style.display = 'none';
                transactionsToRender.forEach(t => {
                    const row = document.createElement('tr');
                    // 根據是原始固定還是自動生成，顯示不同文字
                    let recurringStatus = '否';
                    if (t.type === 'investment' && t.investmentDetails && t.investmentDetails.isRegularInvestment) {
                        recurringStatus = t.recurringOriginalId === null ? '是 (定期原始)' : '是 (定期自動)';
                    } else if (t.isRecurring) {
                        recurringStatus = t.recurringOriginalId === null ? '是 (固定原始)' : '是 (固定自動)';
                    }


                    let descriptionDisplay = t.description || '-';
                    let quantityDisplay = '-';
                    let priceDisplay = '-';

                    if (t.type === 'investment' && t.investmentDetails) {
                        descriptionDisplay = t.investmentDetails.assetName || '-';
                        if (t.description) {
                            descriptionDisplay += ` (${t.description})`;
                        }
                        quantityDisplay = t.investmentDetails.quantity !== null && !isNaN(t.investmentDetails.quantity) ? t.investmentDetails.quantity.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : '-';
                        // 價格顯示幣別
                        priceDisplay = t.investmentDetails.purchasePrice !== null && !isNaN(t.investmentDetails.purchasePrice) ? `${t.investmentDetails.currency || '??'} ${t.investmentDetails.purchasePrice.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '-';
                    }

                    row.innerHTML = `
                        <td>${t.date}</td>
                        <td class="${t.type}">${t.type === 'income' ? '收入' : (t.type === 'expense' ? '支出' : '投資')}</td>
                        <td>${t.category}</td>
                        <td>${descriptionDisplay}</td>
                        <td>${quantityDisplay}</td>
                        <td>${priceDisplay}</td>
                        <td class="${t.type}">${t.type === 'income' ? '+' : (t.type === 'expense' || t.type === 'investment' ? '-' : '')} NT$ ${Math.round(t.amount).toLocaleString('zh-TW')}</td>
                        <td>${recurringStatus}</td>
                        <td class="action-buttons">
                            <button class="edit-btn" data-id="${t.id}">編輯</button>
                            <button class="delete-btn" data-id="${t.id}">刪除</button>
                        </td>
                    `;
                    transactionTableBody.appendChild(row);
                });
            } else {
                noTransactionsMessage.style.display = 'block';
                transactionTableBody.innerHTML = '<tr><td colspan="9">沒有符合條件的交易記錄。</td></tr>'; // 欄位數變成9
            }
        }

        function fetchTransactions() {
            const filterType = document.getElementById('filterType').value;
            const filterCategory = document.getElementById('filterCategory').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            let filteredTransactions = [...mockTransactions];

            if (filterType !== 'all') {
                filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
            }
            if (filterCategory !== 'all') {
                filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory);
            }
            if (startDate) {
                filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
            }
            if (endDate) {
                filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
            }

            renderTransactionTable(filteredTransactions);
        }

        transactionTableBody.addEventListener('click', (event) => {
            // 檢查點擊的目標是否具有 'delete-btn' class
            if (event.target.classList.contains('delete-btn')) {
                const transactionId = parseInt(event.target.dataset.id);
                if (confirm('確定要刪除這筆交易嗎？')) {
                    const deletedTransaction = mockTransactions.find(t => t.id === transactionId);

                    if (deletedTransaction) {
                        if (deletedTransaction.isRecurring && deletedTransaction.recurringOriginalId === null) {
                            // 刪除的是原始固定收支：只移除原始記錄，不移除已自動生成的記錄
                            alert('這是原始固定收支記錄。刪除它將會停止未來的自動生成，但已存在的自動生成記錄會被保留。');
                            mockTransactions = mockTransactions.filter(t => t.id !== transactionId);
                        } else if (deletedTransaction.type === 'investment' && deletedTransaction.investmentDetails && deletedTransaction.investmentDetails.isRegularInvestment && deletedTransaction.recurringOriginalId === null) {
                            // 刪除的是原始定期定額投資：只移除原始記錄
                            alert('這是原始定期定額投資記錄。刪除它將會停止未來的自動生成，但已存在的自動生成記錄會被保留。');
                            mockTransactions = mockTransactions.filter(t => t.id !== transactionId);
                        }
                        else {
                            // 刪除的是一般交易 或 自動生成的固定收支/定期定額（只刪除該單筆）
                            mockTransactions = mockTransactions.filter(t => t.id !== transactionId);
                        }
                        showMessage('交易刪除成功！', 'success', noTransactionsMessage);
                        fetchTransactions(); // 重新渲染表格
                        renderDashboard(); // 更新儀表板數據
                    } else {
                        showMessage('刪除失敗：找不到該筆交易。', 'error', noTransactionsMessage);
                    }
                }
            } else if (event.target.classList.contains('edit-btn')) {
                const transactionId = parseInt(event.target.dataset.id);
                openEditModal(transactionId);
            }
        });

        // --- 固定收支/定期定額自動產生功能 ---
        function checkAndGenerateRecurringTransactions() {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
            const currentMonthString = `${currentYear}-${currentMonth}`;

            // 找出所有標記為 "isRecurring: true" (無論是收支還是投資的定期) 且 recurringOriginalId 為 null (表示是原始模板) 的記錄
            const originalRecurringTransactions = mockTransactions.filter(t =>
                (t.isRecurring === true && t.recurringOriginalId === null) ||
                (t.type === 'investment' && t.investmentDetails && t.investmentDetails.isRegularInvestment === true && t.recurringOriginalId === null)
            );

            originalRecurringTransactions.forEach(originalTransaction => {
                // 找到該原始記錄的「所有」相關記錄中，最新的日期 (包含原始記錄和所有自動生成的記錄)
                const allRelatedTransactions = mockTransactions
                    .filter(t => t.id === originalTransaction.id || t.recurringOriginalId === originalTransaction.id)
                    .sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期降序排序

                const lastOccurenceDate = allRelatedTransactions.length > 0 ? allRelatedTransactions[0].date : originalTransaction.date;


                let checkingDate = new Date(lastOccurenceDate); // 從上次發生的日期開始檢查
                let loopCount = 0; // 防止無限循環的保護 (例如日期解析錯誤等)

                // 將檢查日期推進到下一個月，確保是從下個月開始生成
                checkingDate.setMonth(checkingDate.getMonth()); // 確保月份正確設置
                checkingDate.setDate(1); // 設置到每月1號進行判斷

                while (
                    (checkingDate.getFullYear() < currentYear ||
                     (checkingDate.getFullYear() === currentYear && checkingDate.getMonth() < today.getMonth()))
                    && loopCount < 120 // 防止過多循環，例如如果原始日期非常久遠 (最多檢查10年)
                ) {
                    checkingDate.setMonth(checkingDate.getMonth() + 1); // 進到下一個月
                    loopCount++;

                    const nextMonthYear = checkingDate.getFullYear();
                    const nextMonthMonth = (checkingDate.getMonth() + 1).toString().padStart(2, '0'); // getMonth() 是 0-11
                    const nextMonthString = `${nextMonthYear}-${nextMonthMonth}`;

                    // 計算該固定收支在「這個月」應該有的日期
                    // 取原始記錄的日，但不能超過該月的最大天數
                    const dayOfMonth = Math.min(
                        parseInt(originalTransaction.date.split('-')[2]), // 原始記錄的日
                        new Date(nextMonthYear, parseInt(nextMonthMonth), 0).getDate() // 該月的最後一天
                    );
                    const newDateForRecurring = `${nextMonthYear}-${nextMonthMonth}-${dayOfMonth.toString().padStart(2, '0')}`;


                    // 確保生成的日期不會超過今天
                    if (newDateForRecurring > today.toISOString().split('T')[0]) {
                        break; // 如果生成的日期已經超過今天，就停止
                    }

                    // 檢查這個月是否已經有該固定收支的記錄 (用原始ID和月份判斷)
                    const isAlreadyGeneratedThisMonth = mockTransactions.some(t =>
                        t.recurringOriginalId === originalTransaction.id &&
                        t.date.startsWith(nextMonthString)
                    );

                    if (!isAlreadyGeneratedThisMonth) {
                         const newRecurringTransaction = {
                            id: nextTransactionId++,
                            type: originalTransaction.type,
                            category: originalTransaction.category,
                            amount: originalTransaction.amount, // 固定收支的金額已經是整數
                            date: newDateForRecurring,
                            description: originalTransaction.description + ' (自動生成)',
                            isRecurring: false, // 自動生成的記錄本身不再是「原始固定收支」
                            recurringOriginalId: originalTransaction.id, // 記錄它是從哪條原始記錄生成的
                            investmentDetails: originalTransaction.type === 'investment' ? { // 如果是投資，則複製詳細資訊
                                assetName: originalTransaction.investmentDetails.assetName,
                                quantity: originalTransaction.investmentDetails.quantity,
                                purchasePrice: originalTransaction.investmentDetails.purchasePrice,
                                currency: originalTransaction.investmentDetails.currency, // 複製幣別
                                isRegularInvestment: originalTransaction.investmentDetails.isRegularInvestment // 定期定額狀態
                            } : null
                        };
                        mockTransactions.push(newRecurringTransaction);
                        console.log(`自動生成了一筆固定收支/定期定額: ${newRecurringTransaction.description} for ${newDateForRecurring}`);
                    }
                }
            });
            mockTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)); // 重新排序
        }


        // --- 編輯交易功能 (Modal 和表單處理) ---
        const editTransactionModal = document.getElementById('editTransactionModal');
        const closeButton = editTransactionModal.querySelector('.close-button');
        const editTransactionForm = document.getElementById('editTransactionForm');
        const editTransactionMessage = document.getElementById('editTransactionMessage');

        // 編輯表單的元素
        const editTransactionIdEl = document.getElementById('editTransactionId');
        const editTypeEl = document.getElementById('editType');
        const editCategoryEl = document.getElementById('editCategory');
        const editAmountEl = document.getElementById('editAmount');
        const editDateEl = document.getElementById('editDate');
        const editDescriptionEl = document.getElementById('editDescription');
        const editIsRecurringEl = document.getElementById('editIsRecurring');
        const editIsRecurringLabel = document.getElementById('editIsRecurringLabel');
        const editInvestmentFieldsDiv = document.getElementById('editInvestmentFields');
        const editAssetNameInput = document.getElementById('editAssetName');
        const editQuantityInput = document.getElementById('editQuantity');
        const editPurchasePriceInput = document.getElementById('editPurchasePrice');

        // 編輯頁面幣別相關元素
        const editInvestmentCurrencySelect = document.getElementById('editInvestmentCurrency');
        const editPurchasePriceCurrencyDisplay = document.getElementById('editPurchasePriceCurrencyDisplay');
        const editCurrencyExchangeHint = document.getElementById('editCurrencyExchangeHint'); // 取得提示訊息元素


        // 監聽編輯頁面幣別選擇變化，更新提示
        editInvestmentCurrencySelect.addEventListener('change', () => {
            editPurchasePriceCurrencyDisplay.textContent = ` (${editInvestmentCurrencySelect.value})`;
            if (editInvestmentCurrencySelect.value === 'TWD') {
                editCurrencyExchangeHint.style.display = 'none';
            } else {
                editCurrencyExchangeHint.style.display = 'block';
            }
        });


        // 動態調整編輯表單的分類和欄位
        function handleEditTransactionTypeChange() {
            const selectedType = editTypeEl.value;
            editCategoryEl.innerHTML = '<option value="">請選擇</option>';

            if (selectedType === 'income') {
                incomeCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    editCategoryEl.appendChild(option);
                });
                editInvestmentFieldsDiv.style.display = 'none';
                editDescriptionEl.placeholder = '';
                editIsRecurringLabel.textContent = '是否為固定收支 (每月自動計算)';
                editIsRecurringEl.name = 'isRecurring';
                // isRecurring 狀態會由 openEditModal 設定，這裡不重設 checked
            } else if (selectedType === 'expense') {
                standardCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    editCategoryEl.appendChild(option);
                });
                editInvestmentFieldsDiv.style.display = 'none';
                editDescriptionEl.placeholder = '';
                editIsRecurringLabel.textContent = '是否為固定收支 (每月自動計算)';
                editIsRecurringEl.name = 'isRecurring';
            } else if (selectedType === 'investment') {
                investmentCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    editCategoryEl.appendChild(option);
                });
                editInvestmentFieldsDiv.style.display = 'block';
                editDescriptionEl.placeholder = '額外備註 (例如：交易平台、長期目標)';
                editIsRecurringLabel.textContent = '是否定期定額 (每月自動投資)';
                editIsRecurringEl.name = 'isRegularInvestment'; // 修改名稱
                // 編輯時，也需要根據已選幣別更新提示
                editPurchasePriceCurrencyDisplay.textContent = ` (${editInvestmentCurrencySelect.value})`;
                if (editInvestmentCurrencySelect.value === 'TWD') {
                    editCurrencyExchangeHint.style.display = 'none';
                } else {
                    editCurrencyExchangeHint.style.display = 'block';
                }
            }
        }
        editTypeEl.addEventListener('change', handleEditTransactionTypeChange);


        function openEditModal(transactionId) {
            const transactionToEdit = mockTransactions.find(t => t.id === transactionId);

            if (!transactionToEdit) {
                alert('找不到該筆交易！');
                return;
            }

            // 預填表單資料
            editTransactionIdEl.value = transactionToEdit.id;
            editTypeEl.value = transactionToEdit.type;

            // 根據類型調整分類選項和顯示/隱藏投資欄位
            handleEditTransactionTypeChange(); // 先呼叫以初始化分類和欄位顯示

            editCategoryEl.value = transactionToEdit.category;
            // 編輯時顯示的金額也應該是整數
            editAmountEl.value = Math.round(transactionToEdit.amount);
            editDateEl.value = transactionToEdit.date;
            editDescriptionEl.value = transactionToEdit.description;

            // 處理投資專屬欄位
            if (transactionToEdit.type === 'investment' && transactionToEdit.investmentDetails) {
                editAssetNameInput.value = transactionToEdit.investmentDetails.assetName || '';
                editQuantityInput.value = transactionToEdit.investmentDetails.quantity || '';
                editPurchasePriceInput.value = transactionToEdit.investmentDetails.purchasePrice || '';
                editInvestmentCurrencySelect.value = transactionToEdit.investmentDetails.currency || 'TWD'; // 設定幣別
                editIsRecurringEl.checked = transactionToEdit.investmentDetails.isRegularInvestment || false;

                // 預填完畢後，再次觸發幣別變更事件，以正確顯示提示
                editPurchasePriceCurrencyDisplay.textContent = ` (${editInvestmentCurrencySelect.value})`;
                if (editInvestmentCurrencySelect.value === 'TWD') {
                    editCurrencyExchangeHint.style.display = 'none';
                } else {
                    editCurrencyExchangeHint.style.display = 'block';
                }

            } else {
                editAssetNameInput.value = '';
                editQuantityInput.value = '';
                editPurchasePriceInput.value = '';
                editInvestmentCurrencySelect.value = 'TWD'; // 非投資，重設為預設
                editPurchasePriceCurrencyDisplay.textContent = ' (TWD)';
                editCurrencyExchangeHint.style.display = 'none';
                editIsRecurringEl.checked = transactionToEdit.isRecurring || false;
            }


            // 如果是自動生成的交易，不允許修改 isRecurring 狀態，或甚至不允許編輯某些欄位
            if (transactionToEdit.recurringOriginalId !== null) {
                editIsRecurringEl.disabled = true; // 禁用 isRecurring/isRegularInvestment
                editTypeEl.disabled = true; // 類型也不可改
            } else {
                editIsRecurringEl.disabled = false;
                editTypeEl.disabled = false;
            }


            editTransactionModal.style.display = 'block'; // 顯示 Modal
            editTransactionMessage.style.display = 'none'; // 隱藏之前的提示
        }

        // 關閉 Modal 的事件
        closeButton.addEventListener('click', () => {
            editTransactionModal.style.display = 'none';
        });

        // 點擊 Modal 外部關閉 Modal
        window.addEventListener('click', (event) => {
            if (event.target === editTransactionModal) {
                editTransactionModal.style.display = 'none';
            }
        });

        // 處理編輯表單提交
        editTransactionForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const idToUpdate = parseInt(editTransactionIdEl.value);
            const updatedType = editTypeEl.value;
            const updatedCategory = editCategoryEl.value;
            // 將更新後的金額轉換為整數
            const updatedAmount = Math.round(parseFloat(editAmountEl.value));
            const updatedDate = editDateEl.value;
            const updatedDescription = editDescriptionEl.value;

            let updatedIsRecurring = false;
            let updatedInvestmentDetails = null;

            if (updatedType === 'investment') {
                updatedIsRecurring = editIsRecurringEl.checked;
                updatedInvestmentDetails = {
                    assetName: editAssetNameInput.value,
                    quantity: parseFloat(editQuantityInput.value) || 0,
                    purchasePrice: parseFloat(editPurchasePriceInput.value) || 0,
                    currency: editInvestmentCurrencySelect.value, // 更新幣別
                    isRegularInvestment: updatedIsRecurring
                };

                if (!updatedInvestmentDetails.assetName) {
                    showMessage('投資類型請填寫標的名稱。', 'error', editTransactionMessage);
                    return;
                }
                if (isNaN(updatedInvestmentDetails.quantity) || updatedInvestmentDetails.quantity < 0) {
                     showMessage('購買數量不能為負數。', 'error', editTransactionMessage);
                     return;
                }
                if (isNaN(updatedInvestmentDetails.purchasePrice) || updatedInvestmentDetails.purchasePrice < 0) {
                     showMessage('購買價格不能為負數。', 'error', editTransactionMessage);
                     return;
                }

            } else {
                updatedIsRecurring = editIsRecurringEl.checked;
            }

            if (updatedAmount <= 0 || isNaN(updatedAmount)) {
                showMessage('金額必須大於零。', 'error', editTransactionMessage);
                return;
            }
            if (!updatedCategory) {
                showMessage('請選擇分類。', 'error', editTransactionMessage);
                return;
            }

            // 找到要更新的交易
            const transactionIndex = mockTransactions.findIndex(t => t.id === idToUpdate);

            if (transactionIndex > -1) {
                // 更新該交易的屬性
                mockTransactions[transactionIndex].type = updatedType;
                mockTransactions[transactionIndex].category = updatedCategory;
                mockTransactions[transactionIndex].amount = updatedAmount; // 已是整數
                mockTransactions[transactionIndex].date = updatedDate;
                mockTransactions[transactionIndex].description = updatedDescription;

                // 只有當這筆不是自動生成的記錄時，才允許修改 isRecurring/isRegularInvestment
                if (mockTransactions[transactionIndex].recurringOriginalId === null) {
                    // 根據類型設定 isRecurring 狀態
                    if (updatedType === 'investment') {
                        mockTransactions[transactionIndex].isRecurring = false; // 投資類型不使用主 isRecurring
                        mockTransactions[transactionIndex].investmentDetails = updatedInvestmentDetails;
                    } else {
                        mockTransactions[transactionIndex].isRecurring = updatedIsRecurring;
                        mockTransactions[transactionIndex].investmentDetails = null; // 非投資則清空
                    }
                } else {
                    // 如果是自動生成的記錄，則只更新投資細節，不改變 isRegularInvestment 狀態
                    if (updatedType === 'investment') {
                        mockTransactions[transactionIndex].investmentDetails = {
                            assetName: updatedInvestmentDetails.assetName,
                            quantity: updatedInvestmentDetails.quantity,
                            purchasePrice: updatedInvestmentDetails.purchasePrice,
                            currency: updatedInvestmentDetails.currency, // 自動生成記錄的投資細節，也要更新幣別
                            isRegularInvestment: mockTransactions[transactionIndex].investmentDetails.isRegularInvestment
                        };
                    } else {
                        mockTransactions[transactionIndex].investmentDetails = null;
                    }
                }

                mockTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)); // 重新排序

                showMessage('交易更新成功！', 'success', editTransactionMessage);

                // 延遲關閉 Modal 以便用戶看到成功消息
                setTimeout(() => {
                    editTransactionModal.style.display = 'none';
                    fetchTransactions(); // 重新渲染表格
                    renderDashboard(); // 更新儀表板數據
                }, 1000);

            } else {
                showMessage('更新失敗：找不到該筆交易。', 'error', editTransactionMessage);
            }
        });

        // --- 債務管理功能 ---
        const addDebtForm = document.getElementById('addDebtForm');
        const addDebtMessage = document.getElementById('addDebtMessage');
        const allDebtsTableBody = document.getElementById('allDebtsTableBody');
        const noDebtsMessage = document.getElementById('noDebtsMessage');

        // 新增債務
        addDebtForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('debtName').value;
            const originalAmount = Math.round(parseFloat(document.getElementById('debtOriginalAmount').value));
            const dueDate = document.getElementById('debtDueDate').value;
            const frequency = document.getElementById('debtFrequency').value;
            const description = document.getElementById('debtDescription').value;

            if (originalAmount <= 0 || isNaN(originalAmount)) {
                showMessage('原始金額必須大於零。', 'error', addDebtMessage);
                return;
            }
            if (!name) {
                showMessage('請填寫債務名稱。', 'error', addDebtMessage);
                return;
            }

            const newDebt = {
                id: nextDebtId++,
                name,
                originalAmount,
                paidAmount: 0,
                dueDate,
                frequency,
                status: 'active', // 預設為活動狀態
                description,
                nextPaymentDate: dueDate // 首次還款日即為下次還款日
            };

            mockDebts.push(newDebt);
            showMessage('債務新增成功！', 'success', addDebtMessage);
            addDebtForm.reset();
            document.getElementById('debtDueDate').valueAsDate = new Date(); // 重設日期

            renderAllDebtsTable(); // 更新債務列表
            renderDashboard(); // 更新儀表板數據
        });

        // 渲染所有債務表格
        function renderAllDebtsTable() {
            allDebtsTableBody.innerHTML = '';
            const today = new Date().toISOString().split('T')[0];

            if (mockDebts.length > 0) {
                noDebtsMessage.style.display = 'none';
                mockDebts.forEach(d => {
                    const remainingAmount = d.originalAmount - d.paidAmount;
                    let statusText = '';
                    let statusClass = '';

                    if (d.status === 'paid') {
                        statusText = '已清償';
                        statusClass = 'status-paid';
                    } else if (remainingAmount <= 0) { // 處理已還清但狀態不是 'paid' 的情況
                        statusText = '已清償';
                        statusClass = 'status-paid';
                        d.status = 'paid'; // 同步更新數據狀態
                    } else if (d.nextPaymentDate && d.nextPaymentDate < today) {
                        statusText = '已逾期';
                        statusClass = 'status-overdue';
                    } else {
                        statusText = '活動中';
                        statusClass = 'status-active';
                    }

                    const row = document.createElement('tr');
                    row.classList.add(statusClass);
                    row.innerHTML = `
                        <td>${d.name}</td>
                        <td>NT$ ${Math.round(d.originalAmount).toLocaleString('zh-TW')}</td>
                        <td>NT$ ${Math.round(d.paidAmount).toLocaleString('zh-TW')}</td>
                        <td>NT$ ${Math.round(remainingAmount).toLocaleString('zh-TW')}</td>
                        <td>${d.nextPaymentDate || '-'}</td>
                        <td>${statusText}</td>
                        <td class="action-buttons">
                            ${d.status === 'active' ? `<button class="record-payment-btn" data-id="${d.id}">記錄還款</button>` : ''}
                            ${d.status === 'active' ? `<button class="clear-debt-btn" data-id="${d.id}">清償</button>` : ''}
                        </td>
                    `;
                    allDebtsTableBody.appendChild(row);
                });
            } else {
                noDebtsMessage.style.display = 'block';
                allDebtsTableBody.innerHTML = '<tr><td colspan="7">目前沒有債務記錄。</td></tr>';
            }
        }

        // 債務列表操作 (記錄還款 & 清償)
        allDebtsTableBody.addEventListener('click', (event) => {
            const debtId = parseInt(event.target.dataset.id);
            if (event.target.classList.contains('record-payment-btn')) {
                openRecordPaymentModal(debtId);
            } else if (event.target.classList.contains('clear-debt-btn')) {
                if (confirm('確定要將這筆債務標記為已清償嗎？')) {
                    const debt = mockDebts.find(d => d.id === debtId);
                    if (debt) {
                        debt.paidAmount = debt.originalAmount; // 假設清償就是一次還清所有欠款
                        debt.status = 'paid';
                        debt.nextPaymentDate = null; // 清償後就沒有下次還款日
                        showMessage('債務已清償！', 'success', noDebtsMessage);
                        renderAllDebtsTable();
                        renderDashboard();
                    }
                }
            }
        });

        // 儀表板上的即將到期債務列表的還款按鈕事件
        upcomingDebtsDetailsDiv.addEventListener('click', (event) => {
             if (event.target.classList.contains('record-payment-btn')) {
                const debtId = parseInt(event.target.dataset.id);
                openRecordPaymentModal(debtId);
            } else if (event.target.classList.contains('clear-debt-btn')) {
                if (confirm('確定要將這筆債務標記為已清償嗎？')) {
                    const debtId = parseInt(event.target.dataset.id);
                    const debt = mockDebts.find(d => d.id === debtId);
                    if (debt) {
                        debt.paidAmount = debt.originalAmount;
                        debt.status = 'paid';
                        debt.nextPaymentDate = null;
                        showMessage('債務已清償！', 'success', upcomingDebtsDetailsDiv); // 使用不同的訊息元素
                        renderDashboard(); // 重新渲染儀表板會更新即將到期債務
                        renderAllDebtsTable(); // 也更新所有債務列表
                    }
                }
            }
        });


        // 記錄還款 Modal
        const recordPaymentModal = document.getElementById('recordPaymentModal');
        const closeRecordPaymentModalButton = document.getElementById('closeRecordPaymentModal');
        const recordPaymentForm = document.getElementById('recordPaymentForm');
        const recordPaymentDebtIdInput = document.getElementById('recordPaymentDebtId');
        const paymentAmountInput = document.getElementById('paymentAmount');
        const paymentDateInput = document.getElementById('paymentDate');
        const recordPaymentMessage = document.getElementById('recordPaymentMessage');

        function openRecordPaymentModal(debtId) {
            const debtToPay = mockDebts.find(d => d.id === debtId);
            if (!debtToPay) {
                alert('找不到該筆債務！');
                return;
            }

            recordPaymentDebtIdInput.value = debtToPay.id;
            paymentAmountInput.value = ''; // 清空上次輸入
            paymentDateInput.valueAsDate = new Date(); // 預設為今天

            recordPaymentModal.style.display = 'block';
            recordPaymentMessage.style.display = 'none';
        }

        closeRecordPaymentModalButton.addEventListener('click', () => {
            recordPaymentModal.style.display = 'none';
        });

        recordPaymentModal.addEventListener('click', (event) => {
            if (event.target === recordPaymentModal) {
                recordPaymentModal.style.display = 'none';
            }
        });

        recordPaymentForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const debtId = parseInt(recordPaymentDebtIdInput.value);
            const paymentAmount = Math.round(parseFloat(paymentAmountInput.value));
            const paymentDate = paymentDateInput.value;

            if (paymentAmount <= 0 || isNaN(paymentAmount)) {
                showMessage('還款金額必須大於零。', 'error', recordPaymentMessage);
                return;
            }

            const debt = mockDebts.find(d => d.id === debtId);

            if (debt) {
                if (debt.paidAmount + paymentAmount > debt.originalAmount) {
                    // 如果還款金額超過尚欠金額，可以選擇只還清剩餘部分
                    const confirmOverflow = confirm(`本次還款金額將超過尚欠金額。是否只還清剩餘的 NT$ ${Math.round(debt.originalAmount - debt.paidAmount).toLocaleString('zh-TW')} 並將債務標記為已清償？`);
                    if (confirmOverflow) {
                        debt.paidAmount = debt.originalAmount;
                        debt.status = 'paid';
                        debt.nextPaymentDate = null;
                    } else {
                        // 取消操作
                        return;
                    }
                } else {
                    debt.paidAmount += paymentAmount;
                    // 更新下次還款日 (假設是按月，則每次還款後更新到下個月)
                    if (debt.frequency === 'monthly') {
                        let nextDate = new Date(paymentDate);
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        debt.nextPaymentDate = nextDate.toISOString().split('T')[0];
                    } else if (debt.frequency === 'quarterly') {
                        let nextDate = new Date(paymentDate);
                        nextDate.setMonth(nextDate.getMonth() + 3);
                        debt.nextPaymentDate = nextDate.toISOString().split('T')[0];
                    } else if (debt.frequency === 'yearly') {
                        let nextDate = new Date(paymentDate);
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                        debt.nextPaymentDate = nextDate.toISOString().split('T')[0];
                    }
                    // 如果已還清
                    if (debt.paidAmount >= debt.originalAmount) {
                        debt.status = 'paid';
                        debt.nextPaymentDate = null;
                    }
                }

                // 同時記錄到交易紀錄中，作為一筆支出
                const newTransaction = {
                    id: nextTransactionId++,
                    type: 'expense',
                    category: '債務還款',
                    amount: paymentAmount,
                    date: paymentDate,
                    description: `${debt.name} 還款`,
                    isRecurring: false,
                    recurringOriginalId: null,
                    investmentDetails: null
                };
                mockTransactions.push(newTransaction);
                mockTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));


                showMessage('還款記錄成功！', 'success', recordPaymentMessage);
                setTimeout(() => {
                    recordPaymentModal.style.display = 'none';
                    renderAllDebtsTable(); // 更新所有債務列表
                    renderDashboard(); // 更新儀表板數據和即將到期債務
                }, 1000);

            } else {
                showMessage('記錄還款失敗：找不到該筆債務。', 'error', recordPaymentMessage);
            }
        });


        // --- 初始化頁面 ---
        document.addEventListener('DOMContentLoaded', () => {
            // 在頁面載入時，先執行檢查並生成固定收支/定期定額
            checkAndGenerateRecurringTransactions();
            // 在載入時，更新債務的 nextPaymentDate 和 status
            updateDebtStatusesAndNextPaymentDates();

            // 預設載入儀表板
            document.getElementById('dashboard').classList.add('active');
            document.querySelector('.tab-button[data-tab="dashboard"]').classList.add('active');
            renderDashboard(); // 這裡會自動調用 showCurrentTransactionContent 和 showCurrentChart

            // 設定新增交易日期輸入框的預設值為今天
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').value = today;
            document.getElementById('startDate').value = ''; // 清空預設值
            document.getElementById('endDate').value = ''; // 清空預設值
        });

        // 每次載入時檢查並更新債務的 nextPaymentDate 和 status
        function updateDebtStatusesAndNextPaymentDates() {
            const today = new Date();
            mockDebts.forEach(debt => {
                if (debt.status === 'paid') return; // 已清償的債務不需要更新

                const remainingAmount = debt.originalAmount - debt.paidAmount;
                if (remainingAmount <= 0) {
                    debt.status = 'paid';
                    debt.nextPaymentDate = null;
                    return;
                }

                if (debt.nextPaymentDate) {
                    let currentNextPaymentDate = new Date(debt.nextPaymentDate);
                    // 如果設定的下次還款日已經過去，則將其更新到最近的未來日期
                    while (currentNextPaymentDate < today) {
                        if (debt.frequency === 'monthly') {
                            currentNextPaymentDate.setMonth(currentNextPaymentDate.getMonth() + 1);
                        } else if (debt.frequency === 'quarterly') {
                            currentNextPaymentDate.setMonth(currentNextPaymentDate.getMonth() + 3);
                        } else if (debt.frequency === 'yearly') {
                            currentNextPaymentDate.setFullYear(currentNextPaymentDate.getFullYear() + 1);
                        } else { // 'one-time' 或其他未定義頻率
                            break; // 不再更新
                        }
                    }
                    debt.nextPaymentDate = currentNextPaymentDate.toISOString().split('T')[0];
                }
            });
        }