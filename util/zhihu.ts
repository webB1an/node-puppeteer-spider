import rq from 'request-promise'
import { AnswerList, ZhihuAnswer } from '../interface/zhihu'

import { sleep, saveDataToJson } from '../util'

async function requestAnswer(questionId: string): Promise<AnswerList[]> {
  let result: AnswerList[] = []
  let isEnd = false
  let i = 0

  do {
    console.log('---------------循环请求接口...---------------')

    const answer: ZhihuAnswer = await rq({
      uri: `https://www.zhihu.com/api/v4/questions/${questionId}/answers`,
      qs: {
        'include': 'data[*].is_normal,comment_count,voteup_count,created_time,updated_time',
        'limit': 20,
        'offset': i * 20,
        'platform': 'desktop',
        'sort_by': 'default'
      },
      headers: {
        /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36'
      },
      json: true
    })

    const list: AnswerList[] = answer.data

    isEnd = answer.paging.is_end

    result = [...result, ...list]

    i++

    await sleep({ type: 'random', delay: 6, min: 4 })
  } while (!isEnd)

  return result
}

export async function saveAnswerToJson(questionId: string, type: string): Promise<AnswerList[]> {
  const result = await requestAnswer(questionId)
  await saveDataToJson<AnswerList[]>(result, `zhihu-${type}-${questionId}`)
  return result
}
