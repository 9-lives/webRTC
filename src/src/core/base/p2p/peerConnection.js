import { RtcBase } from '../index'

import { judgeType, log } from '../../../utils'
import { addIceCandidate, createSDP, errHandler, evtCallBack, pConnInit, resetP2PConnTimer, setRemoteSDP } from '../../../constants/methods/index'
import { addDCListener } from './dataChannel'

import * as errCode from '../../../constants/errorCode/index'
import * as evtNames from '../../../constants/eventName'
import { p2pConnTimer } from '../../../constants/property/index'
import { webRtcConfig } from '../../../../config'

const clearPcTimer = Symbol('clearPcTimer') // 复位 p2p 连接超时计时器

// p2p连接事件监听器
const pcEvtListener = {
  /**
   * 收到远程流媒体(标准已移除)
   * @param {object} 事件对象
   */
  addStream: function (e) {
    log.i('收到远程流媒体：', e.stream)

    this[evtCallBack]({
      evtName: 'pOnAddStream',
      args: [e.stream]
    })
  },

  /**
   * 收到数据通道对象
   * @param {object} e 事件对象
   */
  dataChannel: function (e) {
    // 重协商完毕，连接恢复后(iceConnectionState = 'connected')才能收到数据通道对象
    this.dc = e.channel
    addDCListener.call(this, { channel: this.dc })
  },

  /**
   * 正在采集本地 ice candidate
   * @param {object} 事件对象
   */
  iCandidate: function (e) {
    if (e.candidate) {
      log.d('ice candidate已采集[本地]')

      // 本地 ice candidate 上传至服务器
      this[evtCallBack]({
        evtName: 'pOnIceCandidate',
        args: [e.candidate]
      })
    }
  },

  /**
   * ice 连接状态改变
   * @param {object} evt 事件对象
   */
  iConnStateChange: async function (evt) {
    switch (this.pc.iceConnectionState) {
      case 'completed':
        pcEvtListener.iConnStateCompleted.call(this, evt)
        break
      case 'connected':
        pcEvtListener.iConnStateConnected.call(this, evt)
        break
      /**
        * TODO 查询连接状态，区分正常 / 异常的disconnected、failed，针对性报错
        * 在上述工作未完成前，后面的两种情况处理不完善
        */
      case 'disconnected':
          // 可能的情况： 1. 远端主动断开连接，稍后本地 ice 连接状态将变为 failed  2. ice 通路故障，若故障修复连接状态将变为 connected,否则 failed
        pcEvtListener.iConnStateDisconnected.call(this, evt)
        break
      case 'failed':
        await pcEvtListener.iConnStateFailed.call(this, evt)
        break
    }
  },
  /**
   * ice 连接状态改变 - completed
   * @param {object} evt 事件对象
   */
  iConnStateCompleted: function (evt) {
    log.d('ice candidate 搜集完毕')

    this[evtCallBack]({
      evtName: 'pIceConnCompleted',
      args: [evt]
    })
  },

  /**
   * ice 连接状态改变 - connected
   * @param {object} evt 事件对象
   */
  iConnStateConnected: function (evt) {
    if (this[clearPcTimer]()) {
      log.d('p2p ice 连接成功, 清除超时计时器')
    }

    this[evtCallBack]({
      evtName: 'pIceConnConnected',
      args: [evt]
    })
  },

  /**
   * ice 连接状态改变 - disconnected
   * @param {object} evt 事件对象
   */
  iConnStateDisconnected: function (evt) {
    log.d('p2p ice 连接中断')

    this[evtCallBack]({
      evtName: 'pIceConnDisconnected',
      args: [evt]
    })
  },

  /**
   * ice 连接状态改变 - failed
   * @param {object} evt 事件对象
   */
  iConnStateFailed: async function () {
    log.e('p2p ice 连接异常关闭')

    this[errHandler]({
      type: 'peerConnection',
      code: errCode.P2P_ICECONN_FAILED
    })
  },

  /**
   * 准备 sdp 协商(offerer)
   */
  ngoNeeded: async function () {
    log.d('发起 sdp 协商')
    try {
      await this[createSDP]({ role: 'offer' })
    } catch (err) {
      log.e('发起 sdp 协商失败')
      this[errHandler]({
        type: 'peerConnection',
        err,
        code: errCode.P2P_STARTNGO_FAILED
      })
    }
  },

  /**
   * p2p 流媒体已移除
   */
  removeStream: function () {
    log.d('流媒体已移除')
  }
}

/**
 * peerConnection 类(含数据通道，未开发完成)
 * 目前仅兼容chrome 56 及以上版本
 */
export class P2P extends RtcBase {
  constructor (options = {}) {
    super(options)
    this.dc = undefined // p2p 数据通道
    this.pc = undefined // p2p连接
    this[p2pConnTimer] = undefined // p2p 连通超时计时器
  }

