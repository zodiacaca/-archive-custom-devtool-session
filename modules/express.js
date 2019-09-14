
const config = {
  static: process.argv[2],
  html: process.argv[3],
}

const express = require('express')
const app = express()

app.use(express.static(config.static, {index: config.html}))

app.listen(3000)
