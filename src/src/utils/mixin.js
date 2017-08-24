/**
 * 多继承混杂模式实现
 * 将多个类的成员合并到一个混合类
 */

export function mix (...mixins) {
  class Mix {}

  for (let mixin of mixins) {
    copyProperties(Mix, mixin)
    copyProperties(Mix.prototype, mixin.prototype)
  }

  return Mix
}

function copyProperties (target, source) {
  for (let key of Reflect.ownKeys(source)) {
    if (key !== 'constructor' && key !== 'prototype' && key !== 'name') {
      let desc = Object.getOwnPropertyDescriptor(source, key)
      Object.defineProperty(target, key, desc)
    }
  }
}
