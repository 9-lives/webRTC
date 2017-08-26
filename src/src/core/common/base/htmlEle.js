import { log } from '../../../index'
import { getVideoById, getCanvasById } from '../../../constants/methods/index'

/**
 * DOM元素操作类(mixin 混入类)
 *  仅兼容chrome 53 及以上版本
 */
export const HtmlEle = Base => class HtmlEle extends Base {
  constructor (options) {
    super(options)
    this.canvas = undefined // canvas元素
    this.video = undefined // video元素
  }

  /**
    * 获取video元素
    * videoId: DOM元素ID
    */
  [getVideoById] (videoId) {
    let videoEle
    try {
      videoEle = document.getElementById(videoId.toString())
    } catch (err) {
      if (err.message) {
        log.e(err.message)
      }
    }

    if (!videoEle || videoEle.tagName.toLowerCase() !== 'video') {
      log.e('未找到video元素')
      return false
    } else {
      return videoEle
    }
  }

  /**
    * 获取canvas元素
    * canvasId: DOM元素ID
    */
  [getCanvasById] (canvasId) {
    let canvasEle
    try {
      canvasEle = document.getElementById(canvasId)
    } catch (err) {
      if (err.message) {
        log.e(err.message)
      }
    }

    if (!canvasEle || canvasEle.tagName.toLowerCase() !== 'canvas') {
      log.e('拍照失败[未找到canvas元素]')
      return false
    } else {
      return canvasEle
    }
  }
}
