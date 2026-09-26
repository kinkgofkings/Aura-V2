const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().toLowerCase().includes('error') || msg.text().toLowerCase().includes('uncaught')) {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR STACK]`, err.stack || err.message);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 4000));
    
    // Check root content
    const rootHTML = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? { innerHTML: root.innerHTML.slice(0, 300), childCount: root.children.length } : null;
    });
    console.log('[ROOT STATUS]:', JSON.stringify(rootHTML));
  } catch (e) {
    console.log('[EVAL ERROR]:', e.message);
  } finally {
    await browser.close();
  }
})();
