import { judgeType, log } from '../../../index'
import { Hook, HtmlElement, Media } from './index'

/**
 * webRTC 基础类(mixin)
 * 多继承钩子函数类、DOM元素类、流媒体类
 */
export class RtcBase extends Hook(HtmlElement(Media)) {
  constructor (options = {}) {
    super(options)
  }
}
