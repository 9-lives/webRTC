<template>
  <div>
    <div class="block">
      <video id="rec2aaa" width=400 height=300></video>
      <video id="rec2ccc" width=400 height=300 @ended="ended" ></video>
    </div>
    <div class="block">
      <button @click="preview">预览</button>
      <button @click="rec">录像</button>
      <button @click="play">播放</button>
      <button @click="stop">停止</button>
    </div>
    <div class="block">
      <button @click="$router.push({ name: 'home' })">返回主页</button>
    </div>
  </div>
</template>
<script>
  import { Rec } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../config'
  export default {
    data () {
      return {
        recorder: undefined,
        url: undefined
      }
    },
    mounted () {
      this.begin()
    },
    beforeDestroy () {
      this.recorder.close()
      if (typeof url !== 'undefined') {
        window.URL.revokeObjectURL(this.url)
      }
    },
    methods: {
      async begin () {
        try {
          this.init()
          this.bindEvts()
          await this.start()
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('设备开启失败')
        }
      },
      bindEvts () {
        let evtPairs = {} // 批量订阅参数

        Object.assign(evtPairs, {errHandler: this.errHandler})

        this.recorder._rtcEvtsSubscribe({ pairs: evtPairs })
      },
      ended () {
        this.preview()
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
        }
      },
      init () {
        try {
          this.recorder = new Rec({
            wsIp: webRtcConfig.recUrl
          })
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('Rec 对象初始化失败')
        }
      },
      play () {
        // 模拟测试时避免回声
        document.querySelector('#rec2aaa').pause()
        document.querySelector('#rec2ccc').play()
      },
      preview () {
        document.querySelector('#rec2aaa').play()
      },
      async rec () {
        try {
          let ret = await this.recorder.rec()
          if (ret === false) {
            log.e('录像失败')
          }
          this.url = window.URL.createObjectURL(ret)
          document.querySelector('#rec2ccc').src = this.url
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('录像失败')
        }
      },
      async start () {
        let ret = await this.recorder.start({
          // camera: 0,
          // vLabel: 'BisonCam, NB Pro (5986:0401)',
          // vid: '5986',
          // pid: '0401',
          facingMode: 'user',
          mic: 2,
          mLabel: '麦克风 (VIA HD Audio(Win 10))',
          videoId: 'rec2aaa',
          duration: 6000,
          timeSlice: 3000
        })
        if (ret === true) {
          log.d('设备已打开')
        } else {
          log.e('设备开启失败')
        }
      },
      stop () {
        this.recorder.stop()
      }
    }
  }
</script>
