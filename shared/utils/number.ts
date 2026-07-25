/** 統計値の表示用整形：整数はそのまま、小数は最大1桁まで表示する */
export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
