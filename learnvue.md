# 


---

## new Vue()
### 初始化`this._init(opts)`
- `merge options` 到 `$options`
- 初始化生命周期、事件绑定、渲染、钩子函数等一系列函数
    ```
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) 
    initState(vm)
    initProvide(vm)
    callHook(vm, 'created')
    ```
- 有$options.el，则将它挂载到`vm.$mount`上
- `initState()`
    - 将`vm._data` 等通过`proxy`到`vm`上


### 实例挂载$mount
- `platforms/web/runtime/index.js`定义`$mount`

1. 拿到`render`函数
2. 定义并调用`unpdateComponent`方法(定义了`vm._update(vm._render)`)
3. `new Watcher(vm,updateComponent)` 监听变化，有变化也会执行`updateComponent`


### vm._render
1. 执行rendr生成vnode`render.call(vm._renderProxy, vm.$createElement)`
2. `vm.$createElement` 会生成vnode
3. `vm._renderProxy` 对vm 作一层拦截器


### virtual dom
#### createElement()
1. 对参数进行一层处理，再执行`_createElement()`
2. 对`children`作`normalize`处理，分2种，普通处理和简单处理，最后把`children`变成`vnode`一维数组
3. `createElement`作为render参数传入，调用render(),即调用`createElement`生成`vnode`，返回到`vm._update(vm._render)`


