
const fs = require('fs')

// const options = {
//   persistent: true,
//   recursive: true,
//   encoding: 'utf8'
// }
// fs.watch('D:/DL/fdm', options, (eventType, filename) => {
//   console.log(`event type is: ${eventType}`)
//   if (filename) {
//     console.log(`filename is: ${filename}`)
//   } else {
//     console.log('filename not provided')
//   }
// })

const readConfig = require('./methods/readConfig')
const config = readConfig(fs, __dirname + '/launch.json')

const WebSocket = require('ws')
const puppeteer = require('puppeteer')

const deliverer = require('./classes/deliverer')

;(async () => {
  const launchOptions = {
    headless: false,
    executablePath: config.browser,
    defaultViewport: null,
    args: [
      '--disable-infobars',
      '--start-maximized',
      '--lang=en-US,en',
    ]
  }
  const browser = await puppeteer.launch(launchOptions)

  // Create a websocket to issue CDP commands.
  const ws = new WebSocket(browser.wsEndpoint(), { perMessageDeflate: false })
  await new Promise(resolve => ws.once('open', resolve))
  console.log('WebSocket connected!')


  const Order = new deliverer.Order(ws, require('./classes/handler'))

  await Order.Send('Target.getTargets')
  const pageInfo = (await Order.getLastResult()).targetInfos.find(info => info.type == 'page')

  await Order.Send('Target.attachToTarget',
    {
      targetId: pageInfo.targetId,
      flatten: true,
    },
  )

  await Order.Send('Page.getFrameTree')
  const frameId = (await Order.getLastResult()).frameTree.frame.id

  await Order.Send('Page.navigate',
    {
      url: 'https://cn.bing.com',
      frameId: frameId,
    }
  )

  await Order.Send('Page.enable')

  // await Order.Send('DOM.enable')

  // await Order.Send('CSS.enable')

  // await Order.Send('DOM.getDocument')
  // const rootId = (await Order.getLastResult()).root.nodeId

  // await Order.Send('DOM.querySelector',
  //   {
  //     nodeId: rootId,
  //     selector: 'body',
  //   },
  // )
  // const bodyId = (await Order.getLastResult()).nodeId

  // await Order.Send('CSS.getComputedStyleForNode',
  //   {
  //     nodeId: bodyId,
  //   },
  // )
  // const styles = (await Order.getLastResult()).computedStyle
  // // for (let key in styles) {
  // //   console.log(styles[key])
  // // }

  // await Order.Send('Page.captureScreenshot')
  // const data = (await Order.getLastResult()).data
  // // fs.writeFile("./tmp/data.txt", data, function(err) {
  // //   err ? console.log(err) : console.log("File saved!")
  // // })
  // // fs.writeFile("./tmp/out.png", data, 'base64', function(err) {
  // //   err ? console.log(err) : console.log("Image saved!")
  // // })
})()
