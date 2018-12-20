const path = require('path')

/* path.resolve是node.js提供的路径解析方法
 * path.resolve(当前目录即scripts, '../', 'src/platforms/web')
 * 当前目录scripts拼接上一级即是根目录
 * 再拼接'src/platforms/web'
 * return '/vue/src/platforms/web' 绝对路径
*/
const resolve = p => path.resolve(__dirname, '../', p)

module.exports = {
  vue: resolve('src/platforms/web/entry-runtime-with-compiler'),
  compiler: resolve('src/compiler'),
  core: resolve('src/core'),
  shared: resolve('src/shared'),
  web: resolve('src/platforms/web'),
  weex: resolve('src/platforms/weex'),
  server: resolve('src/server'),
  entries: resolve('src/entries'),
  sfc: resolve('src/sfc')
}
