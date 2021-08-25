import express from 'express'
import * as http from 'http'
import cors from 'cors'

import router from './routes'

const app: express.Application = express()
const server: http.Server = http.createServer(app)
const port = 3000

app.use(express.json())
app.use(cors())
app.use(router)

server.listen(port, () => {
  console.log('---------------server is runnung at port: ---------------', port)
})
