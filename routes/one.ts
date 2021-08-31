import express, { Router, Request, Response } from 'express'
import spider from '../util/spider'

const router: Router = express.Router()

router.get('/spider', async(req: Request, res: Response): Promise<Response> => {
  const url = 'http://wufazhuce.com/'
  const selector = '#carousel-one > div > div.item.active'

  const [browser, page] = await spider()

  await page.goto(url)

  // 等待页面元素加载完成
  await page.waitForSelector(selector)

  const one = await page.$eval(selector, element => {
    return {
      image: (element.querySelector('a > img') as Element).getAttribute('src') || '',
      text: (element.querySelector('div.fp-one-cita-wrapper > div.fp-one-cita > a') as Element).innerHTML
    }
  })

  await page.close()
  await browser.close()

  console.log('---------------one---------------', one)

  return res.json(one)
})

export default router
