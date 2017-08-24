/**
 * websocket[信令通道] 错误代码
 */

/**
 * websocket[信令通道] 错误
 */
export const WS_CONN_ESTABLISHFAILED = -1000 // 连接建立失败
export const WS_CONN_ERROROCCUR = -1001 // 连接发生错误
export const WS_CONN_EXCEPTIONALCLOSE = -1002 // 连接异常关闭

/**
 * websocket[信令通道] 订阅回调执行失败
 */
export const WS_HOOK_CONN_OPEN = -1100 // 连接打开回调执行失败
export const WS_HOOK_CONN_MSG = -1101 // 消息处理回调执行失败
