/**
 * 订阅事件名称
 */

/**
 * 错误回调
 */
export const errHandler = 'errHandler'

/**
 * websocket[信令通道]事件
 */
export const wsOpenHandler = 'wsOpenHandler' // 连接成功
export const wsMsgHandler = 'wsMsgHandler' // 收到消息

/**
 * peerConnection 事件
 */
export const pLocalSDPReady = 'pLocalSDPReady' // 本地 sdp 设置完毕
export const pOnIceCandidate = 'pOnIceCandidate' // 正在采集本地 ice candidate
export const pIceConnCompleted = 'pIceConnCompleted' // ice 连接搜集 ice 完成
export const pIceConnConnected = 'pIceConnConnected' // ice 连接成功
export const pIceConnDisconnected = 'pIceConnDisconnected' // ice 连接中断
export const pIceConnFailed = 'pIceConnFailed' // ice 连接失败
export const pOnAddStream = 'pOnAddStream' // 接收到远程流媒体
export const pClosed = 'pClosed' // 连接已正常关闭
