# node-movie-spider

node+ts+puppeteer spider

## install

```shell
yarn
```

## hot reload typescript with ts-node-dev in development

```shell
yarn dev
```

## error with 403 

need use proxy to fix this problem.

## run spider

### show movie list

```shell
curl http://localhost:3000/movie/spider
```

### show one 

```shell
curl http://localhost:3000/one/spider
```

### download emoji

```shell
curl http://localhost:3000/emoji/spider
curl http://localhost:3000/emoji1/spider
```

### download avatar

```shell
curl http://localhost:3000/avatar/spider/1
```

### douban top
```shell
curl http://localhost:3000/douban/spider
```

### generate zhihu question md
```shell
curl http://localhost:3000/zhihu/question/:questionId
```

```js
await page.goto(url, { waitUntil: 'domcontentloaded' })
let selectorExists = await page.$('#ourButton')

while (selectorExists === null) {
  await page.reload({ waitUntil: 'domcontentloaded' })
  console.log('reload')
  selectorExists = await page.$('#ourButton')
}
await page.click('#ourButton')
```