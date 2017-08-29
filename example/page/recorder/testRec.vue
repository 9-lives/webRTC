<template>
  <div>
    <div class="block">
      <video id="rec2aaa" width=400 height=300 autoplay></video>
    </div>
    <ui-selectlabel :devInfo="devInfo" @chosenA="getMLabel" @chosenV="getVLabel"/>
    <div class="block">
      <button :disabled="btnClicked" @click="preview">预览</button>
      <button :disabled="!btnClicked" @click="stopPreview">关闭预览</button>
      <button @click="rec">录像</button>
      <button @click="stop">停止</button>
    </div>
    <ui-gohome />
  </div>
</template>
<script>
  import { selectLabel, goHome } from '@/components/ui/index'
  import { Rec } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../config'
  export default {
    components: {
      'ui-gohome': goHome,
      'ui-selectlabel': selectLabel
    },
    data () {
      return {
        btnClicked: false,
        devInfo: {}, // 设备信息
        mLabel: '', // 选中的视频设备标签
        recorder: undefined,
        vLabel: '' // 选中的音频设备标签
      }
    },
    created () {
      this.begin()
    },
    beforeDestroy () {
      this.recorder.close()
    },
    methods: {
      async begin () {
        try {
          this.init()
          this.bindEvts()
          this.devInfo = await this.recorder._rtcGetDevInfo()
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
          case 'peerConnection':
            // p2p 错误
            break
        }
      },
      // 选择麦克风标签
      getMLabel (val) {
        this.mLabel = val
      },
      // 选择摄像头标签
      getVLabel (val) {
        this.vLabel = val
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
      async preview () {
        let ret = await this.recorder.start({
          // camera: 0, // 摄像头序号
          facingMode: 'user', // 视频轨方向
          // pid: '0401',
          // vid: '5986',
          vLabel: this.vLabel, // 摄像头标签
          mic: 2, // 麦克风序号
          mLabel: this.mLabel, // 麦克风标签
          videoId: 'rec2aaa',
          duration: 6000, // 录制时长
          timeSlice: 3000 // 时间片大小
        })
        if (ret === true) {
          log.d('设备已打开')
        } else {
          log.e('设备开启失败')
        }

        this.btnClicked = !(this.btnClicked === true)
      },
      stopPreview () {
        this.recorder.close()
        this.btnClicked = !(this.btnClicked === true)
      },
      rec () {
        try {
          let ret = this.recorder.rec()
          if (ret === false) {
            // TODO 录制失败处理
          }
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
        }
      },
      stop () {
        this.recorder.recStop()
      }
    }
  }
</script>
