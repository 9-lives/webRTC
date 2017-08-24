/**
 * webRTC 公共方法 symbol
 */

// media 类
export const getDevId = Symbol('getDevId') // 搜集多媒体设备ID
export const getMedia = Symbol('getMedia') // 开启多媒体设备
export const createConstraints = Symbol('createConstraints') // 创造约束
export const getVideoById = Symbol('getVideoById') // 查找 video 元素
export const getCanvasById = Symbol('getCanvasById') // 查找 canvas 元素

// RtcCommon 类
export const errHandler = Symbol('errHandler') // 错误回调
export const connect = Symbol('connect') // 连接 websocket

// recorder 类
export const recStart = Symbol('recStart') // 开始录制
export const recStop = Symbol('recStop') // 关闭录制
