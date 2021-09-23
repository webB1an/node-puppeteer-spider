import express, { Router, Request, Response } from 'express'
import puppeteer from 'puppeteer'
import { writeFileSync, readFileSync } from 'fs'
import { join, basename } from 'path'
import sanitize from 'sanitize-filename'

import { Movie } from '../interface/movie'
import { Filed, Fileds } from '../interface/csv'

import { sleep } from '../util'
import spider from '../util/spider'
import writeCsv from '../util/writeCsv'

const router: Router = express.Router()

const urls: string[] = [
  'https://ddrk.me/category/anime/',
  'https://ddrk.me/tag/action/',
  'https://ddrk.me/tag/comedy/',
  'https://ddrk.me/tag/romance/',
  'https://ddrk.me/tag/sci-fi/',
  'https://ddrk.me/tag/crime/',
  'https://ddrk.me/tag/mystery/',
  'https://ddrk.me/tag/horror/',
  'https://ddrk.me/category/documentary/',
  'https://ddrk.me/category/variety/'
]

router.get('/spider', async(req: Request, res: Response): Promise<Response> => {
  const [browser, page] = await spider()

  for (const url of urls) {
    let movie: Movie[] = await parsePage(page, url)

    movie = await setMovieRate(page, movie)

    movie = movie.sort((a, b) => b.rate - a.rate)

    console.log('---------------movie---------------', movie)

    await saveMovieToJson(movie, sanitize(basename(url)))
  }

  await page.close()
  // 关闭浏览器
  await browser.close()

  return res.send('over')
})

router.get('/write', async(req: Request, res: Response) => {
  let movies: Movie[] = []

  const fields: Filed[] = [
    {
      value: 'posterId',
      label: '标识'
    }, {
      value: 'poster',
      label: '海报'
    }, {
      value: 'title',
      label: '名称'
    }, {
      value: 'innner',
      label: '详情'
    }, {
      value: 'rate',
      label: '评分'
    }
  ]

  const filenames = urls.map(url => sanitize(basename(url)))

  for (const filename of filenames) {
    const dest = join(__dirname, '../json', `/${sanitize(basename(filename))}.json`)
    const filedata = readFileSync(dest, {
      encoding: 'utf-8'
    })
    movies.push(...JSON.parse(filedata))
  }

  movies = movies.sort((a, b) => b.rate - a.rate)

  await writeCsv<Fileds, Movie[]>({ fields }, movies, 'dark')

  res.send('write success')
})

async function parsePage(page: puppeteer.Page, url: string): Promise<Movie[]> {
  console.log('---------------parse page url:---------------', url)

  let movie: Movie[] = []
  const selector = '.post-box'

  try {
    // 跳转页面
    await page.goto(url)

    // 绑定 console
    page.on('console', consoleObj => {
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
          innner: ele.getAttribute('data-href') || '',
          rate: 0
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
  } catch (error) {
    console.log('---------------error---------------', error)
  }

  return movie
}

async function parsePageRate(page: puppeteer.Page, url: string): Promise<number> {
  console.log('---------------parse page rate url:---------------', url)
  const selector = '.post-content > div.entry > div.doulist-item > div > div > div.rating > span.rating_nums'
  try {
    await page.goto(url, {
      waitUntil: 'networkidle0'
    })
    const rate = await page.$eval(selector, element => element.innerHTML)
    console.log('---------------rate---------------', rate)
    return Number(rate)
  } catch (error) {
    console.log('---------------error---------------', error)
    return 0
  }
}

async function setMovieRate(page: puppeteer.Page, movie: Movie[]): Promise<Movie[]> {
  for (const index in movie) {
    await sleep({ type: 'random', delay: 10, min: 1 })
    movie[index].rate = await parsePageRate(page, movie[index].innner)
  }
  return movie
}

async function saveMovieToJson(movie: Movie[], name: string): Promise<void> {
  try {
    const dest = join(__dirname, '../', 'json')
    const filename = join(dest, `${name}.json`)
    writeFileSync(filename, JSON.stringify(movie, null, '\t'))
    console.log('---------------file write success---------------')
  } catch (error) {
    console.log('---------------file write failed---------------', error)
  }
}

export default router
