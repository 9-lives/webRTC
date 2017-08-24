import { errHandler, connect } from '../../../constants/index'
import * as errCode from '../../../constants/errorCode/index'
import * as evtNames from '../../../constants/eventName'
import { funExisting, log } from '../../../index'

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
          reject(new Error('websocket[信令通道] 连接建立失败'))
          // 不建议在回调中处理此错误
          await this[errHandler]({
            type: 'websocket',
            err: evt,
            code: errCode.WS_CONN_ESTABLISHFAILED
          })
        } else {
          log.d('websocket[信令通道] 已连接')
          try {
            let fun = this.hooks.get(evtNames['wsOpenHandler'])
            if (funExisting(fun)) {
              await fun(evt)
            }
          } catch (err) {
            if (err.message) {
              log.e(err.message)
            }
            log.e(`websocket[信令通道] ${evtNames['wsOpenHandler']} 回调异常`)
            await this[errHandler]({
              type: 'websocket',
              err,
              code: errCode.WS_HOOK_CONN_OPEN
            })
          }
          resolve()
        }
      }
      this.ws.onmessage = async evt => {
        try {
          let f = this.hooks.get(evtNames['wsMsgHandler'])
          if (funExisting(f)) {
            await f(evt)
          }
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e(`websocket[信令通道] ${evtNames['wsMsgHandler']} 回调异常`)
          await this[errHandler]({
            type: 'websocket',
            err,
            code: errCode.WS_HOOK_CONN_MSG
          })
        }
      }
      this.ws.onerror = async msg => {
        log.d('websocket[信令通道] 发生错误: ', msg)
        await this[errHandler]({
          type: 'websocket',
          err: msg,
          code: errCode.WS_CONN_ERROROCCUR
        })
        reject(new Error('websocket[信令通道] 连接发生错误'))
      }
      this.ws.onclose = async evt => {
        if (evt && evt.code === 1000) {
          log.d('websocket[信令通道] 正常关闭')
          resolve()
        } else {
          log.e('websocket[信令通道] 异常关闭: ', evt)
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
    let fun = this.hooks.get(evtNames['errHandler'])
    if (funExisting(fun)) {
      await this.hooks.get(evtNames['errHandler'])({
        type,
        value: err,
        code
      })
    } else {
      log.e(`webRTC 封装发生错误，且尚未指定错误处理回调:
        type = ${type},
        value = ${err},
        code = ${code}`
      )
    }
  }
}
