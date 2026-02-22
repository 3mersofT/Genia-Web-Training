#!/bin/bash

# Performance measurement script using Lighthouse CLI
# Measures page load performance for capsules with multimedia content

TARGET_URL="http://localhost:3000/capsules/cap-1-1"
PERFORMANCE_THRESHOLD=90
LCP_THRESHOLD=2500
PAGE_LOAD_THRESHOLD=3000

echo "🚀 Starting Lighthouse performance audit..."
echo ""
echo "Target URL: $TARGET_URL"
echo "Performance threshold: $PERFORMANCE_THRESHOLD"
echo "LCP threshold: ${LCP_THRESHOLD}ms"
echo "Page load threshold: ${PAGE_LOAD_THRESHOLD}ms"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server is not running on port 3000"
    echo "   Please start the dev server with: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Run Lighthouse
npx lighthouse "$TARGET_URL" \
    --only-categories=performance \
    --output=json \
    --output=html \
    --output-path=./lighthouse-report \
    --chrome-flags="--headless --no-sandbox" \
    --throttling-method=simulate \
    --quiet

if [ ! -f "./lighthouse-report.report.json" ]; then
    echo "❌ Lighthouse report not generated"
    exit 1
fi

# Parse results using Node.js
node - <<'EOF'
const fs = require('fs');

try {
    const report = JSON.parse(fs.readFileSync('./lighthouse-report.report.json', 'utf8'));

    const performanceScore = report.categories.performance.score * 100;
    const metrics = report.audits.metrics.details.items[0];
    const lcp = metrics.largestContentfulPaint;
    const fcp = metrics.firstContentfulPaint;
    const tti = metrics.interactive;
    const speedIndex = metrics.speedIndex;
    const tbt = metrics.totalBlockingTime;
    const cls = metrics.cumulativeLayoutShift;

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 PERFORMANCE RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    const perfPass = performanceScore >= 90;
    const lcpPass = lcp <= 2500;
    const ttiPass = tti <= 3000;

    console.log(`Performance Score: ${performanceScore.toFixed(1)}/100 ${perfPass ? '✅' : '❌'}`);
    console.log('');

    console.log('Core Web Vitals:');
    console.log(`  • LCP (Largest Contentful Paint): ${lcp}ms ${lcpPass ? '✅' : '❌'}`);
    console.log(`  • FCP (First Contentful Paint): ${fcp}ms`);
    console.log(`  • TTI (Time to Interactive): ${tti}ms ${ttiPass ? '✅' : '❌'}`);
    console.log(`  • Speed Index: ${speedIndex}ms`);
    console.log(`  • TBT (Total Blocking Time): ${tbt}ms`);
    console.log(`  • CLS (Cumulative Layout Shift): ${cls.toFixed(3)}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════\n');

    if (perfPass && lcpPass && ttiPass) {
        console.log('✅ All performance metrics meet requirements!\n');
        console.log(`Performance Score: ${performanceScore.toFixed(1)}/100 ✅`);
        console.log(`LCP: ${lcp}ms ✅`);
        console.log(`Page Load (TTI): ${tti}ms ✅`);
        console.log('');
        process.exit(0);
    } else {
        console.log('🔧 OPTIMIZATION NEEDED:\n');

        if (!perfPass) {
            console.log(`❌ Performance score: ${performanceScore.toFixed(1)}/100 (target: ≥90)`);
        }
        if (!lcpPass) {
            console.log(`❌ LCP: ${lcp}ms (target: ≤2500ms)`);
        }
        if (!ttiPass) {
            console.log(`❌ TTI: ${tti}ms (target: ≤3000ms)`);
        }
        console.log('');

        console.log('Recommendations:');
        console.log('  - Implement code splitting for large dependencies');
        console.log('  - Add priority loading for above-the-fold images');
        console.log('  - Defer non-critical JavaScript');
        console.log('  - Optimize bundle size');
        console.log('');

        process.exit(1);
    }
} catch (error) {
    console.error('❌ Error parsing Lighthouse report:', error.message);
    process.exit(1);
}
EOF

EXIT_CODE=$?

echo "📄 Reports saved:"
echo "   - JSON: ./lighthouse-report.report.json"
echo "   - HTML: ./lighthouse-report.report.html"
echo ""

exit $EXIT_CODE
