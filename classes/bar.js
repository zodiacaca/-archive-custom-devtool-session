
const Catagory = require('./classes/catagory')
const Event = require('./classes/event')

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
  Bartender: class {
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

    async Order(method, options = null, retry = false) {
      const cmd = divideMethodString(method)
      const Catagory = this.addDomain(cmd.domain)
      const response = await Catagory.Accept(method, options)
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

    Wonder(method, count = null) {

    }

    static Idle(time) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, time)
      })
    }

    async GetReceipt() {
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

    PrintReceipt() {
      const rst = this.results[this.rHistoryCount - 1]
      console.log('\x1b[35m', 'Result:', '\x1b[0m', rst)
    }

    retryLastOrder() {

      return new Promise(resolve => {
        setTimeout(async () => {
          const response = await this.Order(this.rLastOrder.m, this.rLastOrder.o, true)
          resolve(response)
        }, 500)
      })
    }

    addDomain(dmn) {
      if (!this.domains.includes(dmn)) {
        this[dmn] = new Catagory(dmn, this.WebSocket, this.SessionID, this.domains.length)
        this.domains.push(dmn)
      }

      return this[dmn]
    }
  },
}
