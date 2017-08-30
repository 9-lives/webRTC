<template>
  <div>
    <div class="block">
      <video id="tpaaa" width=400 height=300 autoplay></video>
      <canvas id="tpccc" width=400 height=300 ></canvas>
    </div>
    <ui-selectlabel :devInfo="devInfo" :micShow="false" @chosenV="getCamLabel"/>
    <div class="block">
      <button :disabled="btnClicked" @click="preview">预览</button>
      <button :disabled="!btnClicked" @click="stopPreview">关闭预览</button>
      <button @click="takePicture">拍照</button>
    </div>
    <ui-gohome />
  </div>
</template>
<script>
  import { selectLabel, goHome } from '@/components/ui/index'
  import { TakePicture } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  export default {
    components: {
      'ui-gohome': goHome,
      'ui-selectlabel': selectLabel
    },
    data () {
      return {
        btnClicked: false,
        camLabel: '', // 选中的音频设备标签
        devInfo: {}, // 设备信息
        tp: undefined
      }
    },
    created () {
      this.begin()
    },
    beforeDestroy () {
      this.tp.close()
    },
    methods: {
      async begin () {
        try {
          this.init()
          this.devInfo = await this.tp._rtcGetDevInfo()
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('视频设备开启失败')
        }
      },
      // 选择摄像头标签
      getCamLabel (val) {
        this.camLabel = val
      },
      init () {
        this.tp = new TakePicture()
      },
      async preview () {
        let ret = await this.tp.start({
          // camera: 0,
          canvasId: 'tpccc',
          facingMode: 'user', // 视频轨方向
          // pid: '0401',
          // vid: '5986',
          videoId: 'tpaaa',
          vLabel: this.camLabel
        })
        if (ret === true) {
          log.d('视频设备已打开')
        } else {
          log.e('视频设备开启失败')
        }

        this.btnClicked = !(this.btnClicked === true)
      },
      stopPreview () {
        this.tp.close()
        this.btnClicked = !(this.btnClicked === true)
      },
      takePicture () {
        this.tp.takePicture({
          w: 400,
          h: 300
        })
      }
    }
  }
</script>
