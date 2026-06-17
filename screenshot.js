const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 480, height: 860, deviceScaleFactor: 2 });
    
    const filePath = 'file://' + path.resolve(__dirname, 'index.html');
    await page.goto(filePath, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const el = await page.$('.game-container');
    await el.screenshot({ path: path.resolve(__dirname, 'screenshot.png') });
    
    await browser.close();
    console.log('Screenshot saved to screenshot.png');
})();
