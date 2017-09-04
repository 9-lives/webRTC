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
        this.devInfo = await this.offer._rtcGetDevInfo()
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
        try {
          await this.init()
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
        }
      },
      close () {
        this.offer.close()
        this.btnClicked = this.btnClicked === false
      },
      evtsSubscribe () {
        let evtsPairs = {} // 批量订阅参数

        Object.assign(evtsPairs, { pLocalSDPReady: this.pLocalSDPReady })
        Object.assign(evtsPairs, { pOnIceCandidate: this.pOnIceCandidate })
        Object.assign(evtsPairs, { errHandler: this.errHandler })

        this.offer._rtcEvtsSubscribe({ pairs: evtsPairs })
      },
      errHandler ({ code, type, value }) {
        log.e(`错误代码: ${code}`)

        if (type === 'peerConnection') {
          // p2p 错误
          switch (code) {
            case errCode.P2P_ICECONN_ESTABLISH_TIMEOUT:
              // 处理连接超时
              break
            case errCode.P2P_ICECONN_FAILED:
              // 处理连接异常关闭
              this.close()
              break
            default:
              break
          }
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
        await this.initWs()
      },
      initP2P () {
        this.offer = new MonOffer()

        let ret = this.offer.init({
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

        if (ret) {
          // 初始化成功
          this.evtsSubscribe()
        }
      },
      // 初始化 websocket[信令通道]
      initWs () {
        return new Promise((resolve, reject) => {
          this.ws = new WebSocket(webRtcConfig.rmsUrl)

          this.ws.onopen = async evt => {
            if (this.ws.readyState !== 1) {
              this.ws.close()
              reject(new Error('websocket[信令通道] 连接建立失败'))
            } else {
              log.d('websocket[信令通道] 已连接')
              this.wsAuthorizaion()

              resolve()
            }
          }

          this.ws.onmessage = this.wsMsgHandler
          this.ws.onerror = msg => log.e('websocket[信令通道] 发生错误: ', msg)
          this.ws.onclose = evt => log.i('websocket[信令通道] 关闭: ', evt)
        })
      },
      // 发送本地 sdp 到远端
      pLocalSDPReady (sdp) {
        this.ws.send(JSON.stringify({
          cmdId: '1004',
          robotId: 'ROBOT111',
          sdp
        }))
      },
      // 发送 ice candidate 到远端
      pOnIceCandidate (ice) {
        this.ws.send(JSON.stringify({
          cmdId: '1006',
          robotId: 'ROBOT111',
          candidate: ice
        }))
      },
      async start () {
        try {
          this.initP2P()

          let ret = await this.offer.start({
            // camNo: 0,
            facingMode: 'user',
            // pid: 'b5a7',
            // vid: '04f2',
            vLabel: this.camLabel,
            // micNo: 2,
            mLabel: this.micLabel,
            frameRate: 10,
            width: 480,
            height: 360
          })
          if (ret !== true) {
            log.e('视频设备开启失败')
          }

          this.btnClicked = !(this.btnClicked === true)
        } catch (err) {
          log.e(err.message)
        }
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
          try {
            if (data.sdp) {
              await this.offer._rtcPCAddSDP(data)
            } else if (data.candidate) {
              await this.offer._rtcPCAddIceCandidate(data)
            }
          } catch (err) {
            if (err.message) {
              log.e(err.message)
            }
          }
        }
      }
    }
  }
</script>
