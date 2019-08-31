
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
const Puppeteer = require('puppeteer')

const Bar = require('./classes/bar')

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
  const browser = await Puppeteer.launch(launchOptions)

  // Create a websocket to issue CDP commands.
  const ws = new WebSocket(browser.wsEndpoint(), { perMessageDeflate: false })
  await new Promise(resolve => ws.once('open', resolve))
  console.log('WebSocket connected!')


  const Customer = new Bar.Bartender(ws)

  await Customer.Order('Target.getTargets')
  const pageInfo = (await Customer.GetReceipt()).targetInfos.find(info => info.type == 'page')

  await Customer.Order('Target.attachToTarget',
    {
      targetId: pageInfo.targetId,
      flatten: true,
    },
  )
  Customer.SessionID = (await Customer.GetReceipt()).sessionId
  Customer.createEventListener()

  await Customer.Order('Page.getFrameTree')
  const frameId = (await Customer.GetReceipt()).frameTree.frame.id

  await Customer.Order('Page.enable')

  Customer.Wonder('Page.loadEventFired')

  await Customer.Order('Page.navigate',
    {
      url: 'https://cn.bing.com',
      frameId: frameId,
    }
  )

  // await Customer.Check('Page.loadEventFired')

  // await Customer.Order('DOM.enable')

  // await Customer.Order('CSS.enable')

  // await Customer.Order('DOM.getDocument')
  // const rootId = (await Customer.GetReceipt()).root.nodeId

  // await Customer.Order('DOM.querySelector',
  //   {
  //     nodeId: rootId,
  //     selector: 'body',
  //   },
  // )
  // const bodyId = (await Customer.GetReceipt()).nodeId

  // await Customer.Order('CSS.getComputedStyleForNode',
  //   {
  //     nodeId: bodyId,
  //   },
  // )
  // const styles = (await Customer.GetReceipt()).computedStyle
  // // for (let key in styles) {
  // //   console.log(styles[key])
  // // }

  // await Customer.Order('Page.captureScreenshot')
  // const data = (await Customer.GetReceipt()).data
  // // fs.writeFile("./tmp/data.txt", data, function(err) {
  // //   err ? console.log(err) : console.log("File saved!")
  // // })
  // // fs.writeFile("./tmp/out.png", data, 'base64', function(err) {
  // //   err ? console.log(err) : console.log("Image saved!")
  // // })
})()
