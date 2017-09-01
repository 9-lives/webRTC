import { Hook, HtmlElement, Media } from './index'

/**
 * webRTC 基础类(模拟多继承)
 */
export class RtcBase extends Hook(HtmlElement(Media)) {
  constructor (options = {}) {
    super(options)
  }
}
