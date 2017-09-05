import { log } from '../../../utils'
import { judgeType } from '../../../index'

export const getVDevId = Symbol('getVDevId')
export const getADevId = Symbol('getADevId')

// 查找设备ID
const getDevId = {
  audio: {
    /**
      * 通过设备序号查找音频设备ID
      * @param {object} devInfo 设备信息
      * @param {number} micNo // 麦克风序号
      * @returns {string} 音频设备ID
      */
    byNo: function ({ devInfo = {}, micNo = 0 }) {
      log.i(`指定音频设备序号 ${micNo}`)

      if (devInfo.audio[micNo] && devInfo.audio[micNo].deviceId) {
        return devInfo.audio[micNo].deviceId
      }

      log.d('取音频设备ID失败[序号对应设备未找到]')

      return undefined
    },

    /**
      * 通过标签查找音频设备ID
      * @param {object} devInfo 设备信息
      * @param {string} mLabel
      * @returns {string} 音频设备ID
      */
    byLabel: function ({ devInfo = {}, mLabel = '' }) {
      log.i(`指定音频设备标签 label = ${mLabel}`)

      let info = devInfo.audio.find(dev => dev['label'] === mLabel && dev['deviceId'])

      if (!info) {
        log.d('取音频设备ID失败[标签对应设备未找到]')
        return undefined
      }

      return info['deviceId']
    }
  },
  video: {
    /**
      * 通过设备标签查找视频设备ID
      * @param {object} devInfo 设备信息
      * @param {number} vLabel
      * @returns {string} 视频设备ID
      */
    byLabel: function ({vLabel, devInfo}) {
      log.i(`指定视频设备标签 label = ${vLabel}`)

      let info = devInfo.video.find(dev => dev.label === vLabel)

      if (!info) {
        log.d('取视频设备ID失败[标签对应设备未找到]')
        return undefined
      } else {
        return info.deviceId
      }
    },

    /**
      * 通过 vid、pid 查找视频设备ID
      * @param {object} 设备信息
      * @param {string} pid
      * @param {string} vid
      * @returns {string} 视频设备ID
      */
    byIdPair: function ({ devInfo = {}, pid = '', vid = '' }) {
      log.i(`指定摄像头 vid = ${vid}, pid = ${pid}`)

      let info = devInfo.video.find(dev => dev['vid'] === vid && dev['pid'] === pid && dev['deviceId'])

      if (!info) {
        log.d('取视频设备ID失败[pid、vid 对应设备未找到]')
        return undefined
      }

      return info['deviceId']
    },

    /**
      * 通过设备序号查找视频设备ID
      * @param {number} camNo 摄像头序号
      * @param {object} facingMode 视频源指向
      * @param {object} devInfo 设备信息
      * @returns {string} 视频设备ID
      */
    byNo: function (options = {}) {
      let {
        camNo,
        devInfo = {},
        facingMode
      } = options

      log.i(`指定视频设备序号 ${camNo}`)

      let dev = devInfo.video

      if (dev && dev[camNo] && dev[camNo].deviceId) {
        return dev[camNo].deviceId
      }

      log.d('取视频设备ID失败[序号对应设备未找到]')

      return undefined
    }
  }
}

/**
 * webRTC 多媒体设备类
 */
export class Device {
  /**
    * 获取多媒体IO设备信息
    */
  async _rtcGetDevInfo () {
    let originalInfo = await enumerateDevs() // 多媒体IO设备原始信息
    let devInfo = devfilter({ originalInfo }) // 多媒体IO设备过滤信息
    let flag // 是否找到视频输入设备

    if (devInfo.video.length === 0) {
      log.d('未找到视频输入设备')
      flag = false
    }

    if (devInfo.audio.length === 0) {
      log.d('未找到音频输入设备')

      if (!flag) {
        throw new Error('未找到多媒体IO设备')
      }
    }

    return devInfo
  }

