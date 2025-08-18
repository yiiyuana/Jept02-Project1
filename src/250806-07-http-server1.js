import http from "node:http";

// callback functions: 回呼函式
// 形式參數 parameters
// 實際參數 arguments
const server = http.createServer(function (request, response) {
  const { url } = request;
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  })
  response.end(`<h1>小新的網站: 您好</h1>
    <h1>${url}</h1>
    `);
});

server.listen(3000, () => {
  console.log(`偵聽  http://localhost:3000`);
});
