
const fs = require('fs')

const readConfig = require('./methods/readConfig')
const config = readConfig(fs, __dirname + '/launch.json')

const puppeteer = require('puppeteer')

const { URL } = require('url')
const fse = require('fs-extra')
const Path = require('path')

;(async () => {
  const launchOptions = {
    headless: false,
    executablePath: config.browser,
    defaultViewport: null,
    args: [
      '--disable-infobars',
      '--start-maximized',
      '--lang=en-US,en',
    ]
  }
  const browser = await puppeteer.launch(launchOptions)
  const address = 'https://store.steampowered.com/grandprix'
  const page = await browser.newPage()

  const checkResolvable = (path) => {
    const urlArray = address.split('/')
    const page = urlArray[urlArray.length - 1]

    const ext = Path.extname(path)
    const pathArray = path.split('/')
    const length = pathArray.length
    // for (let i = 1; i < length; i++) {
    //   if (pathArray[i].length > 128) {
    //     return false
    //   }
    // }

    if (path.indexOf(';base64') >= 0) {
      console.log('Ignore raw data')

      // return 'base64'
      return false
    } else if (pathArray[length - 1] == '' || pathArray[length - 1] == page) {
      console.log('index')

      return 'index'
    } else if (ext) {
      console.log(ext)

      return ext
    } else {
      console.log('Unknown file type')

      // return false
      return true
    }
  }

  page.on('response', async (response) => {
    const status = response.status()
    if (status >= 300 && status <= 399) {
      console.log('Ignore redirection to', response.headers().location)
    } else {
      const url = new URL(response.url())
      const path = url.pathname
      let out = './tmp/static' + path
      const resolvable = checkResolvable(path)
      if (resolvable) {
        const buffer = await response.buffer()
        if (resolvable == 'index') {
          out += 'index.html'
        }
        if (typeof resolvable == 'string' && (resolvable == 'index' || resolvable.indexOf('html') >= 0 || resolvable.indexOf('css') >= 0 || resolvable.indexOf('js') >= 0)) {
          const text = buffer.toString('utf8')
          const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}/g
          const replaced = text.replace(regex, 'http://127.0.0.1:3000')

          fse.outputFile(out, replaced)
        } else {
          fse.outputFile(out, buffer)
        }
      }
    }
  })

  await page.goto(address, {
    // waitUntil: 'load'
  })
})()
