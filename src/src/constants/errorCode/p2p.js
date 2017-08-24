/**
 * 错误代码
 */

/**
 * p2p 错误
 */
export const P2P_SDP_LOCAL_GENERATEDFAILED = -2002 // 本地 sdp 生成失败
export const P2P_SDP_LOCAL_SETFAILED = -2003 // 本地 sdp 设置失败
export const P2P_SDP_REMOTE_SETFAILED = -2004 // 远程 sdp 设置失败
export const P2P_CONN_ESTABLISH_TIMEOUT = -2005 // 建立ice连接超时
export const P2P_ICE_ADDFAILED = -2007 // ice candidate 添加失败

/**
 * p2p 事件回调执行失败
 */
export const P2P_HOOK_ICE_GATHERER = -2100 // ice candidate 采集回调执行失败
export const P2P_HOOK_STREAM_RECEIVED = -2101 // 收到远程流媒体回调执行失败
export const P2P_HOOK_ICE_CONN_COMPLETED = -2102 // ice连接 ice candidate 搜索完毕回调执行失败
export const P2P_HOOK_SDP_LOCAL_READY = -2103 // 本地 SDP 就绪回调执行失败
export const P2P_HOOK_ICE_CONN_CONNECTED = -2104 // ice连接成功回调执行失败
export const P2P_HOOK_ICE_CONN_DISCONNECTED = -2105 // ice连接中断回调执行失败
export const P2P_HOOK_ICE_CONN_FAILED = -2106 // ice连接异常关闭回调执行失败

