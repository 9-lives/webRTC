<template>
  <div>
    <video id="tpaaa" width=400 height=300 autoplay></video>
    <canvas id="tpccc" width=400 height=300 ></canvas>
    <div>
      <button size="2x" @click="preview">预览</button>
      <button size="2x" @click="takePicture">拍照</button>
    </div>
    <div>
      <button size="2x" @click="$go('screen')">去录屏</button>
      <button size="2x" @click="$go('rec')">去录像</button>
      <button size="2x" @click="$go('recScreen')">去录像录屏</button>
    </div>
  </div>
</template>
<script>
  import { TakePicture } from '../src/core/index'
  export default {
    data () {
      return {
        camera: new TakePicture(),
        url: undefined
      }
    },
    mounted () {
      this.init()
    },
    beforeDestroy () {
      this.camera.close()
    },
    methods: {
      async init () {
        try {
          await this.start()
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$error('视频设备开启失败')
        }
      },
      async start () {
        let ret = await this.camera.start({
          camera: 0,
          canvasId: 'tpccc',
          videoId: 'tpaaa'
        })
        if (ret === true) {
          this.$log.d('视频设备已打开')
        } else {
          this.$error('视频设备开启失败')
        }
      },
      preview () {
        document.querySelector('#tpaaa').play()
      },
      async takePicture () {
        try {
          await this.camera.takePicture({
            w: 400,
            h: 300
          })
        } catch (err) {
          if (err.message) {
            this.$log.e(err.message)
          }
          this.$error('拍照失败')
        }
      }
    }
  }
</script>
