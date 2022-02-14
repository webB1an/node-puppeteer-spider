import mongoose from 'mongoose'

const Schema = mongoose.Schema

const jdSchema = new Schema({
  goodsId: String,
  goodsName: String,
  list: Object
})

export default mongoose.model('jd', jdSchema)
