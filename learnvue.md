### $mount
1. 拿到`render`函数
2. 定义并调用`unpdateComponent`方法(定义了`vm._update(vm._render)`)
3. `new Watcher(vm,updateComponent)` 监听变化，有变化也会执行`updateComponent`


### vm._render
1. 执行rendr生成vnode`render.call(vm._renderProxy, vm.$createElement)`
2. `vm.$createElement` 会生成vnode
3. `vm._renderProxy` 对vm 作一层拦截器