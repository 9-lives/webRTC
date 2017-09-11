import { getMedia, setParam } from '../../constants/methods/index'
import { Recorder } from '../base/index'
import { log, judgeType } from '../../utils/index'

import { webRtcConfig } from '../../..//config'

const createConstraints = Symbol('createConstraints')
const sourceId = Symbol('sourceId')
const timer = Symbol('timer')

/**
 * webRTC 录屏
 */
export class Screen extends Recorder {
  constructor (options = {}) {
    super(options)
    this[sourceId] = undefined // 获取屏幕流需要的ID
    this[timer] = undefined // 扩展程序定时器(询问、请求授权)
  }

  /**
   * 连接扩展程序获取屏幕sourceId
   * 发送目标源 '*' 可能存在安全风险
   * @returns {promise} 得到sourceId时，promise fulfilled
   */
  connExts () {
    return new Promise((resolve, reject) => {
      let cTimeout = webRtcConfig.cTimeout // 连接录屏扩展程序超时时间(秒)
      let aTimeout = webRtcConfig.aTimeout // 录屏授权超时时间(秒)

      if (!(judgeType('number', cTimeout, aTimeout) && aTimeout > 0 && cTimeout > 0)) {
        reject(new Error('连接扩展程序失败[参数错误]'))
        return
      }

      let fs = [] // 存储回调函数

      // 询问插件是否存在消息监听函数
      let isExisting = evt => {
        if (evt.origin !== window.location.origin) {
          return
        }

        if (evt.data === 'true') {
          clearTimeout(this[timer])
          window.postMessage({
            cmd: 'getSourceId',
            aTimeout
          }, '*')
        }
      }

      // 获取 sourceId 消息监听函数
      let getSourceId = evt => {
        if (evt.origin !== window.location.origin) {
          return
        }

        let data = evt.data

        if (data.status && data.type === 'permission') {
          // 授权成功
          this[sourceId] = data.msg
          resolve(true)
          remove(fs)
        } else if (data.status === false) {
          log.e(data.msg)

          let txt = ''
          switch (data.type) {
            case 'permissionDenied':
              // 拒绝授权
              txt = '录屏授权请求被拒绝'
              break
            case 'permissionError':
              // 授权错误
              txt = '录屏授权请求失败'
              break
            case 'permissionTimeout':
              // 授权超时
              txt = '录屏授权请求超时'
              break
          }
          reject(new Error(txt))
          remove(fs)
        }
      }

      fs.push(getSourceId, isExisting)

      window.addEventListener('message', getSourceId, false)
      window.addEventListener('message', isExisting, false)

      // 询问
      this[timer] = setTimeout(() => {
        remove(fs)
        reject(new Error('连接扩展程序超时'))
      }, cTimeout * 1000)

      window.postMessage({
        cmd: 'isExisting'
      }, '*')
    })

    // 移除消息监听
    function remove (fs) {
      for (let f of fs) {
        window.removeEventListener('message', f)
      }
    }
  }

  /**
   * 初始化
   */
  async start (options = {}) {
    // 构造流媒体约束
    let constraints = this[createConstraints](options)

    // 获取流媒体
    this.mediaStream = await super[getMedia](constraints)

    // 设置 MediaRecorder 对象参数
    return super[setParam](options)
  }

  /**
   * 构造 MediaTrackConstraints
   */
  [createConstraints] (options = {}) {
    let {
      maxWidth = 1280,
      maxHeight = 1024,
      minAspectRatio = 1.25
    } = options

    return {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: this[sourceId],
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          minAspectRatio: minAspectRatio
        }
      }
    }
  }
}
