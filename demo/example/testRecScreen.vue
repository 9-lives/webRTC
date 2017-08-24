<template>
  <div>
    <video id="recscreenaaa" width=400 height=300 ></video>
    <video id="recscreenccc" width=400 height=300 @ended="endedR" ></video>
    <video id="recscreenbbb" width=400 height=300 ></video>
    <div>
      <button size="2x" @click="preview">预览</button>
      <button size="2x" @click="rec">录屏录像</button>
      <button size="2x" @click="play">播放</button>
    </div>
    <div>
      <button size="2x" @click="$go('takePicture')">去拍照</button>
      <button size="2x" @click="$go('screen')">去录屏</button>
      <button size="2x" @click="$go('rec')">去录像</button>
    </div>
  </div>
</template>
<script>
  import { Rec, Screen } from '../src/core/index'
  export default {
    data () {
      return {
        camera: new Rec({
          wsIp: 'ws://10.11.2.3:8080/ws/rec/430122199503147114',
          errHandler: this.errHandler
        }),
        screen: new Screen({
          wsIp: 'ws://10.11.2.3:8080/ws/screen/430122199503147114',
          errHandler: this.errHandler
        }),
        urlS: undefined,
        urlR: undefined
      }
    },
    mounted () {
      this.init()
    },
    beforeDestroy () {
      this.camera.close()
      this.screen.close()
      if (typeof this.urlS !== 'undefined') {
        window.URL.revokeObjectURL(this.urlS)
      }
      if (typeof this.urlR !== 'undefined') {
        window.URL.revokeObjectURL(this.urlR)
      }
    },
    methods: {
      async init () {
        try {
          await this.connExts()
          await Promise.all([this.startRec(), this.startScreen()])
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$error('视频设备开启失败')
        }
      },
      async startRec () {
        let ret = await this.camera.start({
          camera: 0,
          mic: 2,
          videoId: 'recscreenaaa',
          duration: 6000,
          timeSlice: 3000
        })
        if (ret === true) {
          this.$log.d('视频设备已打开')
        } else {
          this.$error('视频设备开启失败')
        }
      },
      async startScreen () {
        let ret = await this.screen.start({
          videoId: 'aaa',
          duration: 6000,
          timeSlice: 3000
        })
        if (ret === true) {
          this.$log.d('录屏初始化完毕')
        } else {
          this.$error('录屏开启失败')
        }
      },
      async connExts () {
        let ret = await this.screen.connExts()
        if (ret === true) {
          this.$log.d('获取 sourceId 成功')
        } else {
          this.$error('用户拒绝授权')
        }
      },
      preview () {
        document.querySelector('#recscreenaaa').play()
      },
      async rec () {
        try {
          await Promise.all([this.recByRecorder(), this.recScreen()])
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$error('录像录屏失败')
        }
      },
      async recByRecorder () {
        let ret = await this.camera.rec()

        if (ret === false) {
          this.$error('录像失败')
        }
        this.urlR = window.URL.createObjectURL(ret)
        document.querySelector('#recscreenccc').src = this.urlR
        // 录制好的视频
        // document.querySelector('#recscreenccc').srcObject = ret
      },
      async recScreen () {
        let ret = await this.screen.recScreen()

        if (ret === false) {
          this.$error('录屏失败')
        }
        this.urlS = window.URL.createObjectURL(ret)
        document.querySelector('#recscreenbbb').src = this.urlS
        // 查看好的视频预览
        // document.querySelector('#screenaaa').srcObject = ret
      },
      play () {
        // 模拟测试时避免回声
        document.querySelector('#recscreenaaa').pause()
        document.querySelector('#recscreenccc').play()
        document.querySelector('#recscreenbbb').play()
      },
      endedR () {
        this.preview()
      },
      errHandler (options = {}) {
        const {
          type,
          value
        } = options

        switch(type) {
          case 'websocket':
            // websocket 错误
            break
        }
      }
    }
  }
</script>
