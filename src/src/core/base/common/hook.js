import { judgeType, log } from '../../../utils/index'
import { errHandler, evtCallBack } from '../../../constants/methods/index'

import * as evtNames from '../../../constants/eventName'
import * as errCode from '../../../constants/errorCode/index'
import { hooks } from '../../../constants/property/index'

/**
 * 钩子函数类
 */
export const Hook = Base => class Hook extends Base {
  constructor (options = {}) {
    super(options)
    this[hooks] = new Map() // peerConnection， mediaRecorder 事件回调集合, 仅支持一对一
  }

  /**
   * 订阅事件 [支持批量订阅]
   * @param {object} pairs key: 事件名。 value: 回调方法
   * @returns {boolean} 全部取消订阅成功 true; 部分成功或完全失败 false
   */
  _rtcEvtsSubscribe ({ pairs }) {
    if (!judgeType('object', pairs)) {
      log.e(`webRTC 库订阅事件失败[参数错误]`)
      return false
    }

    let flag = true
    for (let [n, f] of Object.entries(pairs)) {
      if (Object.values(evtNames).indexOf(n) !== -1) {
        // 订阅事件名在事件表中存在
        this[hooks].set(n, f)
      } else {
        log.e(`webRTC 库订阅 ${n} 事件失败[事件名未找到]`)
        flag = false
      }
    }

    return flag
  }

  /**
   * 取消订阅 [支持批量取消]
   * @param {array} names
   * @returns {boolean} 全部取消订阅成功 true; 部分成功或完全失败 false
   */
  _rtcEvtsUnsubscribe ({ names }) {
    if (!(names instanceof Array)) {
      log.e(`webRTC 库取消订阅事件失败[参数错误]`)
      return false
    }

    // 批量取消订阅
    let flag = true
    for (let nm of names) {
      if (this[hooks].has(nm)) {
        this[hooks].delete(nm)
      } else {
        log.e(`webRTC 库取消订阅 ${nm} 事件失败[事件名未找到]`)
        flag = false
      }
    }

    return flag
  }

  /**
   * 事件回调
   * @param {string} evtName 事件名
   * @param {array} args 参数列表
   * @param {string} codeName 错误代码名
   * @param {string} errType 错误类型 1. 'mediaRecorder' 2. peerConnection
   */
  async [evtCallBack] ({evtName = '', args = [], codeName = '', errType = ''}) {
    if (!(judgeType('string', evtName, codeName, errType) && args instanceof Array)) {
      log.e('webRTC 库事件回调方法执行失败[参数错误]')
      return
    }

    let f = this[hooks].get(evtNames[evtName])

    if (judgeType('function', f)) {
      try {
        await f(...args)
        return true
      } catch (err) {
        if (err.message) {
          log.e(err.message)
        }
        log.e(`${errType} ${evtNames[evtName]} 回调异常`)

        await this[errHandler]({
          type: errType,
          err,
          code: errCode[codeName]
        })
      }
    }
  }

  /**
   * 错误回调
   * type: 错误类型。p2p 错误：'peerConnection'；录制 错误：'mediaRecorder'
   */
  async [errHandler] ({ type = '', err = {}, code }) {
    let f = this[hooks].get(evtNames['errHandler'])

    if (!judgeType('function', f)) {
      log.e(`webRTC 库发生错误，且尚未指定错误处理回调:
        type： ${type}, code： ${code},
        value： ${err}`
      )
      return
    }

    await f({
      type,
      value: err,
      code
    })
  }
}
