<template>
  <div>
    <div class="block">
      <video id="screenaaa" width=400 height=300 ></video>
    </div>
    <div class="block">
      <button @click="recScreen">录屏</button>
      <button @click="stop">停止</button>
    </div>
    <ui-gohome />
  </div>
</template>
<script>
  import { goHome } from '@/components/ui/index'
  import { Screen } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../config'
  export default {
    components: {
      'ui-gohome': goHome
    },
    data () {
      return {
        screen: undefined,
        ws: undefined // websocket 录制通道
      }
    },
    mounted () {
      this.begin()
    },
    beforeDestroy () {
      this.screen.close()
      this.ws.close()
    },
    methods: {
      async begin () {
        try {
          await this.init()
          await this.connExts()
          await this.start()
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('录屏开启失败')
        }
      },
      bindEvts () {
        let evtPairs = {} // 批量订阅参数

        Object.assign(evtPairs, {errHandler: this.errHandler})

        this.screen._rtcEvtsSubscribe({ pairs: evtPairs })
      },
      // 连接扩展程序
      async connExts () {
        let ret = await this.screen.connExts({
          cTimeout: 5000,
          aTimeout: 15000
        })
        if (ret === true) {
          log.d('sourceId 获取成功')
        } else {
          log.e('用户拒绝授权')
        }
      },
      errHandler (options = {}) {
        const {
          type,
          value
        } = options

        switch (type) {
          case 'mediaRecorder':
            // websocket 错误
            break
        }
      },
      async init () {
        this.initRec()
        this.bindEvts()
        await this.initWs()
      },
      initWs () {
        return new Promise((resolve, reject) => {
          this.ws = new WebSocket(webRtcConfig.rmsUrl)

          this.ws.onopen = async evt => {
            if (this.ws.readyState !== 1) {
              this.ws.close()
              reject(new Error('websocket[录制通道] 连接建立失败'))
            } else {
              log.d('websocket[录制通道] 已连接')
              // TODO 身份认证
              resolve()
            }
          }

          this.ws.onmessage = () => {}

          this.ws.onerror = msg => {
            log.e('websocket[录制通道] 发生错误: ', msg)
          }

          this.ws.onclose = evt => {
            if (evt.code === 1000) {
              log.d('websocket[录制通道] 正常关闭')
            } else {
              log.e('websocket[录制通道] 异常关闭: ', evt)
            }
          }
        })
      },
      initRec () {
        this.screen = new Screen()
      },
      play () {
        document.querySelector('#screenaaa').play()
      },
      // 录屏
      recScreen () {
        try {
          let ret = this.screen.recScreen()

          if (ret === false) {
            // TODO 录屏失败处理
          }
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
        }
      },
      async start () {
        let ret = await this.screen.start({
          videoId: 'aaa',
          duration: 6000,
          timeSlice: 3000
        })

        if (ret === true) {
          log.d('录屏初始化完毕')
        } else {
          log.e('录屏开启失败')
        }
      },
      stop () {
        this.screen.recStop()
      }
    }
  }
</script>
