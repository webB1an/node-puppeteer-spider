import mongoose from 'mongoose'

mongoose.connect(process.env.MONGODB_URL as string, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  // authSource: 'admin'
}, () => {
  console.log('connect!')
})

const db = mongoose.connection

db.once('open', () => {
  console.log('db is connect!')
})

db.on('error', error => {
  console.log(error)
})

db.on('close', () => {
  console.log('db is closed!')
})

export default mongoose
