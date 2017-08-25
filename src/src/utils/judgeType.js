/**
  * 判断变量类型
  * @param {array 或以逗号分隔的多个参数} args 需要判断的变量
  * 全部存在返回 true，不存在返回 false
  */
export function judgeType (type = '', ...args) {
  for (let arg of args) {
    if (typeof str !== type) {
      return false
    }
  }
  return true
}
