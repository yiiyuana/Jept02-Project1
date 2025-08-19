// public/main.js
const addTransactionForm = document.getElementById("addTransactionForm");
const typeSelect = document.getElementById("type");
const categorySelect = document.getElementById("category");
const investmentFields = document.getElementById("investmentFields");
const addTransactionMessage = document.getElementById("addTransactionMessage");

const categories = {
  expense: ["餐飲", "交通", "購物", "娛樂", "教育", "醫療", "居家", "其他"],
  income: ["薪資", "投資收益", "禮金", "獎金", "其他"],
  investment: ["股票", "加密貨幣", "基金", "黃金", "房地產", "其他投資"],
};

let expenseChartInstance;
let investmentPortfolioChartInstance;
let currentChartIndex = 0;
const totalAssetsEl = document.getElementById("totalAssets");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const totalInvestmentEl = document.getElementById("totalInvestment");
const balanceEl = document.getElementById("balance");
const recentTransactionListEl = document.getElementById(
  "recentTransactionList"
);
const portfolioTableBodyEl = document.getElementById("portfolioTableBody");
const charts = document.querySelectorAll(".chart-display canvas");
const prevChartBtn = document.getElementById("prevChart");
const nextChartBtn = document.getElementById("nextChart");
const prevTransactionBtn = document.getElementById("prevTransactionContent");
const nextTransactionBtn = document.getElementById("nextTransactionContent");
const transactionContents = document.querySelectorAll(
  ".transaction-display > div"
);
let currentTransactionContentIndex = 0;

function switchTransactionContent(direction) {
  if (!transactionContents.length) return;
  transactionContents[currentTransactionContentIndex].classList.remove(
    "active-transaction-content"
  );
  transactionContents[currentTransactionContentIndex].classList.add(
    "hidden-transaction-content"
  );
  currentTransactionContentIndex += direction;
  if (currentTransactionContentIndex >= transactionContents.length) {
    currentTransactionContentIndex = 0;
  } else if (currentTransactionContentIndex < 0) {
    currentTransactionContentIndex = transactionContents.length - 1;
  }
  transactionContents[currentTransactionContentIndex].classList.remove(
    "hidden-transaction-content"
  );
  transactionContents[currentTransactionContentIndex].classList.add(
    "active-transaction-content"
  );
}
if (prevTransactionBtn && nextTransactionBtn) {
  prevTransactionBtn.addEventListener("click", () =>
    switchTransactionContent(-1)
  );
  nextTransactionBtn.addEventListener("click", () =>
    switchTransactionContent(1)
  );
}
function updateCategoryOptions() {
  if (!typeSelect || !categorySelect) return;
  const selectedType = typeSelect.value;
  const categoryOptions = categories[selectedType] || [];
  categorySelect.innerHTML = '<option value="">請選擇</option>';
  categoryOptions.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  if (selectedType === "investment") {
    investmentFields.style.display = "block";
    categorySelect.required = false;
  } else {
    investmentFields.style.display = "none";
    categorySelect.required = true;
  }
}
function formatCurrency(number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(number);
}

