/**
 * webRTC 测试路由
 */

const home = resolve => require(['@/page/home'], resolve)
const testRec = resolve => require(['@/page/recorder/testRec'], resolve)
const testScreen = resolve => require(['@/page/recorder/testScreen'], resolve)
const testTakePicture = resolve => require(['@/page/takePicture/testTakePicture'], resolve)
const testRobot = resolve => require(['@/page/p2p/monitor/testRobot'], resolve)
const testReceiver = resolve => require(['@/page/p2p/monitor/testReceiver'], resolve)

const testRTC = [
  {
    path: '/home',
    name: 'home',
    component: home
  },
  {
    path: '/rec',
    name: 'rec',
    component: testRec
  },
  {
    path: '/screen',
    name: 'screen',
    component: testScreen
  },
  {
    path: '/takePicture',
    name: 'takePicture',
    component: testTakePicture
  },
  {
    path: '/robot',
    name: 'robot',
    component: testRobot
  },
  {
    path: '/receiver',
    name: 'receiver',
    component: testReceiver
  }
]

export default testRTC
