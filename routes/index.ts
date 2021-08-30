import express from 'express'
import movie from './movie'
import one from './one'
import emoji from './emoji'
import emoji1 from './emoji1'
import avatar from './avatar'

import pos from './pos'

const router: express.Router = express.Router()

router.use('/movie', movie)
router.use('/one', one)
router.use('/emoji', emoji)
router.use('/emoji1', emoji1)
router.use('/avatar', avatar)

router.use('/pos', pos)

export default router