async function renderDashboard() {
  console.log("正在嘗試渲染儀表板...");
  try {
    const response = await fetch("/api/dashboard");
    const result = await response.json();
    console.log("從 /api/dashboard 取得的資料：", result);
    if (result.success) {
      const transactions = result.data.transactions;
      let totalAssets = 0,
        totalIncome = 0,
        totalExpense = 0,
        totalInvestment = 0,
        balance = 0;
      let expenseData = {},
        investmentPortfolio = {};
      transactions.forEach((t) => {
        const amount = parseFloat(t.amount);
        switch (t.type) {
          case "income":
            totalIncome += amount;
            balance += amount;
            break;
          case "expense":
            totalExpense += amount;
            balance -= amount;
            expenseData[t.category] = (expenseData[t.category] || 0) + amount;
            break;
          case "investment":
            totalInvestment += amount;
            totalAssets += amount;
            if (t.investment_details) {
              let details =
                typeof t.investment_details === "string"
                  ? JSON.parse(t.investment_details)
                  : t.investment_details;
              const assetName = details?.assetName || "未知標的";
              investmentPortfolio[assetName] =
                (investmentPortfolio[assetName] || 0) + amount;
            }
            break;
        }
      });
      totalAssets += balance;
      if (totalAssetsEl)
        totalAssetsEl.textContent = totalAssets.toLocaleString();
      if (totalIncomeEl)
        totalIncomeEl.textContent = totalIncome.toLocaleString();
      if (totalExpenseEl)
        totalExpenseEl.textContent = totalExpense.toLocaleString();
      if (totalInvestmentEl)
        totalInvestmentEl.textContent = totalInvestment.toLocaleString();
      if (balanceEl) balanceEl.textContent = balance.toLocaleString();
      renderRecentTransactions(transactions);
      renderInvestmentPortfolioTable(transactions);
      if (document.getElementById("expenseChart")) {
        renderExpenseChart(expenseData);
        renderInvestmentPortfolioChart(investmentPortfolio);
      }
    } else {
      console.error("Failed to fetch dashboard data:", result.error);
    }
  } catch (ex) {
    console.error("Error fetching dashboard data:", ex);
  }
}
function renderRecentTransactions(transactions) {
  if (!recentTransactionListEl) return;
  if (transactions.length === 0) {
    recentTransactionListEl.innerHTML = "<p>目前沒有近期交易。</p>";
    return;
  }
  const recentList = transactions
    .slice(0, 5)
    .map((t) => {
      const amountDisplay =
        t.type === "expense"
          ? `-${t.amount.toLocaleString()}`
          : `+${t.amount.toLocaleString()}`;
      return `
            <div class="transaction-item">
                <span>${t.date}</span>
                <span>${t.category}</span>
                <span class="${t.type}">${amountDisplay}</span>
                <span>${t.description || ""}</span>
            </div>
        `;
    })
    .join("");
  recentTransactionListEl.innerHTML = recentList;
}

function renderInvestmentPortfolioTable(transactions) {
  if (!portfolioTableBodyEl) return;
  const investmentTransactions = transactions.filter(
    (t) => t.type === "investment"
  );
  if (investmentTransactions.length === 0) {
    portfolioTableBodyEl.innerHTML =
      '<tr><td colspan="4">目前沒有投資交易</td></tr>';
    return;
  }
  const tableRows = investmentTransactions
    .map((t) => {
      let details =
        typeof t.investment_details === "string"
          ? JSON.parse(t.investment_details)
          : t.investment_details;
      const assetName = details?.assetName || "未知標的";
      const amount = parseFloat(t.amount);
      return `
            <tr>
                <td>${t.date}</td>
                <td>${assetName}</td>
                <td>${amount.toLocaleString()}</td>
                <td>${t.description || ""}</td>
            </tr>
        `;
    })
    .join("");
  portfolioTableBodyEl.innerHTML = tableRows;
}
function renderExpenseChart(data) {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  if (expenseChartInstance) {
    expenseChartInstance.destroy();
  }
  expenseChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#E7E9ED",
            "#A1D9D9",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "支出類別分佈" },
      },
    },
  });
}
function renderInvestmentPortfolioChart(data) {
  const ctx = document
    .getElementById("investmentPortfolioChart")
    .getContext("2d");
  if (investmentPortfolioChartInstance) {
    investmentPortfolioChartInstance.destroy();
  }
  investmentPortfolioChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#E7E9ED",
            "#A1D9D9",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "投資組合分佈" },
      },
    },
  });
}
function switchChart(direction) {
  if (!charts.length) return;
  charts[currentChartIndex].classList.remove("active-chart");
  charts[currentChartIndex].classList.add("hidden-chart");
  currentChartIndex += direction;
  if (currentChartIndex >= charts.length) {
    currentChartIndex = 0;
  } else if (currentChartIndex < 0) {
    currentChartIndex = charts.length - 1;
  }
  charts[currentChartIndex].classList.remove("hidden-chart");
  charts[currentChartIndex].classList.add("active-chart");
}
if (prevChartBtn && nextChartBtn) {
  prevChartBtn.addEventListener("click", () => switchChart(-1));
  nextChartBtn.addEventListener("click", () => switchChart(1));
}
if (addTransactionForm) {
  updateCategoryOptions();
  typeSelect.addEventListener("change", updateCategoryOptions);
  addTransactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addTransactionForm);
    const data = Object.fromEntries(formData.entries());
    if (data.type === "investment") {
      const investmentDetails = {
        category: categorySelect.value,
        assetName: data.assetName,
        investmentCurrency: data.investmentCurrency,
        isRegularInvestment: data.isRegularInvestment === "on",
      };
      data.investmentDetails = investmentDetails;
      delete data.assetName;
      delete data.investmentCurrency;
      delete data.isRegularInvestment;
      delete data.category;
    } else {
      delete data.assetName;
      delete data.investmentCurrency;
      delete data.isRegularInvestment;
    }
    data.isRecurring = data.isRecurring === "on";
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        if (addTransactionMessage) {
          addTransactionMessage.textContent = "新增交易成功！";
          addTransactionMessage.style.color = "green";
        }
        addTransactionForm.reset();
        updateCategoryOptions();
        if (document.getElementById("dashboard")) {
          renderDashboard();
        }
      } else {
        if (addTransactionMessage) {
          addTransactionMessage.textContent = "新增交易失敗：" + result.error;
          addTransactionMessage.style.color = "red";
        }
      }
    } catch (ex) {
      if (addTransactionMessage) {
        addTransactionMessage.textContent = "新增交易失敗，請稍後再試。";
        addTransactionMessage.style.color = "red";
      }
      console.error("發生錯誤:", ex);
    }
  });
}

