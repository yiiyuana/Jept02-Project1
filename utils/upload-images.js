import multer from "multer";
import { v4 } from "uuid";

// 1.篩選檔案, 2.決定副檔名
const extMap = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

function fileFilter(req, file, callback) {
  callback(null, !!extMap[file.mimetype]);
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/imgs"); // null 表示沒有錯誤
  },
  filename: (req, file, callback) => {
    const f = v4() + extMap[file.mimetype];
    callback(null, f);
  },
});

export default multer({fileFilter, storage});