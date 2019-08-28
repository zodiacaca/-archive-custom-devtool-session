
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
  count--
  const self = arguments.callee

  ws.on('message', function(text) {
    const response = JSON.parse(text)
    if (response.method === command.method) {
      console.log(response)
      ws.removeListener('message', arguments.callee)
      if (dispatch > 0) {
        self(ws, command, dispatch)
      } else if (dispatch < 0) {
        self(ws, command, 0)
      }
    }
  })
}
