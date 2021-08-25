type JSON = {
  [propName: string]: string
}

export async function sleep(): Promise<boolean> {
  return new Promise(resolve => {
    const random: number = Math.floor(Math.random() * (10 - 1 + 1) + 1)
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
