<template>
  <div>
    <div class="block">
      <video id="rec" width=400 height=300 autoplay></video>
      <video width=400 height=300 autoplay ref="preview"></video>
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
        blobArr: [], // 存储录制数据
        btnClicked: false,
        camLabel: '', // 选中的音频设备标签
        devInfo: {}, // 设备信息
        micLabel: '', // 选中的视频设备标签
        recorder: undefined,
        url: undefined, // 本地预览 url
        ws: undefined // websocket[录制通道]
      }
    },
    created () {
      this.begin()
    },
    beforeDestroy () {
      this.recorder.close()
      this.ws.close()
      this.revokeURL()
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
      evtsSubscribe () {
        let evtPairs = {} // 批量订阅参数

        Object.assign(evtPairs, { errHandler: this.errHandler })
        Object.assign(evtPairs, { recDataAvail: this.recDataAvailCallBack })
        Object.assign(evtPairs, { recStop: this.recStopCallBack })

        this.recorder._rtcEvtsSubscribe({ pairs: evtPairs })
      },
      errHandler ({ code, type, value }) {
        if (type === 'mediaRecorder') {
          // 处理录制错误
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
        this.recorder = new Rec()
        this.evtsSubscribe()
        await this.initWs()
      },
      initWs () {
        return new Promise((resolve, reject) => {
          this.ws = new WebSocket(webRtcConfig.rmsUrl)

          this.ws.onopen = evt => {
            if (this.ws.readyState !== 1) {
              this.ws.close()
              reject(new Error('websocket[录制通道] 连接建立失败'))
            } else {
              log.d('websocket[录制通道] 已连接')
              resolve()
            }
          }

          this.ws.onerror = msg => log.e('websocket[录制通道] 发生错误: ', msg)
          this.ws.onclose = evt => log.d('websocket[录制通道] 关闭')
        })
      },
      async preview () {
        let ret = await this.recorder.start({
          // camNo: 0, // 摄像头序号
          facingMode: 'user', // 视频轨方向
          // pid: '0401',
          // vid: '5986',
          vLabel: this.camLabel, // 摄像头标签
          // micNo: 2, // 麦克风序号
          mLabel: this.micLabel, // 麦克风标签
          videoId: 'rec'
        })

        if (ret === true) {
          log.d('设备已打开')
        } else {
          log.e('设备开启失败')
        }

        this.btnClicked = !(this.btnClicked === true)
      },
      // 录制
      rec () {
        try {
          let ret = this.recorder.rec({
            duration: 6, // 录制时长
            timeSlice: 3 // 时间片大小
          })
          if (ret !== true) {
            // 录制失败处理
          }
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
        }
      },
      // 获取录制数据
      recDataAvailCallBack (data) {
        this.blobArr.push(data)
      },
      // 本地预览录制的视频
      recStopCallBack () {
        let blob = new Blob(this.blobArr)
        this.blobArr = []

        // 释放先前的URL
        this.revokeURL()
        this.url = window.URL.createObjectURL(blob)
        if (this.$refs.preview) {
          // 修复未录制完成离开页面报错
          this.$refs.preview.src = this.url
        }
      },
      // 释放预览文件的URL
      revokeURL () {
        if (this.url) {
          window.URL.revokeObjectURL(this.url)
          this.url = undefined
        }
      },
      stopPreview () {
        this.recorder.close()
        this.btnClicked = !(this.btnClicked === true)
      },
      stop () {
        this.recorder.recStop()
      }
    }
  }
</script>
