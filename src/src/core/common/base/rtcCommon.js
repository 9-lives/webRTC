import { judgeType, log } from '../../../index'
import { Connect, Hook, HtmlEle, Media } from './index'

/**
 * webRTC 基础类
 */
export class RtcCommon extends Connect(Hook(HtmlEle(Media))) {
  constructor (options = {}) {
    super(options)
  }

  /**
   * 关闭
   */
  close () {
    if (this.mediaStream instanceof MediaStream) {
      // 关闭媒体轨
      stopMediaTracks({
        stream: this.mediaStream
      })

      if (this.video && !this.video.srcObject) {
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

/**
 * 关闭流媒体的所有轨道
 * @param {object} stream 流媒体
 */
function stopMediaTracks ({ stream }) {
  let tracks = stream.getTracks()

  if (tracks && tracks instanceof Array) {
    for (let track of tracks) {
      track.stop()
    }
  }
}
