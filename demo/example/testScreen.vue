<template>
  <div>
    <video id="screenaaa" width=400 height=300 ></video>
    <div>
      <button size="2x" @click="recScreen">录屏</button>
      <button size="2x" @click="play">播放</button>
    </div>
    <div>
      <button size="2x" @click="$go('takePicture')">去拍照</button>
      <button size="2x" @click="$go('rec')">去录像</button>
      <button size="2x" @click="$go('recScreen')">去录像录屏</button>
    </div>
  </div>
</template>
<script>
  import { Screen } from '../src/core/index'
  export default {
    data () {
      return {
        camera: new Screen({
          wsIp: 'ws://10.11.2.3:8080/ws/screen/430122199503147114',
          errHandler: this.errHandler
        }),
        url: undefined
      }
    },
    mounted () {
      this.init()
    },
    beforeDestroy () {
      this.camera.close()
      if (typeof this.url !== 'undefined') {
        window.URL.revokeObjectURL(this.url)
      }
    },
    methods: {
      async init () {
        try {
          await this.connExts()
          await this.start()
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$error('录屏开启失败')
        }
      },
      async connExts () {
        let ret = await this.camera.connExts({
          cTimeout: 5000,
          pTimeout: 15000
        })
        if (ret === true) {
          this.$log.d('sourceId 获取成功')
        } else {
          this.$error('用户拒绝授权')
        }
      },
      async start () {
        let ret = await this.camera.start({
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
      async recScreen () {
        try {
          let ret = await this.camera.recScreen()

          if (ret === false) {
            this.$error('录屏失败')
          }
          this.url = window.URL.createObjectURL(ret)
          document.querySelector('#screenaaa').src = this.url
          // 查看好的视频预览
          // document.querySelector('#screenaaa').srcObject = ret
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$error('录屏失败')
        }
      },
      play () {
        document.querySelector('#screenaaa').play()
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
