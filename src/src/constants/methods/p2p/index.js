/**
 * webRTC p2p protected 方法名
 */

export const createSDP = Symbol('createSDP') // 生成 sdp
export const pConnInit = Symbol('pConnInit') // PeerConnection 对象初始化
export const resetP2PConnTimer = Symbol('resetP2PConnTimer') // 清除 p2p 连接超时计时器
export const setRemoteSDP = Symbol('setRemoteSDP') // 设置远程 sdp
