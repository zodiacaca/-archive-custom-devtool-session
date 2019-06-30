
const fs = require('fs');

// const options = {
//   persistent: true,
//   recursive: true,
//   encoding: 'utf8'
// };
// fs.watch('D:/DL/fdm', options, (eventType, filename) => {
//   console.log(`event type is: ${eventType}`);
//   if (filename) {
//     console.log(`filename is: ${filename}`);
//   } else {
//     console.log('filename not provided');
//   }
// });

const readConfig = require('./methods/readConfig');
const config = readConfig(fs, __dirname + '/launch.json');

const WebSocket = require('ws');
const puppeteer = require('puppeteer');

const handler = require('./classes/handler');


(async () => {
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


  const Order = new handler.Order(ws, require('./methods/SEND'));

  await Order.Send('Target.getTargets');
  const pageInfo = (await Order.getlastResult()).targetInfos.find(info => info.type == 'page');

  await Order.Send('Target.attachToTarget',
    {
      targetId: pageInfo.targetId,
      flatten: true,
    },
  );
  Order.SessionID = (await Order.getlastResult()).sessionId;

  await Order.Send('Page.navigate',
    {
      url: 'https://cn.bing.com',
    }
  );

  await Order.Send('DOM.enable');

  await Order.Send('CSS.enable');

  await Order.Send('DOM.getDocument');
  const rootId = (await Order.getlastResult()).root.nodeId;

  await Order.Send('DOM.querySelector',
    {
      nodeId: rootId,
      selector: 'body',
    },
  );
  const bodyId = (await Order.getlastResult()).nodeId;

  await Order.Send('CSS.getComputedStyleForNode',
    {
      nodeId: bodyId,
    },
  );
  const styles = (await Order.getlastResult()).computedStyle;
  // for (let key in styles) {
  //   console.log(styles[key]);
  // }

  await Order.Send('Page.captureScreenshot', null, true);
  const data = (await Order.getlastResult()).data;
  // fs.writeFile("./tmp/data.txt", data, function(err) {
  //   err ? console.log(err) : console.log("File saved!");
  // });
  // fs.writeFile("./tmp/out.png", data, 'base64', function(err) {
  //   err ? console.log(err) : console.log("Image saved!");
  // });
})();
