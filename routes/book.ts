import express, { Router, Request, Response } from 'express'
import { join } from 'path'
import { readFileSync } from 'fs'
import request from 'request'
import rq from 'request-promise'

import { sleep } from '../util'
import { saveAnswerToJson } from '../util/zhihu'
import writeCsv from '../util/writeCsv'

import { AnswerList } from '../interface/zhihu'
import { Filed, Fileds } from '../interface/csv'

import bookModel from '../models/book'

interface bookMap {
  [propname: string]: number
}

interface book {
  index: number,
  name: string,
  value: number
}

const router: Router = express.Router()
// curl http://localhost:3333/book/request/19714813/book
router.get('/request/:questionId/:type', async(req: Request, res: Response) => {
  const questionId = req.params.questionId
  const type = req.params.type
  let result: AnswerList[] = []

  try {
    const dest = join(__dirname, '../json', `/zhihu-${type}-${questionId}.json`)
    const filedata = readFileSync(dest, {
      encoding: 'utf-8'
    })

    result = JSON.parse(filedata)
  } catch (error) {
    result = await saveAnswerToJson(questionId, type)
    // await saveDataToJson<AnswerList[]>(result, `zhihu-${type}-${questionId}`)
  }

  for (const answer of result) {
    const book = await bookModel.find({ questionId: answer.question.id, answerId: answer.id })
    if (!book?.length) {
      const books = await parseSetContent(answer.question.id, answer.id)
      await bookModel.insertMany([
        { questionId: answer.question.id, answerId: answer.id, book: books }
      ])
      // if (books?.length) {}
    }
  }

  console.log('---------------parseSetContent over---------------')

  request(`http://localhost:${process.env.PORT}/book/generate/${questionId}/${type}`)
})

// curl http://localhost:3333/book/generate/19714813/book
router.get('/generate/:questionId/:type', async(req: Request, res: Response) => {
  const questionId = req.params.questionId
  const type = req.params.type
  const booksList = await bookModel.find({ questionId })
  const bookMap:bookMap = {}
  let bookAry: book[] = []

  for (const books of booksList) {
    console.log('------------------------------', books.book)
    if ((books.book ?? '') !== '') {
      const bookAry = [...new Set(books.book)] as string[]
      for (const book of bookAry) {
        if (!bookMap[book]) {
          bookMap[book] = 1
        } else {
          bookMap[book]++
        }
      }
    }
  }

  for (const book in bookMap) {
    bookAry.push({ name: book, value: bookMap[book], index: 0 })
  }

  bookAry = bookAry.sort((a, b) => b.value - a.value)

  bookAry = bookAry.map((book, index) => {
    return {
      index: index + 1,
      name: book.name,
      value: book.value
    }
  })

  // csv base header
  const fields: Filed[] = [
    {
      value: 'index',
      label: '序号'
    },
    {
      value: 'name',
      label: '书籍名称'
    }, {
      value: 'value',
      label: '出现次数'
    }
  ]

  // export csv and save
  await writeCsv<Fileds, book[]>({ fields }, bookAry, `zhihu-${type}-${questionId}`)
})

async function parseSetContent(questionId: number, asnwerId: number) {
  let result
  let book: string[] = []
  await sleep({ type: 'random', delay: 8, min: 4 })
  try {
    result = await rq({
      uri: `https://www.zhihu.com/question/${questionId}/answer/${asnwerId}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36'
      }
    })
  } catch (error) {
    result = ''
    console.log('---------------rq error:---------------', error)
  }
  if (result) {
    try {
      book = result.match(/<div class="QuestionAnswer-content" tabindex="0">.*<\/div>/)[0].match(/《[\u4E00-\u9FA5]{1,}》/g)
    } catch (error) {
      console.log('---------------error---------------', error)
      console.log('---------------answerId---------------', asnwerId)
    }
  }

  console.log('---------------book---------------', book)
  console.log('---------------asnwerId---------------', asnwerId)

  // try {
  //   const [browser, page] = await spider()
  //   page.setContent(result)

  //   book = [...book, ...await page.$eval('.QuestionAnswer-content', element => {
  //     const domString = element.innerHTML
  //     return domString.match(/《[\u4E00-\u9FA5]{1,}》/g) || []
  //   })]

  //   await page.close()
  //   await browser.close()
  // } catch (error) {

  // }
  return book
}

export default router
