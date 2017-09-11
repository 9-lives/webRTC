import { judgeType, log } from '../../../index'
import { P2P } from '../../base/index'
import { addIceCandidate, createConstraints, getMedia, pConnInit, resetP2PConnTimer, setRemoteSDP } from '../../../constants/methods/index'
import { p2pConnTimer } from '../../../constants/property/index'
import * as errCode from '../../../constants/errorCode/index'

/**
 * webRTC 点对点通信(offerer)
 */

export class MonOffer extends P2P {
  constructor (options = {}) {
    super(options)
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
   * 启动 p2p 连接
   * @param {object} options 流媒体约束参数
   * @returns {boolean} 启动 p2p 连接成功返回 true
   */
  async start (options = {}) {
    // 获取设备信息
    let devInfo = await super._rtcGetDevInfo()

    // 构造 MediaTrackConstraints
    let constraints = super[createConstraints]({
      options,
      devInfo
    })

    // 获取流媒体
    this.mediaStream = await super[getMedia](constraints)

    // 添加本地流媒体（已在工作草案中移除）并发起 sdp 协商
    this.pc.addStream(this.mediaStream)

    return true
  }

  /**
   * websocket[信令通道]收到 answer
   * @param {object} data RTCSessionDescription 格式的对象
   */
  async _rtcPCAddSDP (data) {
    await this[setRemoteSDP](data)

    // 复位连接超时计时器
    if (!this.dataChannel) {
      // 数据通道协商不复位计时器
      super[resetP2PConnTimer]()
    }

    return true
  }

  /**
   * websocket[信令通道] 收到 ice candidate
   * @param {string} candidate 候选地址
   * @param {number} sdpMLineIndex 行索引
   * @param {string} sdpMid id
   */
  async _rtcPCAddIceCandidate ({ candidate, sdpMLineIndex, sdpMid }) {
    if (!(judgeType('number', sdpMLineIndex) && judgeType('string', candidate, sdpMid))) {
      throw new Error('ice candidate[来自远程] 添加失败[参数错误]')
    }

    await super[addIceCandidate]({
      candidate,
      sdpMLineIndex,
      sdpMid
    })

    if (!judgeType('undefined', super[p2pConnTimer])) {
      // 计时器若已启动，复位连接超时计时器
      super[resetP2PConnTimer]()
    }
  }
}
