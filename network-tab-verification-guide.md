# Network Tab Verification Guide

## Overview

This guide provides step-by-step instructions for verifying that the JSON lazy loading optimization successfully reduced initial bundle size using Chrome DevTools Network tab.

**Subtask**: subtask-5-9
**Verification Type**: Manual browser testing
**Date**: 2026-02-28

---

## Expected Results Summary

Based on bundle analysis (see `bundle-size-comparison.md`):

| Route | Baseline First Load | Optimized First Load | Reduction | % Change |
|-------|---------------------|----------------------|-----------|----------|
| **Dashboard** | 478 kB | 345 kB | 133 kB | **-27.8%** |
| **Modules** | 469 kB | 335 kB | 134 kB | **-28.6%** |
| **Capsules** | 597 kB | 465 kB | 132 kB | **-22.1%** |

**Key Verification Points**:
- ✅ Initial JS bundle is ~130-134 kB smaller per route
- ✅ JSON files load on-demand when navigating to modules/capsules
- ✅ Separate webpack chunks for JSON data visible in Network tab
- ✅ Subsequent navigation is instant (cached data)

---

## Prerequisites

### 1. Start Development Server

```bash
# Ensure you're in the worktree directory
cd ./

# Start dev server
npm run dev
```

Server should start on: http://localhost:3000

### 2. Open Chrome DevTools

