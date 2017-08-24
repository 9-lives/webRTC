<template>
  <div>
    <div class="block">
      <video id="vido" autoplay width=400 height=300 ></video>
    </div>
    <div class="block">
      <button @click="start">开启连接</button>
      <button @click="close">关闭连接</button>
    </div>
    <div class="block">
      <button @click="$router.push({ name: 'home' })">返回主页</button>
    </div>
  </div>
</template>
<script>
  import { MonOffer } from 'webRTC/src/core/p2p/monitor/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../../config'
  import * as errCode from 'webRTC/src/constants/errorCode/index'
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
          log.e(err.message)
        }
        log.e('初始化失败')
      }
    },
    beforeDestroyed () {
      this.close()
    },
    methods: {
      bindEvts () {
        let evtsPairs = {} // 批量订阅参数

        Object.assign(evtsPairs, {
          wsOpenHandler: () => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1001',
              robotId: 'ROBOT111',
              appId: 'offer'
            }))
          }
        })

        Object.assign(evtsPairs, {
          wsMsgHandler: msg => {
            let data = JSON.parse(msg.data)
            if (data.token && data.token === '1005' || data.token === '1007') {
              data = JSON.parse(data.data)
              if (data.sdp) {
                this.conn._rtcP2PRcvSDP(data)
              } else if (data.candidate) {
                this.conn._rtcP2PRcvIceCandidate(data)
              }
            }
          }
        })

        Object.assign(evtsPairs, {
          pLocalSDPReady: sdp => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1004',
              robotId: 'ROBOT111',
              sdp
            }))
          }
        })

        Object.assign(evtsPairs, {
          pOnIceCandidate: ice => {
            this.conn.ws.send(JSON.stringify({
              cmdId: '1006',
              robotId: 'ROBOT111',
              candidate: ice
            }))
          }
        })

        Object.assign(evtsPairs, { errHandler: this.errHandler })

        this.conn._rtcEvtsSubscribe({ pairs: evtsPairs })
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
                log.e('p2p建立连接超时')
                break
              default:
                break
            }
            break
        }
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
            log.e(err.message)
          }
          log.e('p2p 连接初始化失败')
        }
      },
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
          log.d('视频设备已打开')
        } else {
          log.e('视频设备开启失败')
        }
      }
    }
  }
</script>
