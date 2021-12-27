import express, { Application } from 'express'
import http, { Server } from 'http'
import cors from 'cors'
import dotenv from 'dotenv'

import router from './routes'

dotenv.config({ path: './dev.env' })

const app: Application = express()
const server: Server = http.createServer(app)

console.log('====================================================================')
console.log('NODE_ENV', process.env.NODE_ENV)
console.log('PORT', process.env.PORT)
console.log('====================================================================')

const port = process.env.PORT

app.use(express.json())
app.use(cors())
app.use(router)

server.listen(port, (): void => {
  console.log('---------------server is runnung at port: ---------------', port)
})
