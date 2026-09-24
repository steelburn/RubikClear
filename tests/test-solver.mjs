import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('./test-artifacts');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  console.log('🚀 Starting Playwright RubikClear Solver Test...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 420, height: 860 }, // Mobile screen format (typical phone)
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  // Listen for console logs and errors
  page.on('console', msg => console.log('  [Browser]', msg.text()));
  page.on('pageerror', err => console.error('  [Page Error]', err));

  try {
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Verify Title
    const title = await page.title();
    console.log(`   Page Title: "${title}"`);

    // Verify Net Editor elements
    await page.waitForSelector('text=RubikClear');
    console.log('   ✓ Found RubikClear header');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-net-editor.png') });
    console.log('   📸 Saved 01-net-editor.png');

    // Test About Modal
    console.log('   Opening About modal by clicking app brand/icon...');
    const brandBtn = page.locator('button[title="About RubikClear"]');
    await brandBtn.click();
    await page.waitForSelector('text=v1.0.0');
    console.log('   ✓ About modal opened successfully');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01b-about-modal.png') });
    console.log('   📸 Saved 01b-about-modal.png');
    // Close modal
    const closeAboutBtn = page.locator('button:has-text("Close")');
    await closeAboutBtn.click();
    await page.waitForTimeout(300);

    // 2. Open Scramble & Presets Modal
    console.log('2. Opening Scramble & Presets modal...');
    const scrambleBtn = page.locator('button[title="Preset Patterns / Scramble"]');
    await scrambleBtn.click();
    await page.waitForSelector('text=Scramble & Presets');
    console.log('   ✓ Scramble modal opened');

    // Select Checkerboard pattern
    console.log('   Applying "Checkerboard" pattern...');
    const checkerboardBtn = page.locator('button:has-text("Checkerboard")');
    await checkerboardBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-checkerboard-applied.png') });
    console.log('   📸 Saved 02-checkerboard-applied.png');

    // 3. Trigger 3D Visual Solver
    console.log('3. Clicking "Solve Cube in 3D"...');
    const solveBtn = page.locator('button:has-text("Solve Cube in 3D")');
    await solveBtn.click();

    // Verify 3D solve guide is mounted
    await page.waitForSelector('text=Step 1 of');
    const stepText = await page.locator('text=Step 1 of').innerText();
    console.log(`   ✓ Solve guide loaded: "${stepText}"`);

    // Wait a brief moment for Three.js to render
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-3d-solve-guide.png') });
    console.log('   📸 Saved 03-3d-solve-guide.png');

    // 4. Step through moves
    console.log('4. Stepping through the solution moves...');
    const nextBtn = page.locator('button[title="Next Move"]');

    // Step forward 3 times
    for (let i = 1; i <= 3; i++) {
      await nextBtn.click();
      await page.waitForTimeout(600); // allow 3D animation to complete
      const currentStep = await page.locator('span:has-text("Step")').innerText();
      console.log(`   Step progress forward: ${currentStep}`);
    }

    // Step backward 1 time to verify animated undo
    const prevBtn = page.locator('button[title="Previous Move"]');
    await prevBtn.click();
    await page.waitForTimeout(700); // allow reverse 3D animation to complete
    const backStep = await page.locator('span:has-text("Step")').innerText();
    console.log(`   Step progress backward (animated undo): ${backStep}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-stepping-moves.png') });
    console.log('   📸 Saved 04-stepping-moves.png');

    // Fast scrub to end to trigger Solved celebration
    console.log('5. Scrubbing timeline to 100% (Solved)...');
    const slider = page.locator('input[type="range"]');
    const maxVal = await slider.getAttribute('max');
    if (maxVal) {
      await slider.fill(maxVal);
      await slider.dispatchEvent('change');
    }
    await page.waitForTimeout(800);

    const celebration = await page.locator('text=Cube Solved!').isVisible();
    console.log(`   ✓ Celebration visible: ${celebration}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-solved-celebration.png') });
    console.log('   📸 Saved 05-solved-celebration.png');

    // 6. Test 3D Sandbox mode
    console.log('6. Switching to 3D Sandbox mode...');
    const editBtn = page.locator('button:has-text("Edit")');
    await editBtn.click();

    const sandboxTab = page.locator('button:has-text("3D Sandbox")');
    await sandboxTab.click();
    await page.waitForSelector('text=3D Interactive Cube');
    console.log('   ✓ 3D Sandbox active');

    // Click face rotation buttons
    console.log('   Turning face U and R in 3D...');
    const uBtn = page.locator('button:text-is("U")');
    await uBtn.click();
    await page.waitForTimeout(500);

    const rBtn = page.locator('button:text-is("R")');
    await rBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-3d-sandbox.png') });
    console.log('   📸 Saved 06-3d-sandbox.png');

    // Test Zoom In / Out controls
    console.log('   Testing Zoom In & Zoom Out...');
    const zoomInBtn = page.locator('button[title="Zoom In"]');
    await zoomInBtn.click();
    await zoomInBtn.click();
    await page.waitForTimeout(300);

    const zoomOutBtn = page.locator('button[title="Zoom Out"]');
    await zoomOutBtn.click();
    await page.waitForTimeout(300);

    // 7. Test Scanner modal
    console.log('7. Testing Camera Scanner Modal...');
    const snapBtn = page.locator('button:has-text("Snap Faces")');
    await snapBtn.click();
    await page.waitForSelector('text=Top (White)');
    console.log('   ✓ Camera Scanner overlay mounted');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-camera-scanner.png') });
    console.log('   📸 Saved 07-camera-scanner.png');

    const cancelScan = page.locator('button:has-text("Cancel")');
    await cancelScan.click();
    console.log('   ✓ Cancelled scanner modal');

    console.log('\n🎉 ALL PLAYWRIGHT TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-failure.png') });
    throw error;
  } finally {
    await browser.close();
  }
}

runTest();
