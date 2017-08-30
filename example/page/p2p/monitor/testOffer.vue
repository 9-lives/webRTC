<template>
  <div>
    <ui-selectlabel :devInfo="devInfo" @chosenA="getMicLabel" @chosenV="getCamLabel"/>
    <div class="block">
      <button :disabled="btnClicked" @click="start">开启监控</button>
      <button :disabled="!btnClicked" @click="close">关闭监控</button>
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
        offer: undefined,
        devInfo: {}, // 设备信息
        mLabel: '', // 选中的视频设备标签
        camLabel: '', // 选中的音频设备标签
        ws: undefined // websocket[信令通道]
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
      this.ws.close()
    },
    methods: {
      async begin () {
        await this.init()
        this.devInfo = await this.offer._rtcGetDevInfo()
      },
      bindEvts () {
        let evtsPairs = {} // 批量订阅参数

        Object.assign(evtsPairs, {
          pLocalSDPReady: sdp => {
            this.ws.send(JSON.stringify({
              cmdId: '1004',
              robotId: 'ROBOT111',
              sdp
            }))
          }
        })

        Object.assign(evtsPairs, {
          pOnIceCandidate: ice => {
            this.ws.send(JSON.stringify({
              cmdId: '1006',
              robotId: 'ROBOT111',
              candidate: ice
            }))
          }
        })

        Object.assign(evtsPairs, { errHandler: this.errHandler })

        this.offer._rtcEvtsSubscribe({ pairs: evtsPairs })
      },
      close () {
        this.offer.close()
        this.btnClicked = this.btnClicked === false
      },
      errHandler (options = {}) {
        const {
          type,
          value,
          code
        } = options

        log.e(`错误代码: ${code}`)

        switch (type) {
          case 'peerConnection':
            // p2p 错误
            switch (code) {
              case errCode.P2P_ICECONN_ESTABLISH_TIMEOUT:
                // TODO 处理连接超时
                break
              case errCode.P2P_ICECONN_FAILED:
                // TODO 处理连接异常关闭
                this.close()
                break
              default:
                break
            }
            break
        }
      },
      // 选择麦克风标签
      getMicLabel (val) {
        this.micLabel = val
      },
      // 选择摄像头标签
      getCamLabel (val) {
        this.camLabel = val
      },
      async init () {
        this.initP2P()
        this.bindEvts()
        await this.initWs()
      },
      initP2P () {
        try {
          this.offer = new MonOffer({
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
      initWs () {
        return new Promise((resolve, reject) => {
          this.ws = new WebSocket(webRtcConfig.rmsUrl)

          this.ws.onopen = async evt => {
            if (this.ws.readyState !== 1) {
              this.ws.close()
              reject(new Error('websocket[webRTC] 连接建立失败'))
            } else {
              log.d('websocket[webRTC] 已连接')

              this.wsAuthorizaion()
              resolve()
            }
          }

          this.ws.onmessage = this.wsMsgHandler

          this.ws.onerror = msg => log.e('websocket[信令通道] 发生错误: ', msg)

          this.ws.onclose = evt => {
            if (evt.code === 1000) {
              log.d('websocket[webRTC] 正常关闭')
            } else {
              log.e('websocket[webRTC] 异常关闭: ', evt)
            }
          }
        })
      },
      async start () {
        let ret = await this.offer.start({
          // camera: 0,
          facingMode: 'user',
          // pid: 'b5a7',
          // vid: '04f2',
          vLabel: this.camLabel,
          // mic: 2,
          mLabel: this.micLabel,
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
      },
      // 信令通道身份认证
      wsAuthorizaion () {
        this.ws.send(JSON.stringify({
          cmdId: '1001',
          robotId: 'ROBOT111',
          appId: 'offer'
        }))
      },
      // 配置p2p连接的 sdp / ice
      async wsMsgHandler (msg) {
        let data = JSON.parse(msg.data)

        if (!data.data || data.data === '') {
          return
        } else if (data.token && data.token === '1005' || data.token === '1007') {
          data = JSON.parse(data.data)
          if (data.sdp) {
            await this.offer._rtcP2PRcvSDP(data)
          } else if (data.candidate) {
            await this.offer._rtcP2PRcvIceCandidate(data)
          }
        }
      }
    }
  }
</script>
