import http from "node:http";
import fs from "node:fs/promises";

const server = http.createServer(async (req, res) => {
  const data = JSON.stringify(req.headers, null, 4);

  await fs.writeFile("headers.txt", data);

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(data);
});

server.listen(3000, () => {
  console.log(`偵聽  http://localhost:3000`);
});
