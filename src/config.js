export const webRtcConfig = {
  /**
   * websocket[信令通道]
   */
  rmsUrl: 'ws://rms.szzt.com/robot/wsConnect',
  /**
   * 机器人监控 stun 服务器地址
   */
  stunUrls: [
    'stun:47.94.225.128:3478'
  ],
  /**
   * 机器人监控 stun 服务器地址
   */
  turnUrls: [
    'turn:47.94.225.128:5349'
  ],
  /**
   * 机器人监控认证信息
   */
  turnUser: 'szzt',
  credential: '123456',
  /**
   * p2p 建立连接超时时间(秒)
   */
  p2pConnTimeout: 8
}
