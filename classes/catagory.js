
module.exports = class {
  constructor(dmn, ws, sID, len) {
    this.Domain = dmn
    this.WebSocket = ws
    this.SessionID = sID
    this.currentID = 10000 * ++len
  }

  async Accept(method, options) {
    const response = await mix(
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

const mix = (ws, command) => {
  ws.send(JSON.stringify(command))

  return new Promise(resolve => {
    ws.on('message', function(text) {
      const response = JSON.parse(text)
      if (response.id === command.id) {
        ws.removeListener('message', arguments.callee)
        resolve(response)
      }
    })
  })
}
