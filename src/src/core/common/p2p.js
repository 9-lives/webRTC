import { log } from '../../index'
import { RtcCommon } from './index'
import { errHandler } from '../../constants/index'
import * as errCode from '../../constants/errorCode/index'
import * as evtNames from '../../constants/eventName'
import { funExisting, isUndefined } from '../../utils'
import { webRtcConfig } from '../../../config'

/**
 * webRTC peerConnection 基础类
 *  仅兼容chrome 53 及以上版本
 */
export class P2P extends RtcCommon {
  constructor (options = {}) {
    const {
      config = {}
    } = options
    super(options)

    this.config = config // p2p 连接参数
    this.peerConn = undefined // p2p连接
    this.p2pConnTimer = undefined // p2p 连通超时计时器
    this.role = undefined // 角色: offerer / answerer
  }

  /**
   * PeerConnection 对象初始化
   */
  pConnInit () {
    if (!window.RTCPeerConnection) {
      log.e('RTCPeerConnection API 不存在，请更换浏览器')
      throw new Error('peerConnection 对象初始化失败')
    }

    this.peerConn = new RTCPeerConnection(this.config) // p2p 连接对象
    this.peerConn.onicecandidate = async evt => {
      // 采集本地 ice candidate(兼容 chrome 56 及以上版本，以下版本通过 RTCIceCandidateEvent 实现)
      if (evt.candidate) {
        // 本地 ice candidate 上传至服务器
        log.d('ice candidate已采集[本地]')
        try {
          let f = this.hooks.get(evtNames['pOnIceCandidate'])
          if (funExisting(f)) {
            await f(evt.candidate)
          }
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e(`p2p连接 ${evtNames['pOnIceCandidate']} 回调异常`)
          await this[errHandler]({
            type: 'peerConnection',
            value: err,
            code: errCode.P2P_HOOK_ICE_GATHERER
          })
        }
      }
    }
    // 准备 sdp 协商(offerer)
    this.peerConn.onnegotiationneeded = async evt => {
      log.d('发起 sdp 协商')
      await this.createSdp({ type: 'offer' })
    }
    // 接收到远程流媒体(标准已移除)
    this.peerConn.onaddstream = async streamEvt => {
      log.i('收到远程流媒体', streamEvt.stream)

      try {
        let f = this.hooks.get(evtNames['pOnAddStream'])
        if (funExisting(f)) {
          await f(streamEvt.stream)
        }
      } catch (err) {
        if (err.message) {
          log.e(err.message)
        }
        log.e(`p2p连接 ${evtNames['pOnAddStream']} 回调异常`)
        await this[errHandler]({
          type: 'peerConnection',
          value: err,
          code: errCode.P2P_HOOK_STREAM_RECEIVED
        })
      }
    }
    // p2p 流媒体已移除
    this.peerConn.onremovestream = () => {
      log.d('流媒体已移除')
    }

    /*
     * 根据工作草案，应使用此事件感知 p2p 连接状态变化，遗憾的是，浏览器(chrome 59)未支持 connectionState 属性
     */
    // this.peerConn.onconnectionstatechange = () => {}

    // ice 连接状态改变
    this.peerConn.oniceconnectionstatechange = async evt => {
      switch (this.peerConn.iceConnectionState) {
        case 'completed':
          // 搜集完毕不一定发现通路
          log.d('ice candidate 搜集完毕')

          try {
            let f = this.hooks.get(evtNames['pIceConnCompleted'])
            if (funExisting(f)) {
              await f(evt)
            }
          } catch (err) {
            if (err.message) {
              log.e(err.message)
            }
            log.e(`p2p连接 ${evtNames['pIceConnCompleted']} 回调异常`)
            await this[errHandler]({
              type: 'peerConnection',
              err,
              code: errCode.P2P_HOOK_ICE_CONN_COMPLETED
            })
          }
          break
        case 'connected':
          log.d('p2p ice 连接完成')

          if (this.role === 'answerer') {
            this.clearP2PConnTimer()
          }

          try {
            let f = this.hooks.get(evtNames['pIceConnConnected'])
            if (funExisting(f)) {
              await f()
            }
          } catch (err) {
            if (err.message) {
              log.e(err.message)
            }
            log.e(`p2p连接 ${evtNames['pIceConnConnected']} 回调异常`)
            await this[errHandler]({
              type: 'peerConnection',
              err,
              code: errCode.P2P_HOOK_ICE_CONN_CONNECTED
            })
          }
          break
        /**
         * TODO 避开未实现的工作草案，查询连接状态，区分正常 / 异常的disconnected、failed，针对性报错
         * 在上述工作未完成前，后面的两种情况存在BUG
         */
        case 'disconnected':
           // 可能的情况： 1. 远端主动断开连接，稍后本地 ice 连接状态将变为 failed  2. ice 通路故障，若故障修复连接状态将变为 connected,否则 failed
          log.i('p2p ice 连接中断')

          try {
            let f = this.hooks.get(evtNames['pIceConnDisconnected'])
            if (funExisting(f)) {
              await f()
            }
          } catch (err) {
            if (err.message) {
              log.e(err.message)
            }
            log.e(`p2p连接 ${evtNames['pIceConnDisconnected']} 回调异常`)
            await this[errHandler]({
              type: 'peerConnection',
              err,
              code: errCode.P2P_HOOK_ICE_CONN_DISCONNECTED
            })
          }
          break
        case 'failed':
          log.e('p2p ice 连接异常关闭')

          try {
            let f = this.hooks.get(evtNames['pIceConnFailed'])
            if (funExisting(f)) {
              await f()
            }
          } catch (err) {
            if (err.message) {
              log.e(err.message)
            }
            log.e(`p2p连接 ${evtNames['pIceConnFailed']} 回调异常`)
            await this[errHandler]({
              type: 'peerConnection',
              err,
              code: errCode.P2P_HOOK_ICE_CONN_FAILED
            })
          }
          break
        default:
          break
      }
    }

    /**
     * 根据工作草案，应使用此事件感知 ice agent 搜集状态变化，遗憾的是，浏览器(chrome 59)未支持该事件
     */
    // this.peerConn.onicegatheringstatechange = () => {}

    // 信令状态改变
    // this.peerConn.onsignalingstatechange = () => {
    //   // TODO 优化ice 添加速度, 在此添加ice
    // }
    return true
  }

