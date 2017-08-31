import { RtcBase } from './index'
import { judgeType, log } from '../../index'
import { isActive, recStart, setParam } from '../../constants/methods/index'

  /**
   * webRTC recorder 基础类
   * chrome 47及以上版本
   */
export class Recorder extends RtcBase {
  constructor (options) {
    super(options)
    this.recorder = undefined // MediaRecorder 对象
  }

  /**
   * 设置参数
   * @param {object} options 录制器初始化参数
   * @returns {boolean} true 设置成功; false 设置失败
   */
  [setParam] (options = {}) {
    let {
      audioBitsPerSecond = 128000, // 音频比特率，录屏时不传值
      videoBitsPerSecond = 640000, // 视频比特率
      mimeType = 'video/webm' // 多用途互联网邮件扩展
    } = options

    if (!window.MediaRecorder) {
      log.e('recorder 初始化失败[MediaRecorder API 不存在]，请更换或升级浏览器')
      return false
    }

    let opt = {
      audioBitsPerSecond,
      videoBitsPerSecond,
      mimeType
    }

    this.recorder = new MediaRecorder(this.mediaStream, opt)

    return true
  }

  /**
   * 录像
   * @param {object} options 录制参数
   * @returns {boolean} 启动录制成功 true；失败 false
   */
  rec (options = {}) {
    if (super[isActive]()) {
      this.recorder.ondataavailable = ret => {
        this.evtCallBack({
          evtName: 'recDataAvail',
          args: [ret.data],
          codeName: 'REC_HOOK_DATAAVAIL',
          errType: 'mediaRecorder'
        })
      }

      this.recorder.onstop = ret => {
        log.d('停止录制')

        this.evtCallBack({
          evtName: 'recStop',
          codeName: 'REC_HOOK_STOP',
          errType: 'mediaRecorder'
        })
      }

      return this[recStart](options)
    } else {
      log.e('录制失败[媒体流未激活]')
      return false
    }
  }

  /**
   * 开始录制
   * @param duration 录制时长(秒), 默认 0 需手动终止
   * @param timeSlice 时间片大小(秒)， 默认 0 不分片
   * @returns {boolean} 启动录制成功 true；失败 false
   */
  [recStart] ({ duration = 0, timeSlice = 0 }) {
    if (!(judgeType('number', duration, timeSlice) && duration > 0 && timeSlice > 0)) {
      log.e('录像初始化失败[录像参数错误]')
      return false
    }

    if (this.recorder.state !== 'recording') {
      log.d('开始录制')
      if (timeSlice === 0) {
        // 不分片
        this.recorder.start()
      } else {
        this.recorder.start(timeSlice * 1000)
      }
    } else {
      log.e('开启录制失败[已经处于录制状态]')
      return false
    }

    if (duration !== 0) {
      // 有限时长
      setTimeout(() => {
        this.recStop()
      }, duration * 1000)
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

  /**
   * 关闭连接
   */
  async close () {
    if (this.recorder instanceof MediaRecorder) {
      this.recStop()
      super.close()

      this.evtCallBack({
        evtName: 'recClosed',
        codeName: 'REC_HOOK_CLOSED',
        errType: 'peerConnection'
      })
    }
  }
}