async function renderHistoryPage() {
  const tableBody = document.getElementById("transactionTableBody");
  if (!tableBody) {
    console.error(
      "錯誤：未找到 transactionTableBody 元素！請檢查您的 history.ejs 檔案。"
    );
    return;
  }

  try {
    const response = await fetch("/api/dashboard");
    const result = await response.json();
    if (result.success) {
      const transactions = result.data.transactions;
      let tableRows = "";
      if (transactions.length === 0) {
        tableRows = '<tr><td colspan="9">目前沒有任何交易紀錄。</td></tr>';
      } else {
        tableRows = transactions
          .map((t) => {
            // 處理金額、說明/標的、數量、價格、是否固定等顯示內容
            let amountDisplay = `NT$${t.amount.toLocaleString()}`;
            let categoryDisplay = t.category || "";
            let descriptionDisplay = t.description || "";
            let quantityDisplay = "";
            let priceDisplay = "";
            let isRecurringDisplay = t.isRecurring ? "是" : "否";

            if (t.type === "investment") {
              try {
                const details = t.investment_details
                  ? JSON.parse(t.investment_details)
                  : {};

                // 更新投資交易的顯示內容
                categoryDisplay = details.category || "投資";
                descriptionDisplay = details.assetName || "";
                quantityDisplay = details.quantity
                  ? details.quantity.toLocaleString()
                  : "";
                priceDisplay = details.price
                  ? details.price.toLocaleString()
                  : "";
              } catch (e) {
                console.error("解析 investment_details 失敗:", e);
              }
            } else if (t.type === "expense") {
              amountDisplay = `-NT$${t.amount.toLocaleString()}`;
            }

            return `
              <tr>
                <td>${t.date}</td>
                <td>${t.type}</td>
                <td>${categoryDisplay}</td>
                <td>${descriptionDisplay}</td>
                <td>${quantityDisplay}</td>
                <td>${priceDisplay}</td>
                <td>${amountDisplay}</td>
                <td>${isRecurringDisplay}</td>
                <td>
                  <button class="edit-btn" data-id="${t.id}">編輯</button>
                  <button class="delete-btn" data-id="${t.id}">刪除</button>
                </td>
              </tr>
            `;
          })
          .join("");
      }
      tableBody.innerHTML = tableRows;
    } else {
      console.error("Failed to fetch history data:", result.error);
      tableBody.innerHTML = '<tr><td colspan="9">載入交易紀錄失敗。</td></tr>';
    }
  } catch (ex) {
    console.error("Error fetching history data:", ex);
    tableBody.innerHTML = '<tr><td colspan="9">載入交易紀錄失敗。</td></tr>';
  }
}

if (document.getElementById("dashboard")) {
  renderDashboard();
}
if (document.getElementById("history")) {
  renderHistoryPage();
}
