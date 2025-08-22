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
const historyTableBodyEl = document.getElementById("transactionTableBody");
const historyPage = document.getElementById("history");
const noTransactionsMessageEl = document.getElementById(
  "noTransactionsMessage"
);

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
        totalAssetsEl.textContent = formatCurrency(totalAssets);
      if (totalIncomeEl)
        totalIncomeEl.textContent = formatCurrency(totalIncome);
      if (totalExpenseEl)
        totalExpenseEl.textContent = formatCurrency(totalExpense);
      if (totalInvestmentEl)
        totalInvestmentEl.textContent = formatCurrency(totalInvestment);
      if (balanceEl) balanceEl.textContent = formatCurrency(balance);
      renderRecentTransactions(transactions);
      renderInvestmentPortfolioTable(investmentPortfolio);
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
 <span>${t.date.split("T")[0]}</span>
 <span>${t.category}</span>
 <span class="${t.type}">${amountDisplay}</span>
 <span>${t.description || ""}</span>
 </div>
 `;
    })
    .join("");
  recentTransactionListEl.innerHTML = recentList;
}
function renderInvestmentPortfolioTable(portfolio) {
  if (!portfolioTableBodyEl) return;
  const portfolioAssets = Object.keys(portfolio);
  if (portfolioAssets.length === 0) {
    portfolioTableBodyEl.innerHTML =
      '<tr><td colspan="4">目前沒有投資交易</td></tr>';
    return;
  }
  const tableRows = portfolioAssets
    .map((assetName) => {
      const amount = portfolio[assetName];
      return `
 <tr>
 <td>${assetName}</td>
 <td>${amount.toLocaleString()}</td>
 <td></td>
 <td></td>
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
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "支出類別分佈",
        },
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
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "投資組合分佈",
        },
      },
      // 已移除長條圖的 scales 選項
    },
  });
}
if (document.getElementById("dashboard")) {
  if (totalAssetsEl) {
    renderDashboard();
  }
  if (prevChartBtn && nextChartBtn) {
    prevChartBtn.addEventListener("click", () => switchChart(-1));
    nextChartBtn.addEventListener("click", () => switchChart(1));
  }
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
if (addTransactionForm) {
  // 將日期輸入欄位預設為今天的日期，但編輯交易時不更動
  const dateInput = document.getElementById("date");
  const isEditing = addTransactionForm.dataset.id;
  if (dateInput && !isEditing) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${year}-${month}-${day}`;
  }

  typeSelect.addEventListener("change", updateCategoryOptions);
  updateCategoryOptions();
  addTransactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addTransactionForm);
    const data = {
      type: formData.get("type"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description"),
      isRecurring: formData.get("isRecurring") === "on",
    };
    if (data.type === "investment") {
      data.investmentDetails = {
        assetName: formData.get("assetName"),
        investmentCurrency: formData.get("investmentCurrency"),
        quantity: formData.get("quantity"),
        price: formData.get("price"),
        isRegularInvestment: formData.get("isRegularInvestment") === "on",
      };
      // 因為投資類型沒有一般分類，將其歸類為 investmentDetails 中的類別
      data.category = formData.get("investmentCurrency");
    }
    const id = addTransactionForm.dataset.id;
    const method = id ? "PUT" : "POST";
    const url = id ? `/api/transactions/${id}` : "/api/transactions";
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        addTransactionMessage.textContent = id
          ? "交易記錄更新成功！"
          : "交易新增成功！";
        addTransactionMessage.classList.remove("error");
        addTransactionMessage.classList.add("success");
        setTimeout(() => {
          window.location.href = "/history";
        }, 1500);
      } else {
        addTransactionMessage.textContent =
          result.error || "新增交易失敗，請稍後再試。";
        addTransactionMessage.classList.remove("success");
        addTransactionMessage.classList.add("error");
      }
    } catch (ex) {
      addTransactionMessage.textContent = "新增交易失敗，請檢查網路連線。";
      addTransactionMessage.classList.remove("success");
      addTransactionMessage.classList.add("error");
    }
    addTransactionMessage.style.display = "block";
  });
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get("id");
  if (transactionId) {
    document.querySelector(".transaction-form-section h2").textContent =
      "編輯交易";
    addTransactionForm.dataset.id = transactionId;
    async function loadTransactionData() {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`);
        const result = await response.json();
        if (result.success && result.data) {
          const t = result.data;
          document.getElementById("type").value = t.type;
          updateCategoryOptions();
          document.getElementById("category").value = t.category;
          document.getElementById("amount").value = t.amount;
          document.getElementById("date").value = t.date.split("T")[0];
          document.getElementById("description").value = t.description;
          document.getElementById("isRecurring").checked = t.isRecurring;
          if (t.type === "investment") {
            const details =
              typeof t.investment_details === "string"
                ? JSON.parse(t.investment_details)
                : t.investment_details;
            if (details) {
              document.getElementById("assetName").value = details.assetName;
              document.getElementById("investmentCurrency").value =
                details.investmentCurrency;
              document.getElementById("quantity").value = details.quantity;
              document.getElementById("price").value = details.price;
              document.getElementById("isRegularInvestment").checked =
                details.isRegularInvestment;
            }
          }
        } else {
          console.error(
            "Failed to load transaction for editing:",
            result.error
          );
        }
      } catch (ex) {
        console.error("Error loading transaction data:", ex);
      }
    }
    loadTransactionData();
  }
}
if (historyPage) {
  const filterTypeSelect = document.getElementById("filterType");
  const filterCategorySelect = document.getElementById("filterCategory");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const applyFiltersBtn = document.getElementById("applyFilters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      renderTransactionHistory();
    });
  }
  filterTypeSelect.addEventListener("change", updateFilterCategoryOptions);
  function updateFilterCategoryOptions() {
    const selectedType = filterTypeSelect.value;
    const categoryOptions = categories[selectedType] || [];
    filterCategorySelect.innerHTML = '<option value="all">所有</option>';
    if (selectedType !== "all") {
      categoryOptions.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        filterCategorySelect.appendChild(option);
      });
    }
  }
  updateFilterCategoryOptions();
  async function deleteTransaction(id) {
    if (!confirm("確定要刪除這筆交易記錄嗎？")) {
      return;
    }
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        alert("刪除成功！");
        renderTransactionHistory();
      } else {
        alert("刪除失敗：" + (result.error || "未知錯誤"));
      }
    } catch (ex) {
      alert("刪除失敗，請檢查網路連線。");
    }
  }
  async function renderTransactionHistory() {
    const type = filterTypeSelect.value;
    const category = filterCategorySelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const params = new URLSearchParams();
    if (type && type !== "all") params.append("type", type);
    if (category && category !== "all") params.append("category", category);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const url = `/api/history?${params.toString()}`;
    try {
      const response = await fetch(url);
      const result = await response.json();
      const tableBody = historyTableBodyEl;
      if (result.success) {
        const transactions = result.data.transactions;
        let tableRows = "";
        if (transactions.length === 0) {
          if (noTransactionsMessageEl)
            noTransactionsMessageEl.style.display = "block";
        } else {
          if (noTransactionsMessageEl)
            noTransactionsMessageEl.style.display = "none";
          tableRows = transactions
            .map((t) => {
              const date = t.date.split("T")[0];
              const categoryDisplay =
                t.type === "investment" ? "投資" : t.category || "未分類";
              let descriptionDisplay = t.description || "";
              let quantityDisplay = "";
              let priceDisplay = "";
              let amountDisplay = "";
              const isRecurringDisplay = t.isRecurring ? "是" : "否";
              if (t.type === "investment") {
                try {
                  let details =
                    typeof t.investment_details === "string"
                      ? JSON.parse(t.investment_details)
                      : t.investment_details;
                  descriptionDisplay = details?.assetName || "未知標的";
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
              } else {
                amountDisplay = `+NT$${t.amount.toLocaleString()}`;
              }
              return `
              <tr>
                <td>${date}</td>
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

        // 監聽 edit-btn 的點擊事件
        document.querySelectorAll(".edit-btn").forEach((button) => {
          button.addEventListener("click", async (e) => {
            const id = e.target.dataset.id;
            // 顯示模態視窗
            const modal = document.getElementById("editModal");
            const modalMessage = document.getElementById("editModalMessage");
            modal.style.display = "flex";
            modalMessage.style.display = "none";
            try {
              const response = await fetch(`/api/transactions/${id}`);
              const result = await response.json();
              if (result.success && result.data) {
                const t = result.data;
                document.getElementById("editTransactionId").value = t.id;
                document.getElementById("editType").value = t.type;

                const categoryOptions = categories[t.type] || [];
                const editCategorySelect =
                  document.getElementById("editCategory");
                editCategorySelect.innerHTML = "";
                categoryOptions.forEach((cat) => {
                  const option = document.createElement("option");
                  option.value = cat;
                  option.textContent = cat;
                  editCategorySelect.appendChild(option);
                });
                document.getElementById("editCategory").value = t.category;

                document.getElementById("editAmount").value = t.amount;
                document.getElementById("editDate").value =
                  t.date.split("T")[0];
                document.getElementById("editDescription").value =
                  t.description;
                document.getElementById("editIsRecurring").checked =
                  t.isRecurring;

                const investmentFields = document.getElementById(
                  "editInvestmentFields"
                );
                if (t.type === "investment") {
                  investmentFields.style.display = "block";
                  const details =
                    typeof t.investment_details === "string"
                      ? JSON.parse(t.investment_details)
                      : t.investment_details;
                  if (details) {
                    document.getElementById("editAssetName").value =
                      details.assetName;
                    document.getElementById("editInvestmentCurrency").value =
                      details.investmentCurrency;
                    document.getElementById("editQuantity").value =
                      details.quantity;
                    document.getElementById("editPrice").value = details.price;
                    document.getElementById("editIsRegularInvestment").checked =
                      details.isRegularInvestment;
                  }
                } else {
                  investmentFields.style.display = "none";
                }
              } else {
                alert("載入交易資料失敗：" + (result.error || "未知錯誤"));
              }
            } catch (ex) {
              alert("載入交易資料失敗，請檢查網路連線。");
            }
          });
        });

        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", (e) => {
            const id = e.target.dataset.id;
            deleteTransaction(id);
          });
        });
      } else {
        console.error("Failed to fetch history data:", result.error);
        tableBody.innerHTML =
          '<tr><td colspan="9">載入交易紀錄失敗。</td></tr>';
      }
    } catch (ex) {
      console.error("Error fetching history data:", ex);
      tableBody.innerHTML = '<tr><td colspan="9">載入交易紀錄失敗。</td></tr>';
    }
  }
  renderTransactionHistory();

  // 模態視窗的事件處理
  const modal = document.getElementById("editModal");
  const closeButton = document.querySelector(".close-button");
  const cancelButton = document.querySelector(".cancel-button");
  const editTransactionForm = document.getElementById("editTransactionForm");

  if (modal && closeButton && cancelButton && editTransactionForm) {
    closeButton.addEventListener("click", () => {
      modal.style.display = "none";
    });

    cancelButton.addEventListener("click", () => {
      modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });

    editTransactionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editTransactionId").value;
      const formData = new FormData(editTransactionForm);
      const data = {
        type: formData.get("type"),
        category: formData.get("category"),
        amount: formData.get("amount"),
        date: formData.get("date"),
        description: formData.get("description"),
        isRecurring: formData.get("isRecurring") === "on",
      };

      if (data.type === "investment") {
        data.investmentDetails = {
          assetName: formData.get("assetName"),
          investmentCurrency: formData.get("investmentCurrency"),
          quantity: formData.get("quantity"),
          price: formData.get("price"),
          isRegularInvestment: formData.get("isRegularInvestment") === "on",
        };
        data.category = formData.get("investmentCurrency");
      }

      const modalMessage = document.getElementById("editModalMessage");
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.success) {
          modalMessage.textContent = "交易更新成功！";
          modalMessage.classList.remove("error");
          modalMessage.classList.add("success");
          renderTransactionHistory();
          setTimeout(() => {
            modal.style.display = "none";
          }, 1500);
        } else {
          modalMessage.textContent = result.error || "更新失敗，請稍後再試。";
          modalMessage.classList.remove("success");
          modalMessage.classList.add("error");
        }
      } catch (ex) {
        modalMessage.textContent = "更新失敗，請檢查網路連線。";
        modalMessage.classList.remove("success");
        modalMessage.classList.add("error");
      }
      modalMessage.style.display = "block";
    });
  }
}
