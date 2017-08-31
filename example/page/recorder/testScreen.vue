<template>
  <div>
    <div class="block">
      <video id="screen" width=400 height=300 ref="screen" autoplay></video>
    </div>
    <div class="block">
      <button @click="rec">录屏</button>
      <button @click="stop">停止</button>
    </div>
    <ui-gohome />
  </div>
</template>
<script>
  import { goHome } from '@/components/ui/index'
  import { Screen } from 'webRTC/src/core/index'
  import { log } from 'webRTC/src/utils/index'
  import { webRtcConfig } from '../../config'
  export default {
    components: {
      'ui-gohome': goHome
    },
    data () {
      return {
        blobArr: [], // 存储录制数据
        screen: undefined,
        url: undefined, // 本地预览 url
        ws: undefined // websocket[录制通道]
      }
    },
    created () {
      this.begin()
    },
    beforeDestroy () {
      this.screen.close()
      this.ws.close()
      this.revokeURL()
    },
    methods: {
      async begin () {
        try {
          await this.init()
          await this.connExts()
          await this.start()
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
        }
      },
      evtsSubscribe () {
        let evtPairs = {} // 批量订阅参数

        Object.assign(evtPairs, { errHandler: this.errHandler })
        Object.assign(evtPairs, { recDataAvail: this.recDataAvailCallBack })
        Object.assign(evtPairs, { recStop: this.recStopCallBack })

        this.screen._rtcEvtsSubscribe({ pairs: evtPairs })
      },
      // 连接扩展程序
      async connExts () {
        let ret = await this.screen.connExts({
          cTimeout: 5, // 连接扩展超时时间(秒)
          aTimeout: 15 // 请求授权超时时间(秒)
        })

        if (ret === true) {
          log.d('sourceId 获取成功')
        }
      },
      errHandler ({ code, type, value }) {
        if (type === 'mediaRecorder') {
          // 处理录制错误
        }
      },
      async init () {
        this.screen = new Screen()
        this.evtsSubscribe()
        await this.initWs()
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
              resolve()
            }
          }

          this.ws.onerror = msg => log.e('websocket[录制通道] 发生错误: ', msg)
          this.ws.onclose = evt => log.d('websocket[录制通道] 正常关闭')
        })
      },
      // 获取录制数据
      recDataAvailCallBack (data) {
        this.blobArr.push(data)
      },
      // 录屏
      rec () {
        try {
          let ret = this.screen.rec({
            duration: 6, // 录制时长
            timeSlice: 3 // 时间片大小
          })

          if (ret !== true) {
            // TODO 录屏失败处理
          }
        } catch (err) {
          if (err.message) {
            log.e(err.message)
          }
        }
      },
      // 本地预览录制的视频
      recStopCallBack () {
        let blob = new Blob(this.blobArr)
        this.blobArr = []

        // 释放先前的URL
        this.revokeURL()
        this.url = window.URL.createObjectURL(blob)

        if (this.$refs.screen) {
          // 未录制完成close可能导致报错
          this.$refs.screen.src = this.url
        }
      },
      // 释放预览文件的URL
      revokeURL () {
        if (this.url) {
          window.URL.revokeObjectURL(this.url)
          this.url = undefined
        }
      },
      // 准备录制
      async start () {
        let ret = await this.screen.start({
          videoId: 'screen'
        })

        if (ret === true) {
          log.d('录屏初始化完毕')
        } else {
          // TODO 启动录屏失败处理
        }
      },
      // 停止录制
      stop () {
        this.screen.recStop()
      }
    }
  }
</script>