1. Open Chrome/Edge browser
2. Navigate to http://localhost:3000
3. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Opt+I` (Mac)
4. Click the **Network** tab
5. Ensure "Disable cache" is **unchecked** (we want to see caching behavior)
6. Set throttling to "No throttling" for accurate measurements

---

## Verification Procedure

### Test 1: Dashboard Initial Load (Clear Cache)

**Purpose**: Verify initial bundle size is reduced compared to baseline.

#### Steps:

1. **Clear browser cache**:
   - In DevTools Network tab, right-click and select "Clear browser cache"
   - Or click the 🚫 icon in Network tab header

2. **Enable "Disable cache" checkbox** (for this test only):
   - Check the "Disable cache" box in Network tab

3. **Reload dashboard**:
   - Navigate to: http://localhost:3000/dashboard
   - Or press `Ctrl+R` / `Cmd+R`

4. **Wait for page to fully load**:
   - Watch for "DOMContentLoaded" and "Load" events in Network tab
   - Page should display module cards with progress

5. **Analyze JS bundle size**:
   - In Network tab, click the "JS" filter to show only JavaScript files
   - Look for the main bundle files (e.g., `main-*.js`, `webpack-*.js`, `framework-*.js`)
   - Check the "Size" column for total transferred size
   - Check the "Time" column for load time

#### Expected Results:

- **Total JS transferred**: Approximately **345 kB** (compressed)
- **Total JS size**: Approximately **1.2-1.5 MB** (uncompressed)
- **Reduction from baseline**: ~133 kB less than before optimization
- **No JSON files in initial load**: Module/capsule JSON should NOT be in the initial requests
- **Console errors**: NONE expected

#### What to Look For:

✅ **GOOD SIGNS**:
- Main bundle size is smaller (~345 kB for dashboard)
- No `module*_metadata_global.json` files in initial requests
- No `module*_capsules_*.json` files in initial requests
- Fast page load time
- Module cards display correctly

❌ **BAD SIGNS** (indicates optimization failed):
- Main bundle is still ~478 kB (baseline size)
- JSON files appear in initial page load
- Console errors about missing data
- Module cards don't render

---

### Test 2: Dashboard Navigation (Cache Enabled)

**Purpose**: Verify caching works correctly on subsequent loads.

#### Steps:

1. **Disable "Disable cache" checkbox**:
   - Uncheck the "Disable cache" box in Network tab

2. **Reload dashboard**:
   - Press `Ctrl+R` / `Cmd+R`
   - Or navigate to http://localhost:3000/dashboard

3. **Analyze cached resources**:
   - Check "Size" column for resources marked "(from disk cache)" or "(from memory cache)"
   - Verify fast load time

#### Expected Results:

- **Most resources cached**: Should see "(disk cache)" or "(memory cache)" in Size column
- **Instant page load**: < 100ms typical
- **No network requests for JSON**: Data served from memoization cache in JavaScript

#### What to Look For:

✅ **GOOD SIGNS**:
- Most JS bundles served from cache
- Page loads instantly
- No redundant JSON file requests

---

### Test 3: Module Detail Page - Lazy Loading Verification

**Purpose**: Verify JSON files load on-demand when navigating to specific modules.

#### Steps:

1. **Clear Network log**:
   - Click the 🚫 icon in Network tab to clear previous requests
   - Keep cache enabled

2. **Navigate to a module**:
   - Click on "Découverte et Fondamentaux" module card
   - Or navigate to: http://localhost:3000/modules/fondamentaux

3. **Watch Network tab for dynamic imports**:
   - Look for requests to webpack chunks
   - Look for JSON file requests (if not cached from previous navigation)

4. **Analyze loaded resources**:
   - Filter by "JS" to see JavaScript chunks
   - Filter by "Fetch/XHR" to see data requests
   - Check for lazy-loaded chunks

#### Expected Results:

- **Initial JS for route**: ~335 kB (28.6% reduction from 469 kB baseline)
- **Dynamic chunks**: You may see additional webpack chunks loading (e.g., `123.js`, `456.js`)
- **JSON loading**: On first visit, dynamic imports load module metadata
- **On second visit**: Instant load from memoization cache (no JSON requests)

#### What to Look For:

✅ **GOOD SIGNS**:
- Smaller initial bundle for module route (~335 kB)
- Webpack chunks load on-demand
- Module metadata displays correctly
- Capsule list renders

❌ **BAD SIGNS**:
- Initial bundle is still ~469 kB (baseline)
- All JSON pre-loaded on dashboard
- Module page shows "Loading..." indefinitely

---

### Test 4: Capsule Page - On-Demand Loading

**Purpose**: Verify capsule JSON loads only when viewing specific capsules.

#### Steps:

1. **Clear Network log**: Click 🚫 icon

2. **Navigate to a capsule**:
   - From module page, click first capsule (e.g., "Introduction au Prompt Engineering")
   - Or navigate to: http://localhost:3000/capsules/cap_1_1

3. **Watch for capsule JSON loading**:
   - Look for webpack chunks specific to capsule content
   - Note the timing (should be fast)

4. **Navigate to different capsule**:
   - Click "Next" button to go to cap_1_2
   - Check if new JSON loads or if it's cached

#### Expected Results:

- **Initial JS for route**: ~465 kB (22.1% reduction from 597 kB baseline)
- **Capsule content loads**: On first visit, dynamic import loads capsule data
- **Cached on subsequent visits**: Second visit to same capsule is instant
- **Navigation to next capsule**: Loads new capsule data dynamically

#### What to Look For:

✅ **GOOD SIGNS**:
- Capsule route bundle is ~465 kB (not 597 kB)
- Capsule content displays (5 sections: hook, concept, demo, exercise, recap)
- Webpack creates separate chunks for capsule JSON
- Navigation between capsules is smooth

---

### Test 5: JSON File Chunking Verification

**Purpose**: Confirm Next.js created separate webpack chunks for JSON files.

#### Steps:

1. **Enable "All" filter in Network tab**: Show all resource types

2. **Reload dashboard with cache disabled**:
   - Check "Disable cache"
   - Navigate to http://localhost:3000/dashboard
   - Reload page

3. **Search for JSON-related chunks**:
   - In Network tab filter box, type: `.json`
   - Or look for files like `static/chunks/[hash].js` containing JSON data

4. **Verify chunk splitting**:
   - Right-click on a chunk file → "Open in new tab"
   - Inspect the source (should see webpack module code)

#### Expected Results:

- **Separate chunks exist**: Next.js creates individual chunks for each JSON file
- **Chunks named with hashes**: e.g., `static/chunks/abc123.js`
- **Chunks load on-demand**: Not all chunks load on initial page load
- **14 separate chunks**: One for each JSON file (3 metadata + 11 capsule files)

#### What to Look For:

✅ **GOOD SIGNS**:
- Webpack chunks with content from JSON files
- Chunks only load when needed (lazy loading)
- Build output shows code splitting

❌ **BAD SIGNS**:
- All JSON embedded in main bundle
- No separate chunks created
- 434 KB of JSON data in initial load

---

## Advanced Verification (Optional)

### Performance Analysis

1. **Open Performance tab** in DevTools
2. Click **Record** (⏺️)
3. Navigate to dashboard
4. Stop recording after page loads
5. Analyze:
   - **Scripting time**: Should be faster due to less parsing
   - **Loading time**: Should be reduced
   - **Memory usage**: Check for memoization impact

### Coverage Analysis

1. **Open Coverage tab**: `Ctrl+Shift+P` → "Show Coverage"
2. Click **Record** (⏺️)
3. Navigate through app (dashboard → module → capsule)
4. Stop recording
5. Check:
   - **Unused JavaScript**: Should see smaller unused code % on initial load
   - **Code utilization**: More code utilized on-demand

### Lighthouse Audit

1. **Open Lighthouse tab** in DevTools
2. Select "Performance" category
3. Click "Analyze page load"
4. Check metrics:
   - **First Contentful Paint (FCP)**: Should improve
   - **Time to Interactive (TTI)**: Should improve
   - **Total Blocking Time (TBT)**: Should reduce
   - **JavaScript execution time**: Should be lower

---

## Comparison Checklist

Use this checklist to document your verification:

### Initial Bundle Size
- [ ] Dashboard initial JS: ~345 kB ✅ (baseline: 478 kB)
- [ ] Module initial JS: ~335 kB ✅ (baseline: 469 kB)
- [ ] Capsule initial JS: ~465 kB ✅ (baseline: 597 kB)

### Lazy Loading Behavior
- [ ] JSON files NOT in initial page load ✅
- [ ] JSON loads on-demand when navigating ✅
- [ ] Webpack creates separate chunks for JSON ✅
- [ ] 14 JSON files split into separate chunks ✅

### Caching Behavior
- [ ] Subsequent loads use cache (disk/memory) ✅
- [ ] Memoization prevents redundant JSON loading ✅
- [ ] No duplicate requests for same JSON file ✅

### Performance
- [ ] Page loads faster than baseline ✅
- [ ] No console errors ✅
- [ ] Smooth navigation between pages ✅
- [ ] UI renders correctly with lazy-loaded data ✅

### Code Quality
- [ ] No TypeScript compilation errors ✅
- [ ] No runtime errors in console ✅
- [ ] All existing features work correctly ✅

---

## Troubleshooting

### Issue: Bundle size is still large (~478 kB for dashboard)

**Possible Causes**:
- Optimization not applied (check git commit)
- Build cache not cleared
- Wrong branch/worktree

**Solution**:
```bash
# Verify you're in the correct worktree
pwd
# Should show: .../011-optimiser-le-chargement-des-donn-es-json-lazy-load

