import { getMedia } from '../../constants/methods/index'
import { Recorder } from '../common/index'

const createConstraints = Symbol('createConstraints')
const sourceId = Symbol('sourceId')

/**
 * webRTC 录屏
 */
export class Screen extends Recorder {
  constructor (options = {}) {
    super(options)
    this[sourceId] = undefined // 获取屏幕流需要的ID
    this.timer = undefined // 扩展程序定时器(询问、请求授权)
  }

  /**
   * 连接扩展程序获取屏幕sourceId
   * 发送目标源 '*' 可能存在安全风险
   * @param {number} aTimeout 连接扩展程序超时时间
   * @param {number} pTimeout 授权超时时间
   * @param {promise} 得到sourceId时fulfilled
   */
  connExts (options = {}) {
    let {
      pTimeout = 20000,
      aTimeout = 5000
    } = options

    return new Promise((resolve, reject) => {
      pTimeout = Number.parseInt(pTimeout)
      aTimeout = Number.parseInt(aTimeout)
      if (!isNaN(pTimeout) && pTimeout >= 0 && !isNaN(aTimeout) && aTimeout >= 0) {
        let fs = [] // 存储回调函数

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
              remove(fs)
              reject(new Error('录屏授权请求失败'))
            } else if (data === 'permissionTimeout') {
              // 授权超时
              remove(fs)
              reject(new Error('录屏授权请求超时'))
            } else if (data.sourceId) {
              // 授权通过
              this[sourceId] = data.sourceId
              remove(fs)
              resolve(true)
            }
          }
        }

        fs.push(getSourceId, isExisting)
        window.addEventListener('message', getSourceId)
        window.addEventListener('message', isExisting)

        // 询问
        this.timer = setTimeout(() => {
          remove(fs)
          reject(new Error('连接扩展程序超时'))
        }, aTimeout)

        window.postMessage({
          cmd: 'isExisting'
        }, '*')
      } else {
        reject(new Error('连接扩展程序失败[参数错误]'))
      }
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
    // 构造 MediaTrackConstraints
    let constraints = this[createConstraints](options)

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // 设置 MediaRecorder 对象参数
    return super.setParam(options)
  }

  /**
   * 录屏(MediaRecorder)
   * chrome 47及以上版本
   */
  recScreen (options = {}) {
    Object.assign(options, { type: 'screen' })
    return super.rec(options)
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
