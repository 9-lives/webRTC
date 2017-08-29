<template>
  <div>
    <ui-selectlabel :devInfo="devInfo" @chosenA="getMLabel" @chosenV="getVLabel"/>
    <div class="block">
      <button :disabled="btnClicked" @click="start">开启连接</button>
      <button :disabled="!btnClicked" @click="close">关闭连接</button>
    </div>
    <ui-gohome />
  </div>
</template>
<script>
  import { selectLabel, goHome } from '@/components/ui/index'
  import { MonOffer } from 'webRTC/src/core/p2p/monitor/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../../config'
  import * as errCode from 'webRTC/src/constants/errorCode/index'
  export default {
    components: {
      'ui-gohome': goHome,
      'ui-selectlabel': selectLabel
    },
    data () {
      return {
        btnClicked: false,
        conn: undefined,
        devInfo: {}, // 设备信息
        mLabel: '', // 选中的视频设备标签
        vLabel: '' // 选中的音频设备标签
      }
    },
    async created () {
      try {
        await this.begin()
      } catch (err) {
        if (err.message) {
          log.e(err.message)
        }
        log.e('初始化失败')
      }
    },
    beforeDestroy () {
      this.close()
    },
    methods: {
      async begin () {
        this.init()
        this.bindEvts()
        this.devInfo = await this.conn._rtcGetDevInfo()
      },
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
        this.btnClicked = !(this.btnClicked === true)
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
      // 选择麦克风标签
      getMLabel (val) {
        this.mLabel = val
      },
      // 选择摄像头标签
      getVLabel (val) {
        this.vLabel = val
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
          // camera: 0,
          facingMode: 'user',
          // pid: 'b5a7',
          // vid: '04f2',
          vLabel: this.vLabel,
          // mic: 2,
          mLabel: this.mLabel,
          frameRate: 10,
          width: 480,
          height: 360
        })
        if (ret === true) {
          log.d('视频设备已打开')
        } else {
          log.e('视频设备开启失败')
        }

        this.btnClicked = !(this.btnClicked === true)
      }
    }
  }
</script>
