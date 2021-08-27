import { basename, join } from 'path'
import sanitize from 'sanitize-filename'
import rq from 'request-promise'
import { writeFileSync } from 'fs'

type JSON = {
  [propName: string]: string
}

export async function sleepTime(delay: number): Promise<boolean> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, delay * 1000)
  })
}

export async function sleep(max = 10, min = 1): Promise<boolean> {
  return new Promise(resolve => {
    const random: number = Math.floor(Math.random() * (max - min + 1) + min)
    setTimeout(() => {
      resolve(true)
    }, random * 1000)
  })
}

export function extension(contentType: string): string {
  const json: JSON = {
    'image/gif': 'gif',
    'image/jpg': 'jpeg'
  }
  return json[contentType]
}

export async function saveSimpleImage(url: string, path = 'images'): Promise<boolean> {
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
