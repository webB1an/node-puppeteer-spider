import express, { Router, Request, Response } from 'express'
import puppeteer from 'puppeteer'

import { Movie } from '../interface/movie'
import { sleep } from '../util'
import spider from '../util/spider'

const router: Router = express.Router()

const urls: string[] = [
  'https://ddrk.me/category/anime/'
  // 'https://ddrk.me/tag/action/',
  // 'https://ddrk.me/tag/comedy/',
  // 'https://ddrk.me/tag/romance/',
  // 'https://ddrk.me/tag/sci-fi/',
  // 'https://ddrk.me/tag/crime/',
  // 'https://ddrk.me/tag/mystery/',
  // 'https://ddrk.me/tag/horror/',
  // 'https://ddrk.me/category/documentary/',
  // 'https://ddrk.me/category/variety/'
]

async function parsePage(page: puppeteer.Page, url: string): Promise<Movie[]> {
  console.log('---------------url---------------', url)

  let movie: Movie[] = []
  const selector = '.post-box'

  // 跳转页面
  await page.goto(url)

  // 绑定 console
  await page.on('console', consoleObj => {
    console.log(consoleObj.text())
  })

  // 等待页面元素加载完成
  await page.waitForSelector(selector)

  // 解析页面元素
  movie = await page.$$eval(selector, element => {
    const result: Movie[] = []

    element.forEach(ele => {
      const posterEle = ele.querySelector('.post-box-image') as Element
      let poster = posterEle.getAttribute('style') as string
      const match = poster.match(/.*(https:\/\/[0-9a-zA-Z.\/]*)\);/) || []

      if (match.length > 1) {
        poster = match[1]
      } else {
        poster = ''
      }

      result.push({
        posterId: ele.getAttribute('id') || '',
        poster,
        title: ele.querySelector('h2 > a')?.innerHTML || '',
        innner: ele.getAttribute('data-href') || ''
      })
    })
    return result
  })

  // 获取下一页
  const nextSel = await page.$('#main > div.pagination_wrap > nav > div > a.next.page-numbers')

  // 判断下一页是否存在
  // 存在则递归爬取下一页页面
  if (nextSel) {
    await sleep({ type: 'random', delay: 10, min: 1 })
    // 获取下一页 href
    const href = await page.$eval('#main > div.pagination_wrap > nav > div > a.next.page-numbers', item => { return item.getAttribute('href') }) || ''
    if (href) {
      movie = [...movie, ...await parsePage(page, href)]
    }
  } else {
    console.log('---------------已经没有下一页啦～---------------')
  }

  return movie
}

router.get('/spider', async(req: Request, res: Response): Promise<Response> => {
  const [browser, page] = await spider()

  let movie: Movie[] = []

  for (const url of urls) {
    movie = [...movie, ...await parsePage(page, url)]
  }

  console.log('---------------movie---------------', movie)

  await page.close()
  // 关闭浏览器
  await browser.close()

  return res.send('over')
})

export default router
