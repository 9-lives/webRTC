export function isUndefined (...args) {
  for (let obj of Object.values(args)) {
    if (typeof obj === 'undefined') {
      return true
    }
  }
  return false
}
