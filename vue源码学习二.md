# vue 源码学习二 实例初始化和挂载过程

## vue 入口

从vue的构建过程可以知道，web环境下，入口文件在 `src/platforms/web/entry-runtime-with-compiler.js`（以Runtime + Compiler模式构建，vue直接运行在浏览器进行编译工作）
```
import Vue from './runtime/index'
```
下一步，找到`./runtime/index`，发现：
```
import Vue from 'core/index'
```
下一步，找到`core/index`，发现：
```
import Vue from './instance/index'
```
按照这个思路找，最后发现：Vue是在'core/index'下定义的
```
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```
引入方法，用`function`定义了`Vue类`，再以`Vue`为参数，调用了5个方法，最后导出了`vue`。

可以进入这5个文件查看相关方法，主要就是在`Vue`原型上挂载方法，可以看到，`Vue` 是把这5个方法按功能放入不同的模块中，这很利于代码的维护和管理

### initGlobalAPI

回到`core/index.js`, 看到除了引入已经在原型上挂载方法后的 Vue 外，还导入`initGlobalAPI 、 isServerRendering、FunctionalRenderContext`，执行`initGlobalAPI(Vue)`，在`vue.prototype`上挂载`$isServer、$ssrContext、FunctionalRenderContext`，在`vue` 上挂载 `version` 属性，

看到`initGlobalAPI`的定义，主要是往vue.config、vue.util等上挂载全局静态属性和静态方法（可直接通过Vue调用，而不是实例调用），再把`builtInComponents 内置组件`扩展到`Vue.options.components`下。此处大致了解下它是做什么的即可，后面用到再做具体分析。


## new Vue()
一般我们用vue都采用模板语法来声明：
```
<div id="app">
  {{ message }}
</div>
```
```
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})
```
当new Vue()时，vue做了哪些处理？
```
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```
看到`vue`只能通过new实例化，否则报错。实例化`vue`后，执行了`this._init()`，该方法在通过`initMixin(Vue)`挂载在`Vue`原型上的，找到定义文件`core/instance/init.js` 查看该方法。
### _init()

一开始在`this`对象上定义`_uid、_isVue`,判断`options._isComponent`，此次先不考虑`options._isComponent`为`true`的情况，走`else`，合并`options`，接着安装`proxy`, 初始化生命周期，初始化事件、初始化渲染、初始化data、钩子函数等，最后判断有`vm.$options.el`则执行`vm.$mount()`,即是把`el`渲染成最终的`DOM`。

## 初始化data 数据绑定
`_init()`中通过`initState()`来绑定数据到vm上，看下`initState`的定义：
```
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

```
获取options，初始化props、methods、data、计算属性、watch绑定到vm上，先来看下initData()是如何把绑定data的：

- 先判断data是不是function类型，是则调用getData，返回data的自调用，不是则直接返回data,并将data赋值到vm._data上
- 对data、props、methods，作个校验，防止出现重复的key,因为它们最终都会挂载到vm上,都是通过vm.key来调用
- 通过```proxy(vm, `_data`, key)```把每个`key`都挂载在`vm`上
  ```
  export function proxy (target: Object, sourceKey: string, key: string) {
    sharedPropertyDefinition.get = function proxyGetter () {
      return this[sourceKey][key]
    }
    sharedPropertyDefinition.set = function proxySetter (val) {
      this[sourceKey][key] = val
    }
    Object.defineProperty(target, key, sharedPropertyDefinition)
  }
  const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
  }
  ```

  `proxy()` 定义了一个`get/set`函数，再通过`Object.defineProperty`定义\修改属性(不了解`Object.defineProperty()`的同学可以先看下[文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)，通过`Object.defineProperty()`定义的属性，通过描述符的设置可以进行更精准的控制对象属性)，将对target的key访问加了一层`get/set`,即当访问`vm.key`时，实际上是调用了`sharedPropertyDefinition.get`，返回`this._data.key`，这样就实现了通过vm.key来调用vm._data上的属性
- 最后，`observe(data, true /* asRootData */)` 观察者，对数据作响应式处理，这也是vue的核心之一，此处先不分析


