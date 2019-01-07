# vue 源码学习二 实例初始化和挂载过程

## vue 入口
使用vue，都要先 `new Vue()` ，说明Vue 应该是个构造函数。
从vue的构建过程可以知道，web环境下，入口文件在 `src/platforms/web/entry-runtime-with-compiler.js`（以Runtime + Compiler模式构建）
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

### 初始化data 数据绑定
_init()中通过initState()来绑定数据到vm上，看下initState的定义：
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
- 对data、props、methods，作个校验，防止出现重复的key,因为它们最终都会挂载到vm上
- 通过```proxy(vm, `_data`, key)```把每个key挂载在vm上
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
  定义了一个get/set函数，通过`Object.defineProperty`定义\修改属性，将对target的key访问加了一层get/set,即当访问vm.key时，实际上是调用了sharedPropertyDefinition.get，返回this._data.key。
- 最后，`observe(data, true /* asRootData */)` 观察者，对数据作响应式处理，此处先不分析




## $mount() 实例挂载
Vue的核心思想之一是数据驱动，在vue下，我们不会直接操作DOM，而是通过js修改数据,所有逻辑只需要考虑对数据的修改，最后再把数据渲染成DOM。其中，$mount()就是负责把数据挂载到vm,再渲染成最终DOM。

接下来将会分析下 vue 是如何把javaScript对象渲染成dom元素的，和之前一样，主要分析主线代码

