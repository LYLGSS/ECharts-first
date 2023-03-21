export default class SocketService {
  // constructor() {}   // 构造方法

  // 单例模式
  static instance = null

  // get 设置的方法调用时不用加括号()
  static get Instance() {
    if (!this.instance) {
      this.instance = new SocketService()
    }
    return this.instance
  }

  // 和服务器连接的 socket 对象
  ws = null

  // 存储回调函数
  callBackMapping = {}

  // 标识是否连接成功
  connected = false

  // 记录重试的次数
  sendRetryCount = 0

  // 重新连接尝试的次数
  connectRetryCount = 0

  // 定义连接服务器的方法
  connect() {
    // 连接服务器
    if (!window.WebSocket) {
      return console.log('您的浏览器不支持 WebSocket')
    }
    this.ws = new WebSocket('ws://localhost:9998')

    // 连接成功的事件
    this.ws.onopen = () => {
      console.log('连接服务端成功了')
      this.connected = true
      // 重置重新连接的次数为0
      this.connectRetryCount = 0
    }
    // 1.连接服务端失败
    // 2.服务端关闭
    this.ws.onclose = () => {
      console.log('连接服务端失败')
      this.connected = false
      this.connectRetryCount++
      // 隔一段时间重新连接
      setTimeout(() => {
        // 重新连接
        this.connect()
      }, this.connectRetryCount * 100) // 延时的时长随着尝试的次数增加
    }
    // 得到服务端发送过来的数据
    this.ws.onmessage = msg => {
      console.log('从服务端获取到了数据')
      // 真正服务端发送过来的原始数据在 msg.data 中
      const resData = JSON.parse(msg.data)
      const socketType = resData.socketType
      // 判断回调函数是否存在
      if (this.callBackMapping[socketType]) {
        const action = resData.action
        if (action === 'getData') {
          const realData = JSON.parse(resData.data)
          this.callBackMapping[socketType].call(this, realData)
        } else if (action === 'fullScreen') {
          this.callBackMapping[socketType].call(this, resData)
        } else if (action === 'themeChange') {
          this.callBackMapping[socketType].call(this, resData)
        }
      }
    }
  }

  // 回调函数的注册（就是将回调函数存储到 callBackMapping 这个对象中）
  registerCallBack(socketType, callBack) {
    this.callBackMapping[socketType] = callBack
  }

  // 取消某一个回调函数（从 callBackMapping 中删除某个回调函数）
  unRegisterCallBack(socketType) {
    this.callBackMapping[socketType] = null
  }

  // 发送数据
  send(data) {
    if (this.connected) {
      this.sendRetryCount = 0
      this.ws.send(JSON.stringify(data))
    } else {
      this.sendRetryCount++
      setTimeout(() => {
        this.send(data)
      }, this.sendRetryCount * 100) // 延时的时长随着尝试的次数增加
    }
  }
}
