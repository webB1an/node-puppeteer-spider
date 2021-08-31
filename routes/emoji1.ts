import express, { Router, Request, Response } from 'express'
import spider from '../util/spider'

import { sleep, saveSimpleImage } from '../util'

const router: Router = express.Router()

router.get('/spider/:search/:page', async(req: Request, res: Response): Promise<Response> => {
  // search http://localhost:3000/emoji1/spider/可爱/1
  // hot https://biaoqing233.com/hot/1

  const URL = req.params.search === 'hot' ? 'https://biaoqing233.com/hot' : `https://biaoqing233.com/search/${req.params.search}/${req.params.page}`
  const SELECTOR = '#__layout > div > div.layout.row-between.app-container > div.app-main > div > div > div.row > .col'

  const [browser, page] = await spider()

  await page.goto(URL, {
    waitUntil: 'networkidle0'
  })

  await page.waitForSelector(SELECTOR)

  const Images: string[] = await page.$$eval(SELECTOR, element => {
    return element.map(ele => ele.querySelector('a > img')?.getAttribute('src') || '')
  })

  console.log('---------------images---------------', Images)

  let i = 19
  for (const src of Images) {
    i++
    if (i < 40 && i >= 18) {
      await sleep({ type: 'random', delay: 10, min: 1 })
      await saveSimpleImage(`https:${src}`)
    }
  }
  console.log('---------------download over---------------')

  await page.close()
  await browser.close()

  return res.send('over')
})

export default router
