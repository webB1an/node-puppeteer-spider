import express, { Router } from 'express'
import movie from './movie'
import one from './one'
import emoji from './emoji'
import emoji1 from './emoji1'
import avatar from './avatar'
import douban from './douban'
import zhihu from './zhihu'
import book from './book'

import pos from './pos'

const router: Router = express.Router()

router.use('/movie', movie)
router.use('/one', one)
router.use('/emoji', emoji)
router.use('/emoji1', emoji1)
router.use('/avatar', avatar)
router.use('/douban', douban)
router.use('/zhihu', zhihu)
router.use('/book', book)

router.use('/pos', pos)

export default router
