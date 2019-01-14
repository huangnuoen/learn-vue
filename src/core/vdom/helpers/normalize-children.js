/* @flow */

import VNode, { createTextVNode } from 'core/vdom/vnode'
import { isFalse, isTrue, isDef, isUndef, isPrimitive } from 'shared/util'

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
// 模板编译器通过在编译时静态地分析模板来尽量减少规范化的需要
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:
// 对于普通的html标记，可以完全跳过normalization，因为生成的render函数保证返回vnode数组，以下2种情况需要另外做normalize

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
// 当子容器组件（因为函数式组件可能会返回一个数组而不是单个根节点），此时，只需做一个简单处理;如果有任一个子组件是数组，就要用Array.prototype.concat拍平它，可以保证它只有一层深，因为函数式组件已经normalize它们的子组件了
export function simpleNormalizeChildren (children: any) {
  for (let i = 0; i < children.length; i++) {
    // 把嵌套数组拍平成一维数组
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
// 当子容器组件包含嵌套数组，例如<template>, <slot>, v-for，或是用户为children提供了手写render函数/JSX。
// 此时需要完全做normalization处理来满足所有子值类型
export function normalizeChildren (children: any): ?Array<VNode> {
  // 判断是否基础类型，是：创建文本节点，否：判断是否数组，是：作normalizeArrayChildren处理
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function isTextNode (node): boolean {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

function normalizeArrayChildren (children: any, nestedIndex?: string): Array<VNode> {
  const res = []
  let i, c, lastIndex, last
  for (i = 0; i < children.length; i++) {
    c = children[i]
    // c是空或者是布尔值 跳过
    if (isUndef(c) || typeof c === 'boolean') continue
    lastIndex = res.length - 1
    last = res[lastIndex]
    //  nested 如果c还是个数组，再对c作normalizeArrayChildren处理
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)// 返回vnode数组
        // merge adjacent text nodes 
        // 如果c的第一个vnode和children上一次处理的vnode都是文本节点可以合并成一个vnode，提高性能
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]: any).text)
          c.shift()
        }
        res.push.apply(res, c)
      }
    } else if (isPrimitive(c)) {
      // 当c是基础类型时
      // children上一次处理的vnode是文本节点，则合并成一个文本节点
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        // 这是SSR hydration所必需的，因为文本节点渲染成html时基本上都是合并的
        res[lastIndex] = createTextVNode(last.text + c)
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c))// 直接创建文本节点
      }
    } else {// 当c是vnode时
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text)
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = `__vlist${nestedIndex}_${i}__`
        }
        res.push(c)
      }
    }
  }
  return res
}
