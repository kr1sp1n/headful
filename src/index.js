const puppeteer = require('puppeteer')
const assert = require('assert')
const url = 'https://googlechrome.github.io/samples/service-worker/basic'

async function main() {
  const browser = await puppeteer.launch({
    args: ['--enable-features=NetworkService'],
    headless: true,
    ignoreHTTPSErrors: true,
  })
  const page = await browser.newPage()
  await page.goto(url, {waitUntil: 'networkidle0'})
  await page.evaluate('navigator.serviceWorker.ready')

  console.log('Going offline')

  await page.setOfflineMode(true)
  page.on('response', r => {
    console.log(`From service worker ${ r.url() }:`, r.fromServiceWorker())
  })
  await page.reload({waitUntil: 'networkidle0'})

  await page.select('select#icons', 'icons/ic_folder_black_48dp.png')
  await page.click('button#show')
  const imageSrc = await page.$eval('div#container > img', el => el.src)
  assert.strictEqual(imageSrc, `${url}/icons/ic_folder_black_48dp.png`)

  // window could be used to access PWA interface (js API):
  const windowHandle = await page.evaluateHandle(() => window)
  const resultHandle = await page.evaluateHandle(window => window.navigator.appName, windowHandle)
  console.log(await resultHandle.jsonValue())
  await resultHandle.dispose()
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
