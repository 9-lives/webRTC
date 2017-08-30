<template>
  <div>
    <div class="block">
      <video id="rec2aaa" width=400 height=300 autoplay></video>
    </div>
    <ui-selectlabel :devInfo="devInfo" @chosenA="getMicLabel" @chosenV="getCamLabel"/>
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
        camLabel: '', // 选中的音频设备标签
        devInfo: {}, // 设备信息
        micLabel: '', // 选中的视频设备标签
        recorder: undefined,
        ws: undefined // websocket[录制通道]
      }
    },
    created () {
      this.begin()
    },
    beforeDestroy () {
      this.recorder.close()
      this.ws.close()
    },
    methods: {
      async begin () {
        try {
          await this.init()
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
          case 'mediaRecorder':
            // websocket 错误
            break
          default:
            break
        }
      },
      // 选择麦克风标签
      getMicLabel (val) {
        this.micLabel = val
      },
      // 选择摄像头标签
      getCamLabel (val) {
        this.camLabel = val
      },
      async init () {
        this.initRec()
        this.bindEvts()
        await this.initWs()
      },
      initRec () {
        try {
          this.recorder = new Rec()
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
          log.e('Rec 对象初始化失败')
        }
      },
      initWs () {
        return new Promise((resolve, reject) => {
          this.ws = new WebSocket(webRtcConfig.rmsUrl)

          this.ws.onopen = async evt => {
            if (this.ws.readyState !== 1) {
              this.ws.close()
              reject(new Error('websocket[录制通道] 连接建立失败'))
            } else {
              log.d('websocket[录制通道] 已连接')
              // TODO 身份认证
              resolve()
            }
          }

          this.ws.onmessage = () => {}

          this.ws.onerror = msg => {
            log.e('websocket[录制通道] 发生错误: ', msg)
          }

          this.ws.onclose = evt => {
            if (evt.code === 1000) {
              log.d('websocket[录制通道] 正常关闭')
            } else {
              log.e('websocket[录制通道] 异常关闭: ', evt)
            }
          }
        })
      },
      async preview () {
        let ret = await this.recorder.start({
          // camera: 0, // 摄像头序号
          facingMode: 'user', // 视频轨方向
          // pid: '0401',
          // vid: '5986',
          vLabel: this.camLabel, // 摄像头标签
          mic: 2, // 麦克风序号
          mLabel: this.micLabel, // 麦克风标签
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
