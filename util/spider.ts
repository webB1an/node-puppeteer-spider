import puppeteer from 'puppeteer'
import faker from 'faker'

/**
 * puppeteer
 * @export
 * @returns {Promise<[puppeteer.Browser, puppeteer.Page]>}
 */
export default async function spider(): Promise<[puppeteer.Browser, puppeteer.Page]> {
  // 浏览器实例化
  const browser: puppeteer.Browser = await puppeteer.launch({
    headless: true,
    // args: [],
    defaultViewport: null,
    slowMo: 500,
    ignoreHTTPSErrors: true,
    args: [
      '--window-size=1920,1080',
      '--disable-gpu', // GPU硬件加速
      '--disable-dev-shm-usage', // 创建临时文件共享内存
      '--disable-setuid-sandbox', // uid沙盒
      '--no-first-run', // 没有设置首页。在启动的时候，就会打开一个空白页面。
      '--no-sandbox', // 沙盒模式
      '--no-zygote',
      '--single-process' // 单进程运行
    ]
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
