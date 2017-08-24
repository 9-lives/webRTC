// 获取屏幕 sourceId
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'desktopCapture') return
  port.onMessage.addListener(message => {
    if (message && message.cmd && message.cmd === 'getSourceId' && typeof message.pTimeout !== 'undefined') {
      let timer = setTimeout(() => {
        return port.postMessage('permissionTimeout')
      }, message.pTimeout)
      chrome.desktopCapture.chooseDesktopMedia(['screen'], port.sender.tab, sourceId => {
        clearTimeout(timer)
        if (sourceId && sourceId !== '') {
          // 允许授权
          return port.postMessage({sourceId: sourceId})
        } else {
          // 拒绝授权，sourceId 等于空字符串
          return port.postMessage('permissionDenied')
        }
      })
    }
  })
})
