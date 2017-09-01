import { judgeType, log } from '../../../index'
import { P2P } from '../../common/index'
import { createConstraints, errHandler, getMedia, pConnInit, resetP2PConnTimer } from '../../../constants/methods/index'
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
    super[pConnInit](options)
    return true
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

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // 添加本地媒体流（已在工作草案中移除）
    this.peerConn.addStream(this.mediaStream)

    return true
  }

  /**
   * websocket[信令通道]收到 answer
   */
  async _rtcP2PRcvSDP (data) {
    if (data.sdp) {
      log.d('收到 answer[来自远程]')
      /**
       * RTCSessionDescription 构造器已从工作草案中移除,chrome 59允许直接传入 sdp 格式对象充当参数
       */
      let sessionDescription = {
        type: 'answer',
        sdp: data.sdp
      }
      // 设置 answer[来自远程]
      try {
        await this.peerConn.setRemoteDescription(sessionDescription)
        log.d('answer[来自远程]设置完毕')
      } catch (err) {
        if (err.message) {
          log.e(err.message)
        }
        log.e('远程 answer 设置失败')

        await this[errHandler]({
          type: 'peerConnection',
          code: errCode.P2P_SDP_REMOTE_SETFAILED
        })
      }

      // 复位连接超时计时器
      super[resetP2PConnTimer]()
    }
  }

  /**
   * websocket[信令通道] 收到 ice candidate
   */
  async _rtcP2PRcvIceCandidate (data) {
    if (data.candidate && !judgeType('undefined', data.sdpMLineIndex, data.sdpMid)) {
      log.d('收到 ice candidate[来自远程], 添加到 p2p 连接')
      let rtcIceCandidate = new RTCIceCandidate({
        candidate: data.candidate,
        sdpMLineIndex: data.sdpMLineIndex,
        sdpMid: data.sdpMid
      })

      try {
        await this.peerConn.addIceCandidate(rtcIceCandidate)
      } catch (err) {
        if (err.message) {
          log.e(err.message)
        }
        log.e('ice candidate 添加失败')

        await this[errHandler]({
          type: 'peerConnection',
          err,
          code: errCode.P2P_ICE_ADDFAILED
        })
      }

      if (!judgeType('undefined', super[p2pConnTimer])) {
        // 复位连接超时计时器
        super[resetP2PConnTimer]()
      }
    }
  }
}
