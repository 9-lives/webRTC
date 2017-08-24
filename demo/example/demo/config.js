export const config = {
  /**
   * RMS 服务器地址
   */
  rmsUrl: 'ws://rms.szzt.com/robot/wsConnect',
  // rmsUrl: 'ws://10.11.0.242:8080/robot/wsConnect',
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
  p2pTimeout: 15
}
