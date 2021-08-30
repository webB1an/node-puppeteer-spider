import express from 'express'
import spider from '../util/spider'
import { sleep, saveSimpleImage } from '../util'

const router: express.Router = express.Router()

router.get('/spider/:page', async(req: express.Request, res: express.Response) => {
  // curl http://localhost:3000/avatar/spider/1 limit 0-10
  const CURRENT = req.params.page
  const URL = `https://www.duitang.com/album/?id=68874303#!albumpics-p${CURRENT}`
  const SELECTOR = `#woo-holder > div.woo-swb.woo-cur > div:nth-child(2)>.woo`

  const [browser, page] = await spider()

  await page.goto(URL, {
    waitUntil: 'networkidle0'
  })

  await sleep({ type: 'interval', delay: 5 })

  const Images: string[] = await page.$$eval(SELECTOR, element => {
    return element.map(ele => ele.querySelector('div > div.mbpho > a > img')?.getAttribute('src') || '')
  })

  let i = 1
  for (const src of Images) {
    if (i <= 10) {
      await sleep({ type: 'random', delay: 10, min: 0 })
      await saveSimpleImage(`${src}`, 'images/cp-avatar')
    }
    i++
  }

  console.log('---------------images---------------', Images, Images.length)

  await sleep({ type: 'interval', delay: 5 })

  await page.close()
  await browser.close()
  res.send('over')
})

export default router
