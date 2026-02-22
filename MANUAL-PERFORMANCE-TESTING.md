# Manual Performance Testing Guide

## Objective
Verify that the multimedia content feature meets performance requirements:
- **Performance Score**: > 90
- **LCP (Largest Contentful Paint)**: < 2.5s
- **Page Load Time (TTI)**: < 3s

## Prerequisites

1. **Dev Server Running**:
   ```bash
   # Stop any existing servers
   # Start fresh dev server
   cd F:\GitHub\Claude\genia-web-training\.auto-claude\worktrees\tasks\010-multimedia-content-support-in-capsules
   npm run dev
   ```

2. **Chrome Browser**: Use latest version of Google Chrome

3. **Test Page**: http://localhost:3000/capsules/cap-1-1

## Method 1: Chrome DevTools Lighthouse (Recommended)

### Steps:

1. **Open the Test Page**
   - Navigate to: `http://localhost:3000/capsules/cap-1-1`
   - Wait for page to fully load

2. **Open Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

3. **Navigate to Lighthouse Tab**
   - Click on "Lighthouse" tab in DevTools
   - If not visible, click the `>>` icon and select "Lighthouse"

4. **Configure Lighthouse**
   - Mode: **Navigation (Default)**
   - Device: **Desktop** (or Mobile for mobile testing)
   - Categories: **Performance** only (uncheck others for faster run)
   - Clear Storage: **Unchecked** (for realistic caching)

5. **Run Audit**
   - Click "Analyze page load" button
   - Wait for audit to complete (~30 seconds)

6. **Review Results**
   - Check Performance Score: Should be **> 90**
   - Expand "Metrics" section
   - Verify Core Web Vitals:
     - **LCP**: Should be < 2.5s (< 2500ms)
     - **TBT**: Should be < 200ms
     - **CLS**: Should be < 0.1
     - **FCP**: Should be < 1.8s
     - **Speed Index**: Should be < 3.4s
     - **TTI**: Should be < 3.0s

### What to Look For:

✅ **PASS Criteria**:
- Performance Score: 90-100 (Green)
- LCP < 2500ms
- TTI < 3000ms
- No major warnings in "Opportunities" section

⚠️ **WARNING Signs**:
- Performance Score: 50-89 (Orange)
- LCP > 2500ms but < 4000ms
- Multiple warnings in "Opportunities"

❌ **FAIL Criteria**:
- Performance Score: < 50 (Red)
- LCP > 4000ms
- TTI > 5000ms

### Screenshot:
Take a screenshot of the Lighthouse results showing:
1. Performance score
2. Core Web Vitals metrics
3. Any "Opportunities" or "Diagnostics" warnings

## Method 2: Lighthouse CLI

If DevTools Lighthouse is not available:

```bash
# Install Lighthouse globally (if not installed)
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000/capsules/cap-1-1 \
  --only-categories=performance \
  --view

# This will open an HTML report in your browser
```

**Check the same metrics** as Method 1.

## Method 3: Production Build Testing (Most Accurate)

For the most accurate performance measurement, test the production build:

```bash
# Build production version
npm run build

# Start production server (usually port 3000)
npm start

# Wait for server to start, then run Lighthouse on:
# http://localhost:3000/capsules/cap-1-1
```

**Production builds are optimized** and will show better performance than dev builds.

## Method 4: Network Throttling (Optional)

Test performance under slower network conditions:

1. **Open Chrome DevTools** (F12)
2. **Go to Network Tab**
3. **Select Throttling**: "Fast 3G" or "Slow 3G"
4. **Run Lighthouse** with this throttling enabled
5. **Verify Page Load < 3s** even on Fast 3G

## Expected Optimizations to Verify

### Visual Checks:

1. **Lazy Loading**:
   - Scroll down the page slowly
   - Videos and images below the fold should load only when near viewport
   - Check Network tab: images/videos load as you scroll

2. **Loading States**:
   - Spinner icons should appear before media loads
   - No layout shifts when content loads (CLS should be low)

3. **Code Splitting**:
   - Open Network tab > JS
   - Look for separate chunks for multimedia components
   - Components should load on-demand, not all upfront

### Network Tab Checks:

1. **Initial Bundle Size**:
   - Main bundle should be < 500KB (gzipped)
   - Check `_next/static/chunks/pages` files

2. **Lazy Loaded Resources**:
   - Images: Should have `loading="lazy"` attribute
   - Videos: Should load when scrolled into view
   - External scripts (YouTube, Vimeo): Only load when video is near viewport

3. **Caching**:
   - On second page load, static assets should load from disk cache
   - Check "Size" column shows "(disk cache)" or "(memory cache)"

## Troubleshooting

### Issue: Performance Score < 90

**Possible Causes**:
1. Dev server is slower than production
2. Other applications consuming CPU/memory
3. Browser extensions interfering

**Solutions**:
- Test production build instead
- Close other applications
- Use Chrome Incognito mode (disables extensions)
- Clear browser cache and retry

### Issue: LCP > 2.5s

**Possible Causes**:
1. Large images above the fold
2. Fonts not loading efficiently
3. Render-blocking resources

**Check**:
- Lighthouse "Opportunities" section
- Look for "Eliminate render-blocking resources"
- Look for "Properly size images"

### Issue: TTI > 3.0s

**Possible Causes**:
1. Too much JavaScript
2. Long tasks blocking main thread
3. Heavy third-party scripts

**Check**:
- Lighthouse "Diagnostics" section
- Look for "Avoid long main thread tasks"
- Check "Total Blocking Time" metric

## Recording Results

Create a results document with:

```markdown
## Performance Test Results

**Date**: [Date]
**Environment**: Development / Production
**Device**: Desktop / Mobile
**URL**: http://localhost:3000/capsules/cap-1-1

### Metrics:
- Performance Score: [XX]/100
- LCP: [XXXX]ms
- FCP: [XXXX]ms
- TTI: [XXXX]ms
- TBT: [XXX]ms
- CLS: [X.XXX]
- Speed Index: [XXXX]ms

### Result: PASS / FAIL

**Screenshots**: [Attach Lighthouse report screenshot]

**Notes**: [Any observations, warnings, or issues]
```

## Automated Testing (Optional)

For CI/CD integration, use the provided script:

```bash
# Run automated Lighthouse test
bash ./run-lighthouse.sh

# Check exit code
echo $?  # 0 = success, 1 = failed
```

## Success Criteria Checklist

- [ ] Performance Score > 90
- [ ] LCP < 2.5s (2500ms)
- [ ] TTI < 3.0s (3000ms)
- [ ] No critical "Opportunities" in Lighthouse
- [ ] Images lazy load below the fold
- [ ] Videos lazy load on scroll
- [ ] No layout shift when multimedia loads (CLS < 0.1)
- [ ] Page usable while multimedia loads (good TTI)
- [ ] Smooth animations (no jank)

## Next Steps

If all criteria pass:
1. Document results in `build-progress.txt`
2. Update `implementation_plan.json` subtask status to "completed"
3. Commit changes with performance results
4. Proceed to subtask 6-3 (end-to-end verification)

If criteria fail:
1. Review Lighthouse "Opportunities" and "Diagnostics"
2. Implement recommended optimizations
3. Re-test until passing
4. Document what optimizations were needed
