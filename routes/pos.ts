import express from 'express'
import spider from '../util/spider'
import { writeFileSync } from 'fs'
import { join } from 'path'

import { sleep } from '../util'
import { ElementHandle } from 'puppeteer'

const router: express.Router = express.Router()

router.get('/spider', async(req: express.Request, res: express.Response) => {
  const url = 'http://yunpos.uat.dusto-yc.com/#/dashboard'
  const username = '#app > div > form > div:nth-child(2) > div > div > input'
  const password = '#app > div > form > div:nth-child(3) > div > div > input'
  const login = '#app > div > form > button.el-button.el-button--primary.el-button--medium'
  const shop = '#app > div > div.el-dialog__wrapper.stores-dialog > div > div.el-dialog__footer > div > button.el-button.el-button--primary.el-button--medium > span'
  const menu = '#app > div > div.sidebar-container.el-scrollbar > div.scrollbar-wrapper.el-scrollbar__wrap > div > ul > div:nth-child(4) > li > div'
  const subMenu = '#app > div > div.sidebar-container.el-scrollbar > div.scrollbar-wrapper.el-scrollbar__wrap > div > ul > div:nth-child(4) > li > ul > a:nth-child(2)'
  const search = '#pane-local > div > form:nth-child(2) > div > div > div > div > div.el-col.el-col-24.el-col-md-10 > div > button.el-button.el-button--primary.el-button--medium'
  const user = {
    username: '99999902',
    password: '123456'
  }

  // waitUntil 满足什么条件认为页面跳转完成，默认是 load 事件触发时
  const [browser, page] = await spider()

  page.on('response', async response => {
    if (response.url().startsWith('http://middleapi.uat.dusto-yc.com:81/middle-pos-api/product/getallsizegroup')) {
      if (response.ok()) {
        const json = await response.json()
        const dest = join(__dirname, '../', 'json', 'data.json')
        writeFileSync(dest, JSON.stringify(json, null, '\t'))
        console.log('---------------JSON---------------', JSON.stringify(json))
      }
    }
  })

  await page.goto(url, {
    waitUntil: 'networkidle0'
  })

  await page.type(username, user.username, {
    delay: 100
  })
  await page.type(password, user.password, {
    delay: 100
  })

  const loginSelector = await page.$(login) as ElementHandle
  loginSelector.click()

  await sleep({ type: 'interval', delay: 2 })

  const shopSelector = await page.$(shop) as ElementHandle
  await shopSelector.click()

  await page.waitForNavigation({ waitUntil: 'networkidle0' })

  await sleep({ type: 'interval', delay: 1 })

  const menuSlector = await page.waitForSelector(menu) as ElementHandle
  menuSlector.click()

  await sleep({ type: 'interval', delay: 1 })

  const subMenuSelector = await page.waitForSelector(subMenu) as ElementHandle
  subMenuSelector.click()

  await sleep({ type: 'interval', delay: 1 })

  const searchSelector = await page.waitForSelector(search) as ElementHandle
  await searchSelector.click()

  await sleep({ type: 'interval', delay: 3 })
  await browser.close()
  res.send('over')
})

export default router
