import { RtcBase } from '../index'

import { judgeType, log } from '../../../utils'
import { createSDP, errHandler, evtCallBack, pConnInit, resetP2PConnTimer, setRemoteSDP } from '../../../constants/methods/index'
import { addDCListener } from './dataChannel'

import * as errCode from '../../../constants/errorCode/index'
import * as evtNames from '../../../constants/eventName'
import { p2pConnTimer } from '../../../constants/property/index'
import { webRtcConfig } from '../../../../config'

const clearP2PConnTimer = Symbol('clearP2PConnTimer') // 复位 p2p 连接超时计时器

/**
 * peerConnection 类
 * 目前仅兼容chrome 56 及以上版本
 */
export class P2P extends RtcBase {
  constructor (options = {}) {
    super(options)
    this.dataChannel = undefined // p2p 数据通道
    this.peerConn = undefined // p2p连接
    this[p2pConnTimer] = undefined // p2p 连通超时计时器
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

    this.peerConn = new RTCPeerConnection(options) // p2p 连接

    this.peerConn.onaddstream = onaddstream.bind(this)
    this.peerConn.ondatachannel = ondatachannel.bind(this)
    this.peerConn.onicecandidate = onicecandidate.bind(this)

    /*
     * 根据工作草案，应使用此事件感知 p2p 连接状态变化。浏览器(chrome 60)未支持 connectionState 属性
     */
    // this.peerConn.onconnectionstatechange = () => {}

    this.peerConn.oniceconnectionstatechange = oniceconnectionstatechange.bind(this)

    /**
     * 根据工作草案，应使用此事件感知 ice agent 搜集状态变化。浏览器(chrome 60)未支持该事件
     */
    // this.peerConn.onicegatheringstatechange = () => {}

    this.peerConn.onnegotiationneeded = onnegotiationneeded.bind(this)
    this.peerConn.onremovestream = onremovestream.bind(this)

    /**
     * 信令状态改变
     * 该事件监听在chrome 60 似乎存在BUG，本地测试一定几率观察到浏览器遗漏状态变更，结果是发出两次状态变更到stable事件
     * 由于可能的chrome bug，放弃在此进行检查或优化
     */
    // this.peerConn.onsignalingstatechange = () => {}

    return true
  }

  /**
   * 创建并设置本地 SDP 信令
   * @param {string} role 角色。 offer 或 answer
   */
  async [createSDP] ({ role }) {
    let sdp

    // 构造本地 SDP
    try {
      switch (role) {
        case 'offer':
          sdp = await this.peerConn.createOffer()
          break
        case 'answer':
          sdp = await this.peerConn.createAnswer()
          break
      }
    } catch (err) {
      log.e(err.message)
      throw new Error(`构造本地 ${role} 失败`)
    }

    // 设置本地 SDP 后开始搜集 ice candidate
    try {
      await this.peerConn.setLocalDescription(sdp)
    } catch (err) {
      log.e(err.message)
      throw new Error(`设置本地 ${role} 设置失败`)
    }

    // 发送本地 sdp 到信令服务器
    this[evtCallBack]({
      evtName: 'pLocalSDPReady',
      args: [this.peerConn.localDescription],
      codeName: 'P2P_HOOK_SDP_LOCAL_READY',
      errType: 'peerConnection'
    })
  }

  /**
   * 关闭p2p连接及本地流媒体
   */
  async close () {
    if (!(this.peerConn instanceof RTCPeerConnection)) {
      log.e('p2p 连接关闭失败[连接不存在]')
      return false
    }

    this[clearP2PConnTimer]()

    if (this.peerConn.signalingState !== 'closed') {
      log.d('p2p 连接已关闭')
      this.peerConn.close()
    }

    if (super.close) {
      // rtcBase 层关闭
      super.close()
    }

    this[evtCallBack]({
      evtName: 'pClosed',
      codeName: 'P2P_HOOK_CONN_CLOSED_FAILED',
      errType: 'peerConnection'
    })

    return true
  }

  /**
   * 清除 p2p 连接超时计时器
   */
  [clearP2PConnTimer] () {
    if (!judgeType('undefined', this[p2pConnTimer])) {
      clearTimeout(this[p2pConnTimer])
      this[p2pConnTimer] = undefined
      return true
    } else {
      return false
    }
  }

