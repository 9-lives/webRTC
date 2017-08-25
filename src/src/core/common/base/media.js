import { judgeType, log } from '../../../index'
import { createConstraints, getMedia } from '../../../constants/methods'
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
      aGroupId, // 音频设备组ID
      mic, // 麦克风序号
      mLabel, // 麦克风标签
      sampleRate = 44100, // 采样率
      sampleSize = 16, // 采样大小
      volumn = 1.0, // 音量
      // MediaTrackConstraints - video
      camera, // 摄像头序号
      vLabel, // 摄像头标签
      facingMode, // 视频源方向
      frameRate = 24, // 理想帧率
      height = 480, // 理想视频高度
      maxFrameRate = 28, // 最大帧率
      pid, // 摄像头pid
      vGroupId, // 视频设备组ID
      vid, // 摄像头vid
      width = 640 // 理想视频宽度
    } = options

    let audio // 音频轨约束
    let video // 视频轨约束
    let aDevId // 麦克风设备ID
    let vDevId // 摄像头设备ID

    if (judgeType('undefined', vGroupId)) {
      // 未指定视频设备组ID
      vDevId = super[getVDevId]({
        camera,
        vLabel,
        facingMode,
        vid,
        pid,
        devIds
      })
    } else {
      // 已指定视频设备组ID
    }

    if (judgeType('undefined', aGroupId)) {
      // 未指定音频设备组ID
      aDevId = super[getADevId]({
        mic,
        mLabel,
        devIds
      })
    } else {
      // 已指定音频设备组ID
    }

    if (!judgeType('undefined', aDevId)) {
      // 找到音频设备ID
      audio = {
        deviceId: aDevId,
        echoCancellation,
        channelCount,
        sampleRate,
        sampleSize,
        volumn
      }
    } else if (!judgeType('undefined', aGroupId)) {
      log.d(`指定音频设备组ID aGroupId = ${aGroupId}`)
      audio = {
        groupId: aGroupId,
        echoCancellation,
        channelCount,
        sampleRate,
        sampleSize,
        volumn
      }
    } else {
      log.d('音频轨已禁用[硬件ID未找到]')
      audio = false
    }

    if (!judgeType('undefined', vDevId) || !judgeType('undefined', facingMode)) {
      // 指定视频设备ID或已指定 facingMode

      // 构造部分 videoTrackConstraints
      video = {
        frameRate: { ideal: frameRate, max: maxFrameRate },
        width: { ideal: width },
        height: { ideal: height }
      }

      if (!judgeType('undefined', vDevId)) {
        // 指定视频设备ID
        Object.assign(video, { deviceId: vDevId })
      } else if (!judgeType('undefined', facingMode)) {
        // 已指明视频轨朝向
        log.d(`指定视频轨朝向 facingMode = ${facingMode}`)
        Object.assign(video, { facingMode })
      }
    } else if (!judgeType('undefined', vGroupId)) {
      // 指定视频设备组ID
      log.d(`指定视频设备组ID vGroupId = ${vGroupId}`)
      video = {
        groupId: vGroupId,
        frameRate: { ideal: frameRate, max: maxFrameRate },
        width: { ideal: width },
        height: { ideal: height }
      }
    } else {
      // 禁用视频轨
      log.d('视频轨已禁用[硬件ID未找到]')
      video = false
    }

    return {
      audio: audio,
      video: video
    }
  }

  /**
    * 获取媒体流
    * 返回 mediaStream
    */
  async [getMedia] (constraints = {}) {
    // 约束
    const {
      audio = false,
      video = false
    } = constraints
    log.d('正在获取流媒体')

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // chrome 53 及以上
      try {
        let media = await navigator.mediaDevices.getUserMedia({
          audio,
          video
        })
        log.d('获取流媒体成功: ', media)
        return media
      } catch (err) {
        if (err.message) {
          log.e(err.message)
        }
        throw new Error('获取流媒体失败')
      }
    } else {
      throw new Error('未找到 mediaDevices.getUserMedia 方法')
    }
  }

  /**
   * 检测流状态
   * 激活状态返回true，终止状态返回false
   */
  isActive () {
    if (this.mediaStream && this.mediaStream instanceof MediaStream) {
      if (!judgeType('undefined', this.mediaStream.active)) {
        if (this.mediaStream.active) {
          return true
        } else {
          log.e('媒体流未激活')
          return false
        }
      } else {
        log.e('检测媒体流状态失败[active属性未找到]')
        return false
      }
    } else {
      log.e('检测媒体流状态失败[媒体流不存在]')
      return false
    }
  }
}

// Media 类继承 Device 类
export const Media = MediaBase(Device)
