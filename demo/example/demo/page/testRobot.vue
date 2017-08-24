<template>
  <div>
    <video id="vido" autoplay width=400 height=300 ></video>
    <div>
      <button @click="start">开启连接</button>
      <button @click="close">关闭连接</button>
    </div>
  </div>
</template>
<script>
  import { MonOffer } from '../../../src/core/p2p/monitor/index'
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
        let ret = await this.conn.start({
          camera: 0,
          // vLabel: 'Intel(R) RealSense(TM) 3D Camera (R200) RGB (8086:0a80)',
          mic: 2,
          frameRate: 10,
          width: 480,
          height: 360
        })
        if (ret === true) {
          this.$log.d('视频设备已打开')
        } else {
          this.$error('视频设备开启失败')
        }
      },
      bindEvts () {
        let evtsPairs = new Map() // 批量订阅参数

        evtsPairs.set(
          'wsOpenHandler', () => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1001',
              robotId: 'ROBOT111',
              appId: 'offer'
            }))
          }
        )

        evtsPairs.set(
          'wsMsgHandler', msg => {
            let data = JSON.parse(msg.data)
            if (data.token && data.token === '1005' || data.token === '1007') {
              data = JSON.parse(data.data)
              if (data.sdp) {
                this.conn._rtcP2PRcvSDP(data)
              } else if (data.candidate) {
                this.conn._rtcP2PRcvIceCandidate(data)
              }
            } else {
              return
            }
            return data
          }
        )

        evtsPairs.set(
          'pLocalSDPReady', sdp => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1004',
              robotId: 'ROBOT111',
              sdp
            }))
          }
        )

        evtsPairs.set(
          'pOnIceCandidate', ice => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1006',
              robotId: 'ROBOT111',
              candidate: ice
            }))
          }
        )

        evtsPairs.set('errHandler', this.errHandler)

        this.conn._rtcEvtsSubscribe({ pairs: evtsPairs })
      },
      init () {
        try {
          this.conn = new MonOffer({
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
