
module.exports = {
  async: function(ws, command) {
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
  },
  sync: function(ws, command, dispatch) {
    dispatch--
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
}
