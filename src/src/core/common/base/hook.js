import { errHandler } from '../../../constants/methods/index'
import * as evtNames from '../../../constants/eventName'
import * as errCode from '../../../constants/errorCode/index'
import { judgeType, log } from '../../../utils/index'

/**
 * 钩子函数类
 */
export const Hook = Base => class Hook extends Base {
  constructor (options = {}) {
    super(options)

    /*
      websocket、peerConnection的事件回调集合
      仅支持一对一
    */
    this.hooks = new Map()
  }

  /**
   * 订阅事件 [支持批量订阅]
   * @param {object} pairs key: 事件名, value: 回调方法
   */
  _rtcEvtsSubscribe ({ pairs }) {
    if (judgeType('object', pairs)) {
      let names = Object.values(evtNames) // 事件表
      for (let [n, f] of Object.entries(pairs)) {
        if (names.indexOf(n) !== -1) {
          // 订阅事件名在事件表中存在
          this.hooks.set(n, f)
        } else {
          log.e(`webRTC 库订阅 ${n} 事件失败[事件名未找到]`)
        }
      }
    } else {
      log.e(`webRTC 库订阅事件失败[参数错误]`)
    }
  }

  /**
   * 取消订阅 [支持批量取消]
   * @param {array} names
   */
  _rtcEvtsUnsubscribe ({ names }) {
    if (names instanceof Array) {
      // 批量取消订阅
      for (let nm of names) {
        if (this.hooks.has(nm)) {
          this.hooks.delete(nm)
        } else {
          log.e(`webRTC 库取消订阅 ${nm} 事件失败[事件名未找到]`)
        }
      }
    } else {
      log.e(`webRTC 库取消订阅事件失败[参数错误]`)
    }
  }

  /**
   * 事件回调
   * @param {string} evtName 事件名
   * @param {array} args 参数列表
   * @param {string} codeName 错误代码名
   * @param {string} errType 错误类型 1. 'websocket' 2. peerConnection
   */
  async evtCallBack ({evtName = '', args = [], codeName = '', errType = ''}) {
    if (judgeType('string', evtName, codeName, errType) && args instanceof Array) {
      let f = this.hooks.get(evtNames[evtName])

      if (judgeType('function', f)) {
        try {
          await f(...args)
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e(`${errType} ${evtNames[evtName]} 回调异常`)

          await this[errHandler]({
            type: errType,
            value: err,
            code: errCode[codeName]
          })
        }
      }
    } else {
      throw new Error('webRTC 库事件回调方法执行失败[参数错误]')
    }
  }
}
