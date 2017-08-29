/**
  * 判断变量类型
  * @param {array 或以逗号分隔的多个参数} args 需要判断的变量
  * 全部满足条件返回 true，不满足或部分满足返回 false
  */
export function judgeType (type = '', ...args) {
  for (let arg of args) {
    if (typeof arg !== type) {
      return false
    }
  }
  return true
}
