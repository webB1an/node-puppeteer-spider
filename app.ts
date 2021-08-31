import express, { Application } from 'express'
import http, { Server } from 'http'
import cors from 'cors'

import router from './routes'

const app: Application = express()
const server: Server = http.createServer(app)
const port = 3000

app.use(express.json())
app.use(cors())
app.use(router)

server.listen(port, (): void => {
  console.log('---------------server is runnung at port: ---------------', port)
})
