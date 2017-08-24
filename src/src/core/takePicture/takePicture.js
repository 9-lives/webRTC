import { isUndefined, log } from '../../utils/index'
import { RtcCommon } from '../common/base/index'
import { createConstraints, getVideoById, getCanvasById, getDevId, getMedia } from '../../constants/index'

/**
 * webRTC 拍照
 */

/**
 * 开启设备
 */
export class TakePicture extends RtcCommon {
  constructor (options = {}) {
    super(options)
  }

  /**
   * 初始化
   */
  async start (options = {}) {
    const {
      camera = 0, // 摄像头序号
      canvasId, // canvas 标签ID
      videoId // video 标签ID
    } = options

    if (isNaN(Number.parseInt(camera))) {
      log.e('错误的摄像头序号')
      return false
    }

    if (!isUndefined(videoId)) {
      this.video = super[getVideoById](videoId)
      if (this.video === false) return false
    }

    if (!isUndefined(canvasId)) {
      this.canvas = super[getCanvasById](canvasId)
      if (this.canvas === false) return false
    }

    // 获取设备ID
    let devIds = await super[getDevId]()

    // 构造 MediaTrackConstraints
    let constraints = super[createConstraints](options, devIds)

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // video 标签绑定流媒体
    if (!isUndefined(videoId)) {
      this.video.srcObject = this.mediaStream
    }

    return true
  }

  /**
   * 拍照
   */
  takePicture (options = {}) {
    if (this.isActive()) {
      let {
        w = 400,
        h = 300
      } = options

      w = Number.parseInt(w)
      h = Number.parseInt(h)
      w = isNaN(w) ? 0 : w
      h = isNaN(h) ? 0 : h

      this.canvas.getContext('2d').drawImage(this.video, 0, 0, w, h)
      log.d('拍照成功')
      return true
    } else {
      log.e('拍照失败[流媒体未激活]')
      return false
    }
  }
}
