# vue中axios请求的封装

## axios
Axios 是一个基于 promise 的 HTTP 库，可以用在浏览器和 node.js 中, 也是vue官方推荐使用的http库；封装axios，一方面为了以后维护方便，另一方面也可以对请求进行自定义处理

### 安装
`npm i axios`

### 封装
我把axios请求封装在http.js中，重新把get请求，post请求封装了一次

首先，引入axios
```javascript {.line-numbers}
import axios from 'axios'
```
### 设置接口请求前缀
一般我们开发都会有开发、测试、生产环境，前缀需要加以区分，我们利用node环境变量来作判断，
```javascript {.line-numbers}
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = 'http://dev.xxx.com'
} else if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'http://prod.xxx.com'
}
```


本项目是vue cli3搭建的，代理配置是在`vue.config.js`文件中:
```javascript {.line-numbers}
module.exports = {
  devServer: {
    proxy: {
      '/proxyApi': {
        target: 'http://dev.xxx.com',
        changeOrigin: true,
        pathRewrite: {
          '/proxyApi': ''
        }
      }
    }
  }
}
```
这样就成功把`/proxyApi` 指向了 `'http://dev.xxx.com'`，重启服务

修改一下http.js中的配置
```javascript {.line-numbers}
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = '/proxyApi'
} else if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'http://prod.xxx.com'
}
```
### 拦截器
接着设置超时时间和请求头信息
```javascript {.line-numbers}
axios.defaults.timeout = 10000
// 请求头信息是为post请求设置
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
```
axios很好用，其中之一就是它的拦截器十分强大，我们就可以为请求和响应设置拦截器，比如请求拦截器可以在每个请求里加上token，做了统一处理后维护起来也方便，响应拦截器可以在接收到响应后先做一层操作，如根据状态码判断登录状态、授权。
```javascript {.line-numbers}
// 请求拦截器
axios.interceptors.request.use(
  config => {
    // 每次发送请求之前判断是否存在token
    // 如果存在，则统一在http请求的header都加上token，这样后台根据token判断你的登录情况，此处token一般是用户完成登录后储存到localstorage里的
    token && (config.headers.Authorization = token)
    return config
  },
  error => {
    return Promise.error(error)
  })
// 响应拦截器
axios.interceptors.response.use(response => {
  // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
  // 否则的话抛出错误
  if (response.status === 200) {
    if (response.data.code === 511) {
      // 未授权调取授权接口
    } else if (response.data.code === 510) {
      // 未登录跳转登录页
    } else {
      return Promise.resolve(response)
    }
  } else {
    return Promise.reject(response)
  }
}, error => {
  // 我们可以在这里对异常状态作统一处理
  if (error.response.status) {
    // 处理请求失败的情况
    // 对不同返回码对相应处理
    return Promise.reject(error.response)
  }
})

```
### get post的封装
`httpGet`: 一个参数是请求的url,一个就携带的请求参数，返回promise对象
```javascript {.line-numbers}
// get 请求
export function httpGet({
  url,
  params = {}
}) {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      params
    }).then((res) => {
      resolve(res.data)
    }).catch(err => {
      reject(err)
    })
  })
}

```
`httpPost`: 原理和get差不多，需要注意，这里多了个data参数，post请求提交前需要对它进行序列号操作，这里是通过`transformRequest`做处理；另外两个参数url,params和get请求的一样；
```javascript {.line-numbers}
// post请求
export function httpPost({
  url,
  data = {},
  params = {}
}) {
  return new Promise((resolve, reject) => {
    axios({
      url,
      method: 'post',
      transformRequest: [function (data) {
        let ret = ''
        for (let it in data) {
          ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
        }
        return ret
      }],
      // 发送的数据
      data,
      // url参数
      params

    }).then(res => {
      resolve(res.data)
    })
  })
}
```
### 如何使用
我把所有的接口调用都在api.js文件中

先引入封装好的方法，再在要调用的接口重新封装成一个方法暴露出去
```javascript {.line-numbers}
import { httpGet, httpPost } from './http'
export const getorglist = (params = {}) => httpGet({ url: 'apps/api/org/list', params })

```
在页面中可以这样调用：
```javascript {.line-numbers}
// .vue
import { getorglist } from '@/assets/js/api'

getorglist({ id: 200 }).then(res => {
  console.log(res)
})
```
这样可以把api统一管理起来，以后维护修改只需要在api.js文件操作即可。

## 完整代码
最后贴上完整代码
```javascript {.line-numbers}
// http.js
import axios from 'axios'

// 环境的切换
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = '/proxyApi'
} else if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'http://prod.xxx.com'
}

// 请求拦截器
axios.interceptors.request.use(
  config => {
    token && (config.headers.Authorization = token)
    return config
  },
  error => {
    return Promise.error(error)
  })

axios.defaults.timeout = 10000

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'

// 响应拦截器
axios.interceptors.response.use(response => {
  if (response.status === 200) {
    if (response.data.code === 511) {
      // 未授权调取授权接口
    } else if (response.data.code === 510) {
      // 未登录跳转登录页
    } else {
      return Promise.resolve(response)
    }
  } else {
    return Promise.reject(response)
  }
}, error => {
  // 我们可以在这里对异常状态作统一处理
  if (error.response.status) {
    // 处理请求失败的情况
    // 对不同返回码对相应处理
    return Promise.reject(error.response)
  }
})

// get 请求
export function httpGet({
  url,
  params = {}
}) {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      params
    }).then((res) => {
      resolve(res.data)
    }).catch(err => {
      reject(err)
    })
  })
}

// post请求
export function httpPost({
  url,
  data = {},
  params = {}
}) {
  return new Promise((resolve, reject) => {
    axios({
      url,
      method: 'post',
      transformRequest: [function (data) {
        let ret = ''
        for (let it in data) {
          ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
        }
        return ret
      }],
      // 发送的数据
      data,
      // url参数
      params

    }).then(res => {
      resolve(res.data)
    })
  })
}
```
```javascript {.line-numbers}
// api.js
import { httpGet, httpPost } from './http'
export const getorglist = (params = {}) => httpGet({ url: 'apps/api/org/list', params })

export const save = (data) => {
  return httpPost({
    url: 'apps/wechat/api/save_member',
    data
  })
}
```
```javascript {.line-numbers}
// .vue
<script>
import { getorglist } from '@/assets/js/api'
export default {
  name: 'upload-card',
  data() {},
  mounted() {
    getorglist({ id: 200 }).then(res => {
      // console.log(res)
    })
  },
}
</script>
```
=========================================================

### 3月25日更新

先谢谢帮我说话的小伙伴，没想到这篇竟然有这么多阅读量，原来只是随手笔记，以为没什么人看，周末一看有100多条消息，有点惊到了

针对评论区的提出意见，文章已经做了更新修正

评论区疑问是为什么还要多封装一层promise,不直接返回axios。
我在这里统一做个说明：

当然可以直接返回`axios.get().then(res=>res.data)`,写法更简洁些；个人编程习惯，感觉`resolve(res.data)`写法更优雅些,这个就见仁见智了，所以正文对这点先做保留。这篇笔记也是提供一个思路，仅供参考。小伙伴可以根据自己实际业务需求来选择。

本人前端小白一枚 这次也是想记录一下axios的使用，有什么不足之处欢迎各位提意见哈（尽量温柔点），以后也会根据实际业务需求和大家的意见来做调整和修正（持续更新~)