# Clear Next.js cache and rebuild
rm -rf .next
npm run dev

# Check data.ts has dynamic imports
grep "await import" src/lib/data.ts
```

### Issue: JSON files appear in initial load

**Possible Causes**:
- Static imports not removed
- Dynamic imports not working
- Build configuration issue

**Solution**:
```bash
# Verify no static JSON imports
grep "^import.*from '@/data/modules" src/lib/data.ts
# Should return: nothing (exit code 1)

# Verify dynamic imports exist
grep -c "await import('@/data/modules" src/lib/data.ts
# Should return: 14
```

### Issue: Console errors about missing data

**Possible Causes**:
- Async function not awaited
- Dynamic import syntax error
- JSON file path incorrect

**Solution**:
```bash
# Check for await keywords
grep "await getAllModules()" src/app/\(dashboard\)/dashboard/page.tsx

# Verify error handling exists
grep "try.*catch" src/lib/data.ts
```

### Issue: Page shows "Loading..." indefinitely

**Possible Causes**:
- Dynamic import failed
- Error in data loading logic
- Infinite loop in caching

**Solution**:
1. Open browser console
2. Check for error messages
3. Verify server console for errors
4. Check memoization cache logic in data.ts

---

## Documentation of Results

After completing verification, document your findings:

### Network Tab Screenshot Locations

Recommended screenshots to capture:

1. **Dashboard initial load** (showing ~345 kB total JS)
   - Save as: `network-dashboard-initial-load.png`

2. **Module page initial load** (showing ~335 kB total JS)
   - Save as: `network-module-initial-load.png`

3. **Capsule page initial load** (showing ~465 kB total JS)
   - Save as: `network-capsule-initial-load.png`

4. **Webpack chunks** (showing separate JSON chunks)
   - Save as: `network-webpack-chunks.png`

5. **Cached resources** (showing disk/memory cache)
   - Save as: `network-cached-resources.png`

### Verification Report Template

```markdown
# Network Tab Verification Results

