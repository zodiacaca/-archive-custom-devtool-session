
const fs = require('fs');

const options = {
  persistent: true,
  recursive: true,
  encoding: 'utf8'
};
fs.watch('D:/DL/fdm', options, (eventType, filename) => {
  console.log(`event type is: ${eventType}`);
  if (filename) {
    console.log(`filename is: ${filename}`);
  } else {
    console.log('filename not provided');
  }
});

const readConfig = require('./methods/readConfig');
const config = readConfig(fs, __dirname + '/launch.json');

const WebSocket = require('ws');
const puppeteer = require('puppeteer');

const SEND = require('./methods/SEND');

(async() => {
  const launchOptions = {
    headless: false,
    executablePath: config.browser,
    defaultViewport: null,
    args: [
      '--disable-infobars',
      '--start-maximized',
    ]
  };
  const browser = await puppeteer.launch(launchOptions);

  // Create a websocket to issue CDP commands.
  const ws = new WebSocket(browser.wsEndpoint(), { perMessageDeflate: false });
  await new Promise(resolve => ws.once('open', resolve));
  console.log('WebSocket connected!');

  // Get list of all targets and find a "page" target.
  const targets = await SEND.async(
    ws,
    {
      id: 1,
      method: 'Target.getTargets',
    }
  );
  const tgt_page = targets.result.targetInfos.find(info => info.type == 'page');

  // Attach to the page target.
  const sessionId = (await SEND.async(
    ws,
    {
      id: 2,
      method: 'Target.attachToTarget',
      params: {
        targetId: tgt_page.targetId,
        flatten: true,
      },
    }
  )).result.sessionId;

  // Navigate the page using this session.
  await SEND.async(
    ws,
    {
      sessionId,
      id: 1,  // Note that IDs are independent between sessions.
      method: 'Page.navigate',
      params: {
        url: 'https://pptr.dev',
      },
    }
  );

  // let message = await SEND.async(
  //   ws,
  //   {
  //     id: 1,
  //     method: 'Browser.getWindowBounds',
  //     params: {
  //       windowId: 1,
  //     }
  //   }
  // );
  // console.log(message);

  message = await SEND.async(
    ws,
    {
      sessionId,
      id: 2,
      method: 'Page.captureSnapshot',
    }
  );
  console.log(message);
})();
