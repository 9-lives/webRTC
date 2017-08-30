import { errHandler, connect } from '../../../constants/methods/index'
import * as errCode from '../../../constants/errorCode/index'
import * as evtNames from '../../../constants/eventName'
import { judgeType, log } from '../../../index'

/**
 * 连接类(mixin 混入类)
 */
export const Connect = Base => class Connect extends Base {
  constructor (options = {}) {
    super(options)
  }

  /**
   * 错误回调
   * type: 错误类型。p2p 错误：'peerConnection'；websocket 错误：'websocket'
   */
  async [errHandler] ({ type = '', err = {}, code }) {
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
