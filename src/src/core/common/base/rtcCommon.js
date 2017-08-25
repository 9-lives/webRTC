import { judgeType, log } from '../../../index'
import { Connect, Hook, HtmlEle, Media } from './index'

/**
 * webRTC 基础类
 *  仅兼容chrome 53 及以上版本
 */
export class RtcCommon extends Connect(Hook(HtmlEle(Media))) {
  constructor (options = {}) {
    super(options)
  }

  /**
   * 关闭
   */
  close () {
    if (!judgeType('undefined', this.mediaStream)) {
      // 关闭媒体轨
      let tracks = this.mediaStream.getTracks()
      if (tracks && tracks instanceof Array) {
        for (let track of tracks) {
          track.stop()
        }
      }

      if (this.video && !judgeType('undefined', this.video.srcObject)) {
        // 是否需要手动释放?
        this.video.srcObject = undefined
      }

      this.canvas = this.mediaStream = this.video = undefined
      log.d('多媒体设备已关闭')
    }
    // 关闭 websocket 连接
    if (this.ws && this.ws instanceof WebSocket) {
      this.ws.close(1000, '终端主动终止连接')
    }
  }
}