  /**
    * 取视频设备ID
    */
  [getVDevId] ({ options = {}, devInfo }) {
    const {
      camNo, // 摄像头序号
      facingMode, // 视频源方向
      pid, // 摄像头pid
      vid, // 摄像头vid
      vLabel // 摄像头标签
    } = options

    let vDevId // 视频设备ID

    if (judgeType('string', vid, pid)) {
      // 已指定 vid、pid 对
      vDevId = getDevId.video['byIdPair']({
        devInfo,
        pid,
        vid
      })

      if (vDevId) {
        // 找到 vid、pid 对应设备
        return vDevId
      }
    }

    if (judgeType('number', camNo)) {
      // 已指定摄像头序号
      vDevId = getDevId.video['byNo']({
        camNo,
        devInfo,
        facingMode
      })

      if (vDevId) {
        // 找到序号对应设备
        return vDevId
      }
    }

    if (judgeType('string', vLabel)) {
      // 已指定设备标签
      vDevId = getDevId.video['byLabel']({
        devInfo,
        vLabel
      })

      if (vDevId) {
        // 找到标签对应设备
        return vDevId
      }
    }

    if (judgeType('string', facingMode)) {
      // 已指定视频轨朝向
      return undefined
    }

    if (!judgeType('undefined', pid, vid, camNo, vLabel, facingMode)) {
      log.e('取视频设备ID失败')
    }

    return undefined
  }

  /**
    * 取音频设备ID
    */
  [getADevId] ({ options = {}, devInfo }) {
    const {
      micNo, // 麦克风序号
      mLabel // 麦克风标签
    } = options

    let aDevId

    if (judgeType('number', micNo)) {
      // 已指定麦克风序号
      aDevId = getDevId.audio['byNo']({
        micNo,
        devInfo
      })

      if (aDevId) {
        // 找到麦克风序号对应设备
        return aDevId
      }
    }

    if (judgeType('string', mLabel)) {
      // 已指定设备标签
      aDevId = getDevId.audio['byLabel']({
        devInfo,
        mLabel
      })

      if (aDevId) {
        // 找到标签对应设备
        return aDevId
      }
    }

    if (!judgeType('undefined', micNo, mLabel)) {
      log.e('取音频设备ID失败')
    }

    return undefined
  }
}

/**
  * 使用多媒体设备信息标签解析 vid 和 pid
  * @param {number} label：视频轨的标签, 例如格式: Bison cam, NB Pro(5986:0706)
  * @returns {object} 小写 vid、pid 信息对象
  */
function analysisVidPid (label) {
  // vid、pid均只有2个字节，16进制表示，即4个十六进制字符
  let left = label.lastIndexOf('(')
  let right = label.lastIndexOf(')')

  if (left === -1 || right === -1) {
    log.e('解析视频设备 vid、pid 失败')
    return {
      vid: '',
      pid: ''
    }
  }

  return {
    vid: label.substring(left + 1, left + 5).toLocaleLowerCase(),
    pid: label.substring(left + 6, right).toLocaleLowerCase()
  }
}

/**
  * 设备信息过滤器
  * @param {array} originalInfo 原始设备信息
  * @returns {object} 过滤的设备信息数组
  */
function devfilter ({ originalInfo = [] }) {
  let devInfo = {
    video: [], // 视频设备列表
    audio: [] // 音频设备列表
  }

  for (let info of originalInfo.values()) {
    if (info.kind === 'video' || info.kind === 'videoinput') {
        // 过滤出视频设备
      let pair = analysisVidPid(info.label)
      devInfo.video.push({
        deviceId: info.deviceId || info.id,
        groupId: info.groupId,
        label: info.label,
        pid: pair.pid,
        vid: pair.vid
      })
    } else if (info.kind === 'audio' || info.kind === 'audioinput') {
        // 过滤出音频设备
      devInfo.audio.push(info)
    }
  }

  log.i('过滤的设备信息数组：', devInfo)

  return devInfo
}

/**
  * 枚举多媒体IO设备信息
  * @returns {array} 多媒体IO设备原始信息
  */
async function enumerateDevs () {
  let originalInfo

  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    originalInfo = await navigator.mediaDevices.enumerateDevices()
  } else {
    throw new Error('未找到 enumerateDevices 方法，请更换或升级浏览器')
  }

  log.i('原始设备信息：', originalInfo)

  return originalInfo
}
