import express from "express";
import "dotenv/config";
import admin2Router from "./routes/admin2.js";
import abRouter from "./routes/address-book.js";
import db from "./utils/connect-mysql.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import moment from "moment-timezone";

const app = express();

app.set("view engine", "ejs");

// 設定靜態內容資料夾
app.use(express.static("public"));

// 使用 cookie 的功能
app.use(cookieParser());

app.use(
  session({
    secret: "dfkjd&*(dkfghdkfkdkf",
    saveUninitialized: false,
    resave: false,
  })
);

// *** 頂層的中間件 ***
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// *** 自訂中間件 ***
app.use((req, res, next) => {
  res.locals.theme = req.cookies.theme || "retro";
  res.locals.pageTitle = "小新的網站"; // 網站名稱
  res.locals.pageName = "";
  res.locals.session = req.session; // session 資料丟給 EJS

  next();
});

// 兩個條件: 方法, 路徑
app.get("/", (req, res) => {
  console.log(req.constructor.name);
  console.log(res.constructor.name);

  res.locals.pageTitle = `首頁 - ` + res.locals.pageTitle;
  res.render("home", { name: "小吉" });
});

app.get("/sales-array", (req, res) => {
  res.locals.pageTitle = `迴圈測試 - ` + res.locals.pageTitle;
  res.locals.pageName = `sales-array`;
  const sales = [
    { name: "Bill", age: 28, id: "A001" },
    { name: "Peter", age: 32, id: "A002" },
    { name: "Carl", age: 29, id: "A003" },
  ];
  // res.send(sales); // 給的是字串時, 回應 html; object 或 array 回應的 JSON
  // res.json(sales); // 回應 JSON 的格式
  res.render("sales-array", { sales });
});

app.get("/try-qs", (req, res) => {
  /*
  • http://localhost:3001/try-qs?a=1&b=3 
  • http://localhost:3001/try-qs?a[]=2&a[]=bill 
  • http://localhost:3001/try-qs?a=2&a=bill 
  • http://localhost:3001/try-qs?a[age]=20&a[name]=bill 
  */
  res.json(req.query);
});

// middleware: 中間件, 中介軟體
// const urlencodedParser = express.urlencoded({ extended: true });

// 只接受 POST 方法來拜訪
app.post("/try-post", (req, res) => {
  // req.body: 表單資料存放的屬性
  const { query, body } = req;
  res.json({ query, body });
});

// 路徑的參數
app.get("/users/:action?/:id?", (req, res) => {
  res.json(req.params);
});
// *** 這個路由會被上一個擋到 (寬鬆的規則放後面, 嚴謹規則放前面)
app.get("/users/shinder", (req, res) => {
  res.json("hello");
});

app.use("/admins", admin2Router);
app.use("/address-book", abRouter);
app.get("/colors", (req, res) => {
  res.locals.pageName = "colors";
  res.render("colors");
});

app.get("/try-db", async (req, res) => {
  const sql = `SELECT * FROM address_book ORDER BY ab_id DESC LIMIT 20 `;
  // const [rows, fields] = await db.query(sql);
  const [rows] = await db.query(sql);
  // res.json({ rows, fields });
  // res.json(rows);
  res.render("try-db", { rows });
});

app.get("/try-db2", async (req, res) => {
  const name = "⼩新'GF",
    email = "shinder@test.com",
    mobile = "0912345678",
    address = "台北市";
  /*
  // 錯誤的作法 SQL injection 的風險
  const sql = `INSERT INTO address_book
    (name, email, mobile, address)
    VALUES ('${name}', '${email}', '${mobile}', '${address}')`;
  const [result] = await db.query(sql);
  */
  const sql = `INSERT INTO address_book
    (name, email, mobile, address, created_at)
    VALUES (?, ?, ?, ?, NOW())`;

  const [result] = await db.query(sql, [name, email, mobile, address]);

  res.json(result);
});

app.get("/cookie1", async (req, res) => {
  // 讀取: 用戶端送過來的
  const username = req.cookies.username;
  // 設定: 設定在 HTTP 檔頭, 告訴瀏覽器要設定 cookie
  res.cookie("username", "John", {
    httpOnly: true, // 只能透過 HTTP 的機制來設定和讀取 (不能用前端的 JS 讀取和設定)
  });

  res.send(username ? username : "沒有設定 username");
});
app.get("/themes/:t", async (req, res) => {
  const ar = ["dark", "light", "retro"];
  if (ar.includes(req.params.t)) {
    res.cookie("theme", req.params.t, {
      maxAge: 365 * 24 * 60 * 60_000,
    });
  }
  // res.redirect("/sales-array"); // 轉向到某個頁面
  const come_from = req.get("referer") || "/";
  res.redirect(come_from); // 轉向到某個頁面
});

app.get("/try-sess", (req, res) => {
  req.session.my_num ||= 0;
  req.session.my_num++;
  res.json(req.session);
});

app.get("/try-moment", (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment(); // 取得當下時間的 moment 物件
  const m2 = moment("2024-02-29");
  const m3 = moment("2025-02-29");
  res.json({
    m1: m1.format(fm),
    m2: m2.format(fm),
    m3: m3.format(fm),
    m1v: m1.isValid(),
    m2v: m2.isValid(),
    m3v: m3.isValid(),
    m1z: m1.tz("Europe/London").format(fm),
    m2z: m2.tz("Europe/London").format(fm),
  });
});

app.get("/yahoo", async (req, res) => {
  const r = await fetch("https://tw.yahoo.com");
  const txt = await r.text();
  res.send(txt);
});

// 快速登入
app.get("/quick/:m_id", async (req, res) => {
  const sql = `SELECT * FROM members WHERE member_id=?`;

  const [rows] = await db.query(sql, req.params.m_id);

  if (rows.length) {
    req.session.member = rows[0];
    // res.json({ success: true, data: rows[0] });
    res.redirect('/member-list')
  } else {
    res.json({ success: false });
  }
});
app.get("/member-list", async (req, res) => {
  res.locals.pageName = 'member-list';
  const sql = `SELECT * FROM members`;

  const [rows] = await db.query(sql);

  res.render("member-list", { rows });
});
// ******************************** 404 *******************
app.use((req, res) => {
  res.status(404).send(`<h1>你走錯路了</h1>
      <div><img src="/imgs/404.webp" width="300" /></div>`);
});

const port = process.env.WEB_PORT || 3002; // 問題: || 什麼意思??
app.listen(port, () => {
  console.log(`伺服器啟動: http://localhost:${port}`);
});
