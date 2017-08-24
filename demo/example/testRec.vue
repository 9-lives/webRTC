<template>
  <div>
    <video id="rec2aaa" width=400 height=300 ></video>
    <video id="rec2ccc" width=400 height=300 @ended="ended" ></video>
    <div>
      <button size="2x" @click="preview">预览</button>
      <button size="2x" @click="rec">录像</button>
      <button size="2x" @click="play">播放</button>
      <button size="2x" @click="stop">停止</button>
    </div>
    <div>
      <button size="2x" @click="$go('takePicture')">去拍照</button>
      <button size="2x" @click="$go('screen')">去录屏</button>
      <button size="2x" @click="$go('recScreen')">去录像录屏</button>
    </div>
  </div>
</template>
<script>
  import { Rec } from '../src/core/index'
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
            this.$log.e(err.message)
          }
          this.$error('设备开启失败')
        }
      },
      init () {
        this.recorder = new Rec({
          wsIp: 'ws://10.11.2.3:8080/ws/rec/430122199503147114'
        })
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
          this.$log.d('设备已打开')
        } else {
          this.$error('设备开启失败')
        }
      },
      bindEvts () {
        let evtPairs = new Map() // 批量订阅参数

        evtPairs.set('errHandler', this.errHandler)

        this.recorder._rtcEvtsSubscribe({ pairs: evtPairs })
      },
      preview () {
        document.querySelector('#rec2aaa').play()
      },
      async rec () {
        try {
          let ret = await this.recorder.rec()
          if (ret === false) {
            this.$error('录像失败')
          }
          this.url = window.URL.createObjectURL(ret)
          document.querySelector('#rec2ccc').src = this.url
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$error('录像失败')
        }
      },
      play () {
        // 模拟测试时避免回声
        document.querySelector('#rec2aaa').pause()
        document.querySelector('#rec2ccc').play()
      },
      stop () {
        this.recorder.stop()
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
      }
    }
  }
</script>
