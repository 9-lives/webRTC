/**
 * 原型扩展
 */
function format (fmt, date) {
  var o = {
    'M+': date.getMonth() + 1,                 // 月份
    'd+': date.getDate(),                    // 日
    'h+': date.getHours(),                   // 小时
    'm+': date.getMinutes(),                 // 分
    's+': date.getSeconds(),                 // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S': date.getMilliseconds()             // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return fmt
}

/**
 * 记录日志
 */
export const log = {
  d: (...args) => console.debug(`[${format('yyyy-MM-dd hh:mm:ss', new Date())}][DEBUG] -`, ...args),
  i: (...args) => console.info(`[${format('yyyy-MM-dd hh:mm:ss', new Date())}][INFO] -`, ...args),
  l: (...args) => console.log(`[${format('yyyy-MM-dd hh:mm:ss', new Date())}][LOG] -`, ...args),
  e: (...args) => console.error(`[${format('yyyy-MM-dd hh:mm:ss', new Date())}][ERROR] -`, ...args),
  w: (...args) => console.warn(`[${format('yyyy-MM-dd hh:mm:ss', new Date())}][WARN] -`, ...args)
}
