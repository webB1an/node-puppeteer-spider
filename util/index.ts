type JSON = {
  [propName: string]: string
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
