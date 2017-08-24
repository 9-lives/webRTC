import { getMedia, connect } from '../../constants/methods'
import { Recorder } from '../common/index'

const createConstraints = Symbol('createConstraints')

/**
 * webRTC 录屏
 */

export class Screen extends Recorder {
  constructor (options = {}) {
    super(options)
    this.sourceId = undefined // 获取屏幕流需要的ID
    this.timer = undefined // 扩展程序定时器(询问、请求授权)
  }

  /**
   * 连接扩展程序获取屏幕sourceId
   * MDN 建议暂时不用postMessage进行扩展-chrome页面通信，因为发送目标源 '*' 存在安全风险
   * cTimeout: 连接扩展程序超时时间
   * pTimeout: 授权超时时间
   */
  connExts (options = {}) {
    let {
      pTimeout = 20000,
      cTimeout = 5000
    } = options

    return new Promise((resolve, reject) => {
      pTimeout = Number.parseInt(pTimeout)
      cTimeout = Number.parseInt(cTimeout)
      if (!isNaN(pTimeout) && pTimeout >= 0 && !isNaN(cTimeout) && cTimeout >= 0) {
        let funs = [] // 存储回调函数

        // 询问插件是否存在消息监听函数
        let isExisting = evt => {
          if (evt.origin === window.location.origin) {
            let data = evt.data
            if (data === 'true') {
              clearTimeout(this.timer)
              window.postMessage({
                cmd: 'getSourceId',
                pTimeout: pTimeout
              }, '*')
            }
          }
        }

        // 获取 sourceId 消息监听函数
        let getSourceId = evt => {
          if (evt.origin === window.location.origin) {
            let data = evt.data
            if (data === 'permissionDenied') {
              // 拒绝授权
              remove(funs)
              reject(new Error('录屏授权请求失败'))
            } else if (data === 'permissionTimeout') {
              // 授权超时
              remove(funs)
              reject(new Error('录屏授权请求超时'))
            } else if (data.sourceId) {
              // 授权通过
              this.sourceId = data.sourceId
              remove(funs)
              resolve(true)
            }
          }
        }

        funs.push(getSourceId, isExisting)
        window.addEventListener('message', getSourceId)
        window.addEventListener('message', isExisting)

        // 询问
        this.timer = setTimeout(() => {
          remove(funs)
          reject(new Error('连接扩展程序超时'))
        }, cTimeout)

        window.postMessage({
          cmd: 'isExisting'
        }, '*')
      } else {
        reject(new Error('连接扩展程序失败[参数错误]'))
      }
    })

    // 移除消息监听
    function remove (funs) {
      for (let fun of funs) {
        window.removeEventListener('message', fun)
      }
    }
  }

  /**
   * 初始化
   */
  async start (options = {}) {
    // 建立 websocket 连接
    await super[connect]()

    // 构造 MediaTrackConstraints
    let constraints = this[createConstraints](options)

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // 设置 MediaRecorder 对象参数
    if (super.setParam(options) === false) return false

    return true
  }

  /**
   * 录屏(MediaRecorder)
   * chrome 47及以上版本
   */
  async recScreen (options = {}) {
    Object.assign(options, { type: 'screen' })
    let ret = await super.rec(options)
    if (ret === false) {
      return false
    } else {
      return ret
    }
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
          chromeMediaSourceId: this.sourceId,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          minAspectRatio: minAspectRatio
        }
      }
    }
  }
}
