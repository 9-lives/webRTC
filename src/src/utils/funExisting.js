/**
  * 判断函数是否存在。存在返回 true，不存在返回 false
  */

export function funExisting (fun) {
  if (typeof fun === 'function') {
    return true
  } else {
    return false
  }
}
