// 一般匯出
export const f1 = (a) => a * a;
export const f2 = (a) => a ** 3;

console.log(f1(6));

// 預設的匯出
export default function f3(a) {
  return a ** 0.5;
}
