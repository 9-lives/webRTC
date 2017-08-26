import { judgeType } from '../../utils/index'
import { Recorder } from '../common/index'
import { createConstraints, getVideoById, getDevId, getMedia, connect } from '../../constants/methods/index'

/**
 * webRTC 录像(音频改进)
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
      videoId // 预览video标签ID, 默认不开启预览
    } = options

    // 建立 websocket 连接
    await super[connect]()

    if (!judgeType('undefined', videoId)) {
      this.video = super[getVideoById](videoId)
      if (this.video === false) return false
    }

    // 获取设备ID
    let devIds = await super[getDevId]()

    // 构造 MediaTrackConstraints
    let constraints = super[createConstraints](options, devIds)

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // video 标签绑定流媒体
    if (!judgeType('undefined', this.video)) {
      this.video.srcObject = this.mediaStream
    }

    // 设置 MediaRecorder 对象参数
    if (super.setParam(options) === false) return false

    return true
  }

  /**
   * 录像(MediaRecorder)
   * chrome 47及以上版本
   */
  async rec (options = {}) {
    Object.assign(options, { type: 'rec' })
    let ret = await super.rec(options)
    if (ret === false) {
      return false
    } else {
      return ret
    }
  }
}
