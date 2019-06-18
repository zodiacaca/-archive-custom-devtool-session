
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

const classes = require('./classes/classes');
const DomainCodes = new classes.DomainCodes();

const SEND = require('./methods/SEND');

const profile = {
  ws: undefined,
  sId: undefined
};
const results = new classes.Results();

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
  profile.ws = new WebSocket(browser.wsEndpoint(), { perMessageDeflate: false });
  await new Promise(resolve => profile.ws.once('open', resolve));
  console.log('WebSocket connected!');


  await expressSEND('Target.getTargets');
  const pageObj = results.getTargets[0].targetInfos.find(info => info.type == 'page');

  await expressSEND('Target.attachToTarget',
    {
      targetId: pageObj.targetId,
      flatten: true,
    },
  );
  profile.sId = results.attachToTarget[0].sessionId;
  console.log("sessionId:", profile.sId);

  await expressSEND('Page.navigate',
    {
      url: 'https://cn.bing.com',
    }
  );

  await expressSEND('DOM.enable');

  await expressSEND('CSS.enable');

  await expressSEND('DOM.getDocument');
  console.log(results.getDocument[0]);
})();

const expressSEND = async (method, options = null) => {
  const domain = divideMethodString(method).domain;
  const command = divideMethodString(method).command;
  const id = getIncrementalId(domain);
  const response = await SEND.async(
    profile.ws,
    {
      sessionId: profile.sId,
      id: id,
      method: method,
      params: options,
    }
  );

  return new Promise(resolve => {
    results.push(command, response.result);
    console.log('\x1b[35m', method + ':', '\x1b[0m', response);

    resolve(response);
  });
};

const divideMethodString = (method) => {
  const index = method.indexOf('.');

  return {
    domain: method.substring(0, index),
    command: method.substring(++index),
  };
};

const getIncrementalId = (domain) => {
  DomainCodes[domain]++;

  return DomainCodes[domain];
};
