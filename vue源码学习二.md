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
按照这个思路找，最后发现：
```

```