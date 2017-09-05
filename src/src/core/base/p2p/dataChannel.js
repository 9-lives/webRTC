import { log } from '../../../utils'

/**
 * dataChannel 相关(未开发完成)
 * 目前仅兼容chrome 60 及以上版本
 */

/**
 * RTCDataChannel 添加监听
 * @param {object} channel 数据通道
 * @returns {boolean} 成功添加返回 true；失败 false
 */
export function addDCListener ({ channel }) {
  if (!(channel instanceof window.RTCDataChannel)) {
    log.e('添加监听失败[rtcDataChannel未找到]')
    return false
  }

  channel.onopen = () => {
    log.d('p2p 数据通道已连接')
  }

  channel.onmessage = msg => {
    log.i('p2p 数据通道收到消息：', msg)
  }

  channel.onerror = evt => {
    log.e('p2p 数据通道发生错误：', evt)
  }

  channel.onclose = evt => {
    log.i('p2p 数据通道关闭：', evt)
  }

  return true
}
