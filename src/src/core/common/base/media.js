import { judgeType, log } from '../../../index'
import { createConstraints, getMedia, isActive } from '../../../constants/methods/index'
import { Device, getVDevId, getADevId } from './index'

/**
 *  webRTC 流媒体类
 *  默认关闭音视频源
 */
const MediaBase = Base => class MediaBase extends Base {
  constructor (options) {
    super(options)
    this.mediaStream = undefined // 媒体流
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

      this.mediaStream = undefined
      log.d('多媒体设备已关闭')

      if (judgeType('function', super.close)) {
        super.close()
      }
    }
  }

  /**
   * 构造流媒体约束
   * @param {object} options 流媒体约束参数
   * @param {array} devInfo 设备信息
   * @returns {object} 流媒体约束
   */
  [createConstraints] ({ options = {}, devInfo }) {
    let audio // 音频轨约束
    let video // 视频轨约束
    let aDevId // 音频输入设备ID
    let vDevId // 视频输入设备ID

    // 查找视频输入设备ID
    vDevId = super[getVDevId]({
      options,
      devInfo
    })

    // 查找音频输入设备ID
    aDevId = super[getADevId]({
      options,
      devInfo
    })

    // 构造音频轨约束
    audio = createAudioTrackConstraints({
      options,
      aDevId
    })

    // 构造视频轨约束
    video = createVideoTrackConstraints({
      options,
      vDevId
    })

    return {
      audio,
      video
    }
  }

  /**
    * 获取流媒体
    * @param {object} audio 音频轨约束
    * @param {object} video 视频轨约束
    * @returns {object} 流媒体
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

        log.d('获取本地流媒体成功: ', media)
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
   * @returns {boolean} 激活状态 true，终止状态 false
   */
  [isActive] () {
    if (!(this.mediaStream instanceof MediaStream)) {
      log.e('检测媒体流状态失败[媒体流不存在]')
      return false
    }

    if (!judgeType('undefined', this.mediaStream.active)) {
      return this.mediaStream.active
    } else {
      log.e('检测媒体流状态失败[active属性未找到]')
      return false
    }
  }
}

/**
 * 关闭流媒体的所有轨道
 * @param {object} stream 流媒体
 */
function stopMediaTracks ({ stream }) {
  if (stream instanceof MediaStream) {
    let tracks = stream.getTracks()

    if (tracks && tracks instanceof Array) {
      for (let track of tracks) {
        track.stop()
      }
    }
  }
}

/**
 * 构造音频轨约束
 * @param {object} options 音频轨约束参数
 * @param {string} aDevId 音频输入设备ID
 * @returns {object | boolean} 音频轨约束
 */
function createAudioTrackConstraints ({ options = {}, aDevId }) {
  const {
    channelCount = 2, // 声道
    echoCancellation = true, // 消除回声
    sampleRate = 44100, // 采样率
    sampleSize = 16, // 采样大小
    volumn = 1.0 // 音量
  } = options

  if (!judgeType('string', aDevId)) {
    // 禁用音频轨
    log.d('音频轨已禁用[硬件ID未找到]')
    return false
  }

  // 找到音频设备ID
  let constraints = {
    channelCount,
    deviceId: aDevId,
    echoCancellation,
    sampleRate,
    sampleSize,
    volumn
  }

  return constraints
}

/**
 * 构造视频轨约束
 * @param {object} options 视频轨约束参数
 * @param {string} vDevId 视频输入设备ID
 * @returns {object | boolean} 视频轨约束
 */
function createVideoTrackConstraints ({ options = {}, vDevId }) {
  const {
    facingMode, // 视频源指向
    frameRate = 19, // 理想帧率
    height = 480, // 理想高度
    maxFrameRate = 28, // 最大帧率
    width = 640// 理想宽度
  } = options

  if (judgeType('undefined', vDevId) && !judgeType('string', facingMode)) {
    // 禁用视频轨
    log.d('视频轨已禁用[硬件ID未找到]')
    return false
  }

  // 找到视频设备ID或已指定 facingMode
  let constraints = {
    frameRate: { ideal: frameRate, max: maxFrameRate },
    height: { ideal: height },
    width: { ideal: width }
  }

  if (judgeType('string', vDevId)) {
    // 找到视频设备ID
    Object.assign(constraints, { deviceId: vDevId })
  } else if (judgeType('string', facingMode)) {
    // 已指明视频轨朝向
    log.i(`指定视频轨朝向 facingMode = ${facingMode}`)
    Object.assign(constraints, { facingMode })
  }

  return constraints
}

// Media 类继承 Device 类
export const Media = MediaBase(Device)
