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
   * 清理保存的DOM元素
   */
  close () {
    this.canvas = this.video = undefined
    if (super.close) {
      super.close()
    }
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

    let ret = checkTagName({
      name: 'video',
      element: videoEle
    })

    if (!ret) {
      log.e(`未找到 video 元素`)
    }

    return ret
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

    let ret = checkTagName({
      name: 'canvas',
      element: canvasEle
    })

    if (!ret) {
      log.e(`未找到 canvas 元素`)
    }

    return ret
  }
}

/**
 * 判断标签名
 * @param {string} name 标签名
 * @param {object} element DOM元素
 * @returns {object | boolean} 元素与标签名匹配返回 DOM 元素；否则 false
 */
function checkTagName ({ name, element }) {
  if (!(judgeType('string', name) && judgeType('object', element))) {
    return false
  }

  return element && element.tagName.toLowerCase() === name ? element : false
}
