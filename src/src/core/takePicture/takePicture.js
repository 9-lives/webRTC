import { judgeType, log } from '../../utils/index'
import { RtcBase } from '../base/common/index'
import { createConstraints, getVideoById, getCanvasById, getMedia, isActive } from '../../constants/methods/index'

/**
 * webRTC 拍照
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
      canvasId, // canvas 标签ID
      videoId // video 标签ID
    } = options

    this.video = super[getVideoById](videoId)
    if (!this.video) {
      return false
    }

    this.canvas = super[getCanvasById](canvasId)
    if (!this.canvas) {
      return false
    }

    // 获取设备信息
    let devInfo = await super._rtcGetDevInfo()

    // 构造流媒体约束
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
  takePicture ({ w = 400, h = 300 }) {
    if (!judgeType('number', w, h)) {
      log.e('拍照失败[参数类型错误]')
      return false
    }

    if (!this[isActive]({ stream: this.mediaStream })) {
      log.e('拍照失败[流媒体未激活]')
      return false
    }

    this.canvas.getContext('2d').drawImage(this.video, 0, 0, w, h)
    return true
  }
}
