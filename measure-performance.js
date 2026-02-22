#!/usr/bin/env node
/**
 * Performance measurement script using Lighthouse
 * Measures page load performance for capsules with multimedia content
 */

const lighthouse = require('lighthouse').default || require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

const TARGET_URL = 'http://localhost:3000/capsules/cap-1-1';
const PERFORMANCE_THRESHOLD = 90;
const LCP_THRESHOLD = 2500; // milliseconds
const PAGE_LOAD_THRESHOLD = 3000; // milliseconds

async function runLighthouse() {
  console.log('🚀 Starting Lighthouse performance audit...\n');
  console.log(`Target URL: ${TARGET_URL}`);
  console.log(`Performance threshold: ${PERFORMANCE_THRESHOLD}`);
  console.log(`LCP threshold: ${LCP_THRESHOLD}ms`);
  console.log(`Page load threshold: ${PAGE_LOAD_THRESHOLD}ms\n`);

  let chrome;
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });

    // Run Lighthouse
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      throttlingMethod: 'simulate',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      }
    };

    const runnerResult = await lighthouse(TARGET_URL, options);

    // Extract metrics
    const { lhr } = runnerResult;
    const performanceScore = lhr.categories.performance.score * 100;

    // Core Web Vitals
    const metrics = lhr.audits.metrics.details.items[0];
    const lcp = metrics.largestContentfulPaint;
    const fcp = metrics.firstContentfulPaint;
    const tti = metrics.interactive;
    const speedIndex = metrics.speedIndex;
    const tbt = metrics.totalBlockingTime;
    const cls = metrics.cumulativeLayoutShift;

    // Save full report
    const reportJson = JSON.stringify(lhr, null, 2);
    fs.writeFileSync('./lighthouse-report.json', reportJson);

    // Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 PERFORMANCE RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Performance Score: ${performanceScore.toFixed(1)}/100 ${performanceScore >= PERFORMANCE_THRESHOLD ? '✅' : '❌'}`);
    console.log('');

    console.log('Core Web Vitals:');
    console.log(`  • LCP (Largest Contentful Paint): ${lcp}ms ${lcp <= LCP_THRESHOLD ? '✅' : '❌'}`);
    console.log(`  • FCP (First Contentful Paint): ${fcp}ms`);
    console.log(`  • TTI (Time to Interactive): ${tti}ms ${tti <= PAGE_LOAD_THRESHOLD ? '✅' : '❌'}`);
    console.log(`  • Speed Index: ${speedIndex}ms`);
    console.log(`  • TBT (Total Blocking Time): ${tbt}ms`);
    console.log(`  • CLS (Cumulative Layout Shift): ${cls}`);
    console.log('');

    // Detailed audits
    console.log('Key Optimizations:');
    const audits = lhr.audits;

    // Check critical audits
    const criticalAudits = [
      { key: 'render-blocking-resources', title: 'Eliminate render-blocking resources' },
      { key: 'unused-css-rules', title: 'Remove unused CSS' },
      { key: 'unused-javascript', title: 'Remove unused JavaScript' },
      { key: 'modern-image-formats', title: 'Use modern image formats' },
      { key: 'offscreen-images', title: 'Defer offscreen images' },
      { key: 'unminified-css', title: 'Minify CSS' },
      { key: 'unminified-javascript', title: 'Minify JavaScript' },
      { key: 'efficient-animated-content', title: 'Use video formats for animated content' },
      { key: 'uses-text-compression', title: 'Enable text compression' },
      { key: 'uses-long-cache-ttl', title: 'Use efficient cache policy' }
    ];

    criticalAudits.forEach(({ key, title }) => {
      const audit = audits[key];
      if (audit && audit.score !== null) {
        const score = audit.score * 100;
        const status = score >= 90 ? '✅' : score >= 50 ? '⚠️' : '❌';
        const savings = audit.details?.overallSavingsMs;
        const savingsText = savings ? ` (save ${savings}ms)` : '';
        console.log(`  ${status} ${title}: ${score.toFixed(0)}%${savingsText}`);
      }
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Recommendations
    if (performanceScore < PERFORMANCE_THRESHOLD || lcp > LCP_THRESHOLD || tti > PAGE_LOAD_THRESHOLD) {
      console.log('🔧 OPTIMIZATION RECOMMENDATIONS:\n');

      if (performanceScore < PERFORMANCE_THRESHOLD) {
        console.log('❌ Performance score is below threshold');
        console.log('   → Current: ' + performanceScore.toFixed(1));
        console.log('   → Target: ' + PERFORMANCE_THRESHOLD);
        console.log('');
      }

      if (lcp > LCP_THRESHOLD) {
        console.log('❌ LCP (Largest Contentful Paint) is too slow');
        console.log('   → Current: ' + lcp + 'ms');
        console.log('   → Target: < ' + LCP_THRESHOLD + 'ms');
        console.log('   Suggestions:');
        console.log('   - Add priority="true" to above-the-fold images');
        console.log('   - Preload critical resources');
        console.log('   - Optimize image sizes');
        console.log('');
      }

      if (tti > PAGE_LOAD_THRESHOLD) {
        console.log('❌ Time to Interactive is too slow');
        console.log('   → Current: ' + tti + 'ms');
        console.log('   → Target: < ' + PAGE_LOAD_THRESHOLD + 'ms');
        console.log('   Suggestions:');
        console.log('   - Code-split large dependencies');
        console.log('   - Defer non-critical JavaScript');
        console.log('   - Use dynamic imports for heavy components');
        console.log('');
      }

      // Check for specific issues
      if (audits['render-blocking-resources']?.score < 0.9) {
        console.log('⚠️  Render-blocking resources detected');
        console.log('   - Consider inlining critical CSS');
        console.log('   - Defer non-critical CSS/JS');
        console.log('');
      }

      if (audits['unused-javascript']?.score < 0.9) {
        console.log('⚠️  Unused JavaScript detected');
        console.log('   - Use dynamic imports for multimedia components');
        console.log('   - Tree-shake unused code');
        console.log('');
      }

      if (audits['offscreen-images']?.score < 0.9) {
        console.log('⚠️  Offscreen images loading eagerly');
        console.log('   - Lazy loading is implemented, ensure it\'s working');
        console.log('   - Check Intersection Observer configuration');
        console.log('');
      }
    } else {
      console.log('✅ All performance metrics meet requirements!\n');
      console.log('Performance Score: ' + performanceScore.toFixed(1) + '/100 ✅');
      console.log('LCP: ' + lcp + 'ms ✅');
      console.log('Page Load (TTI): ' + tti + 'ms ✅');
      console.log('');
    }

    console.log('📄 Full report saved to: ./lighthouse-report.json\n');

    // Exit code based on success
    const success = performanceScore >= PERFORMANCE_THRESHOLD &&
                    lcp <= LCP_THRESHOLD &&
                    tti <= PAGE_LOAD_THRESHOLD;

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('❌ Error running Lighthouse:', error.message);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Check if server is running
console.log('Checking if dev server is running...');
const http = require('http');
http.get('http://localhost:3000', (res) => {
  console.log('✅ Dev server is running\n');
  runLighthouse();
}).on('error', (err) => {
  console.error('❌ Dev server is not running on port 3000');
  console.error('   Please start the dev server with: npm run dev');
  process.exit(1);
});
