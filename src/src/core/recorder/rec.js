import { judgeType } from '../../utils/index'
import { Recorder } from '../common/index'
import { createConstraints, getVideoById, getMedia } from '../../constants/methods/index'

/**
 * webRTC 录像
 */

export class Rec extends Recorder {
  constructor (options = {}) {
    super(options)
  }

  /**
   * 初始化
   */
  async start (options = {}) {
    const {
      videoId // 预览video标签ID
    } = options

    if (videoId) {
      this.video = super[getVideoById](videoId)
      if (!this.video) return false
    }

    // 获取设备ID
    let devIds = await super._rtcGetDevInfo()

    // 构造 MediaTrackConstraints
    let constraints = super[createConstraints](options, devIds)

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // video 标签绑定流媒体
    if (this.video) {
      this.video.srcObject = this.mediaStream
    }

    // 设置 MediaRecorder 对象参数
    return super.setParam(options)
  }

  /**
   * 录像(MediaRecorder)
   * chrome 47及以上版本
   */
  rec (options = {}) {
    Object.assign(options, { type: 'rec' })
    return super.rec(options)
  }
}
