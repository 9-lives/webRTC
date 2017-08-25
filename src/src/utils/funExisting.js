/**
  * 判断函数是否存在
  * @param {array 或以逗号分隔的多个参数} funArr 需要判断的变量
  * 全部存在返回 true，不存在返回 false
  */
export function funExisting (...funArr) {
  for (let f of funArr) {
    if (typeof f !== 'function') {
      return false
    }
  }
  return true
}
