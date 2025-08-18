import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ name: "admin2.js - root" });
});

router.get("/admin2/:p1?", (req, res) => {
  const ar = [2, 3, 4, 5, 6];
  const [a, ...b] = ar; // ... rest operator 其餘運算子
  const { url, baseUrl, originalUrl, params } = req;

  // res.json({ name: "admin2.js", ...req.params }); // ... spread operator 展開運算子

  res.json({ url, baseUrl, originalUrl, params });
});

export default router;
