
const Catagory = require('./catagory')

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
      this.events = []
      this.subscriptions = []
      // retry relative
      this.rSuccessCount = 0
      this.rHistoryCount = 0
      this.rLastOrder = undefined
      this.rMaximumNumberOfAttempts = 5

      this.init()
    }

    init() {
      this.StartTime = Date.now()
      this.createEventListener()
    }

    createEventListener() {
      this.WebSocket.on('message', (text) => {
        const event = JSON.parse(text)
        if (this.subscriptions.includes(event.method)) {
          this.events.push(event)
          console.log(event)
          const delta = (Date.now() - this.StartTime) / 1000
          console.log(`@${delta}s`)
        }
      })
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

    Wonder(method) {
      this.subscriptions.push(method)
    }

    Check(method) {
      return new Promise(resolve => {
        let count = 0
        const timer = setInterval(() => {
          for (let i = this.events.length - 1; i >= count; i--) {
            if (this.events[i].method == method && !this.events[i].checked) {
              const idx = this.subscriptions.slice().reverse().indexOf(method)
              if (idx >= 0) {
                this.subscriptions.splice(idx, 1)

                clearInterval(timer)
                this.events[i].checked = true
                this.clearOldEvents(method)
                resolve(this.events[i].params.timestamp)
                break
              }
            }
          }
          count = this.events.length
        }, 50)
      })
    }

    static Idle(time) {
      return new Promise(resolve => {
        console.log(`[Idling...`)
        setTimeout(() => {
          console.log(`...${time} milliseconds passed.]`)
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

    clearOldEvents(method) {
      for (let i = this.events.length - 1; i >= 0; i--) {
        if (this.events[i].method == method && !this.events[i].checked) {
          this.events[i].checked = true
        }
      }
    }
  },
}
