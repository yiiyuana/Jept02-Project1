import express from "express";
import db from "../utils/connect-mysql.js";
import moment from "moment-timezone";
import multer from "multer";
import upload from "../utils/upload-images.js";

// const upload = multer({ dest: "tmp/" });

const router = express.Router();

// 列表頁的內容
router.get("/", async (req, res) => {
  res.locals.pageTitle = `列表 - ` + res.locals.pageTitle;
  res.locals.pageName = `ab-list`;
  const page = parseInt(req.query.page) || 1;
  if (page < 1) {
    return res.redirect("?page=1");
  }

  const perPage = 20; // 每一頁最多有幾筆
  const t_sql = "SELECT COUNT(1) totalRows FROM `address_book`";
  const [[{ totalRows }]] = await db.query(t_sql); // 多層的解構 destruct

  let totalPages = 0; // 預設值
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage); // 總頁數
    if (page > totalPages) {
      return res.redirect(`?page=${totalPages}`);
    }
    const sql = `SELECT * FROM address_book
      ORDER BY ab_id DESC LIMIT ${(page - 1) * perPage}, ${perPage}`;
    [rows] = await db.query(sql);
    rows.forEach((r) => {
      const m = moment(r.birthday);
      if (m.isValid()) {
        r.birthday = m.format("YYYY-MM-DD");
      } else {
        r.birthday = "";
      }
    });
  }

  // res.json({ totalRows, totalPages, page, rows, perPage });
  res.render("address-book/list", {
    totalRows,
    totalPages,
    page,
    rows,
    perPage,
  });
});

// 呈現新增資料的表單
router.get("/add", async (req, res) => {
  res.locals.pageTitle = `新增通訊錄 - ` + res.locals.pageTitle;
  res.locals.pageName = `ab-add`;
  res.render("address-book/add");
});
// 處理新增資料的表單
// upload.none(): 處理表單資料, 但是沒有要上傳檔案
router.post("/add", upload.single("avatar"), async (req, res) => {
  const output = {
    success: false, // 預設是沒有成功
    bodyData: req.body, // 除錯用
    result: {},
    file: req.file,
  };

  // TODO: 檢查欄位的資料 (有沒有填寫, 格式)
  let { address, birthday, email, mobile, name } = req.body;

  // 處理日期, 給空字串時轉換成 null
  let b = moment(birthday);
  if (b.isValid()) {
    birthday = b.format("YYYY-MM-DD");
  } else {
    birthday = null;
  }

  const sql =
    "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`) VALUES (?,?,?,?,?)";
  try {
    const [result] = await db.query(sql, [
      name,
      email,
      mobile,
      birthday,
      address,
    ]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.error = ex;
  }

  res.json(output);
});

router.get("/delete/:ab_id", async (req, res) => {
  const ab_id = parseInt(req.params.ab_id);
  if (!ab_id || ab_id < 1) {
    return res.redirect("/address-book"); // 跳到列表頁
  }
  const sql = `DELETE FROM address_book WHERE ab_id=${ab_id}`;
  const [result] = await db.query(sql);

  const come_from = req.get("referer") || "/address-book";
  res.redirect(come_from);
});

// 呈現修改表單的頁面
router.get("/edit/:ab_id", async (req, res) => {
  const ab_id = parseInt(req.params.ab_id);
  if (!ab_id || ab_id < 1) {
    return res.redirect("/address-book"); // 跳到列表頁
  }
  const sql = `SELECT * FROM address_book WHERE ab_id=${ab_id}`;
  const [rows] = await db.query(sql);
  if (!rows.length) {
    // 沒有該筆資料
    return res.redirect("/address-book"); // 跳到列表頁
  }
  if (!rows[0].birthday) {
    rows[0].birthday = "";
  } else {
    rows[0].birthday = moment(rows[0].birthday).format("YYYY-MM-DD");
  }

  res.render("address-book/edit", rows[0]);
});
// 處理修改表單 API
router.post("/edit/:ab_id", upload.none(), async (req, res) => {
  const output = {
    success: false, // 預設是沒有成功
    bodyData: req.body, // 除錯用
    result: {},
    error: "",
  };

  const ab_id = parseInt(req.params.ab_id);
  if (!ab_id || ab_id < 1) {
    output.error = "編號格式不正確";
    return res.json(output);
  }
  const sql = `SELECT * FROM address_book WHERE ab_id=${ab_id}`;
  const [rows] = await db.query(sql);
  if (!rows.length) {
    output.error = "沒有這筆資料";
    return res.json(output);
  }

  let { address, birthday, email, mobile, name } = req.body;

  // 處理日期, 給空字串時轉換成 null
  let b = moment(birthday);
  if (b.isValid()) {
    birthday = b.format("YYYY-MM-DD");
  } else {
    birthday = null;
  }

  const sql2 = `UPDATE address_book SET ? WHERE ab_id=?`;
  try {
    const [result] = await db.query(sql2, [
      { address, birthday, email, mobile, name },
      ab_id,
    ]);
    output.result = result;
    // output.success = !!result.affectedRows;
    output.success = !!result.changedRows;
  } catch (ex) {
    output.error = ex;
  }
  res.json(output);
});

export default router;
