/** 整数はそのまま、小数は最大1桁まで表示する。目盛りのように整数が前提の値に使う */
export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/**
 * 統計値（平均値・割合・理論値など小数になり得る値）の表示用整形。
 * 割り切れる値でも `21.0` のように必ず小数第1位まで表示し、
 * 期待値・理論値（`toFixed(1)`）と桁を揃えるとともに、丸めた値であることを伝える
 */
export function fmtStat(n: number): string {
  return n.toFixed(1)
}
