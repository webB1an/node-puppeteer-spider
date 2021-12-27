import express, { Router, Request, Response } from 'express'
import { join } from 'path'
import { readFileSync } from 'fs'
import rq from 'request-promise'

import { sleep, saveDataToJson } from '../util'
import { saveAnswerToJson } from '../util/zhihu'
import writeCsv from '../util/writeCsv'

import { AnswerList } from '../interface/zhihu'
import { Filed, Fileds } from '../interface/csv'

interface bookMap {
  [propname: string]: number
}

interface book {
  name: string,
  value: number
}

const router: Router = express.Router()
// https://www.zhihu.com/question/438708854/answer/1675657296
router.get('/request/:questionId/:type', async(req: Request, res: Response) => {
  const questionId = req.params.questionId
  const type = req.params.type
  let result: AnswerList[] = []
  const bookMap:bookMap = {}
  let bookAry: book[] = []

  try {
    const dest = join(__dirname, '../json', `/zhihu-${type}-${questionId}.json`)
    const filedata = readFileSync(dest, {
      encoding: 'utf-8'
    })

    result = JSON.parse(filedata)
  } catch (error) {
    result = await saveAnswerToJson(questionId, type)
    await saveDataToJson<AnswerList[]>(result, `zhihu-${type}-${questionId}`)
  }

  for (const answer of result) {
    const books = await parseSetContent(answer.question.id, answer.id)
    for (const book in books) {
      if (!bookMap[book]) {
        bookMap[book] = 1
      } else {
        bookMap[book]++
      }
    }
  }

  for (const book in bookMap) {
    bookAry.push({ name: book, value: bookMap[book] })
  }

  bookAry = bookAry.sort((a, b) => b.value - a.value)

  // csv base header
  const fields: Filed[] = [
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
  console.log('---------------result---------------', result)
  if (result) {
    try {
      book = result.match(/<div class="QuestionAnswer-content" tabindex="0">.*<\/div>/)[0].match(/《[\u4E00-\u9FA5]{1,}》/g)
    } catch (error) {
      console.log('---------------error---------------', error)
      console.log('---------------answerId---------------', asnwerId)
    }
  }

  console.log('---------------book---------------', book)

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
