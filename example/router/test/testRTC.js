/**
 * webRTC 测试路由
 */

const home = resolve => require(['@/page/home'], resolve)
const testRec = resolve => require(['@/page/recorder/testRec'], resolve)
const testScreen = resolve => require(['@/page/recorder/testScreen'], resolve)
const testTakePicture = resolve => require(['@/page/takePicture/testTakePicture'], resolve)
const testOffer = resolve => require(['@/page/p2p/monitor/testOffer'], resolve)
const testAnswer = resolve => require(['@/page/p2p/monitor/testAnswer'], resolve)

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
    path: '/offer',
    name: 'offer',
    component: testOffer
  },
  {
    path: '/answer',
    name: 'answer',
    component: testAnswer
  }
]

export default testRTC
