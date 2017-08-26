import { log } from '../../../utils'
import { judgeType } from '../../../index'
import { getDevId } from '../../../constants/methods/index'

export const getVDevId = Symbol('getVDevId')
export const getADevId = Symbol('getADevId')

/**
 * webRTC 多媒体设备类
 */
export class Device {
/**
  * 获取所有多媒体设备id
  */
  async [getDevId] () {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        // 枚举多媒体IO设备信息
      let infoArr = await navigator.mediaDevices.enumerateDevices()
      let devInfo = {
        video: [], // 视频设备列表
        audio: [] // 音频设备列表
      }

      log.i('未过滤的设备信息数组：', infoArr)

      for (let info of Object.values(infoArr)) {
        if (info.kind === 'video' || info.kind === 'videoinput') {
            // 过滤出视频设备
          let vidPid = analysisVidPid(info.label)
          devInfo.video.push({
            deviceId: info.deviceId || info.id,
            groupId: info.groupId,
            label: info.label,
            pid: vidPid.pid,
            vid: vidPid.vid
          })
        } else if (info.kind === 'audio' || info.kind === 'audioinput') {
            // 过滤出音频设备
          devInfo.audio.push(info)
        }
      }
      if (devInfo.video.length === 0) {
        throw new Error('未找到视频输入设备')
      } else if (devInfo.audio.length === 0) {
        throw new Error('未找到音频输入设备')
      } else {
        log.i('过滤的设备信息数组：', devInfo)
        return devInfo
      }
    } else {
      throw new Error('未找到 enumerateDevices 方法')
    }
  }

  /**
    * 取视频设备ID
    */
  [getVDevId] (options = {}) {
    const {
      camera, // 摄像头序号
      vLabel, // 摄像头标签
      facingMode, // 视频源方向
      vid, // 摄像头vid
      pid, // 摄像头pid
      devIds // 硬件ID
    } = options

    let vDevId // 视频设备ID
    if (!judgeType('undefined', vid, pid)) {
      // vid、pid 对已指定
      log.i(`指定摄像头 vid = ${vid}, pid = ${pid}`)
      for (let dev of Object.values(devIds.video)) {
        if (dev && dev['vid'] === vid && dev['pid'] === pid && dev['deviceId']) {
          vDevId = dev['deviceId']
          break
        }
      }
      if (judgeType('undefined', vDevId)) {
        // vid、pid对应设备未找到
        if (!judgeType('undefined', camera)) {
          log.d('取视频设备ID失败[vid、pid 对应设备未找到]，尝试使用设备序号查找')
          // 已指定摄像头序号
          vDevId = getVDevIdByNo({
            camera,
            devIds,
            facingMode
          })
        } else {
          // 未指定摄像头序号
          if (judgeType('undefined', facingMode)) {
            // 未指定视频源方向
            log.e('取视频设备ID失败[vid、pid 对应设备未找到]')
          } else {
            // 已指定视频源方向
            log.d('取视频设备ID失败[序号对应设备未找到]，尝试使用视频源方向指定设备')
          }
        }
      }
    } else {
      // 未指定 vid、pid 对
      if (!judgeType('undefined', camera)) {
        // 已指定摄像头序号
        vDevId = getVDevIdByNo({
          camera,
          devIds,
          facingMode
        })
      } else {
        // 未指定摄像头序号
        if (!judgeType('undefined', vLabel)) {
          // 指定摄像头标签
          vDevId = getVDevIdByLabel({
            vLabel,
            devIds
          })
        } else {
          // 未指定摄像头标签
          if (judgeType('undefined', facingMode)) {
            // 未指定视频源方向
            log.e('取视频设备ID失败[参数错误]')
          } else {
            // 已指定视频源方向
            log.d('使用视频源方向指定设备')
          }
        }
      }
    }

    return vDevId
  }

  /**
    * 取音频设备ID
    */
  [getADevId] (options = {}) {
    const {
      mic, // 麦克风序号
      mLabel, // 麦克风标签
      devIds // 硬件ID
    } = options

    let aDevId

    if (!judgeType('undefined', mLabel)) {
      // 已指定麦克风标签
      log.d(`指定音频设备 label = ${mLabel}`)
      for (let dev of Object.values(devIds.audio)) {
        if (dev && dev['label'] === mLabel && dev['deviceId']) {
          aDevId = dev['deviceId']
          break
        }
      }
      if (judgeType('undefined', aDevId)) {
        // 麦克风标签对应设备未找到
        if (!judgeType('undefined', mic)) {
          // 已指定麦克风序号
          log.d('取音频设备ID失败[标签对应设备未找到]，尝试使用设备序号查找')
          aDevId = getADevIdByNo({
            mic,
            devIds
          })
        } else {
          // 未指定麦克风序号
          log.e('取音频设备ID失败[标签对应设备未找到]')
        }
      }
    } else {
      // 未指定麦克风标签
      if (!judgeType('undefined', mic)) {
        // 已指定麦克风序号
        aDevId = getADevIdByNo({
          mic,
          devIds
        })
      } else {
        // 未指定麦克风序号
      }
    }

    return aDevId
  }
}

/**
  * 通过多媒体设备信息中的 label 解析相应的 vid 和 pid
  * label：视频流的 Track 的 label 标签, label 格式: Bison cam, NB Pro(5986:0706)
  * 返回值小写
  */
function analysisVidPid (label) {
  // vid、pid均只有2个字节，16进制表示，即4个十六进制字符
  let left = label.lastIndexOf('(')
  let right = label.lastIndexOf(')')

  if (left === -1 || right === -1) {
    return {
      vid: '',
      pid: ''
    }
  }

  label.substring(left + 1, left + 5).toLocaleLowerCase()

  return {
    vid: label.substring(left + 1, left + 5).toLocaleLowerCase(),
    pid: label.substring(left + 6, right).toLocaleLowerCase()
  }
}

/**
  * 通过设备标签查找视频设备ID
  * @param {Number} vLabel
  * @param {Object} devIds
  */
function getVDevIdByLabel ({vLabel, devIds}) {
  log.d(`指定视频设备标签 label = ${vLabel}`)

  for (let info of Object.values(devIds.video)) {
    if (vLabel === info.label) {
      return info.deviceId
    }
  }

  log.e('取视频设备ID失败[标签对应设备未找到]')
  return undefined
}

/**
  * 通过设备序号查找音频设备ID
  * @param {Number} mic
  * @param {Object} devIds
  */
function getADevIdByNo ({mic, devIds}) {
  log.d(`指定音频设备序号 ${mic}`)

  if (devIds.audio[mic] && devIds.audio[mic].deviceId) {
    return devIds.audio[mic].deviceId
  }

  log.e('取音频设备ID失败[序号对应设备未找到]')

  return undefined
}

/**
  * 通过设备序号查找视频设备ID
  * @param {Number} camera 摄像头序号
  * @param {Object} facingMode 视频源指向
  * @param {Object} devIds 硬件设备IDs
  */
function getVDevIdByNo (options = {}) {
  let {
    camera,
    devIds,
    facingMode
  } = options

  log.d(`指定视频设备序号 ${camera}`)

  if (devIds.video[camera] && devIds.video[camera].deviceId) {
    return devIds.video[camera].deviceId
  }

  if (judgeType('undefined', facingMode)) {
    log.e('取视频设备ID失败[序号对应设备未找到]')
  } else {
    log.d('取视频设备ID失败[序号对应设备未找到]，尝试使用视频源方向指定设备')
  }

  return undefined
}

