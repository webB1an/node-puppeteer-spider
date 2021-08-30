import { basename, join } from 'path'
import sanitize from 'sanitize-filename'
import rq from 'request-promise'
import { writeFileSync } from 'fs'

type JSON = {
  [propName: string]: string
}

type PromiseType = Promise<boolean>

interface Sleep {
  type: 'random' | 'interval';
  delay: number;
  min?: number
}

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

export function extension(contentType: string): string {
  const json: JSON = {
    'image/gif': 'gif',
    'image/jpg': 'jpeg'
  }
  return json[contentType]
}

export async function saveSimpleImage(url: string, path = 'images'): PromiseType {
  const destination = join(__dirname, '../', path)
  const response = await rq({ url, resolveWithFullResponse: true, encoding: null })
  const fileName = join(destination, sanitize(basename(url)))
  try {
    writeFileSync(fileName, response.body)
  } catch (error) {
    console.log('---------------error---------------', error)
  }
  console.log('---------------fileName---------------', fileName)
  return true
}
