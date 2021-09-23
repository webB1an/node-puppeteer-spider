import express, { Router, Request, Response } from 'express'

const router: Router = express.Router()

router.get('/question', async(req: Request, res: Response) => {
  res.send('over')
})

export default router
