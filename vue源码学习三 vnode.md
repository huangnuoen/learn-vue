# vue 源码学习三 vue中如何生成虚拟DOM以及渲染出真实DOM

## `vm._render` 生成虚拟dom
我们知道在挂载过程中， `$mount` 会调用 `vm._update和vm._render` 方法，`vm._updata`是负责把VNode渲染成真正的DOM，`vm._render`方法是用来把实例渲染成VNode，这里的`_render`是实例的私有方法，和前面我们说的`vm.render`不是同一个，先来看下`vm._render`定义,`vm._render`是通过`renderMixin(Vue)`挂载的，定义在`src/core/instance/render.js `：
```
// 简化版本
Vue.prototype._render = function (): VNode {
  const vm: Component = this
  const { render, _parentVnode } = vm.$options
  ...
  // render self
  let vnode
  try {
    // _renderProxy生产环境下是vm
    // 开发环境可能是proxy对象
    vnode = render.call(vm._renderProxy, vm.$createElement) // 近似vm.render(createElement)
  } catch (e) {...}
  // return empty vnode in case the render function errored out
  if (!(vnode instanceof VNode)) {
    if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {...}
    vnode = createEmptyVNode()
  }
  // set parent
  vnode.parent = _parentVnode
  return vnode
}

```
- 先缓存`vm.$options.render`和`vm.$options._parentVnode`，`vm.$options.render`是在上节的$mount中通过comileToFunctions方法将template/el编译来的。
- `vnode = render.call(vm._renderProxy, vm.$createElement)`调用了`render`方法，参数是`vm._renderProxy,vm.$createElement`
- 拿到vnode后，判断类型是否为VNode，如果有多个vnode，则是模板上有多个根节点，触发告警。
- 挂载vnode父节点，最后返回vnode

### 小结 

简要概括，`vm._render`函数最后是通过`render`执行了`createElement`方法并返回`vnode`；下面就来具体看下`vm._renderProxy,vm.$createElement,vnode`

