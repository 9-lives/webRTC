import { judgeType, log } from '../../../index'
import { P2P } from '../../common/p2p'
import { createSDP, errHandler, pConnInit, resetP2PConnTimer } from '../../../constants/methods/index'
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
    super[pConnInit](options)
    return true
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
      // 复位连接超时计时器
      super[resetP2PConnTimer]()
    }

    let ice = this[iceBuff].pop()

    while (judgeType('object', ice)) {
      log.d('ice candidate[来自远程] 添加到 p2p 连接')

      try {
        await this.peerConn.addIceCandidate(ice)
      } catch (err) {
        log.e(err.message)
        log.e('ice candidate 添加失败')
        await this[errHandler]({
          type: 'peerConnection',
          err,
          code: errCode.P2P_ICE_ADDFAILED
        })
      }

      ice = this[iceBuff].pop()
    }
  }

  /**
   * websocket[信令通道] 收到 offer
   */
  async _rtcP2PRcvSDP (data) {
    if (data.sdp) {
      // 收到 offer[来自远程]
      log.d('收到 offer[来自远程]')
      /**
       * RTCSessionDescription 构造器已从工作草案中移除,chrome 59允许直接传入 sdp 格式对象充当参数
       */
      let rtcSessionDescription = {
        type: 'offer',
        sdp: data.sdp
      }
      // 设置 offer[来自远程]
      try {
        await this.peerConn.setRemoteDescription(rtcSessionDescription)
        log.d('offer[来自远程] 设置完毕')
      } catch (err) {
        log.e(err.message)
        log.e('远程 offer 设置失败')
        await this[errHandler]({
          type: 'peerConnection',
          code: errCode.P2P_SDP_REMOTE_SETFAILED
        })
      }

      // 启动连接超时计时器
      super[resetP2PConnTimer]()

      // 临时方案
      this[addIceReady] = true
      await this[addIceCandidate]()

      // 构造 answer
      await this[createSDP]({ role: 'answer' })
    }
  }

  /**
   * websocket[信令通道] 收到 ice candidate
   */
  async _rtcP2PRcvIceCandidate (data) {
    if (data.candidate && !judgeType('undefined', data.sdpMLineIndex, data.sdpMid)) {
      log.d('收到并缓存 ice candidate[来自远程]')
      let rtcIceCandidate = new RTCIceCandidate({
        candidate: data.candidate,
        sdpMLineIndex: data.sdpMLineIndex,
        sdpMid: data.sdpMid
      })

      /**
       * chrome 尚未实现查询连接状态API，采用临时方案
       * ice candidate 存入缓冲区
       * TODO 检查信令状态，提升 ice 设置速度
       */
      this[iceBuff].push(rtcIceCandidate)
      if (this[addIceReady] === true) {
        // 如果 answer 设置完毕
        await this[addIceCandidate]()
      }
    }
  }
}
