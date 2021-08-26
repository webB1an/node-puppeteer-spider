import express from 'express'
import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import rq from 'request-promise'
import sanitize from 'sanitize-filename'
import faker from 'faker'

import { extension, sleep } from '../util'
import { Image } from '../interface/emoji'

const router: express.Router = express.Router()

router.get('/spider', async(req: express.Request, res: express.Response) => {
  const URL = 'https://www.dbbqb.com'
  const IMAGE_BASE_URL = `https://image.dbbqb.com/`
  const RESPONSE_URL = `${URL}/api/search/json?size=100`

  const browser: puppeteer.Browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=1920,1080'],
    defaultViewport: null
  })

  const page: puppeteer.Page = await browser.newPage()
  await page.setUserAgent(faker.internet.userAgent())

  // 绑定 console
  page.on('console', consoleObj => {
    console.log(consoleObj.text())
  })

  await page.on('response', async response => {
    if (response.url().startsWith(RESPONSE_URL)) {
      if (response.ok()) {
        const json: Image[] = await response.json()
        console.log('---------------Images---------------', json)
        let i = 0
        for (const item of json) {
          i++
          if (i < 20) {
            await sleep(20)
            await saveImage(`${IMAGE_BASE_URL}${item.path}`)
          }
        }
        console.log('---------------download over---------------')
      }
    }
  })

  await page.goto(URL, {
    waitUntil: 'networkidle2'
  })

  await page.close()
  await browser.close()

  res.send('over')
})

async function saveImage(url: string) {
  const dest = join(__dirname, '../', 'images')

  const response = await rq({ url, resolveWithFullResponse: true, encoding: null })

  let fileName = join(dest, sanitize(basename(url)))

  if (!extname(fileName)) {
    const contentType = response.headers['content-type'] || ''
    const ext = extension(contentType)
    if (ext) {
      fileName += `.${ext}`
      try {
        writeFileSync(fileName, response.body)
        console.log('---------------fileName---------------', fileName)
      } catch (error) {
        console.log('---------------error---------------', error)
      }
    } else {
      console.error('Cannot detect file extension!')
    }
  }
  return true
}

export default router
