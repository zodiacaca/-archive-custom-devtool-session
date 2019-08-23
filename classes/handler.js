
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
  sync: function(ws, command) {
    ws.on('message', function(text) {
      const response = JSON.parse(text)
      if (response.method === command.method) {
        console.log(response)
      }
      // if (response.id === command.id) {
      //   ws.removeListener('message', arguments.callee)
      // }
    })
  }
}
