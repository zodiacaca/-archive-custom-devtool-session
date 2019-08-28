
module.exports = class {
  constructor(ws, sID) {
    this.WebSocket = ws
    this.SessionID = sID
  }

  async Accept(method, count) {
    const response = await _Accept(
      this.WebSocket,
      {
        sessionId: this.SessionID,
        method: method,
      },
      count,
    )

    return new Promise(resolve => {
      resolve(response)
    })
  }
}

const _Accept = (ws, command, count) => {
  if (count) {
    count--
  }
  const self = arguments.callee

  ws.on('message', function(text) {
    const response = JSON.parse(text)
    if (response.method === command.method) {
      console.log(response)
      ws.removeListener('message', arguments.callee)
      if (count && count > 0) {
        self(ws, command, count)
      } else if (count && count < 0) {
        self(ws, command, 0)
      }
    }
  })
}
