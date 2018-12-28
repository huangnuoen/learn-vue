# vue 源码学习（一）
---
## Flow

vue框架使用了Flow作为类型检查，来保证项目的可读性和维护性。在学习源码前可以先看下Flow的语法，了解下,[官方文档](https://flow.org/en/docs/config/)

vue.js的主目录下有Flow的配置.flowconfig文件，还有flow目录，指定了各种自定义类型

## 源码src目录结构 
```
src
├── compiler        # 编译相关 
├── core            # 核心代码 
├── platforms       # 不同平台的支持
├── server          # 服务端渲染
├── sfc             # .vue 文件解析
├── shared          # 共享代码
```

### compiler
template的编译
### core
```
core
├── components     # 内置组件
├── global-api     # 全局 API 封装 
├── instance       # Vue 实例化
├── observer       # 观察者
├── util           # 工具函数
├── vdom           # 虚拟 DOM
```
## vue.js构建 