### vm._renderProxy
首先来看下`vm._renderProxy`，`vm._renderProxy`是在_init()中挂载的:
```
Vue.prototype._init = function (options?: Object) {
  ...
  if (process.env.NODE_ENV !== 'production') {
    // 对vm对一层拦截处理，当使用vm上没有的属性时将告警      
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }
  ...
}
```
如果是生产环境，vm._renderProxy直接就是vm;开发环境下，执行`initProxy(vm)`,找到定义：
```
initProxy = function initProxy (vm) {
  if (hasProxy) {
    // determine which proxy handler to use
    const options = vm.$options
    const handlers = options.render && options.render._withStripped
      ? getHandler
      : hasHandler
    // 对vm对一层拦截处理
    vm._renderProxy = new Proxy(vm, handlers)
  } else {
    vm._renderProxy = vm
  }
}
```
先判断当前是否支持Proxy(ES6新语法)，支持的话会实例化一个[Proxy](http://es6.ruanyifeng.com/#docs/proxy), 当前例子用的是hasHandler(只要判断是否vm上有无属性即可)，这样每次通过vm._renderProxy访问vm时，都必须经过这层代理:
```
// 判断对象是否有某个属性
const hasHandler = {
  has (target, key) {
    // vm中是否有key属性
    const has = key in target
    // 当key是全局变量或者key是私有属性且key没有在$data中，允许访问该key
    const isAllowed = allowedGlobals(key) ||
      (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
    // 没有该属性且不允许访问该属性时发起警告
    if (!has && !isAllowed) {
      if (key in target.$data) warnReservedPrefix(target, key)
      else warnNonPresent(target, key)
    }
    return has || !isAllowed
  }
}
```
所以，`_render`中的`vnode = render.call(vm._renderProxy, vm.$createElement)`,实际上是执行`vm._renderProxy.render(vm.$createElement)`


## Virtual DOM 虚拟dom

`vue.2.0`中引入了`virtual dom `,大大提升了代码的性能。所谓`virtual dom` ，就是用js对象去描述一个`dom`节点，这比真实创建dom快很多。在vue中，Virtual dom是用`类vnode`来表示，`vnode`在`src/core/vdom/vnode.js`中定义，有真实`dom`上也有的属性，像`tag/text/key/data/children`等，还有些是`vue`的特色属性,在渲染过程也会用到.

### 定义

## `vm.$createElement`
vue文档中介绍了render函数,第一个参数就是createElement,之前的例子转换成render函数就是：
```
<div id="app">
  {{ message }}
</div>
// 转换成render:
render: function (createElement) {
  return createElement('div', {
     attrs: {
        id: 'app'
      },
  }, this.message)
}
```
可以看出，`createElement`就是`vm.$createElement`

找到`vm.$createElement`定义，在`initRender`方法中，
```
// bind the createElement fn to this instance
// so that we get proper render context inside it.
// args order: tag, data, children, normalizationType, alwaysNormalize
// internal version is used by render functions compiled from templates
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
// normalization is always applied for the public version, used in
// user-written render functions. 
vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
```
看到这里定义了2个实例方法都是调用的`createElement`，一个是用于编译生成的`render`方法,一个是用于手写`render`方法,`createElement`最后会返回`Vnode`，来看下`createElement`的定义：
```
export function createElement (
  context: Component, //vm实例
  tag: any,
  data: any, //可以不传
  children: any,// 子节点
  normalizationType: any,
  alwaysNormalize: boolean
) {
  // 参数判断，不传data时,要把children,normalizationType参数往前移
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}
```
先经过参数重载，根据`alwaysNormalize`传不同的`normalizationType`,调用`_createElement()`,实际上`createElement`是提前对参数做了一层处理
这里的参数重载有个小点值得注意，`normalizationType`是关系到后面`children`的扁平处理，没有`children`则不需要对`normalizationType`赋值，`children`和`normalizationType`就都是空值
### _createElement()

1. 首先校验data,data是响应式的，调用`createEmptyVNode`直接返回注释节点:
```
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true//注释vnode
  return node
}
```
2. 处理tag，没有tag时也返回注释节点
3. key做基础类型校验
4. 当`children`中有`function`类型作`slot`处理，此处先不作分析
5. 对`children`做`normalize` 变成`vnode`一维数组,有2种不同的方式:`normalizeChildren`和`simpleNormalizeChildren`
6. 创建vnode

#### simpleNormalizeChildren
`normalizeChildren`和`simpleNormalizeChildren`是2种对`children`扁平化处理的方法，先来看下`simpleNormalizeChildren`定义：
```
export function simpleNormalizeChildren (children: any) {
  for (let i = 0; i < children.length; i++) {
    // 把嵌套数组拍平成一维数组
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}
```
如果chilren中有一个是数组则将整个children作为参数组用`concat`连接，可以得到每个子元素都是`vnode`的`children`,这适用于只有一级嵌套数组的情况

#### normalizeChildren
```
export function normalizeChildren (children: any): ?Array<VNode> {
  // 判断是否基础类型，是：创建文本节点，否：判断是否数组，是：作normalizeArrayChildren处理
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}
```
普通的children处理：最后也是返回一组一维vnode的数组，当children是Array时，执行`normalizeArrayChildren`

#### normalizeArrayChildren
代码较长，此处就不贴了，可以自己对照源码来分析：
- 定义res
- 遍历children，当children[i]是空或者是布尔值,跳过该次循环
- 如果children[i]还是个数组，再对children[i]作normalizeArrayChildren处理
  ```
  if (Array.isArray(c)) {
    if (c.length > 0) {
      c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)// 返回vnode数组
      // merge adjacent text nodes 
      // 优化：如果c的第一个vnode和children上一次处理的vnode都是文本节点可以合并成一个vnode
      if (isTextNode(c[0]) && isTextNode(last)) {
        res[lastIndex] = createTextVNode(last.text + (c[0]: any).text)
        c.shift()
      }
      res.push.apply(res, c)
    }
  } else if (){...}
  ```
- children[i]是基础类型时
  ```
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
      res.push(createTextVNode(c))// c不为空直接创建文本节点
    }
  } else {
  ```
- 其它情况，children[i]是vnode时，
  ```
  } else {// 当c是vnode时
    if (isTextNode(c) && isTextNode(last)) {
      // merge adjacent text nodes
      res[lastIndex] = createTextVNode(last.text + c.text)
    } else {
      // default key for nested array children (likely generated by v-for)
      // 特殊处理，先略过
      if (isTrue(children._isVList) &&
        isDef(c.tag) &&
        isUndef(c.key) &&
        isDef(nestedIndex)) {
        c.key = `__vlist${nestedIndex}_${i}__`
      }
      // push到res上
      res.push(c)
    }
  }
  ```
- 最后返回一组vnode
主要有2个点，一是`normalizeArrayChildren`的递归调用，二是文本节点的合并

#### 创建vnode
6. 创建vnode,并返回

- 判断`tag`类型，为字符串时：
  ```
  let Ctor
  ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
  // 判断tag是否是原生标签
  if (config.isReservedTag(tag)) {
    // platform built-in elements
    vnode = new VNode(
      config.parsePlatformTagName(tag), data, children,
      undefined, undefined, context
    )
  } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
    // component组件部分先略过
    vnode = createComponent(Ctor, data, context, children, tag)
  } else {
    // unknown or unlisted namespaced elements
    // check at runtime because it may get assigned a namespace when its
    // parent normalizes children
    // 未知标签，创建vnode
    vnode = new VNode(
      tag, data, children,
      undefined, undefined, context
    )
  }

  ```
  - `tag`不是字符串类型时，`vnode = createComponent(tag, data, context, children)`,先略过
  - 最后再对生成的`vnode`作校验，返回`vnode`

### 小结
到此为止，我们分析了`vm._render`方法和`_createElement`方法，知道了创建`vnode`的整个过程，在$mount中的` vm._update(vm._render(), hydrating)`，`vm._render`返回了vnode,再传入`vm._update`中,由`vm._update`渲染成真实`dom`

