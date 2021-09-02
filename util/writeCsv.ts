import { Parser } from 'json2csv'
import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * export csv and save
 * eg: writeCsv<Fileds, Movie[]>({ fields }, movies, 'douban-TOP')
 * @export
 * @template T
 * @template Y
 * @param {T} header
 * @param {Y} data
 * @param {string} filename
 * @param {string} [basedir='../']
 * @returns {Promise<void>}
 */
export default async function<T, Y>(header: T, data: Y, filename: string, basedir = '../'): Promise<void> {
  try {
    const json2csvParser = new Parser(header)
    const csv = json2csvParser.parse(data)
    const dest = join(__dirname, basedir, 'json', `${filename}.csv`)
    writeFileSync(dest, csv)
    console.log('---------------write success---------------')
  } catch (error) {
    console.log('---------------error---------------', error)
  }
  return
}
