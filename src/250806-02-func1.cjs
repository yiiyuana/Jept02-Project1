const f1 = (a) => a * a; // 求平方
const f2 = (a) => a ** 3; // 求三次方

console.log(f1(6));

// 只能匯出一個東西
module.exports = { f1, f2 };
