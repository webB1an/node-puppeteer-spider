import express, { Router, Request, Response } from 'express'
import spider from '../util/spider'
import { sleep, saveSimpleImage } from '../util'

const router: Router = express.Router()

router.get('/spider/:page', async(req: Request, res: Response): Promise<Response> => {
  // curl http://localhost:3000/avatar/spider/1
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

  for (const src of Images) {
    await sleep({ type: 'random', delay: 10, min: 0 })
    await saveSimpleImage(`${src}`, 'images/cp-avatar')
  }

  console.log('---------------images---------------', Images, `已经下载${Images.length}条数据`)

  console.log('---------------finish---------------')

  await page.close()
  await browser.close()
  return res.send('over')
})

export default router
