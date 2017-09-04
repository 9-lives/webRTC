<template>
  <div>
    <div class="block">
      <video autoplay width=400 height=300 ref="vida"></video>
    </div>
    <div class="block">
      <button :disabled="btnClicked" @click="initP2P">开启监控</button>
      <button :disabled="!btnClicked" @click="close">关闭监控</button>
    </div>
    <ui-gohome />
  </div>
</template>
<script>
  import { goHome } from '@/components/ui/index'
  import { MonAnswer } from 'webRTC/src/core/p2p/monitor/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../../config'
  import * as errCode from 'webRTC/src/constants/errorCode/index'
  export default {
    components: {
      'ui-gohome': goHome
    },
    data () {
      return {
        btnClicked: false,
        conn: undefined,
        ws: undefined // websocket[信令通道]
      }
    },
    async created () {
      try {
        await this.begin()
      } catch (err) {
        log.e(err.message)
        log.e('初始化失败')
      }
    },
    beforeDestroy () {
      this.close()
      this.ws.close()
    },
    methods: {
      async begin () {
        await this.initWs()
      },
      close () {
        this.answer.close()
        this.btnClicked = !(this.btnClicked === true)
      },
      evtsSubscribe () {
        let evtsPairs = {} // 批量订阅参数

        Object.assign(evtsPairs, { pLocalSDPReady: this.pLocalSDPReady })
        Object.assign(evtsPairs, { pOnIceCandidate: this.pOnIceCandidate })
        Object.assign(evtsPairs, { pIceConnConnected: this.pIceConnConnected })
        Object.assign(evtsPairs, { errHandler: this.errHandler })

        this.answer._rtcEvtsSubscribe({ pairs: evtsPairs })
      },
      // 错误事件回调
      errHandler ({ code, type, value }) {
        log.i(`错误代码: ${code}`)

        if (type === 'peerConnection') {
          // p2p 错误
          switch (code) {
            case errCode.P2P_ICECONN_ESTABLISH_TIMEOUT:
              // 处理连接超时
              break
            case errCode.P2P_ICECONN_FAILED:
              // 连接异常关闭处理
              this.close()
              break
          }
        }
      },
      initP2P () {
        this.answer = new MonAnswer()
        let ret = this.answer.init({
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
          this.btnClicked = !(this.btnClicked === true)
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
      // 从 p2p 连接获取流媒体
      pIceConnConnected () {
        let streamArr = this.answer._rtcGetRemoteStreams()
        if (streamArr.length > 0) {
          this.$refs.vida.srcObject = streamArr[0]
        } else {
          log.e('远程流媒体未找到')
        }
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
      // 信令通道身份认证
      wsAuthorizaion () {
        this.ws.send(JSON.stringify({
          cmdId: '1001',
          robotId: 'ROBOT111',
          appId: 'answer'
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
              await this.answer._rtcPCAddSDP(data)
            } else if (data.candidate) {
              await this.answer._rtcPCAddIceCandidate(data)
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
