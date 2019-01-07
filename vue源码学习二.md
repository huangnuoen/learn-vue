# vue 源码学习 入口分析

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

## initGlobalAPI

回到`core/index.js`, 看到除了引入已经在原型上挂载方法后的 Vue 外，还导入`initGlobalAPI 、 isServerRendering、FunctionalRenderContext`，执行`initGlobalAPI(Vue)`，在`vue.prototype`上挂载`$isServer、$ssrContext、FunctionalRenderContext`，在`vue` 上挂载 `version` 属性.

看到`initGlobalAPI`的定义，主要是往vue.config、vue.util等上挂载全局属性和方法。此处大致了解下它是做什么的即可，后面用到再做具体分析。


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
一开始在`this`对象上定义`_uid、_isVue`,判断`options._isComponent`，此次先不考虑options._isComponent为true的情况，走else，合并options
```
vm.$options = mergeOptions(
  resolveConstructorOptions(vm.constructor),
  options || {},
  vm
)
```