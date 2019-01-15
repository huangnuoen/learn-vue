# vue源码学习四 真实dom的渲染

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
看下传入的2个参数，`nodeOps`在`src\platforms\web\runtime\node-ops.js`文件中，定义了一些实际`dom`操作的方法,包括`dom`元素创建、添加、插入等；`modules`是`platformModules和baseModules`组成的新数组，`platformModules`里封装了一些dom属性操作、类名操作、dom添加事件等原生方法，`baseModules`里封装了些vue中自定义的钩子函数、指令等方法。
```
// 打印出来的参数
{nodeOps: {…}, modules: Array(8)}
modules: Array(8)
0:
create: ƒ updateAttrs(oldVnode, vnode)
update: ƒ updateAttrs(oldVnode, vnode)
__proto__: Object
1: {create: ƒ, update: ƒ}
2: {create: ƒ, update: ƒ}
3: {create: ƒ, update: ƒ}
4: {create: ƒ, update: ƒ}
5: {create: ƒ, activate: ƒ, remove: ƒ}
6: {create: ƒ, update: ƒ, destroy: ƒ}
7: {create: ƒ, update: ƒ, destroy: ƒ}
length: 8
__proto__: Array(0)
nodeOps:
appendChild: ƒ appendChild(node, child)
createComment: ƒ createComment(text)
createElement: ƒ createElement$1(tagName, vnode)
createElementNS: ƒ createElementNS(namespace, tagName)
createTextNode: ƒ createTextNode(text)
insertBefore: ƒ insertBefore(parentNode, newNode, referenceNode)
nextSibling: ƒ nextSibling(node)
parentNode: ƒ parentNode(node)
removeChild: ƒ removeChild(node, child)
setAttribute: ƒ setAttribute(node, key, val)
setTextContent: ƒ setTextContent(node, text)
tagName: ƒ tagName(node)
__proto__: Object
__proto__: Object
```
所以`patch`方法实际上是调用了`createPatchFunction`后返回生成的一个函数，来看下`createPatchFunction`的定义

### createPatchFunction
`createPatchFunction`在`src\core\vdom\patch.js`文件中定义：
- 拿传入的参数对象，把所有模块方法挂载到对应的hook上
  ```
  // 打印cbs
  {create: Array(8), activate: Array(1), update: Array(7), remove: Array(1), destroy: Array(0)}
  activate: [ƒ]
  create: Array(8)
  0: ƒ updateAttrs(oldVnode, vnode)
  1: ƒ updateClass(oldVnode, vnode)
  2: ƒ updateDOMListeners(oldVnode, vnode)
  3: ƒ updateDOMProps(oldVnode, vnode)
  4: ƒ updateStyle(oldVnode, vnode)
  5: ƒ _enter(_, vnode)
  6: ƒ create(_, vnode)
  7: ƒ updateDirectives(oldVnode, vnode)
  length: 8
  __proto__: Array(0)
  destroy: []
  remove: [ƒ]
  update: (7) [ƒ, ƒ, ƒ, ƒ, ƒ, ƒ, ƒ]
  __proto__: Object
  ```
  可以看到，每个钩子上都挂载着对应的钩子函数
- 定义了一些辅助函数
- 最后返回了`patch`函数，也就是我们调用`vm.__patch__`时的实际调用方法

这个的`patch`用了柯里化函数来处理，通过调用`create`Patch`Function`来返回`patch`,而不是直接定义，这样的好处是什么呢？`patch`方法是要将`vnode`渲染成真实`dom`,这个步骤和代码运行平台是相关的，所以这个过程是需要根据不同平台来进行差异化处理的，如果我们直接定义`patch`,则需要在`patch`方法里通过`if.else.`做这个差异化处理，每次调用`patch`都要做这步操作，而通过柯里化函数，我们看到在调用`createPatchFunction`时传入了参数，这个差异化处理是调用`createPatchFunction`时做了，而`createPatchFunction`只会在patch初始化时调用一次，也就是说只需要做一次差异化处理。

### patch
下面我们来看下这个`patch`方法
- 传入参数`oldVnode(vm.$el真实dom), vnode, hydrating, removeOnly`