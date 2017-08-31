import { judgeType, log } from '../../utils/index'
import { RtcBase } from '../common/base/index'
import { createConstraints, getVideoById, getCanvasById, getMedia, isActive } from '../../constants/methods/index'

/**
 * webRTC 拍照
 */

/**
 * 开启设备
 */
export class TakePicture extends RtcBase {
  constructor (options = {}) {
    super(options)
  }

  /**
   * 初始化
   */
  async start (options = {}) {
    const {
      camNo = 0, // 摄像头序号
      canvasId, // canvas 标签ID
      videoId // video 标签ID
    } = options

    if (isNaN(Number.parseInt(camNo))) {
      log.e('错误的摄像头序号')
      return false
    }

    this.video = super[getVideoById](videoId)
    if (!this.video) {
      return false
    }

    this.canvas = super[getCanvasById](canvasId)
    if (!this.canvas) {
      return false
    }

    // 获取设备ID
    let devInfo = await super._rtcGetDevInfo()

    // 构造 MediaTrackConstraints
    let constraints = super[createConstraints]({
      options,
      devInfo
    })

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // video 标签绑定流媒体
    this.video.srcObject = this.mediaStream

    return true
  }

  /**
   * 拍照
   */
  takePicture (options = {}) {
    if (this[isActive]()) {
      let {
        w = 400,
        h = 300
      } = options

      w = Number.parseInt(w)
      h = Number.parseInt(h)
      w = isNaN(w) ? 0 : w
      h = isNaN(h) ? 0 : h

      this.canvas.getContext('2d').drawImage(this.video, 0, 0, w, h)
      return true
    } else {
      log.e('拍照失败[流媒体未激活]')
      return false
    }
  }
}
