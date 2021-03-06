import express, { Router, Request, Response } from 'express'
import { writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import rq from 'request-promise'
import sanitize from 'sanitize-filename'

import { extension, sleep } from '../util'
import spider from '../util/spider'
import { Image } from '../interface/emoji'

const router: Router = express.Router()

// curl http://localhost:3000/emoji/spider
router.get('/spider', async(req: Request, res: Response): Promise<Response> => {
  const URL = 'https://www.dbbqb.com'
  const IMAGE_BASE_URL = `https://image.dbbqb.com/`
  const RESPONSE_URL = `${URL}/api/search/json?size=100`

  const [browser, page] = await spider()

  page.on('response', async response => {
    if (response.url().startsWith(RESPONSE_URL)) {
      if (response.ok()) {
        const json: Image[] = await response.json()
        console.log('---------------Images---------------', json)
        let i = 0
        for (const item of json) {
          if (i < 20) {
            await sleep({ type: 'random', delay: 20, min: 1 })
            await saveImage(`${IMAGE_BASE_URL}${item.path}`)
          }
          i++
        }
        console.log('---------------download over---------------')
      }
    }
  })

  await page.goto(URL, {
    waitUntil: 'networkidle0'
  })

  await page.close()
  await browser.close()

  return res.send('over')
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
