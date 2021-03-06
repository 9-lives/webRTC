import { judgeType, log } from '../../../index'
import { P2P } from '../../common/index'
import { connect, createConstraints, errHandler, getDevId, getMedia } from '../../../constants/index'

export const wsReconnect = Symbol('wsReconnect')

/**
 * webRTC 点对点通信(offerer)
 */

export class MonOffer extends P2P {
  constructor (options = {}) {
    super(options)

    this.role = 'offerer' // 角色： offerer
  }

  /**
   * 开启 p2p 连接
   */
  async start (options = {}) {
    // PeerConnection 对象初始化
    await super.pConnInit()

    // 建立 websocket 连接
    await super[connect]()

    // 获取设备ID
    let devIds = await super[getDevId]()

    // 构造 MediaTrackConstraints
    let constraints = super[createConstraints](options, devIds)

    // 获取媒体流
    this.mediaStream = await super[getMedia](constraints)

    // 添加本地媒体流（已在工作草案中移除）
    this.peerConn.addStream(this.mediaStream)

    return true
  }

  /**
   * websocket 断线重连
   */
  async [wsReconnect] () {
    await super[connect]()
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
        this[errHandler]({
          type: 'peerConnection',
          code: -2004
        })
      }

      // 复位连接超时计时器
      this.resetP2PConnTimer()
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
          code: -2006
        })
      }

      if (!judgeType('undefined', this.p2pConnTimer)) {
        // 复位连接超时计时器
        this.resetP2PConnTimer()
      }
    }
  }
}
