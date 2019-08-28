
module.exports = class {
  constructor(ws, sID) {
    this.WebSocket = ws
    this.SessionID = sID
  }

  Accept(method, count) {
    _Accept(
      this.WebSocket,
      {
        sessionId: this.SessionID,
        method: method,
      },
      count,
    )
  }
}

const _Accept = function(ws, command, count) {
  const self = arguments.callee
  if (count) {
    count--
  }

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
