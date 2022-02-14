import mongoose from 'mongoose'

const Schema = mongoose.Schema

const bookSchema = new Schema({
  questionId: String,
  answerId: String,
  book: Array
})

export default mongoose.model('book', bookSchema)
