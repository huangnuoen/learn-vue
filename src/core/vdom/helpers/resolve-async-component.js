/* @flow */

import {
  warn,
  once,
  isDef,
  isUndef,
  isTrue,
  isObject,
  hasSymbol
} from 'core/util/index'

import { createEmptyVNode } from 'core/vdom/vnode'
// 确保res是构造器
function ensureCtor (comp: any, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default
  }
  // comp是对象则用base转换成构造器
  return isObject(comp)
    ? base.extend(comp)
    : comp
}

export function createAsyncPlaceholder (
  factory: Function,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag: ?string
): VNode {
  const node = createEmptyVNode()
  node.asyncFactory = factory
  node.asyncMeta = { data, context, children, tag }
  return node
}

export function resolveAsyncComponent (
  factory: Function,
  baseCtor: Class<Component>,
  context: Component
): Class<Component> | void {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }
  // 函数已经执行过，直接返回
  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }
  // 已经有过pending
  if (isDef(factory.contexts)) {
    // already pending
    factory.contexts.push(context)
  } else {
    // 首次pend
    // 缓存传入的实例
    const contexts = factory.contexts = [context]
    let sync = true

    const forceRender = (renderCompleted: boolean) => {
      // 遍历所有contexts,执行每个实例的update
      for (let i = 0, l = contexts.length; i < l; i++) {
        contexts[i].$forceUpdate()// 会再次触发createcomponent
      }

      if (renderCompleted) {
        contexts.length = 0
      }
    }
    // 通过once方法对传入的resolve作一层封装，确保resolve只会执行一次
    const resolve = once((res: Object | Class<Component>) => { // res是require返回值
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor)// 异步组件构造器
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      // 只在非同步才执行回调
      if (!sync) { // sync=false
        forceRender(true)
      }
    })

    const reject = once(reason => {
      process.env.NODE_ENV !== 'production' && warn(
        `Failed to resolve async component: ${String(factory)}` +
        (reason ? `\nReason: ${reason}` : '')
      )
      if (isDef(factory.errorComp)) {
        factory.error = true
        forceRender(true)
      }
    })
    // 执行工厂函数(通过webpack异步require)
    const res = factory(resolve, reject)// require结束执行resolve
    // 工厂函数是promise写法时，返回的是一个promise对象，会走这个流程
    if (isObject(res)) {
      if (typeof res.then === 'function') {
        // () => Promise
        if (isUndef(factory.resolved)) {
          // 第一次加载会执行then()，加载完会执行resolve
          res.then(resolve, reject)
        }
      } else if (isDef(res.component) && typeof res.component.then === 'function') {// 高级用法
        res.component.then(resolve, reject)

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor)
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor)
          // 为0时直接渲染loading组件
          if (res.delay === 0) {
            factory.loading = true
          } else {
            // 设置延时：200ms后组件还没加载完且没报错则渲染loading,重新触发渲染
            // forceRender->$forceUpdate->create-component->
            setTimeout(() => {
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true
                forceRender(false)
              }
            }, res.delay || 200)
          }
        }

        if (isDef(res.timeout)) {
          setTimeout(() => {
            if (isUndef(factory.resolved)) {
              reject(
                process.env.NODE_ENV !== 'production'
                  ? `timeout (${res.timeout}ms)`
                  : null
              )
            }
          }, res.timeout)
        }
      }
    }
    // 执行工厂函数后设为false
    sync = false
    // return in case resolved synchronously
    // 同步先返回undefined，有loading时先渲染loading
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}
