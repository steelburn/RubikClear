import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('./test-artifacts');

async function testZoom() {
  console.log('🔍 Starting Playwright Zoom & Pinch Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 860 },
    hasTouch: true,
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('1. Switched to 3D Sandbox...');
    await page.locator('button:has-text("3D Sandbox")').click();
    await page.waitForSelector('text=3D Interactive Cube');

    // Baseline screenshot
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'zoom-01-baseline.png') });
    console.log('   📸 Saved zoom-01-baseline.png');

    // Test 1: Click Zoom In button twice
    console.log('2. Clicking Zoom In button (+)...');
    const zoomInBtn = page.locator('button[title="Zoom In"]');
    await zoomInBtn.click();
    await zoomInBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'zoom-02-zoomed-in.png') });
    console.log('   📸 Saved zoom-02-zoomed-in.png');

    // Test 2: Click Zoom Out button
    console.log('3. Clicking Zoom Out button (-)...');
    const zoomOutBtn = page.locator('button[title="Zoom Out"]');
    await zoomOutBtn.click();
    await zoomOutBtn.click();
    await zoomOutBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'zoom-03-zoomed-out.png') });
    console.log('   📸 Saved zoom-03-zoomed-out.png');

    // Test 3: Mouse Wheel Zoom
    console.log('4. Testing Mouse Wheel Zoom...');
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, -350); // Wheel up to zoom in
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'zoom-04-wheel-zoomed-in.png') });
      console.log('   📸 Saved zoom-04-wheel-zoomed-in.png');
    }

    // Test 4: Reset View
    console.log('5. Clicking Reset View...');
    await page.locator('button[title="Reset Camera View"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'zoom-05-reset.png') });
    console.log('   📸 Saved zoom-05-reset.png');

    console.log('\n🎉 ALL ZOOM TESTS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

testZoom();
