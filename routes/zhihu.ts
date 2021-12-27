import express, { Router, Request, Response } from 'express'
import { join, basename } from 'path'
import request from 'request'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

import { Page } from 'puppeteer'
import rq from 'request-promise'

import spider from '../util/spider'
import { sleep, saveDataToJson, saveDataToMd, saveSimpleImage } from '../util'
import { saveAnswerToJson } from '../util/zhihu'

import { AnswerList, ZhihuAnswer } from '../interface/zhihu'

const router: Router = express.Router()

interface Question {
  username: string;
  answerId: string;
  images: string[];
  voteupCount: number;
}

// const questionId = '450376556'
// type: download md
// curl http://localhost:3333/zhihu/request/507754159/md
router.get('/request/:questionId/:type', async(req: Request, res: Response) => {
  console.log('---------------开始获取数据---------------')
  const questionId = req.params.questionId
  const type = req.params.type
  let result: AnswerList[] = []

  result = await saveAnswerToJson(questionId, type)

  if (result.length === 0) return res.send('over')

  await saveDataToJson<AnswerList[]>(result, `zhihu-${type}-${questionId}`)

  request(`http://localhost:${process.env.PORT}/zhihu/images/${questionId}/${type}`)
  res.send('over')
})

async function parseSetContent(questionId: string, asnwerId: string, voteupCount: number): Promise<Question> {
  let result
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

  let answer: Question = {
    username: '',
    answerId: asnwerId,
    images: [],
    voteupCount
  }
  try {
    const [browser, page] = await spider()

    const userAnswerId = asnwerId

    page.setContent(result)

    console.log('---------------asnwerId---------------', asnwerId)

    try {
      answer = { ...answer, ...await page.$eval('.QuestionAnswer-content', (element) => {
        let username: string
        let answerId: string
        let images: string[]

        try {
          username = (element.querySelector('.AuthorInfo-name .UserLink-link') as Element).innerHTML || ''
        } catch (error) {
          username = ''
        }
        try {
          answerId = (element.querySelector('.AnswerItem') as Element).getAttribute('name') || userAnswerId
        } catch (error) {
          console.log('---------------parse set content error: answerId---------------')
          answerId = ''
        }

        try {
          images = Array.from(element.querySelectorAll('figure img')).map(image => image.getAttribute('data-original') || '')
        } catch (error) {
          console.log('---------------parse set content error: images---------------')
          images = []
        }

        return {
          username,
          answerId,
          images
        }
      }) }
    } catch (error) {
      console.log('---------------parse set content error---------------', error)
    }

    // await sleep({ type: 'random', delay: 100000, min: 10000 })

    await page.close()
    await browser.close()
  } catch (error) {
    console.log('--------------->error', error, '<---------------')
  }

  return answer
}

// type: download md
router.get('/images/:questionId/:type', async(req: Request, res: Response) => {
  const questionId = req.params.questionId
  const type = req.params.type

  const dest = join(__dirname, '../json', `/zhihu-${type}-${questionId}.json`)
  const filedata = readFileSync(dest, {
    encoding: 'utf-8'
  })

  let answerList: AnswerList[] = JSON.parse(filedata)

  answerList = answerList.sort((a, b) => b.voteup_count - a.voteup_count)

  const questions: Question[] = []

  if (answerList.length === 0) return res.send('over')

  if (type === 'md') {
    let i = 0
    let md = ''
    for (const answer of answerList) {
      if (i < 50) {
        md += `[https://www.zhihu.com/question/${answer.question.id}/answer/${answer.id}](https://www.zhihu.com/question/${answer.question.id}/answer/${answer.id})`
        i++
      }
    }

    if (md) {
      saveDataToMd(md, `zhihu-md-${questionId}`)
    }
  } else {
    for (const answer of answerList) {
      if (answer.id) {
        await sleep({ type: 'random', delay: 10, min: 4 })
        const question = await parseSetContent(questionId, String(answer.id), answer.voteup_count)
        console.log('---------------question---------------', question)
        questions.push(question)
      }
    }
  }

  console.log('---------------question---------------', questions)

  if (type === 'download') {
    await saveDataToJson<Question[]>(questions, `zhihu-images-${questionId}`)
    request(`http://localhost:${process.env.PORT}/zhihu/download/${questionId}`)
  }

  res.send('over')
})

