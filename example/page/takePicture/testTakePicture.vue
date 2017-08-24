<template>
  <div>
    <div class="block">
      <video id="tpaaa" width=400 height=300 autoplay></video>
      <canvas id="tpccc" width=400 height=300 ></canvas>
    </div>
    <div class="block">
      <button @click="preview">预览</button>
      <button @click="takePicture">拍照</button>
    </div>
    <div class="block">
      <button @click="$router.push({ name: 'home' })">返回主页</button>
    </div>
  </div>
</template>
<script>
  import { TakePicture } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  export default {
    data () {
      return {
        tp: undefined,
        url: undefined
      }
    },
    mounted () {
      this.begin()
    },
    beforeDestroy () {
      this.tp.close()
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
          log.e('视频设备开启失败')
        }
      },
      bindEvts () {
        let evtPairs = {} // 批量订阅参数

        Object.assign(evtPairs, {errHandler: this.errHandler})

        this.tp._rtcEvtsSubscribe({ pairs: evtPairs })
      },
      init () {
        this.tp = new TakePicture()
      },
      preview () {
        document.querySelector('#tpaaa').play()
      },
      async start () {
        let ret = await this.tp.start({
          camera: 0,
          canvasId: 'tpccc',
          videoId: 'tpaaa'
        })
        if (ret === true) {
          log.d('视频设备已打开')
        } else {
          log.e('视频设备开启失败')
        }
      },
      async takePicture () {
        try {
          await this.tp.takePicture({
            w: 400,
            h: 300
          })
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('拍照失败')
        }
      }
    }
  }
</script>
