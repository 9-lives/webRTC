<template>
  <div>
    <div class="block">
      <video autoplay width=400 height=300 ref="vida"></video>
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
        conn: undefined,
        ws: undefined // websocket[信令通道]
      }
    },
    created () {
      this.begin()
    },
    beforeDestroy () {
      this.close()
      this.ws.close()
    },
    methods: {
      async begin () {
        try {
          await this.init()
          await this.start()
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('初始化失败')
        }
      },
      bindEvts () {
        let evtsPairs = {} // 批量订阅参数

        // 发送本地 sdp 到远端
        Object.assign(evtsPairs, {
          pLocalSDPReady: sdp => {
            this.ws.send(JSON.stringify({
              cmdId: '1004',
              robotId: 'ROBOT111',
              sdp
            }))
          }
        })

        // 发送 ice candidate 到远端
        Object.assign(evtsPairs, {
          pOnIceCandidate: candidate => {
            this.ws.send(JSON.stringify({
              cmdId: '1006',
              robotId: 'ROBOT111',
              candidate
            }))
          }
        })

        // 从 p2p 连接获取流媒体
        Object.assign(evtsPairs, {
          pIceConnConnected: () => {
            let streamArr = this.answer._rtcGetRemoteStreams()
            if (streamArr.length > 0) {
              this.$refs.vida.srcObject = streamArr[0]
            } else {
              log.e('远程流媒体未找到')
            }
          }
        })

        // 错误事件回调
        Object.assign(evtsPairs, {errHandler: this.errHandler})

        this.answer._rtcEvtsSubscribe({ pairs: evtsPairs })
      },
      close () {
        this.answer.close()
      },
      errHandler (options = {}) {
        const {
          type,
          value,
          code
        } = options
        log.i(`错误代码: ${code}`)
        switch (type) {
          case 'peerConnection':
            // p2p 错误
            switch (code) {
              case errCode.P2P_ICECONN_ESTABLISH_TIMEOUT:
                // TODO 处理连接超时
                break
              case errCode.P2P_ICECONN_FAILED:
                // TODO 连接异常关闭处理
                this.close()
                break
              default:
                break
            }
            break
        }
      },
      async init () {
        this.initP2P()
        this.bindEvts()
        await this.initWs()
      },
      initP2P () {
        try {
          this.answer = new MonAnswer({
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
              reject(new Error('websocket[信令通道] 连接建立失败'))
            } else {
              log.d('websocket[信令通道] 已连接')
              this.wsAuthorizaion()

              resolve()
            }
          }

          this.ws.onmessage = this.wsMsgHandler

          this.ws.onerror = msg => {
            log.e('websocket[信令通道] 发生错误: ', msg)
          }

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
        let ret = await this.answer.start()
        if (ret !== true) {
          log.e('视频设备开启失败')
        }
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
          if (data.sdp) {
            await this.answer._rtcP2PRcvSDP(data)
          } else if (data.candidate) {
            await this.answer._rtcP2PRcvIceCandidate(data)
          }
        }
      }
    }
  }
</script>
