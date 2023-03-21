const path = require('path')
const fileUtils = require('../utils/file_utils')
const WebSocket = require('ws')
// 创建WebSocket服务端的对象, 绑定的端口号是9998
const wss = new WebSocket.Server({
  port: 9998
})
// 服务端开启了监听
module.exports.listen = () => {
  // 对客户端的连接事件进行监听
  // client:代表的是客户端的连接socket对象
  wss.on('connection', client => {
    console.log('有客户端连接成功了...')
    // 对客户端的连接对象进行message事件的监听
    // msg: 由客户端发给服务端的数据
    client.on('message', async msg => {
      console.log('客户端发送数据给服务端了: ' + msg)
      // 将客户端发送的数据转换为 json 格式
      let payload = JSON.parse(msg)
      // 获取客户请求的操作
      const action = payload.action
      if (action === 'getData') {
        // 客户端发送的请求是 getData，则从服务器发送数据给客户端
        // payload.chartName 为用户请求哪个图表的数据，值可能为 trend seller map rank hot stock
        // 拼接路径
        let filePath = '../data/' + payload.chartName + '.json'
        filePath = path.join(__dirname, filePath)
        const res = await fileUtils.getFileJsonData(filePath)
        // 需要在服务器获取到的数据的基础上，增加一个 data 字段
        // data 对应的值，就是某个 json 文件的内容
        payload.data = res
        client.send(JSON.stringify(payload))
      } else {
        // 客户端发送的请求不是 getData，则把接收到的数据原封不动的发送给每一个处于链接状态的客户端
        // wss.clients:所有客户端的连接
        wss.clients.forEach(client => {
          client.send(msg)
        })
      }
      // 由服务端往客户端发送数据
      // client.send('hello socket from backend')
    })
  })
}
