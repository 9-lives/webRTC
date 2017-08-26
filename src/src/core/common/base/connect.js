import { errHandler, connect } from '../../../constants/methods/index'
import * as errCode from '../../../constants/errorCode/index'
import * as evtNames from '../../../constants/eventName'
import { judgeType, log } from '../../../index'

/**
 * 连接类(mixin 混入类)
 */
export const Connect = Base => class Connect extends Base {
  constructor (options = {}) {
    const {
      wsIp
    } = options
    super(options)
    this.ws = undefined // websocket 连接
    this.wsIp = wsIp // 上传文件 Ip 地址
  }

/**
  * websocket 连接
  */
  [connect] () {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsIp)
      this.ws.onopen = async evt => {
        if (this.ws.readyState !== 1) {
          this.ws.close()
          reject(new Error('websocket[webRTC] 连接建立失败'))
          // 不建议在回调中处理此错误
          await this[errHandler]({
            type: 'websocket',
            err: evt,
            code: errCode.WS_CONN_ESTABLISHFAILED
          })
        } else {
          log.d('websocket[webRTC] 已连接')

          this.evtCallBack({
            evtName: 'wsOpenHandler',
            args: [evt],
            codeName: 'WS_HOOK_CONN_OPEN',
            errType: 'websocket'
          })

          resolve()
        }
      }
      this.ws.onmessage = async evt => {
        this.evtCallBack({
          evtName: 'wsMsgHandler',
          args: [evt],
          codeName: 'WS_HOOK_CONN_MSG',
          errType: 'websocket'
        })
      }
      this.ws.onerror = async msg => {
        log.d('websocket[webRTC] 发生错误: ', msg)
        await this[errHandler]({
          type: 'websocket',
          err: msg,
          code: errCode.WS_CONN_ERROROCCUR
        })
        reject(new Error('websocket[webRTC] 连接发生错误'))
      }
      this.ws.onclose = async evt => {
        if (evt && evt.code === 1000) {
          log.d('websocket[webRTC] 正常关闭')
          resolve()
        } else {
          log.e('websocket[webRTC] 异常关闭: ', evt)
          await this[errHandler]({
            type: 'websocket',
            err: evt,
            code: errCode.WS_CONN_EXCEPTIONALCLOSE
          })
          reject(new Error('websocket[信令通道] 异常关闭'))
        }
      }
    })
  }

  /**
   * 错误回调
   * type: 错误类型。p2p 错误：'peerConnection'；websocket 错误：'websocket'
   */
  async [errHandler] (options = {}) {
    const {
      type = '',
      err = {},
      code
    } = options
    let f = this.hooks.get(evtNames['errHandler'])
    if (judgeType('function', f)) {
      await f({
        type,
        value: err,
        code
      })
    } else {
      log.e(`webRTC 库发生错误，且尚未指定错误处理回调:
        type = ${type},
        value = ${err},
        code = ${code}`
      )
    }
  }
}
