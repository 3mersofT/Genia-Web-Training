# Module Detail Pages - Manual Verification Checklist

**Verification Date**: ___________
**Tester Name**: ___________
**Server URL**: http://localhost:3001

---

## Quick Verification Guide

### Before You Start
1. Ensure development server is running: `npm run dev`
2. Open browser to http://localhost:3001
3. Open Chrome DevTools (F12)
4. Open the Console tab to monitor for errors
5. Open the Network tab to monitor JSON file loading

---

## Module 1: Fondamentaux

**URL**: http://localhost:3001/modules/fondamentaux

### Visual Checks
- [ ] Page loads without errors
- [ ] Module title displays: "Découverte et Fondamentaux du Prompt Engineering"
- [ ] Blue gradient banner shows at top of module card
- [ ] Module description displays
- [ ] Progress bar displays
- [ ] Capsule list shows all lessons from Module 1

### Functional Checks
- [ ] Click "Dashboard" link → navigates back to dashboard
- [ ] Hover over capsule items → background changes
- [ ] Click "Commencer" button → navigates to capsule page
- [ ] Feedback button exists and is clickable

### Console Checks
- [ ] No JavaScript errors in Console tab
- [ ] No 404 errors in Network tab
- [ ] Network tab shows lazy loading (only module 1 JSON files loaded)

---

## Module 2: Techniques

**URL**: http://localhost:3001/modules/techniques

### Visual Checks
- [ ] Page loads without errors
- [ ] Module title displays correctly
- [ ] Purple gradient banner shows
- [ ] Module description displays
- [ ] Progress bar displays
- [ ] Capsule list shows all lessons from Module 2

### Functional Checks
- [ ] Click "Dashboard" link → navigates back to dashboard
- [ ] Hover over capsule items → background changes
- [ ] Click "Commencer" button → navigates to capsule page
- [ ] Feedback button exists and is clickable

### Console Checks
- [ ] No JavaScript errors in Console tab
- [ ] No 404 errors in Network tab
- [ ] Network tab shows lazy loading (only module 2 JSON files loaded)

---

## Module 3: Pratique

**URL**: http://localhost:3001/modules/pratique

### Visual Checks
- [ ] Page loads without errors
- [ ] Module title displays correctly
- [ ] Green gradient banner shows
- [ ] Module description displays
- [ ] Progress bar displays
- [ ] Capsule list shows all lessons from Module 3

### Functional Checks
- [ ] Click "Dashboard" link → navigates back to dashboard
- [ ] Hover over capsule items → background changes
- [ ] Click "Commencer" button → navigates to capsule page
- [ ] Feedback button exists and is clickable

### Console Checks
- [ ] No JavaScript errors in Console tab
- [ ] No 404 errors in Network tab
- [ ] Network tab shows lazy loading (only module 3 JSON files loaded)

---

## Edge Case: Invalid Module

**URL**: http://localhost:3001/modules/invalid-slug

### Expected Behavior
- [ ] Shows "Module non trouvé" message
- [ ] Shows link to return to dashboard
- [ ] No console errors
- [ ] Graceful error handling

---

## Performance Verification

### Lazy Loading Test
1. Open Network tab in DevTools
2. Filter by ".json" files
3. Navigate to `/modules/fondamentaux`
   - [ ] Only module 1 JSON files are loaded
4. Navigate to `/modules/techniques`
   - [ ] Only module 2 JSON files are loaded (module 1 not reloaded)
5. Go back to `/modules/fondamentaux`
   - [ ] No new network requests (data served from cache)

### Load Time
- [ ] Initial page load < 2 seconds
- [ ] Subsequent loads < 500ms (cached)
- [ ] No performance warnings in console

---

## Common Issues to Look For

❌ **If you see these, report them:**
- Console errors mentioning "undefined" or "null"
- 404 errors for JSON files
- Blank/white screen instead of module content
- Capsule list is empty
- Progress bar doesn't display
- Module title is missing or shows as "undefined"
- Gradients don't display correctly

✅ **These are expected:**
- Warning about large chunks (this is being optimized)
- Redirect to /login if not authenticated
- Locked capsules showing lock icon

---

## Sign-Off

**All Checks Completed**: ☐ Yes ☐ No

**Issues Found**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

**Verification Status**: ☐ PASS ☐ FAIL

**Tester Signature**: _____________________ **Date**: __________

---

## Notes

This checklist verifies that module detail pages:
1. Load correctly with all metadata
2. Display capsule lists properly
3. Handle navigation correctly
4. Show no console errors
5. Implement lazy loading correctly
6. Use memoization for performance

The verification confirms the lazy loading and memoization optimizations implemented in this task are working correctly.
