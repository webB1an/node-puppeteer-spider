import express from 'express'
import puppeteer from 'puppeteer'

const router: express.Router = express.Router()

router.get('/spider', async(req: express.Request, res: express.Response) => {
  const url = 'http://wufazhuce.com/'
  const selector = '#carousel-one > div > div.item.active'

  // 浏览器实例化
  const browser: puppeteer.Browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=1920,1080'],
    defaultViewport: null
  })
  // 页面实例化
  const page: puppeteer.Page = await browser.newPage()

  await page.goto(url)

  // 绑定 console
  await page.on('console', consoleObj => {
    console.log(consoleObj.text())
  })

  // 等待页面元素加载完成
  await page.waitForSelector(selector)

  const one = await page.$eval(selector, element => {
    return {
      image: (element.querySelector('a > img') as Element).getAttribute('src'),
      text: (element.querySelector('div.fp-one-cita-wrapper > div.fp-one-cita > a') as Element).innerHTML
    }
  })

  await browser.close()

  console.log('---------------one---------------', one)

  res.json(one)
})

export default router
