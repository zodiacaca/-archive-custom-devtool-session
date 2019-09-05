
const fs = require('fs')

const readConfig = require('./methods/readConfig')
const config = readConfig(fs, __dirname + '/launch.json')

const WebSocket = require('ws')
const Puppeteer = require('puppeteer')

const Path = require('path')
const chokidar = require('chokidar');

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

  /* ------------------------------
    after WebSocket connected
  ------------------------------ */
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

  /* ------------------------------
    after Customer got SessionID
  ------------------------------ */
  await Customer.Order('Page.getFrameTree')
  const frameId = (await Customer.GetReceipt()).frameTree.frame.id

  await Customer.Order('Page.enable')

  Customer.Wonder('Page.loadEventFired')

  await Customer.Order('Page.navigate',
    {
      url: 'https://cn.bing.com',
      // url: 'https://store.steampowered.com',
      frameId: frameId,
    }
  )

  await Customer.Check('Page.loadEventFired')

  Customer.Wonder('Page.loadEventFired')

  /* ------------------------------
    start watcher
  ------------------------------ */
  const watcher = chokidar.watch(config.static, {
    ignored: /(^|[\/\\])\../,
    persistent: true
  })

  watcher.on('change', async (path) => {
    const ext = Path.extname(path)
    if (ext === '.html') {
      const html = await fs.promises.readFile(`${config.static}/${config.html}`,
        { encoding: 'utf8' }
      )

      await Customer.Order('Page.setDocumentContent',
        {
          frameId: frameId,
          html: html,
        }
      )
    } else {

    }
  })

  // await Customer.Order('Page.reload',
  //   {
  //     ignoreCache: true,
  //   },
  // )
})()
