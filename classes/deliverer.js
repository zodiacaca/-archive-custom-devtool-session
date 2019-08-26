
const divideMethodString = (method) => {
  const index = method.indexOf('.')

  return {
    domain: method.substring(0, index),
    command: method.substring(index + 1),
  }
}

const stampResult = (rst, stp) => {
  rst.stamp = stp

  return rst
}

module.exports = {
  Order: class {
    constructor(ws) {
      this.WebSocket = ws
      this.SessionID = undefined
      this.domains = []
      this.results = []
      // retry relative
      this.rSuccessCount = 0
      this.rHistoryCount = 0
      this.rLastOrder = undefined
      this.rMaximumNumberOfAttempts = 5
    }

    async Send(method, options = null, retry = false) {
      const cmd = divideMethodString(method)
      this.addDomain(cmd.domain)
      const response = await this[cmd.domain].Accept(method, options)
      return new Promise(resolve => {
        if (!response.code && response.result) {
          const stamp = {
            method: method,
          }
          const result = stampResult(response.result, stamp)
          this.results.push(result)
          this.rSuccessCount++
        } else {
          console.log('\x1b[35m', `${method}:`, '\x1b[0m', response)
          if (retry) {
            console.log('\x1b[31m', "Bad! Retry again!", '\x1b[0m')
          } else {
            console.log('\x1b[31m', "Bad!", '\x1b[0m')
          }
        }
        if (!retry) {
          this.rHistoryCount++
        }
        this.rLastOrder = cmd

        resolve(response)
      })
    }

    Report(method, dispatch = 0) {
      this.Handler.sync(
        this.WebSocket,
        {
          sessionId: this.SessionID,
          method: method,
        },
        dispatch,
      )
    }

    static Idle(time) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, time)
      })
    }

    async getLastResult() {
      let result = this.results[this.rHistoryCount - 1]

      if (!result) {
        for (let i = 0; i < this.rMaximumNumberOfAttempts; i++) {
          const response = await this.retryLastOrder()
          if (!response.code && response.result) {
            result = this.results[this.rHistoryCount - 1]
            break
          } else {
            console.error(response)
          }
        }
      }

      if (result) {
        return new Promise(resolve => {
          const rst = this.rSuccessCount > 0 ? result : null
          resolve(rst)
        })
      }
    }

    printLastResult() {
      const rst = this.results[this.rHistoryCount - 1]
      console.log('\x1b[35m', 'Result:', '\x1b[0m', rst)
    }

    retryLastOrder() {

      return new Promise(resolve => {
        setTimeout(async () => {
          const response = await this.Send(this.rLastOrder.m, this.rLastOrder.o, true)
          resolve(response)
        }, 500)
      })
    }

    addDomain(dmn) {
      if (!this.domains.includes(dmn)) {
        this[dmn] = new Cocktail(dmn, this.WebSocket, this.SessionID, this.domains.length)
        this.domains.push(dmn)
      }
    }
  },
}

class Cocktail {
  constructor(dmn, ws, sID, len) {
    this.Domain = dmn
    this.WebSocket = ws
    this.SessionID = sID
    this.Shaker = require('./handler')
    this.currentID = 10000 * ++len
  }

  async Accept(method, options) {
    const response = await this.Shaker.async(
      this.WebSocket,
      {
        sessionId: this.SessionID,
        id: ++this.currentID,
        method: method,
        params: options,
      }
    )

    return new Promise(resolve => {
      resolve(response)
    })
  }
}
