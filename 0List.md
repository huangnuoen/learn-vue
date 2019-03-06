# vue 源码学习（一）

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

### vm._update
- 首次渲染和数据更新时时会调用
- 核心是调用`vm.__patch__`
#### __patch__
1. `const patch: Function = createPatchFunction({ nodeOps, modules })` 柯里化
2. `createElm` 创建真实dom，children通过`createChildren`创建子节点
    - 把vnode.elm插入到对应parentelm,包括vode.children


## 组件化
### create-component
### 为什么要定义子类构造器
### vndoe
### hook 
### 组件的patch
1. 整体流程
- 组件的构造器和普通页面的构造器有什么不一样
- this._init()方法的不同
2. activeInstance
3. vm.$vnode 占位 可以理解成
app.vue、helloworld.vue的$vnode是<App>、<HelloWorld>
4. vm._vnode 渲染
5. 嵌套组件插入顺序
6. createComponent(vnode, insertedVnodeQueue, parentElm, refElm)返回值和componentVNodeHooks.init有关->即是取决于_createElement时的tag有关
### mixin
### 合并配置
1. mergeField
2. vue中传入自定义配置
### 生命周期
1. callHook
2. 挂载时间：
- _init时挂载beforecreate,created
- mountComponent:beforeMount,先父后子
- mounted：1 根节点挂载完成 2 子组件update-__patch__-生成insertedVnodeQueue-invokeInsertHook-componentVNodeHooks.insert-callHook(componentInstance, 'mounted')依次调用钩子，先子后父
- beforeUpdate: watcher.before
- update: watcher flushSchedulerQueue-callUpdatedHooks-callHook(vm, 'updated')
- beforeDestroy: 在Vue.prototype.$destroy时，先父后子
- destroyed: vm.__patch__(vm._vnode, null)-callHook(vm, 'destroyed')先子后父

### 组件注册
1. 全局注册
2. 异步组件的加载 
先渲染注释节点，加载完再渲染组件
resolveAsyncComponent方法包含了3种方式的加载，有些很有用的技巧
2.1. 工厂
2.2. promise
2.3. 高级用法

### 响应式原理
1. Object.defineProperty(obj, prop, descriptor) 添加getter/setter
2. props
3. data
4. 递归data,对子属性也进行响应式处理
5. 依赖收集  只对有用到的数据派发更新
6. defineReactive
- new Dep() 每个key
7. render时会访问vm.data->触发getter->Dep.target->dep.depend()
- ->Dep.target.addDep(this)->this.newDepIds.add(id)->dep.addSub(this)
-  new Watcher 
-> this.get()
-> pushTarget()
-> this.getter.call(vm,vm)
-> updateComponent()
-> vm._update(vm._render())
-> vm._render()
-> new Watcher 组件部分
-> this.get()...->render()
-> vm.flag
-> 触发get:dep.depend()
-> Dep.target.addDep(this)
-> this.newDepIds.add(id) this.newDeps.push(dep) dep.addSub(this)
- this.deps:[Dep,Dep]
- Dep: {id, subs:[Watcher]}
- Watcher:{newDepIds,newDeps,deps,depIds}