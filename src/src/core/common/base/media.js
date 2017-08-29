import { judgeType, log } from '../../../index'
import { createConstraints, getMedia, isActive } from '../../../constants/methods/index'
import { Device, getVDevId, getADevId } from './index'

/**
 *  webRTC 多媒体类
 *  默认关闭音视频源，仅兼容chrome 53 及以上版本
 */
const MediaBase = Base => class MediaBase extends Base {
  constructor (options) {
    super(options)
    this.mediaStream = undefined // 媒体流
  }

  /**
   * 构造 MediaTrackConstraints
   */
  [createConstraints] (options = {}, devIds) {
    let {
      // MediaTrackConstraints - Audio
      channelCount = 2, // 声道
      echoCancellation = true, // 消除回声
      mic, // 麦克风序号
      mLabel, // 麦克风标签
      sampleRate = 44100, // 采样率
      sampleSize = 16, // 采样大小
      volumn = 1.0, // 音量
      // MediaTrackConstraints - video
      camera, // 摄像头序号
      facingMode, // 视频源方向
      frameRate = 24, // 理想帧率
      height = 480, // 理想视频高度
      maxFrameRate = 28, // 最大帧率
      pid, // 摄像头pid
      vid, // 摄像头vid
      vLabel, // 摄像头标签
      width = 640 // 理想视频宽度
    } = options

    let audio // 音频轨约束
    let video // 视频轨约束
    let aDevId // 麦克风设备ID
    let vDevId // 摄像头设备ID

    vDevId = super[getVDevId]({
      camera,
      facingMode,
      devIds,
      pid,
      vid,
      vLabel
    })

    aDevId = super[getADevId]({
      devIds,
      mic,
      mLabel
    })

    if (judgeType('string', aDevId)) {
      // 找到音频设备ID
      audio = {
        channelCount,
        deviceId: aDevId,
        echoCancellation,
        sampleRate,
        sampleSize,
        volumn
      }
    } else {
      log.d('音频轨已禁用[硬件ID未找到]')
      audio = false
    }

    if (judgeType('string', vDevId) || judgeType('string', facingMode)) {
      // 找到视频设备ID或已指定 facingMode
      // 构造部分 videoTrackConstraints
      video = {
        frameRate: { ideal: frameRate, max: maxFrameRate },
        height: { ideal: height },
        width: { ideal: width }
      }

      if (judgeType('string', vDevId)) {
        // 找到视频设备ID
        Object.assign(video, { deviceId: vDevId })
      } else if (judgeType('string', facingMode)) {
        // 已指明视频轨朝向
        log.i(`指定视频轨朝向 facingMode = ${facingMode}`)
        Object.assign(video, { facingMode })
      }
    } else {
      // 禁用视频轨
      log.d('视频轨已禁用[硬件ID未找到]')
      video = false
    }

    return {
      audio,
      video
    }
  }

  /**
    * 获取流媒体
    * @param {object} audio 音频轨约束
    * @param {object} video 视频轨约束
    * @return {object} 流媒体
    */
  async [getMedia] ({ audio = false, video = false }) {
    let media

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // chrome 53 及以上
      try {
        media = await navigator.mediaDevices.getUserMedia({
          audio,
          video
        })

        log.d('获取流媒体成功: ', media)
      } catch (err) {
        if (err.message) {
          log.e(err.message)
        }
        throw new Error('获取流媒体失败')
      }

      return media
    } else {
      throw new Error('未找到 mediaDevices.getUserMedia 方法')
    }
  }

  /**
   * 检测流状态
   * @return {boolean} 激活状态 true，终止状态 false
   */
  [isActive] () {
    if (this.mediaStream && this.mediaStream instanceof MediaStream) {
      if (!judgeType('undefined', this.mediaStream.active)) {
        if (this.mediaStream.active) {
          return true
        } else {
          return false
        }
      } else {
        throw new Error('检测媒体流状态失败[active属性未找到]')
        // return false
      }
    } else {
      throw new Error('检测媒体流状态失败[媒体流不存在]')
      // return false
    }
  }
}

// Media 类继承 Device 类
export const Media = MediaBase(Device)
