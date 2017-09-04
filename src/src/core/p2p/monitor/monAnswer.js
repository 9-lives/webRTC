import { judgeType, log } from '../../../index'
import { P2P } from '../../base/index'
import { createSDP, errHandler, pConnInit, resetP2PConnTimer, setRemoteSDP } from '../../../constants/methods/index'
import { p2pConnTimer } from '../../../constants/property/index'
import * as errCode from '../../../constants/errorCode/index'

const addIceCandidate = Symbol('addIceCandidate')
const addIceReady = Symbol('addIceReady')
const iceBuff = Symbol('addIceReady')

/**
 * webRTC 点对点通信(anaswerer)
 */

export class MonAnswer extends P2P {
  constructor (options = {}) {
    super(options)

    this[addIceReady] = false // offer[远程] 设置完成，可以添加ice候选 (临时方案)
    this[iceBuff] = [] // ice candidate[来自远程] 缓冲数组
  }

  /**
   * 初始化
   * @param {object} options RTCPeerConnection 配置
   * @returns {boolean} 初始化成功返回 true
   */
  init (options = {}) {
    return super[pConnInit](options)
  }

  /**
   * 启动 p2p 连接(stub method)
   * @returns {boolean} 启动 p2p 连接成功返回 true
   */
  async start (options = {}) {
    return true
  }

  /**
   * 添加远程 ice candidate
   */
  async [addIceCandidate] () {
    if (!judgeType('undefined', super[p2pConnTimer])) {
      // 若计时器已启动，复位连接超时计时器
      super[resetP2PConnTimer]()
    }

    let ice = this[iceBuff].pop()

    while (judgeType('object', ice)) {
      log.d('ice candidate[来自远程] 已添加到 p2p 连接')

      try {
        await this.peerConn.addIceCandidate(ice)
      } catch (err) {
        log.e(err.message)
        log.e('ice candidate 添加失败')
      }

      ice = this[iceBuff].pop()
    }
  }

  /**
   * websocket[信令通道] 收到 offer
   * @param {object} data RTCSessionDescription 格式的对象
   */
  async _rtcPCAddSDP (data) {
    // 设置远程 offer
    await this[setRemoteSDP](data)

    // 启动连接超时计时器
    super[resetP2PConnTimer]()

    // 临时方案
    this[addIceReady] = true
    await this[addIceCandidate]()

    // 构造 answer
    await this[createSDP]({ role: 'answer' })
  }

  /**
   * websocket[信令通道] 收到 ice candidate
   * @param {string} candidate 候选地址
   * @param {number} sdpMLineIndex 行索引
   * @param {string} sdpMid id
   */
  async _rtcPCAddIceCandidate ({ candidate, sdpMLineIndex, sdpMid }) {
    if (!(judgeType('number', sdpMLineIndex) && judgeType('string', candidate, sdpMid))) {
      throw new Error('ice candidate 添加失败[参数错误]')
    }

    log.d('已缓存 ice candidate[来自远程]')

    /**
      * chrome60 尚未实现查询连接状态API，采用临时方案
      * ice candidate 存入缓冲区
      * TODO 检查信令状态，提升 ice 设置速度
      */
    this[iceBuff].push(new RTCIceCandidate({
      candidate,
      sdpMLineIndex,
      sdpMid
    }))

    if (this[addIceReady] === true) {
      // 如果 answer 设置完毕
      await this[addIceCandidate]()
    }
  }
}
