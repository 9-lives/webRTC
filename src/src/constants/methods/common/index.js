/**
 * webRTC protected 方法名
 */

// media 类
export const getMedia = Symbol('getMedia') // 开启多媒体设备
export const createConstraints = Symbol('createConstraints') // 创造约束
export const getVideoById = Symbol('getVideoById') // 查找 video 元素
export const getCanvasById = Symbol('getCanvasById') // 查找 canvas 元素
export const isActive = Symbol('isActive') // 检测流状态

// Hook 类
export const errHandler = Symbol('errHandler') // 错误回调
