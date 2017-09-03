import { log } from '../../../utils'

/**
 * dataChannel 相关
 * 目前仅兼容chrome 60 及以上版本
 */

/**
 * RTCDatachannel 添加监听
 * @returns {boolean} 成功添加返回 true；失败 false
 */
export function addChannelListener ({ channel }) {
  if (!(channel instanceof window.RTCDataChannel)) {
    log.e('添加监听失败[rtcDataChannel未找到]')
    return false
  }

  this.dataChannel.onopen = () => {
    log.d('p2p 数据通道已连接')
  }

  this.dataChannel.onmessage = msg => {
    log.i('p2p 数据通道收到消息：', msg)
  }

  this.dataChannel.onerror = evt => {
    log.e('p2p 数据通道发生错误：', evt)
  }

  this.dataChannel.onclose = evt => {
    log.i('p2p 数据通道关闭：', evt)
  }

  return true
}
