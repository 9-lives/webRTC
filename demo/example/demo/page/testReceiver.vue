<template>
  <div>
    <video id="vida" autoplay width=400 height=300 ref="vida"></video>
    <div>
      <button @click="start">开启连接</button>
      <button @click="close">关闭连接</button>
    </div>
  </div>
</template>
<script>
  import { MonAnswer } from '../../../src/core/p2p/monitor/index'
  import { webRtcConfig } from '../../../config'
  import * as errCode from '../../../src/constants/errorCode/index'
  export default {
    data () {
      return {
        conn: undefined
      }
    },
    async mounted () {
      try {
        this.init()
        this.bindEvts()
        await this.start()
      } catch (err) {
        if (err.message) {
          this.$log.e(err.message)
        }
        this.$error('初始化失败')
      }
    },
    beforeDestroyed () {
      this.close()
    },
    methods: {
      async start () {
        let ret = await this.conn.start()
        if (ret !== true) {
          this.$error('视频设备开启失败')
        }
      },
      bindEvts () {
        let evtsPairs = new Map() // 批量订阅参数

        // 信令通道身份认证
        evtsPairs.set(
          'wsOpenHandler', () => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1001',
              robotId: 'ROBOT111',
              appId: 'answer'
            }))
          }
        )

        // 暴露sdp / ice 给 webRTC 封装
        evtsPairs.set(
          'wsMsgHandler', msg => {
            let data = JSON.parse(msg.data)
            if (!data.data || data.data === '') {
              return
            } else {
              data = JSON.parse(data.data)
              if (data.sdp) {
                this.conn._rtcP2PRcvSDP(data)
              } else if (data.candidate) {
                this.conn._rtcP2PRcvIceCandidate(data)
              }
            }
            return data
          }
        )

        // 发送本地 sdp 到远端
        evtsPairs.set(
          'pLocalSDPReady', sdp => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1004',
              robotId: 'ROBOT111',
              sdp: sdp
            }))
          }
        )

        // 发送 ice candidate 到远端
        evtsPairs.set(
          'pOnIceCandidate', ice => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1006',
              robotId: 'ROBOT111',
              candidate: ice
            }))
          }
        )

        // 从 p2p 连接获取流媒体
        evtsPairs.set(
          'pIceConnConnected', ice => {
            let streamArr = this.conn._rtcGetRemoteStreams()
            if (streamArr.length > 0) {
              this.$refs.vida.srcObject = streamArr[0]
            } else {
              this.$log.e('远程流媒体未找到')
            }
          }
        )

        evtsPairs.set('errHandler', this.errHandler)

        this.conn._rtcEvtsSubscribe({ pairs: evtsPairs })
      },
      init () {
        try {
          this.conn = new MonAnswer({
            wsIp: webRtcConfig.rmsUrl,
            config: {
              iceServers: [
                {
                  urls: webRtcConfig.stunUrls
                },
                {
                  urls: webRtcConfig.turnUrls,
                  username: webRtcConfig.turnUser,
                  credential: webRtcConfig.credential
                }
              ]
            }
          })
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$log.e('p2p 连接初始化失败')
        }
      },
      close () {
        this.conn.close()
      },
      errHandler (options = {}) {
        const {
          type,
          value,
          code
        } = options
        console.info('错误回调, ', code)
        switch (type) {
          case 'websocket':
            // websocket 错误
            break
          case 'peerConnection':
            // p2p 错误
            switch (code) {
              case errCode.P2P_CONN_ESTABLISH_TIMEOUT:
                console.error('p2p建立连接超时')
                break
              default:
                break
            }
            break
        }
      }
    }
  }
</script>
