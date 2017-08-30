<template>
  <div>
    <div class="block">
      <video id="screenaaa" width=400 height=300 ></video>
    </div>
    <div class="block">
      <button @click="recScreen">录屏</button>
      <button @click="play">播放</button>
    </div>
    <ui-gohome />
  </div>
</template>
<script>
  import { selectLabel, goHome } from '@/components/ui/index'
  import { Screen } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../config'
  export default {
    components: {
      'ui-gohome': goHome,
      'ui-selectlabel': selectLabel
    },
    data () {
      return {
        screen: undefined
      }
    },
    mounted () {
      this.begin()
    },
    beforeDestroy () {
      this.screen.close()
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
      }
    }
  }
</script>
