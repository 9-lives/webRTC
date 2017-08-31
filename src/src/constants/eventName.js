/**
 * 订阅事件名称
 */

/**
 * 错误回调
 */
export const errHandler = 'errHandler'

/**
 * 录制事件
 */
export const recDataAvail = 'recDataAvail' // 可获取录制数据
export const recClosed = 'recClosed' // 录制连接已正常关闭
export const recStop = 'recStop' // 停止录制

/**
 * p2p 事件
 */
export const pLocalSDPReady = 'pLocalSDPReady' // 本地 sdp 设置完毕
export const pOnIceCandidate = 'pOnIceCandidate' // 正在采集本地 ice candidate
export const pIceConnCompleted = 'pIceConnCompleted' // ice 连接搜集 ice 完成
export const pIceConnConnected = 'pIceConnConnected' // ice 连接成功
export const pIceConnDisconnected = 'pIceConnDisconnected' // ice 连接中断
export const pOnAddStream = 'pOnAddStream' // 接收到远程流媒体
export const pClosed = 'pClosed' // 连接已正常关闭
