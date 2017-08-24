import * as evtNames from '../../../constants/eventName'
import { log } from '../../../utils/index'

/**
 * 钩子函数类(mixin 混入类)
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
    if (pairs instanceof Object) {
      let names = Object.values(evtNames) // 事件表
      for (let [n, f] of Object.entries(pairs)) {
        if (names.indexOf(n) !== -1) {
          // 订阅事件名在事件表中存在
          this.hooks.set(n, f)
        } else {
          log.e(`webRTC 封装订阅 ${n} 事件失败[事件名未找到]`)
        }
      }
    } else {
      log.e(`webRTC 封装订阅事件失败[参数错误]`)
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
          log.e(`webRTC 封装取消订阅 ${nm} 事件失败[事件名未找到]`)
        }
      }
    } else {
      log.e(`webRTC 封装取消订阅事件失败[参数错误]`)
    }
  }
}
