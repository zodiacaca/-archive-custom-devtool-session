
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

module.exports = {
  Order: class {
    constructor(ws, helper) {
      this.WebSocket = ws;
      this.SEND = helper;
      this.results = [];
      this.SessionID = undefined;
      // retry relative
      this.rSuccessCount = 0;
      this.rHistoryCount = 0;
      this.rLastOrder = undefined;
      this.rMaximumNumberOfAttempts = 5;
    }

    async Send(method, options = null, silence = false, retry = false) {
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
        if (!response.code && response.result) {
          this.results.push(response);
          this.rSuccessCount++;
        } else {
          if (retry) {
            console.log('\x1b[31m', "Bad! Retry again!", '\x1b[0m');
          } else {
            console.log('\x1b[31m', "Bad!", '\x1b[0m');
          }
        }
        if (!retry) {
          this.rHistoryCount++;
        }
        this.rLastOrder = { m: method, o: options };
        if (!silence) {
          console.log('\x1b[35m', method + ':', '\x1b[0m', response);
        }

        resolve(response);
      });
    }

    async getlastResult() {
      let result = this.results[this.rHistoryCount - 1];

      if (!result) {
        for (let i = 0; i < this.rMaximumNumberOfAttempts; i++) {
          const response = await this.retryLastOrder();
          if (!response.code && response.result) {
            result = this.results[this.rHistoryCount - 1];
            break;
          } else {
            console.error(response);
          }
        }
      }

      if (result) {
        return new Promise(resolve => {
          const result = this.rSuccessCount > 0 ? result : null;
          resolve(result);
        });
      }
    }

    retryLastOrder() {

      return new Promise(resolve => {
        setTimeout(async () => {
          const response = await this.Send(this.rLastOrder.m, this.rLastOrder.o, true, true);
          resolve(response);
        }, 500);
      });
    }
  },
}
