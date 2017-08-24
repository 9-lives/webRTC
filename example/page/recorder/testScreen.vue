<template>
  <div>
    <div class="block">
      <video id="screenaaa" width=400 height=300 ></video>
    </div>
    <div class="block">
      <button @click="recScreen">录屏</button>
      <button @click="play">播放</button>
    </div>
    <div class="block">
      <button @click="$router.push({ name: 'home' })">返回主页</button>
    </div>
  </div>
</template>
<script>
  import { Screen } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../config'
  export default {
    data () {
      return {
        screen: undefined,
        url: undefined
      }
    },
    mounted () {
      this.begin()
    },
    beforeDestroy () {
      this.screen.close()
      if (typeof this.url !== 'undefined') {
        window.URL.revokeObjectURL(this.url)
      }
    },
    methods: {
      async begin () {
        try {
          this.init()
          this.bindEvts()
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
      async connExts () {
        let ret = await this.screen.connExts({
          cTimeout: 5000,
          pTimeout: 15000
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
          case 'websocket':
            // websocket 错误
            break
        }
      },
      init () {
        try {
          this.screen = new Screen({
            wsIp: webRtcConfig.recScreenUrl
          })
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('初始化 Screen 对象失败')
        }
      },
      play () {
        document.querySelector('#screenaaa').play()
      },
      async recScreen () {
        try {
          let ret = await this.screen.recScreen()

          if (ret === false) {
            log.e('录屏失败')
          }
          this.url = window.URL.createObjectURL(ret)
          document.querySelector('#screenaaa').src = this.url
          // 查看好的视频预览
          // document.querySelector('#screenaaa').srcObject = ret
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('录屏失败')
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
      }
    }
  }
</script>
