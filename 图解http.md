# http

## TCP/IP

- 应用层
协议
FTP, HTTP, DNS(查找IP地址)
- 传输层
2台计算机之间的数据传输
TCP, UDP
- 网络层
网络数据包 IP
- 数据链路层
硬件 网络

### TCP
3次握手
client - 我准备发送数据给你，send syn data -> server
client <- 收到, 并 send syn/ack data - server
client - 好的，握手结束，send syn data -> server

client - 查询IP地址 -> DNS
client <- 告知IP地址 - DNS

## HTTP
http协议不具备保存之前发送的请求或响应的功能

引入cookie

### 状态码
1xx 请求正在处理
2xx 请求正常处理完毕
3xx 重定向 
4xx 客户端错误，服务器无法处理 
5xx 服务器错误

## web服务器

### 虚拟主机实现多个域名
在服务器上配置虚拟主机，即不同域名指向不同文件目录，模拟多台服务器
e.g.
dev.daishutijian.com -> 本地服务器IP -> 文件目录/Applications/MAMP/htdocs/daishu
dev.kangaroo.com -> 本地服务器IP -> 文件目录有/Applications/MAMP/htdocs/kangaroo-public

### 代理
代理服务器：接收客户端发送的请求后转发给其他服务器
#### 透明代理
转发请求不对报文做任何加工
#### 缓存代理(利用缓存技术减少带宽流量):
代理转发响应时，缓存代理cahing proxy 会预习讲资源副本保存在代理服务器上。代理接收到相同资源请求时就可以将缓存资源作为响应返回。

除此之外，还有客户端缓存

## https
### http缺点有很多缺点，如
#### 使用明文不加密，可能被窃听
可以抓包响应、解析它
- 通信加密
通过ssl tls 加密http的通信内容 **http+ssl => https**
- 内容加密

#### 不验证身份，可能遇伪装
任何人都可发起请求，无法确定请求方身份，无法阻止海量攻击
- 查明对方证书，使用ssl证书

#### 无法证明报文完整性
响应内容可能被篡改，MITM 中间人攻击
- MD5 , SHA-1 校验法，用来确认文件数字签名方法

综上所述，http + 加密 + 认证 + 完整性保护 => https

传输过程：http - ssl - tcp - ip

### SSL
独立于http的协议，最广泛的网络安全技术

#### 公钥加密
加密算法隔开，密钥保密
有密钥即能解密

##### 对称加密 | 共享密钥加密
加密和解密用同一个密钥
#### 非对称加密 | 公开密钥加密
用公钥和私钥
使用公钥加密 -发送-> 使用私钥解密

#### 混合加密机制
https采用共享密钥加密和公开密钥两种的混合加密
1. 使用公开密钥安全交换稍后的共享密钥加密中药用的密钥
2. 确保交换的密钥是安全的前提下，用共享密钥加密方式进行通信

证明公开密钥正确性的证书
使用由数字证书认证机构CA颁发的公开密钥证书。


## 用户身份认证

### session会话 && cookie
一般使用cookie来管理session

client - 用户Id 密码 -> server
client <- 包含session id的cookie:set-cookie... - server
client - 把session id 作为cookie 保存在本地 -> server

## 基于http的功能追加协议
1. SPDY: ajax, comet
2. websocket 
- 推送功能
- 减少通信量
3. http2.0
4. WebDAV

## web攻击
1. 输出转义不完全引发
- 客户端验证、服务端验证，输入验证，输出转义
2. 跨站脚本攻击
3. SQL注入攻击
4. http首部注入攻击
5. 会话劫持
6. 跨站点请求伪造