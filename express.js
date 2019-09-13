
const fs = require('fs')

const readConfig = require('./methods/readConfig')
const config = readConfig(fs, __dirname + '/launch.json')


const express = require('express')
const app = express()

app.use(express.static(config.static, {index: config.html}))

app.listen(3000)
