export const webRtcConfig = {
  /**
   * 录屏数据上传地址
   */
  recScreenUrl: 'ws://10.11.2.3:8080/ws/screen/430122199503147114',
  /**
   * 录像数据上传地址
   */
  recUrl: 'ws://10.11.2.3:8080/ws/rec/430122199503147114',
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
  credential: '123456'
}
