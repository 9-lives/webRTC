import { judgeType, log } from '../../../index'
import { Media } from './index'
import { getVideoById, getCanvasById } from '../../../constants/methods/index'

/**
 * DOM元素操作类
 *  仅兼容chrome 53 及以上版本
 */
export const HtmlElement = Base => class HtmlEle extends Base {
  constructor (options) {
    super(options)
    this.canvas = undefined // canvas元素
    this.video = undefined // video元素
  }

  /**
    * 查找video元素
    * @param {string} videoId: video元素的ID
    * @returns {object || boolean} 查找成功返回指定元素，查找失败返回 false
    */
  [getVideoById] (videoId) {
    let videoEle

    if (!judgeType('string', videoId)) {
      log.e('查找 video 元素失败[参数错误]')
      return false
    }

    videoEle = document.getElementById(videoId)

    if (!videoEle || videoEle.tagName.toLowerCase() !== 'video') {
      log.e('未找到 video 元素')
      return false
    } else {
      return videoEle
    }
  }

  /**
    * 查找canvas元素
    * @param {string} canvasId: canvas元素的ID
    * @returns {object || boolean} 查找成功返回指定元素，查找失败返回 false
    */
  [getCanvasById] (canvasId) {
    let canvasEle

    if (!judgeType('string', canvasId)) {
      log.e('查找 canvas 元素失败[参数错误]')
      return false
    }

    canvasEle = document.getElementById(canvasId)

    if (!canvasEle || canvasEle.tagName.toLowerCase() !== 'canvas') {
      log.e('拍照失败[未找到canvas元素]')
      return false
    } else {
      return canvasEle
    }
  }
}
