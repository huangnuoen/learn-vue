## _update()

`vm._update`在`lifecycleMixin()`时挂载的,我们知道，数据在什么时候会被渲染成`dom`呢，一个是在首次渲染时，一个是在数据发生改变时
- 缓存`this/vm.$el/vm._vnode`，首次渲染时`vm._vnode`是为空的，执行`vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)`渲染出真实dom，挂载到`vm.$el`上
- 
## __patch__
`__patch__`是最终渲染成dom的方法，定义在`src\platforms\web\runtime\index.js`中：
```
// install platform patch function 
Vue.prototype.__patch__ = inBrowser ? patch : noop
```
因为在浏览器端才有`__patch__`方法，否则为空，找到`patch`的定义，在`src\platforms\web\runtime\patch.js`中：
```
// 跨端差异化处理 柯里化函数 提前处理差异 只需要处理一次差异
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

