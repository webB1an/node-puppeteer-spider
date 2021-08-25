import express from 'express'
import movie from './movie'
import one from './one'
import emoji from './emoji'

const router: express.Router = express.Router()

router.use('/movie', movie)
router.use('/one', one)
router.use('/emoji', emoji)

export default router
