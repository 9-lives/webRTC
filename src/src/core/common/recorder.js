import { RtcCommon } from './index'
import { judgeType, log } from '../../index'
import { isActive, recStart } from '../../constants/methods/index'

  /**
   * webRTC recorder 基础类
   * chrome 47及以上版本
   */
export class Recorder extends RtcCommon {
  constructor (options) {
    super(options)
    this.recorder = undefined // MediaRecorder 对象
    this.duration = 0 // // 录制时长, 默认 0 手动停止
    this.timeSlice = 0 // 时间片, 默认 0 不分片
  }

  /**
   * 设置参数
   * @return {boolean} true 设置成功; false 设置失败
   */
  setParam (options = {}) {
    let {
      type, // 录制类型： 'rec' 录像录音； 'screen' 录屏
      audioBitsPerSecond = 128000, // 音频比特率，录屏时不传值
      videoBitsPerSecond = 640000, // 视频比特率
      mimeType = 'video/webm', // 多用途互联网邮件扩展
      duration = 0, // 录制时长, 默认 0 手动停止
      timeSlice = 0 // 时间片, 默认 0 不分片
    } = options

    duration = Number.parseInt(duration)
    if (isNaN(duration) || duration < 0) {
      log.e('录像参数错误[录制时长]')
      return false
    }

    timeSlice = Number.parseInt(timeSlice)
    if (isNaN(timeSlice) || timeSlice < 0) {
      log.e('录像参数错误[时间片]')
      return false
    }

    let opt = {}
    if (judgeType('string', type)) {
      switch (type) {
        case 'rec':
          Object.assign(opt, audioBitsPerSecond)
          break
        case 'screen':
          break
        default:
          log.e('recorder 初始化失败[未知的录制类型]')
          return false
      }
    }
    Object.assign(opt, {
      videoBitsPerSecond: videoBitsPerSecond,
      mimeType: mimeType
    })

    if (!window.MediaRecorder) {
      log.e('recorder 初始化失败[MediaRecorder API 不存在]，请更换或升级浏览器')
      return false
    }

    this.recorder = new MediaRecorder(this.mediaStream, opt)
    this.duration = duration
    this.timeSlice = timeSlice

    return true
  }

  /**
   * 录像(MediaRecorder)
   */
  rec (options = {}) {
    if (super[isActive]()) {
      this.recorder.ondataavailable = ret => {
        this.evtCallBack({
          evtName: 'recDataAvail',
          args: [ret.data],
          codeName: 'REC_FETCHDATAFAILED',
          errType: 'websocket'
        })
      }

      this.recorder.onstop = ret => {
        log.d('停止录制')
      }

      return this[recStart]()
    } else {
      log.e('录制失败[媒体流未激活]')
      return false
    }
  }

  /**
   * 开始录制
   */
  [recStart] () {
    if (this.recorder.state !== 'recording') {
      log.d('开始录制')
      if (this.timeSlice === 0) {
        this.recorder.start()
      } else {
        this.recorder.start(this.timeSlice)
      }
    } else {
      log.e('开启录制失败[已经处于录制状态]')
      return false
    }

    if (this.duration !== 0) {
      setTimeout(() => {
        this.recStop()
      }, this.duration)
    }

    return true
  }

  /**
   * 停止录制
   */
  recStop () {
    if (MediaRecorder && this.recorder && this.recorder instanceof MediaRecorder) {
      // chrome 47 以上
      if (this.recorder.state !== 'inactive') {
        this.recorder.stop()
      }
    }
  }
}