## $mount() 实例挂载
`Vue`的核心思想之一是数据驱动，在`vue`下，我们不会直接操作`DOM`，而是通过js修改数据,所有逻辑只需要考虑对数据的修改，最后再把数据渲染成DOM。其中，`$mount()`就是负责把数据挂载到`vm`,再渲染成最终`DOM`。

接下来将会分析下` vue `是如何把javaScript对象渲染成`dom`元素的，和之前一样，主要分析主线代码

### 预处理

还是从`src/platform/web/entry-runtime-with-compiler.js` 文件入手，
```
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)
  ···
}
```
首先将原先原型上的`$mount`方法缓存起来，再重新定义`$mount`：
- 先判断 `el` ，`el` 不能是 `body, html` ，因为渲染出来的 `DOM `最后是会替换掉`el`的
- 判断`render`方法, 有的话直接调用`mount.call(this, el, hydrating)`
- 没有`render`方法时：
1. 判断有没有`template` ，有则用`compileToFunctions`将其编译成render方法
2. 没有`template`时，则查看有没有`el`,有转换成`template`，再用`compileToFunctions`将其编译成`render`方法
3. 将`render`挂载到options下
4. 最后调用 `mount.call(this, el, hydrating)`,即是调用原先原型上的mount方法

我们发现这一系列调用都是为了生成`render`函数，说明在`vue`中，所有的组件渲染最终都需要`render`方法（不管是单文件.vue还是el\template），`vue` 文档里也提到：
> `Vue` 选项中的 render 函数若存在，则 `Vue` 构造函数不会从 `template` 选项或通过 el 选项指定的挂载元素中提取出的 `HTML` 模板编译渲染函数。


### 原先原型上的mount方法
找到原先原型上的mount方法，在`src/platform/web/runtime/index.js`中:
```
// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```
这个是公用的`$mount`方法，这么设计使得这个方法可以被 `runtime only`和`runtime+compiler` 版本共同使用

`$mount` 第一个参数el, 表示挂载的元素，在浏览器环境会通过query(el)获取到dom对象，第二个参数和服务端渲染相关，不进行深入分析，此处不传。接着调用`mountComponent()`

看下`query()`,比较简单，当`el `是`string`时，找到该选择器返回dom对象，否则新创建个div dom对象，el是dom对象直接返回el.

### mountComponent
`mountComponent`定义在`src/core/instance/lifecycle.js`中，传入`vm,el`, 

- 将`el`缓存在`vm.$el`上
- 判断有没有`render`方法，没有则直接把createEmptyVNode作为`render`函数 
- 开发环境警告（没有`Render`但有`el/template`不能使用`runtime-only`版本、`render`和`template`必须要有一个）
- 挂载`beforeMount`钩子
- 定义 `updateComponent` , 渲染相关
  ```
  updateComponent = () => {
    vm._update(vm._render(), hydrating)
  }
  ```
- `new Watcher()` 实例化一个渲染watcher,简单看下定义,
  ``` this.getter = expOrFn  ```
  把`updateComponent`挂载到`this.getter`上
  `this.value = this.lazy ? undefined : this.get()`
  ```
  get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
    } catch (e) {...}
    return value
  }
  ```
  执行`this.get()`，则执行了`this.getter`,即`updateComponent`,所以`new Watcher()`时会执行`updateComponent`,也就会执行到`vm._update、vm._render`方法。

  因为之后不止初始化时需要渲染页面，数据发生变化时也是要更新到dom上的，实例watcher可以实现对数据进行监听以及随后的更新`dom`处理，`watcher`会在初始化执行回调，也会在数据变化时执行回调，此处先简单介绍为什么要使用`watcher`,不深入分析`watcher`实现原理。
- 最后判断有无根节点，无则表示首次挂载，添加`mounted`钩子函数 ，返回vm

## 总结

实例初始化：`new Vue()->挂载方法属性->this._init->初始化data->$mount`

挂载过程:(在`complier`版本，生成`render`函数)对el作处理，执行`mountComponent`,`mountComponent`中定义了`updateComponent`,通过实例化`watcher`的回调执行`updateComponent`,执行`updateComponent`，即调用了`vm._update、vm._render`真实渲染成`dom`对象。




