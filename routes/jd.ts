import express, { Router, Request, Response } from 'express'
// import rq from 'request-promise'

import { sleep } from '../util'
import spider from '../util/spider'

import jdModel from '../models/jd'

const router: Router = express.Router()
// http://localhost:3333/jd/request
router.post('/request', async(req: Request, res: Response) => {
  // {"goods": [{"goodsId": "100018969104", "goodsName": "京造K8"}]}
  const { goods } = req.body

  for (const item of goods) {
    const { goodsId, goodsName } = item

    const time = new Date()
    const key = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`

    const listOpt = `list.${key}`
    const query = { goodsId, [listOpt]: { $exists: true }}
    console.log('---------------query---------------', query)
    const result = await jdModel.find(query)

    console.log('---------------result---------------', result)

    if (!result.length) {
      const price = await parseSetContent(goodsId)
      await jdModel.updateOne({ goodsId }, { goodsId, goodsName, [listOpt]: price }, { upsert: true })
    }

    console.log('---------------success one---------------')
    await sleep({ type: 'random', delay: 6, min: 4 })
  }
  console.log('---------------success all---------------')

  res.send('成功')
})

router.post('/list', async(req: Request, res: Response) => {
  const { goodsId } = req.body

  console.log('---------------goodsId---------------', goodsId)
  const result = await jdModel.find({ goodsId: { $in: goodsId }}, { _id: 0, __v: 0 })

  res.json({
    code: 0,
    msg: 'ok',
    data: result
  })
})

async function parseSetContent(id: number): Promise<number> {
  const [browser, page] = await spider()

  await page.goto(`https://item.jd.com/${id}.html`, {
    waitUntil: 'networkidle0'
  })

  const selector = 'div.summary-price.J-summary-price > div.dd > span .price'

  await page.waitForSelector(selector)

  const result = await page.$eval(selector, element => {
    return element.innerHTML
  })

  const price = parseInt(result)

  await page.close()
  await browser.close()

  return price
}

export default router
