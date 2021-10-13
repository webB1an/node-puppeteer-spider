import express, { Router, Request, Response } from 'express'
import { Page } from 'puppeteer'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

import spider from '../util/spider'
import { sleep, saveDataToJson } from '../util'
import request from 'request'

const router: Router = express.Router()

interface Question {
  username: string;
  answerId: string;
  images: string[];
}

// const questionId = '394344003'
router.get('/question/:questionId', async(req: Request, res: Response) => {
  // curl http://localhost:3000/zhihu/question
  const questionId = req.params.questionId
  console.log('---------------spider is running---------------')
  const url = `https://www.zhihu.com/question`

  const questions: Question[] = await parseQuestion(url, questionId)
  if (questions.length === 0) return res.send('over')
  console.log('---------------question---------------', questions)
  await saveDataToJson<Question[]>(questions, `zhihu-${questionId}`)

  request(`http://localhost:3000/zhihu/generate/${questionId}`)
  res.send('over')
})

router.get('/generate/:questionId', async(req: Request, res: Response) => {
  // curl http://localhost:3000/zhihu/generate
  const questionId = req.params.questionId
  let md = ''
  const dest = join(__dirname, '../json', `/zhihu-${questionId}.json`)
  const filedata = readFileSync(dest, {
    encoding: 'utf-8'
  })
  const questions: Question[] = JSON.parse(filedata)

  for (const question of questions) {
    if (question.images.length && question.images[0]) {
      md += `
# ${question.username} 
![img](${question.images[0]})
[https://www.zhihu.com/question/${questionId}/answer/${question.answerId}](https://www.zhihu.com/question/${questionId}/answer/${question.answerId})
`
    }
  }

  const destination = join(__dirname, '../', 'md')
  try {
    if (!existsSync(destination)) {
      mkdirSync(destination, { recursive: true })
    }
  } catch (error) {

  }
  const filename = join(destination, `zhihu-${questionId}.md`)
  writeFileSync(filename, md)
  console.log('---------------file write success---------------')

  res.send(md)
})

async function autoScroll(page: Page) {
  await page.evaluate(async() => {
    await new Promise((resolve) => {
      let totalHeight = 0

      const timer = setInterval(() => {
        console.log('---------------scrolling---------------')
        const distance = window.innerHeight
        const scrollHeight = document.body.scrollHeight

        window.scrollBy(0, distance)

        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve(true)
        }
      }, 3000)
    })
  })
}

async function parseQuestion(url: string, questionId: string): Promise<Question[]> {
  console.log('---------------begin parse question---------------')
  const [browser, page] = await spider()

  await page.goto(`${url}/${questionId}`, {
    waitUntil: ['networkidle0', 'domcontentloaded']
  })

  await sleep({ type: 'random', delay: 15, min: 10 })

  try {
    const close = await page.waitForSelector('body div.Modal.Modal--default.signFlowModal > button', {
      timeout: 2000
    })
    console.log('---------------出现了登录窗口---------------')
    await close?.click()
  } catch (error) {
    console.log('---------------未出现登录窗口---------------')
    return []
  }

  // 等待页面加载完成
  await autoScroll(page)

  const result = await page.$$eval('#QuestionAnswers-answers > div > div > div > div:nth-child(2) > div .List-item', (element) => {
    return element.map(ele => {
      let username: string
      let answerId: string
      let images: string[]
      try {
        username = (ele.querySelector('.AuthorInfo-name .UserLink-link') as Element).innerHTML || ''
      } catch (error) {
        username = ''
      }
      try {
        answerId = (ele.querySelector('.AnswerItem') as Element).getAttribute('name') || ''
      } catch (error) {
        answerId = ''
      }

      try {
        images = Array.from(ele.querySelectorAll('figure img')).map(image => image.getAttribute('data-original') || '')
      } catch (error) {
        images = []
      }

      return {
        username,
        answerId,
        images
      }
    })
  })

  console.log('---------------parseQuestion result---------------', result)

  console.log('---------------parse question over---------------')

  await page.close()
  await browser.close()

  return result
}
/*
async function downloadAnswerImages(questionId: string, userAnswerImages: UserAnswerImages[]) {
  console.log('---------------begin download answer images---------------')
  for (const answer of userAnswerImages) {
    if (answer.images.length) {
      for (const src of answer.images) {
        await sleep({ type: 'random', delay: 5, min: 1 })
        let url = `https://pic1.zhimg.com/${basename(src)}`
        url = src.split('?')[0]
        await saveSimpleImage(url, `images/zhihu1/${questionId}/${answer.username}-${answer.answerId}`)
      }
    }
  }
  console.log('---------------download answer images over---------------')
}
*/

export default router
