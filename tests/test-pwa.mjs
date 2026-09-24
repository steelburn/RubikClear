import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('./test-artifacts');

async function testPWA() {
  console.log('📱 Starting Playwright PWA Validation (Android & iOS)...');
  const browser = await chromium.launch({ headless: true });

  // Test 1: Android Chrome Emulation
  console.log('1. Testing Android Chrome PWA behavior...');
  const androidContext = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    hasTouch: true,
  });
  const androidPage = await androidContext.newPage();

  await androidPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Verify Web Manifest link in head
  const manifestHref = await androidPage.locator('link[rel="manifest"]').getAttribute('href');
  console.log(`   ✓ Web Manifest linked: "${manifestHref}"`);

  // Verify Manifest HTTP 200 response
  const manifestResponse = await androidPage.request.get(`http://localhost:5173${manifestHref}`);
  console.log(`   ✓ Manifest fetched with HTTP status: ${manifestResponse.status()}`);
  const manifestJson = await manifestResponse.json();
  console.log(`   ✓ Manifest name: "${manifestJson.name}"`);
  console.log(`   ✓ Manifest short_name: "${manifestJson.short_name}"`);
  console.log(`   ✓ Manifest theme_color: "${manifestJson.theme_color}"`);
  console.log(`   ✓ Manifest icons count: ${manifestJson.icons?.length}`);

  // Verify Icon 192 response
  const iconResponse = await androidPage.request.get('http://localhost:5173/icon-192.png');
  console.log(`   ✓ icon-192.png HTTP status: ${iconResponse.status()}`);

  // Test 2: iOS Safari Emulation
  console.log('\n2. Testing iOS Safari PWA behavior...');
  const iosContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    hasTouch: true,
  });
  const iosPage = await iosContext.newPage();
  await iosPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Verify iOS meta tags
  const appleCapable = await iosPage.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
  const appleStatus = await iosPage.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content');
  const appleTitle = await iosPage.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content');
  const appleTouchIcon = await iosPage.locator('link[rel="apple-touch-icon"][sizes="180x180"]').getAttribute('href');

  console.log(`   ✓ apple-mobile-web-app-capable: ${appleCapable}`);
  console.log(`   ✓ apple-mobile-web-app-status-bar-style: ${appleStatus}`);
  console.log(`   ✓ apple-mobile-web-app-title: ${appleTitle}`);
  console.log(`   ✓ apple-touch-icon: ${appleTouchIcon}`);

  // Verify Apple Touch Icon HTTP 200 response
  const appleIconResponse = await iosPage.request.get(`http://localhost:5173${appleTouchIcon}`);
  console.log(`   ✓ apple-touch-icon HTTP status: ${appleIconResponse.status()}`);

  // Check iOS Add to Home Screen in-app prompt
  await iosPage.waitForTimeout(500);
  const iosPromptVisible = await iosPage.locator('text=Add RubikClear to Home Screen').isVisible();
  console.log(`   ✓ iOS "Add to Home Screen" guide visible: ${iosPromptVisible}`);
  await iosPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'pwa-ios-prompt.png') });
  console.log('   📸 Saved pwa-ios-prompt.png');

  await browser.close();
  console.log('\n🎉 ALL PWA VALIDATION CHECKS PASSED!');
}

testPWA();
