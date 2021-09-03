import express, { Router, Request, Response } from 'express'
import { Page } from 'puppeteer'

import { Movie } from '../interface/douban'
import { Filed, Fileds } from '../interface/csv'

import spider from '../util/spider'
import writeCsv from '../util/writeCsv'
import { sleep } from '../util'

const router: Router = express.Router()

router.get('/spider', async(req: Request, res: Response): Promise<Response> => {
  const base = 'https://movie.douban.com/top250'
  const url = ''
  const selector = '#content > div > div.article > ol > li'
  const next = '#content > div > div.article > div.paginator > span.next > a'
  const [browser, page] = await spider()

  const movies: Movie[] = await parseDouban(page, base, url, selector, next)

  console.log('---------------movies---------------', movies)

  // csv base header
  const fields: Filed[] = [
    {
      value: 'rank',
      label: '排名'
    }, {
      value: 'name',
      label: '名称'
    }, {
      value: 'rate',
      label: '评分'
    }, {
      value: 'quote',
      label: '描述'
    }, {
      value: 'href',
      label: '详情'
    }
  ]

  // export csv and save
  await writeCsv<Fileds, Movie[]>({ fields }, movies, 'douban-TOP')

  await page.close()
  await browser.close()
  return res.send('over')
})

/**
 * parse page
 * @param {Page} page
 * @param {string} base base url
 * @param {string} url  url params
 * @param {string} selector selector
 * @param {string} next next selector
 * @returns {Promise<Movie[]>}
 */
async function parseDouban(page: Page, base: string, url: string, selector: string, next: string): Promise<Movie[]> {
  console.log('---------------url---------------', url)
  await sleep({ type: 'random', delay: 10, min: 1 })
  let movies: Movie[] = []
  await page.goto(`${base}${url}`, {
    waitUntil: 'networkidle0'
  })
  await page.waitForSelector(selector)

  movies = await page.$$eval(selector, (element: Element[]): Movie[] => {
    return element.map(ele => {
      function getInnerHTML(element: Element): (selector: string, options?: string) => string {
        return (selector: string, options = 'innerHTML') => {
          try {
            if (options === 'innerHTML') {
              return (element.querySelector(selector) as Element).innerHTML
            } else if (options === 'href') {
              return (element.querySelector(selector) as Element).getAttribute('href') || ''
            } else {
              return ''
            }
          } catch (error) {
            return ''
          }
        }
      }
      const getInner = getInnerHTML(ele)
      return {
        rank: getInner('div > div.pic > em'),
        name: getInner('div > div.info > div.hd > a > span:nth-child(1)'),
        rate: getInner('div > div.info > div.bd > div > span.rating_num'),
        quote: getInner('div > div.info > div.bd > p.quote > span'),
        href: getInner('div > div.info > div.hd > a', 'href')
      }
    })
  })

  console.log('---------------movie---------------', movies)

  const nextSlector = await page.$(next)

  if (nextSlector) {
    const href = await page.$eval(next, (element: Element) => element.getAttribute('href')) || ''
    if (href) {
      movies = [...movies, ...await parseDouban(page, base, href, selector, next)]
    }
  }

  return movies
}

export default router