  /**
   * 复位 p2p 连接超时计时器
   */
  [resetP2PConnTimer] () {
    this[clearP2PConnTimer]()
    this[p2pConnTimer] = setTimeout(async () => {
      log.e('p2p建立连接超时')
      this[p2pConnTimer] = undefined

      await this[errHandler]({
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
    if (!(this.peerConn instanceof RTCPeerConnection)) {
      log.e('取远端流媒体失败[p2p连接未找到]')
      return
    }

    return this.peerConn.getRemoteStreams()
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
      await this.peerConn.setRemoteDescription({
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

/**
 * p2p连接事件监听 - 接收到远程流媒体(标准已移除)
 * @param {object} 事件
 */
function onaddstream (e) {
  log.i('收到远程流媒体：', e.stream)

  this[evtCallBack]({
    evtName: 'pOnAddStream',
    args: [e.stream],
    codeName: 'P2P_HOOK_STREAM_RECEIVED',
    errType: 'peerConnection'
  })
}

/**
 * p2p连接事件监听 - 收到数据通道对象事件
 * @param {object} 事件对象
 */
function ondatachannel (e) {
  // 重协商完毕，连接恢复后(iceConnectionState = 'connected')才能收到数据通道对象
  log.d('p2p 数据通道已连接')
  this.dataChannel = e.channel
  addDCListener.call(this, { channel: this.dataChannel })
}

/**
 * p2p连接事件监听 - 正在采集本地 ice candidate
 * @param {object} 事件对象
 */
function onicecandidate (e) {
  if (e.candidate) {
    // 本地 ice candidate 上传至服务器
    log.d('ice candidate已采集[本地]')

    this[evtCallBack]({
      evtName: 'pOnIceCandidate',
      args: [e.candidate],
      codeName: 'P2P_HOOK_ICE_GATHERER',
      errType: 'peerConnection'
    })
  }
}

/**
 * p2p连接事件监听 - ice 连接状态改变
 * @param {object} evt 事件对象
 */
async function oniceconnectionstatechange (evt) {
  switch (this.peerConn.iceConnectionState) {
    case 'completed':
      // 至少发现一条通路
      log.d('ice candidate 搜集完毕')

      if (this.peerConn.createDataChannel && !this.dataChannel) {
        log.d('正在建立点对点数据通道')
        this.dataChannel = this.peerConn.createDataChannel('rtcDataChannel')
        addDCListener.call(this, { channel: this.dataChannel })
      }

      this[evtCallBack]({
        evtName: 'pIceConnCompleted',
        args: [evt],
        codeName: 'P2P_HOOK_ICE_CONN_COMPLETED',
        errType: 'peerConnection'
      })
      break
    case 'connected':
      if (this[clearP2PConnTimer]()) {
        log.d('p2p ice 连接成功, 清除超时计时器')
      }

      this[evtCallBack]({
        evtName: 'pIceConnConnected',
        args: [evt],
        codeName: 'P2P_HOOK_ICE_CONN_CONNECTED',
        errType: 'peerConnection'
      })
      break
    /**
      * TODO 查询连接状态，区分正常 / 异常的disconnected、failed，针对性报错
      * 在上述工作未完成前，后面的两种情况存在BUG
      */
    case 'disconnected':
        // 可能的情况： 1. 远端主动断开连接，稍后本地 ice 连接状态将变为 failed  2. ice 通路故障，若故障修复连接状态将变为 connected,否则 failed
      log.d('p2p ice 连接中断')

      this[evtCallBack]({
        evtName: 'pIceConnDisconnected',
        args: [evt],
        codeName: 'P2P_HOOK_ICE_CONN_DISCONNECTED',
        errType: 'peerConnection'
      })
      break
    case 'failed':
      log.e('p2p ice 连接异常关闭')

      await this[errHandler]({
        type: 'peerConnection',
        code: errCode.P2P_ICECONN_FAILED
      })
      break
  }
}

/**
 * p2p连接事件监听 - 准备 sdp 协商(offerer)
 */
async function onnegotiationneeded () {
  log.d('发起 sdp 协商')
  try {
    await this[createSDP]({ role: 'offer' })
  } catch (err) {
    log.e(err.message)
    log.e('sdp 协商失败')
  }
}

/**
 * p2p连接事件监听 - p2p 流媒体已移除
 */
function onremovestream () {
  log.d('流媒体已移除')
}