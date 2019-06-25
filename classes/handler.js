
const maps = require('./_WeakMap');
const DomainCodes = new maps.DomainCodes();


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

const bindResult = (result, method) => {
  result.method = method;

  return result;
};

module.exports = {
  Order: class {
    constructor(ws, helper) {
      this.WebSocket = ws;
      this.SEND = helper;
      this.results = [];
      this.SessionID = undefined;
    }

    async Send(method, options = null, silence) {
      const domain = divideMethodString(method).domain;
      const command = divideMethodString(method).command;
      const id = getIncrementalId(domain);
      const response = await this.SEND.async(
        this.WebSocket,
        {
          sessionId: this.SessionID,
          id: id,
          method: method,
          params: options,
        }
      );

      return new Promise(resolve => {
        let result;
        try {
          result = bindResult(response.result, method);
        }
        catch (e) {
          console.error('\x1b[31m', "Bad!");
        }
        this.results.push(result);
        if (!silence) {
          console.log('\x1b[35m', method + ':', '\x1b[0m', response);
        }

        resolve(response);
      });
    }

    get lastResult() {
      const len = this.results.length;
      const rst = this.results[len - 1];

      return len > 0 ? rst : null;
    }
  },
}
