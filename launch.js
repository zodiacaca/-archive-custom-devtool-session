
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

const idPrefix = {
  Target: 100,
  Page: 200,
  DOM: 300,
  CSS: 400,
};

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

  // Get list of all targets and find a "page" target.
  const getTargetsOptions = {
    method: 'Target.getTargets',
    params: null,
  };
  const getTargets = await expressSEND(...Object.values(getTargetsOptions));
  const tgt_page = getTargets.result.targetInfos.find(info => info.type == 'page');

  // Attach to the page target.
  const attachToTargetOptions = {
    method: 'Target.attachToTarget',
    params: {
      targetId: tgt_page.targetId,
      flatten: true,
    },
  };
  const result_attach = await expressSEND(...Object.values(attachToTargetOptions));
  profile.sId = result_attach.sessionId;
  console.log("sessionId:", profile.sId);

  // Navigate the page using this session.
  const navigateOptions = {
    method: 'Page.navigate',
    params: {
      url: 'https://cn.bing.com',
    },
  };
  await expressSEND(...Object.values(navigateOptions));

  const enableDOMOptions = {
    method: 'DOM.enable',
    params: null,
    state: "DOM agent enabled:",
  };
  await expressSEND(...Object.values(enableDOMOptions));

  const enableCSSOptions = {
    method: 'CSS.enable',
    params: null,
    state: "CSS agent enabled:",
  };
  await expressSEND(...Object.values(enableCSSOptions));

  const getDocumentOptions = {
    method: 'DOM.getDocument',
    params: null,
    state: "Document:",
  };
  await expressSEND(...Object.values(getDocumentOptions));
})();

const expressSEND = async (method, options = null, state = null) => {
  const domain = getDomainName(method);
  const sessionId = profile.sId;
  const id = getIncrementalId(domain);
  const result = await SEND.async(
    profile.ws,
    {
      sessionId,
      id: id,
      method: method,
      params: options,
    }
  );

  return new Promise(resolve => {
    if (state) {
      console.log(state, result);
    }

    resolve(result);
  });
};

const getDomainName = (method) => {
  const index = method.indexOf('.');

  return method.substring(0, index);
};

const getIncrementalId = (domain) => {
  idPrefix[domain]++;

  return idPrefix[domain];
};