  /**
   * 创建并设置本地 SDP 信令
   */
  async createSdp ({ type } = { type: '' }) {
    let sdp
    try {
      switch (type) {
        case 'offer':
          sdp = await this.peerConn.createOffer()
          break
        case 'answer':
          sdp = await this.peerConn.createAnswer()
          break
        default:
          throw new Error('本地 sdp 生成参数错误')
      }
    } catch (err) {
      if (err.message) {
        log.e(err.message)
      }
      log.e('本地 sdp 生成失败')
      await this[errHandler]({
        type: 'peerConnection',
        value: err,
        code: errCode.P2P_SDP_LOCAL_GENERATEDFAILED
      })
    }

    // 设置本地 SDP 后开始搜集 ice candidate
    try {
      await this.peerConn.setLocalDescription(sdp)
    } catch (err) {
      if (err.message) {
        log.e(err.message)
      }
      log.e('本地 sdp 设置失败')
      await this[errHandler]({
        type: 'peerConnection',
        value: err,
        code: errCode.P2P_SDP_LOCAL_SETFAILED
      })
    }

    // 发送本地 sdp 到信令服务器
    try {
      let fun = this.hooks.get(evtNames['pLocalSDPReady'])
      if (funExisting(fun)) {
        await fun(this.peerConn.localDescription)
      }
    } catch (err) {
      if (err.message) {
        log.e(err.message)
      }
      log.e('p2p连接 LocalSDPReady 回调异常')
      await this[errHandler]({
        type: 'peerConnection',
        value: err,
        code: errCode.P2P_HOOK_SDP_LOCAL_READY
      })
    }
  }

  /**
   * 关闭连接
   */
  close () {
    if (this.peerConn instanceof RTCPeerConnection) {
      this.clearP2PConnTimer()
      if (this.peerConn.signalingState !== 'closed') {
        log.d('p2p 连接已关闭')
        this.peerConn.close()
      }
      super.close()
    }
  }

  /**
   * 清除 p2p 连接超时计时器
   */
  clearP2PConnTimer () {
    if (!isUndefined(this.p2pConnTimer)) {
      clearTimeout(this.p2pConnTimer)
      this.p2pConnTimer = undefined
    }
  }

  /**
   * 复位 p2p 连接超时计时器
   */
  resetP2PConnTimer () {
    this.clearP2PConnTimer()

    this.p2pConnTimer = setTimeout(() => {
      this[errHandler]({
        type: 'peerConnection',
        code: errCode.P2P_CONN_ESTABLISH_TIMEOUT
      })
      this.p2pConnTimer = undefined
    }, webRtcConfig.p2pConnTimeout * 1000)
  }

  /**
   * 获取 p2p 连接的远程流媒体
   */
  _rtcGetRemoteStreams () {
    if (this.peerConn instanceof RTCPeerConnection) {
      return this.peerConn.getRemoteStreams()
    }
  }
}
