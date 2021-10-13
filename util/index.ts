import { basename, join } from 'path'
import sanitize from 'sanitize-filename'
import rq from 'request-promise'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

type JSON = {
  [propName: string]: string
}

type PromiseType = Promise<boolean>

interface Sleep {
  type: 'random' | 'interval';
  delay: number;
  min?: number
}

/**
 * sleep
 * @export
 * @param {Sleep} sleep
 * @returns {PromiseType}
 */
export async function sleep(sleep: Sleep): PromiseType {
  return new Promise(resolve => {
    let delay
    if (sleep.min) {
      delay = Math.floor(Math.random() * (sleep.delay - sleep.min + 1) + sleep.min)
    } else {
      delay = sleep.delay
    }
    setTimeout(() => {
      resolve(true)
    }, delay * 1000)
  })
}

/**
 * get picture ext
 * @export
 * @param {string} contentType
 * @returns {string}
 */
export function extension(contentType: string): string {
  const json: JSON = {
    'image/gif': 'gif',
    'image/jpg': 'jpeg'
  }
  return json[contentType]
}

/**
 * save image
 * @export
 * @param {string} url
 * @param {string} [path='images']
 * @returns {PromiseType}
 */
export async function saveSimpleImage(url: string, path = 'images'): PromiseType {
  const destination = join(__dirname, '../', path)
  const response = await rq({ url, resolveWithFullResponse: true, encoding: null })
  // console.log('---------------res---------------', response)
  console.log('---------------des---------------', destination)
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true })
  }
  const fileName = join(destination, sanitize(basename(url)))
  try {
    writeFileSync(fileName, response.body)
  } catch (error) {
    console.log('---------------error---------------', error)
  }
  console.log('---------------fileName---------------', fileName)
  return true
}

export async function saveDataToJson<T>(data: T, name: string): Promise<void> {
  try {
    const destination = join(__dirname, '../', 'json')
    if (!existsSync(destination)) {
      mkdirSync(destination, { recursive: true })
    }
    const filename = join(destination, `${name}.json`)
    writeFileSync(filename, JSON.stringify(data, null, '\t'))
    console.log('---------------file write success---------------')
  } catch (error) {
    console.log('---------------file write failed---------------', error)
  }
}
