/**
  * 判断函数是否存在
  * @param {array 或以逗号分隔的多个参数} strArr 需要判断的变量
  * 全部存在返回 true，不存在返回 false
  */
export function isUndefined (...args) {
  for (let obj of Object.values(args)) {
    if (typeof obj === 'undefined') {
      return true
    }
  }
  return false
}
