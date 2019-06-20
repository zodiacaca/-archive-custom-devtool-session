
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

const classes = require('./classes/classes');
const DomainCodes = new classes.DomainCodes();


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


  Order.SEND = require('./methods/SEND');

  await Order.send('Target.getTargets');
  const pageObj = Order.lastResult.targetInfos.find(info => info.type == 'page');

  await Order.send('Target.attachToTarget',
    {
      targetId: pageObj.targetId,
      flatten: true,
    },
  );
  Order.sessionId = Order.lastResult.sessionId;

  await Order.send('Page.navigate',
    {
      url: 'https://cn.bing.com',
    }
  );

  await Order.send('DOM.enable');

  await Order.send('CSS.enable');

  await Order.send('DOM.getDocument');
  const rootId = Order.lastResult.root.nodeId;

  await Order.send('DOM.querySelector',
    {
      nodeId: rootId,
      selector: 'body',
    },
  );
  const bodyId = Order.lastResult.nodeId;

  await Order.send('CSS.getComputedStyleForNode',
    {
      nodeId: bodyId,
    },
  );
  const styles = Order.lastResult.computedStyle;
  // for (let key in styles) {
  //   console.log(styles[key]);
  // }

  await Order.send('Page.captureScreenshot', null, true);
  const data = Order.lastResult.data;
  // fs.writeFile("./tmp/data.txt", data, function(err) {
  //   err ? console.log(err) : console.log("File saved!");
  // });
  // fs.writeFile("./tmp/out.png", data, 'base64', function(err) {
  //   err ? console.log(err) : console.log("Image saved!");
  // });
})();

const Order = {
  send: async (method, options = null, silence) => {
    const domain = divideMethodString(method).domain;
    const command = divideMethodString(method).command;
    const id = getIncrementalId(domain);
    const response = await this.SEND.async(
      profile.ws,
      {
        sessionId: this.sessionId,
        id: id,
        method: method,
        params: options,
      }
    );

    return new Promise(resolve => {
      const result = envelopResult(response.result, method);
      this.results.push(result);
      if (!silence) {
      console.log('\x1b[35m', method + ':', '\x1b[0m', response);
      }

      resolve(response);
    });
  },

  results: [],

  get lastResult() {
    const len = this.results.length;
    const rst = this.results[len - 1];

    return len > 0 ? rst : null;
  },
};

const divideMethodString = (method) => {
  const index = method.indexOf('.');

  return {
    domain: method.substring(0, index),
    command: method.substring(index + 1),
  };
};

const getIncrementalId = (domain) => {
  DomainCodes[domain]++;

  return DomainCodes[domain];
};

const envelopResult = (result, method) => {
  result.method = method;

  return result;
};
