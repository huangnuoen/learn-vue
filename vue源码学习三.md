# vue 源码学习三 vm._render 虚拟DOM的生成

## `vm._render` 主流程 生成虚拟dom
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
先判断当前是否支持Proxy(ES6新语法)，支持的话会实例化一个[Proxy](http://es6.ruanyifeng.com/#docs/proxy), 当前例子用的是hasHandler,只要判断是否vm上有无属性即可，这样每次访问vm时，都必须经过这层代理


## Virtual DOM 虚拟dom

`vue.2.0`中引入了`virtual dom `,大大提升了代码的性能。所谓`virtual dom` ，就是用js对象去描述一个`dom`节点，这比真实创建dom快很多。在vue中，Virtual dom是用`类vnode`来表示，`vnode`在`src/core/vdom/vnode.js`中定义，有真实`dom`上也有的属性，像`tag/text/key/data/children`等，还有些是`vue`的特色属性,在渲染过程也会用到.

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
看到这里定义了2个实例方法都是调用的`createElement`，一个是用于编译生成的`render`方法,一个是用于手写`render`方法,`createElement`最后会返回`Vnode`



