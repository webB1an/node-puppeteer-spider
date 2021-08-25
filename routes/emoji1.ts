import express from 'express'
import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'
import { basename, join } from 'path'
import rq from 'request-promise'
import sanitize from 'sanitize-filename'
import faker from 'faker'

import { sleep } from '../util'

const router: express.Router = express.Router()

router.get('/spider', async(req: express.Request, res: express.Response) => {
  const URL = 'https://biaoqing233.com/hot'
  const Selector = '#__layout > div > div.layout.row-between.app-container > div.app-main > div > div > div.row > .col'

  const browser: puppeteer.Browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=1920,1080'],
    defaultViewport: null
  })

  const page: puppeteer.Page = await browser.newPage()
  await page.setUserAgent(faker.internet.userAgent())

  // 绑定 console
  await page.on('console', consoleObj => {
    console.log(consoleObj.text())
  })

  await page.goto(URL, {
    waitUntil: 'networkidle2'
  })

  await page.waitForSelector(Selector)

  const Images: string[] = await page.$$eval(Selector, element => {
    return element.map(ele => ele.querySelector('a > img')?.getAttribute('src') || '')
  })

  console.log('---------------images---------------', Images)

  let i = 0
  for (const src of Images) {
    i++
    if (i < 20) {
      await sleep()
      await saveImage(`https:${src}`)
    }
  }

  await page.close()
  await browser.close()

  res.send('over')
})

async function saveImage(url: string): Promise<boolean> {
  const destination = join(__dirname, '../', 'images')
  const response = await rq({ url, resolveWithFullResponse: true, encoding: null })
  const fileName = join(destination, sanitize(basename(url)))
  try {
    writeFileSync(fileName, response.body)
  } catch (error) {
    console.log('---------------error---------------', error)
  }
  console.log('---------------fileName---------------', fileName)
  return true
}

export default router
