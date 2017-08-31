// 获取屏幕 sourceId
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'desktopCapture') return

  port.onMessage.addListener(message => {
    if (!(message && message.cmd && message.cmd === 'getSourceId')) {
      // 仅接受取sourceId命令
      return
    }

    // 参数检查
    let timeout = message.aTimeout
    if (!(typeof timeout === 'number' && timeout > 0)) {
      return port.postMessage({
        status: false,
        type: 'permissionError',
        msg: '[Get SourceId] 获取 sourceId 失败[参数错误]'
      })
    }

    // 获取 sourceId
    let winId = chrome.desktopCapture.chooseDesktopMedia(['screen'], port.sender.tab, sourceId => {
      if (typeof timer !== 'undefined') {
        // 清除授权超时计时器
        clearTimeout(timer)
        timer = undefined
      }

      if (sourceId && sourceId !== '') {
        // 允许授权
        return port.postMessage({
          status: true,
          type: 'permission',
          msg: sourceId
        })
      } else {
        // 拒绝授权，sourceId 等于空字符串
        return port.postMessage({
          status: false,
          type: 'permissionDenied',
          msg: '[Get SourceId] 获取 sourceId 失败[拒绝授权]'
        })
      }
    })

    // 设置授权超时计时器
    let timer = setTimeout(() => {
      timer = undefined

      // 隐藏选择捕获屏幕的窗口
      chrome.desktopCapture.cancelChooseDesktopMedia(winId)

      return port.postMessage({
        status: false,
        type: 'permissionTimeout',
        msg: '[Get SourceId] 获取 sourceId 失败[请求授权超时]'
      })
    }, timeout * 1000)
  })
})
