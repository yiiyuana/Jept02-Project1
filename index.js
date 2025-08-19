// index.js
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

// 交易記錄頁面
app.get("/history", async (req, res) => {
  res.locals.pageName = "history";
  res.render("history", { title: "交易記錄" });
});

// 編輯交易頁面
app.get("/edit-transaction", async (req, res) => {
  res.locals.pageName = "add-transaction";
  res.render("add-transaction", { title: "編輯交易" });
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

// API 路由 - 取得所有交易記錄 (可篩選)
app.get("/api/history", async (req, res) => {
  const { type, category, startDate, endDate } = req.query;
  let sql = "SELECT * FROM transactions WHERE 1=1";
  const params = [];

  if (type && type !== "all") {
    sql += " AND type = ?";
    params.push(type);
  }
  if (category && category !== "all") {
    sql += " AND category = ?";
    params.push(category);
  }
  if (startDate) {
    sql += " AND date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND date <= ?";
    params.push(endDate);
  }
  sql += " ORDER BY date DESC, id DESC";

  try {
    const [rows] = await db.query(sql, params);
    const data = {
      transactions: rows,
    };
    res.json({ success: true, data });
  } catch (ex) {
    res.json({ success: false, error: ex.message });
  }
});

// API 路由 - 取得單一交易
app.get("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM transactions WHERE id = ?";
  try {
    const [rows] = await db.query(sql, [id]);
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] });
    } else {
      res.json({ success: false, error: "交易記錄不存在" });
    }
  } catch (ex) {
    res.json({ success: false, error: ex.message });
  }
});

// API 路由 - 新增交易
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
    values[1] = investmentDetails.investmentCurrency;
  }

  try {
    const [result] = await db.query(sql, values);
    res.json({ success: true, insertId: result.insertId });
  } catch (ex) {
    res.json({ success: false, error: ex.message });
  }
});

// API 路由 - 更新交易
app.put("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
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
    "UPDATE transactions SET type=?, category=?, amount=?, date=?, description=?, isRecurring=?, investment_details=? WHERE id=?";
  let values = [
    type,
    category,
    amount,
    date,
    description,
    isRecurring ? 1 : 0,
    investmentDetails ? JSON.stringify(investmentDetails) : null,
    id,
  ];
  if (type === "investment" && investmentDetails) {
    values[1] = investmentDetails.investmentCurrency;
  }
  try {
    const [result] = await db.query(sql, values);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "交易記錄不存在或沒有改變" });
    }
  } catch (ex) {
    res.json({ success: false, error: ex.message });
  }
});

// API 路由 - 刪除交易
app.delete("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM transactions WHERE id = ?";
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "交易記錄不存在或已被刪除" });
    }
  } catch (ex) {
    res.json({ success: false, error: ex.message });
  }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器正在 http://localhost:${PORT} 運作...`);
});