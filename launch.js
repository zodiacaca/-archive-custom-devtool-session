
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


  let getTargets = {
    method: 'Target.getTargets',
    params: null,
  };
  getTargets = await expressSEND(...Object.values(getTargets));
  const pageObj = getTargets.result.targetInfos.find(info => info.type == 'page');

  let attachToTarget = {
    method: 'Target.attachToTarget',
    params: {
      targetId: pageObj.targetId,
      flatten: true,
    },
  };
  attachToTarget = await expressSEND(...Object.values(attachToTarget));
  profile.sId = attachToTarget.result.sessionId;
  console.log("sessionId:", profile.sId);

  let navigate = {
    method: 'Page.navigate',
    params: {
      url: 'https://cn.bing.com',
    },
  };
  await expressSEND(...Object.values(navigate));

  let enableDOMAgent = {
    method: 'DOM.enable',
    params: null,
  };
  await expressSEND(...Object.values(enableDOMAgent));

  let enableCSSAgent = {
    method: 'CSS.enable',
    params: null,
  };
  await expressSEND(...Object.values(enableCSSAgent));

  let getDocument = {
    method: 'DOM.getDocument',
    params: null,
  };
  getDocument = await expressSEND(...Object.values(getDocument));
  const nId = getDocument.result.root.nodeId;
})();

const expressSEND = async (method, options = null) => {
  const domain = getDomainName(method);
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
    console.log('\x1b[35m', method + ':', '\x1b[0m', response);

    resolve(response);
  });
};

const getDomainName = (method) => {
  const index = method.indexOf('.');

  return method.substring(0, index);
};

const getIncrementalId = (domain) => {
  DomainCodes[domain]++;

  return DomainCodes[domain];
};
