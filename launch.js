
const fs = require('fs')

const readConfig = require('./methods/readConfig')
const config = readConfig(fs, __dirname + '/launch.json')

const puppeteer = require('puppeteer')

const { URL } = require('url')


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
  const address = 'http://127.0.0.1:3000'
  const page = (await browser.pages())[0]

  await page.setRequestInterception(true)
  page.on('request', interceptedRequest => {
    const url = new URL(interceptedRequest.url())
    console.log(url.hostname)
    if (url.hostname == '127.0.0.1') {
      interceptedRequest.continue()
    } else {
      interceptedRequest.abort()
    }
  })

  await page.goto(address, {
    // waitUntil: 'load'
  })
})()