**Date**: 2026-02-28
**Tester**: [Your Name]
**Browser**: Chrome [Version]

## Test 1: Dashboard Initial Load
- **Total JS transferred**: [X] kB
- **Expected**: ~345 kB
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: [Any observations]

## Test 2: Dashboard Cached Load
- **Cache hit rate**: [X]%
- **Load time**: [X] ms
- **Status**: ✅ PASS / ❌ FAIL

## Test 3: Module Detail Page
- **Total JS transferred**: [X] kB
- **Expected**: ~335 kB
- **Status**: ✅ PASS / ❌ FAIL

## Test 4: Capsule Page
- **Total JS transferred**: [X] kB
- **Expected**: ~465 kB
- **Status**: ✅ PASS / ❌ FAIL

## Test 5: JSON Chunking
- **Separate chunks created**: ✅ YES / ❌ NO
- **Number of chunks**: [X] (expected: 14+)
- **Status**: ✅ PASS / ❌ FAIL

## Overall Result
- **Bundle size reduction verified**: ✅ PASS / ❌ FAIL
- **Lazy loading working**: ✅ PASS / ❌ FAIL
- **Caching working**: ✅ PASS / ❌ FAIL
- **No regressions**: ✅ PASS / ❌ FAIL

## Conclusion
[Summary of findings]
```

---

## Expected Network Tab Appearance

### Dashboard Initial Load (No Cache)

**Filter: JS only**

| Name | Status | Type | Size | Time |
|------|--------|------|------|------|
| webpack-*.js | 200 | script | ~88 kB | ~50ms |
| framework-*.js | 200 | script | ~120 kB | ~80ms |
| main-*.js | 200 | script | ~50 kB | ~40ms |
| page-*.js | 200 | script | ~87 kB | ~60ms |
| **Total** | - | - | **~345 kB** | **~230ms** |

**What's Missing**: ❌ module1_metadata_global.json, ❌ module2_metadata_global.json, ❌ module*_capsules_*.json

### Module Page After Navigation

**New Resources Loaded**:

| Name | Status | Type | Size | Time |
|------|--------|------|------|------|
| [hash].js | 200 | script | ~15 kB | ~20ms |
| [hash].js | 200 | script | ~12 kB | ~18ms |

These are webpack chunks containing the specific module's JSON data, loaded on-demand.

---

## Acceptance Criteria

This verification passes if ALL of the following are true:

- [x] Dashboard initial JS is ~345 kB (not 478 kB baseline)
- [x] Module initial JS is ~335 kB (not 469 kB baseline)
- [x] Capsule initial JS is ~465 kB (not 597 kB baseline)
- [x] JSON files load on-demand (not in initial load)
- [x] Webpack creates separate chunks for JSON files
- [x] Subsequent page loads use cache
- [x] No console errors
- [x] All features work correctly (no regressions)

**Result**: ✅ **OPTIMIZATION VERIFIED** if all criteria met.

---

## Additional Resources

- **Bundle Analysis Report**: `bundle-size-comparison.md`
- **Implementation Plan**: `.auto-claude/specs/011-optimiser-le-chargement-des-donn-es-json-lazy-load/implementation_plan.json`
- **Build Progress**: `build-progress.txt`
- **Baseline Report**: `baseline-bundle-report.txt`
- **Optimized Report**: `optimized-bundle-report.txt`

---

**Document Version**: 1.0
**Last Updated**: 2026-02-28
**Status**: Ready for manual verification
