import "dotenv/config";

// console.log(process.env.DB_PASS);

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = process.env;
console.log({ DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT });
