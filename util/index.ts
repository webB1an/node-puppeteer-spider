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
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true })
  }
  const fileName = join(destination, sanitize(basename(url)))

  try {
    writeFileSync(fileName, response.body)
  } catch (error) {
    console.log('---------------error---------------', error)
  }
  console.log('---------------download---------------', fileName)
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

export async function saveDataToMd(data: string, name: string): Promise<void> {
  try {
    const destination = join(__dirname, '../', 'md')
    if (!existsSync(destination)) {
      mkdirSync(destination, { recursive: true })
    }
    const filename = join(destination, `${name}.md`)
    writeFileSync(filename, data)
    console.log('---------------file write success---------------')
  } catch (error) {
    console.log('---------------file write failed---------------', error)
  }
}

function deepClone(obj: any) {
  // 根据类型制造一个新的数组或对象 => 指向一个新的空间
  // 由于数组的typeof也是'object',所以用Array.isArray(obj)
  let new_obj: any
  // 首先判断obj的类型
  // 普通类型
  if (typeof obj !== 'object') {
    // 这里不能直接返回obj,不然就是浅拷贝的性质
    return obj
  }
  // 引用类型
  // 数组
  if (obj instanceof Array) {
    new_obj = []
    for (let i = 0; i < obj.length; i++) {
      new_obj[i] = obj[i]
      if (typeof new_obj[i] === 'object') {
        deepClone(new_obj[i])
      }
    }
  } else { // 对象
    new_obj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // 对象中的数组和对象
        if (typeof obj[key] === 'object') {
          new_obj[key] = deepClone(obj[key])
        } else { // 对象中没有引用类型
          new_obj[key] = obj[key]
        }
      }
    }
  }
  return new_obj
}

interface CallBack<T> {
  (params: T[]): void
}

export async function asyncLimit<T>(arrary: Promise<T>[], limit: number): Promise<T[]> {
  const gridArrary = []
  let result: T[] = []
  arrary = deepClone(arrary)
  do {
    gridArrary.push(arrary.splice(0, limit))
  } while (arrary.length > 0)

  for (const element of gridArrary) {
    result = [...result, ...await Promise.all(element)]
  }

  return result
}
