// 连接扩展程序
let port = chrome.runtime.connect({name: 'desktopCapture'})
port.onMessage.addListener(message => {
  // 将背景js的消息传递给前端页面
  window.postMessage(message, '*')
})

window.addEventListener('message', event => {
  // 不接收非前端页面指令
  if (event.source !== window || typeof event.data.cmd === 'undefined') return

  switch (event.data.cmd) {
    case 'isExisting':
      // 询问扩展是否存在
      window.postMessage('true', '*')
      break
    case 'getSourceId':
      // 下达获取sourceId命令给扩展程序
      port.postMessage(event.data)
      break
  }
})