router.get('/download/:questionId', async(req: Request, res: Response) => {
  // curl http://localhost:3333/zhihu/download/450376556
  const questionId = req.params.questionId

  const dest = join(__dirname, '../json', `/zhihu-images-${questionId}.json`)
  const filedata = readFileSync(dest, {
    encoding: 'utf-8'
  })
  const questions: Question[] = JSON.parse(filedata)

  for (const answer of questions) {
    console.log('---------------用户信息---------------', answer.username)
    for (const image of answer.images) {
      if (image) {
        await sleep({ type: 'random', delay: 10, min: 4 })
        let url = `https://pic1.zhimg.com/${basename(image)}`
        url = url.split('?')[0]
        await saveSimpleImage(url, `images/zhihu/${questionId}`)
      }
    }
  }

  console.log('---------------questions---------------', questions.length)

  res.send('over')
})

// 旧版本爬取知乎数据方法
// const questionId = '450376556'
router.get('/question/:questionId', async(req: Request, res: Response) => {
  // curl http://localhost:3333/zhihu/question
  const questionId = req.params.questionId
  console.log('---------------spider is running---------------')
  const url = `https://www.zhihu.com/question`

  const questions: Question[] = await parseQuestion(url, questionId)
  if (questions.length === 0) return res.send('over')
  console.log('---------------question---------------', questions)
  await saveDataToJson<Question[]>(questions, `zhihu-${questionId}`)

  request(`http://localhost:${process.env.PORT}/zhihu/generate/${questionId}`)
  res.send('over')
})

// 构建 MD
router.get('/generate/:questionId', async(req: Request, res: Response) => {
  // curl http://localhost:3333/zhihu/generate
  const questionId = req.params.questionId
  let md = ''
  const dest = join(__dirname, '../json', `/zhihu-${questionId}.json`)
  const filedata = readFileSync(dest, {
    encoding: 'utf-8'
  })
  const questions: Question[] = JSON.parse(filedata)

  for (const question of questions) {
    if (question.images.length && question.images[0]) {
      md += `# ${question.username} 
![img](${question.images[0]})
[https://www.zhihu.com/question/${questionId}/answer/${question.answerId}](https://www.zhihu.com/question/${questionId}/answer/${question.answerId})`
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

async function autoScroll(page: Page, total: number, target: string) {
  await page.evaluate(async() => {
    await new Promise((resolve) => {
      let totalHeight = 0

      const timer = setInterval(() => {
        console.log(`---------------scrolling ${Date.now()}---------------`)
        const distance = window.innerHeight
        const scrollHeight = document.body.scrollHeight

        window.scrollBy(0, distance)

        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve(true)
        }
      }, 1500)
    })
  })

  const lists = await page.$$eval(target, element => element.length)
  console.log('---------------所有问题---------------', total)
  console.log('---------------当前获取问题---------------', target)
  if (lists <= total) {
    console.log('---------------未获取完所有问题，再次滚动---------------')
    await sleep({ type: 'random', delay: 5, min: 1 })
    autoScroll(page, total, target)
  }
}

// 旧版本爬取知乎数据方法
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

  const total = await page.$eval('.List-headerText span', element => {
    return Number(element.innerHTML.split(' ')[0]) || 0
  })

  console.log('---------------回答个数---------------', total)

  // 等待页面加载完成
  await autoScroll(page, total, '.List-item')

  const result = await page.$$eval('#QuestionAnswers-answers > div > div > div > div:nth-child(2) > div .List-item', (element) => {
    return element.map(ele => {
      let username: string
      let answerId: string
      let images: string[]
      const voteupCount = 0
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
        images,
        voteupCount
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
