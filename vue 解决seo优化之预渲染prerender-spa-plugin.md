# vue 解决seo优化之预渲染prerender-spa-plugin

## 安装prerender-spa-plugin
```
npm install --save prerender-spa-plugin
```
这个过程中会可能会遇到报错，因为要装一个`puppeteer`插件，需要翻墙，可以用镜像安装
```
cnpm install --save prerender-spa-plugin
```
这个过程会下载`chromium`

## vue.config.js
接下来在vue.config.js中进行配置
```
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer
const path = require('path')
module.exports = {
  productionSourceMap: false,
  configureWebpack: config => {
    if (process.env.NODE_ENV !== 'production') return
    return {
      plugins: [
        new PrerenderSPAPlugin({
          //生成文件的路径，也可以与webpakc打包的一致
          staticDir: path.join(__dirname, 'dist'),
          // 对应自己的路由文件，比如index有参数，就需要写成 /index/param1。
          routes: ['/', '/about'],
          // 预编译
          renderer: new Renderer({
            inject: {
              foo: 'bar'
            },
            headless: false,
            renderAfterDocumentEvent: 'render-event'
          })
        })
      ]
    }
  }
}
```

## main.js
接着在main.js中修改
```
new Vue({
  router,
  store,
  render: h => h(App),
  // 加上了这句代码
  mounted() {
    document.dispatchEvent(new Event('render-event'))
  }
}).$mount("#app");
```
这样在打包时就会生成dist/index.html, dist/about/index.html

## 打包
`npm run build`
打开dist/index.html已经可以成功看到页面内容了，但是有个问题js/css都没加载出来
