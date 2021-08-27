import puppeteer from 'puppeteer'
import faker from 'faker'

export default async function spider(): Promise<[puppeteer.Browser, puppeteer.Page]> {
  // 浏览器实例化
  const browser: puppeteer.Browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=1920,1080'],
    defaultViewport: null
  })
  // 页面实例化
  const page: puppeteer.Page = await browser.newPage()
  // 设置虚假user-agent
  await page.setUserAgent(faker.internet.userAgent())
  // 绑定 console
  await page.on('console', consoleObj => {
    console.log(consoleObj.text())
  })

  return [browser, page]
}