  /**
   * 添加 ice candidate[来自远程]到 p2p 连接
   * @param {string} candidate 候选地址
   * @param {number} sdpMLineIndex 行索引
   * @param {string} sdpMid id
   */
  async [addIceCandidate] ({ candidate, sdpMLineIndex, sdpMid }) {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate({
        candidate,
        sdpMLineIndex,
        sdpMid
      }))
      log.d('ice candidate[来自远程] 已添加到 p2p 连接')
    } catch (err) {
      log.e('ice candidate[来自远程] 添加失败')
      throw err
    }
  }

  /**
   * 生成并设置本地 SDP 信令
   * @param {string} role 角色。 offer 或 answer
   */
  async [createSDP] ({ role }) {
    let sdp

    // 构造本地 SDP
    try {
      switch (role) {
        case 'offer':
          sdp = await this.pc.createOffer()
          break
        case 'answer':
          sdp = await this.pc.createAnswer()
          break
      }
    } catch (err) {
      log.e(`生成本地 ${role} 失败`)
      throw err
    }

    // 设置本地 SDP 后开始搜集 ice candidate
    try {
      await this.pc.setLocalDescription(sdp)
    } catch (err) {
      log.e(`设置本地 ${role} 设置失败`)
      throw err
    }

    // 发送本地 sdp 到信令服务器
    this[evtCallBack]({
      evtName: 'pLocalSDPReady',
      args: [this.pc.localDescription]
    })
  }

  /**
   * 关闭p2p连接及本地流媒体
   */
  async close () {
    if (!(this.pc instanceof RTCPeerConnection)) {
      log.e('p2p 连接关闭失败[连接不存在]')
      return false
    }

    this[clearPcTimer]()

    if (this.pc.signalingState !== 'closed') {
      log.d('p2p 连接已关闭')
      this.pc.close()
    }

    if (super.close) {
      // rtcBase 层关闭
      super.close()
    }

    this[evtCallBack]({
      evtName: 'pClosed'
    })

    return true
  }

  /**
   * 清除 p2p 连接超时计时器
   * @returns {boolean} 清除成功返回 true；失败 false
   */
  [clearPcTimer] () {
    if (!judgeType('number', this[p2pConnTimer])) {
      return false
    }

    clearTimeout(this[p2pConnTimer])
    this[p2pConnTimer] = undefined
    return true
  }

  /**
   * 复位 p2p 连接超时计时器
   */
  [resetP2PConnTimer] () {
    this[clearPcTimer]()
    this[p2pConnTimer] = setTimeout(async () => {
      log.e('p2p建立连接超时')
      this[p2pConnTimer] = undefined

      this[errHandler]({
        type: 'peerConnection',
        code: errCode.P2P_ICECONN_ESTABLISH_TIMEOUT
      })
    }, webRtcConfig.p2pConnTimeout * 1000)
  }

  /**
   * 获取 p2p 连接的远端流媒体
   * @returns {array | undefined} 成功返回远端流媒体数组；失败返回 undefined
   */
  _rtcGetRemoteStreams () {
    if (!(this.pc instanceof RTCPeerConnection)) {
      log.e('取远端流媒体失败[p2p连接未找到]')
      return
    }

    return this.pc.getRemoteStreams()
  }

  /**
   * PeerConnection 对象初始化
   * @param {object} options RTCPeerConnection 配置
   * @returns {boolean} 成功返回 true；失败 false
   */
  [pConnInit] (options = {}) {
    if (!window.RTCPeerConnection) {
      log.e('peerConnection 对象初始化失败[RTCPeerConnection API 不存在]')
      return false
    }

    this.pc = new RTCPeerConnection(options) // p2p 连接

    this.pc.onaddstream = pcEvtListener.addStream.bind(this)
    this.pc.ondatachannel = pcEvtListener.dataChannel.bind(this)
    this.pc.onicecandidate = pcEvtListener.iCandidate.bind(this)

    /*
     * 根据工作草案，应使用此事件感知 p2p 连接状态变化。浏览器(chrome 60)未支持 connectionState 属性
     */
    // this.pc.onconnectionstatechange = () => {}

    this.pc.oniceconnectionstatechange = pcEvtListener.iConnStateChange.bind(this)

    /**
     * 根据工作草案，应使用此事件感知 ice agent 搜集状态变化。浏览器(chrome 60)未支持该事件
     */
    // this.pc.onicegatheringstatechange = () => {}

    this.pc.onnegotiationneeded = pcEvtListener.ngoNeeded.bind(this)
    this.pc.onremovestream = pcEvtListener.removeStream.bind(this)

    /**
     * 信令状态改变
     * 根据工作草案定义，answer端 have-local-panswer 状态可能被跳过
     */
    // this.pc.onsignalingstatechange = () => {}

    return true
  }

/**
 * 设置远程 sdp
 * @param {object} data RTCSessionDescription 格式的普通对象
 * @param {string} type 类型。 answer / offer
 * @param {string} sdp 会话描述协议
 * @returns {boolean} 设置成功返回 true；失败 false
 */
  async [setRemoteSDP] ({ sdp, type }) {
    if (!(judgeType('string', sdp, type))) {
      throw new Error('设置远程 sdp 失败[参数错误]')
    }

    /**
      * 由于与序列化后与普通对象一致，RTCSessionDescription 构造器已从工作草案中移除,chrome 59允许直接传入 sdp 格式对象充当参数
      */
    try {
      // 设置 sdp[来自远程]
      await this.pc.setRemoteDescription({
        type,
        sdp
      })
      log.d(`${type}[来自远程] 设置完毕`)
    } catch (err) {
      log.e(err.message)
      throw new Error(`远程 ${type} 设置失败`)
    }
  }
}
