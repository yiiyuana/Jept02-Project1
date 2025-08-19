// index.js (完整且修正後的版本)
import express from "express";
import "dotenv/config";
import db from "./utils/connect-mysql.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import expressLayouts from "express-ejs-layouts";

const app = express();

// 設定 EJS 和 Layouts
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("views", "views");
app.set("layout", "layout");

// 設定靜態內容資料夾
app.use(express.static("public"));

// 使用 cookie 和 session
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    saveUninitialized: false,
    resave: false,
  })
);

// 頂層的中間件
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 自訂中間件，用於傳遞變數給所有 EJS 模板
app.use((req, res, next) => {
  res.locals.pageName = "";
  res.locals.session = req.session;
  next();
});

// 根路由 - 儀表板頁面
app.get("/", async (req, res) => {
  res.locals.pageName = "dashboard";
  res.render("dashboard", { title: "儀表板" });
});

// 新增交易頁面
app.get("/add-transaction", async (req, res) => {
  res.locals.pageName = "add-transaction";
  res.render("add-transaction", { title: "新增交易" });
});

// 交易記錄頁面 (已修正)
app.get("/history", async (req, res) => {
  res.locals.pageName = "history";
  res.render("history", { title: "交易記錄" });
});

// 債務管理頁面
app.get("/debt-management", async (req, res) => {
  res.locals.pageName = "debt-management";
  res.render("debt-management", { title: "債務管理" });
});

// API 路由 - 取得儀表板數據
app.get("/api/dashboard", async (req, res) => {
  const sql = "SELECT * FROM transactions ORDER BY date DESC, id DESC";
  try {
    const [rows] = await db.query(sql);
    const data = {
      transactions: rows,
    };
    res.json({ success: true, data });
  } catch (ex) {
    res.json({ success: false, error: ex.message });
  }
});

// API 路由 - 新增交易 (已修正邏輯)
app.post("/api/transactions", async (req, res) => {
  const {
    type,
    category,
    amount,
    date,
    description,
    isRecurring,
    investmentDetails,
  } = req.body;

  let sql =
    "INSERT INTO transactions (type, category, amount, date, description, isRecurring, investment_details) VALUES (?, ?, ?, ?, ?, ?, ?)";
  let values = [
    type,
    category,
    amount,
    date,
    description,
    isRecurring ? 1 : 0,
    investmentDetails ? JSON.stringify(investmentDetails) : null,
  ];

  if (type === "investment" && investmentDetails) {
    values[1] = investmentDetails.category;
  }

  try {
    const [result] = await db.query(sql, values);
    res.json({ success: true, newId: result.insertId });
  } catch (ex) {
    console.error("Error inserting transaction:", ex);
    res.json({ success: false, error: "交易新增失敗。" });
  }
});

// API 路由 - 債務管理 (待實作)
app.get("/api/debts", async (req, res) => {
  res.json({ success: true, data: [] });
});

app.post("/api/debts", async (req, res) => {
  res.json({ success: true });
});

// 其他可能存在的路由 (如果您的專案中有的話)
// app.use("/admin2", admin2Router);
// app.use("/ab", abRouter);

// 其他您專案中可能存在的路由，請自行保留

// 404 頁面處理
app.use((req, res) => {
  res.status(404).send(`<h2>找不到頁面</h2>`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});
