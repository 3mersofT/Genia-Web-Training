# Capsule Pages Manual Verification Checklist

**Subtask:** 5-5 - Verify capsule pages load on-demand
**Date:** 2026-02-28
**Server:** http://localhost:3002

---

## Purpose

This checklist provides step-by-step instructions for manually verifying that capsule pages load correctly with the lazy loading optimization. While automated checks confirm technical functionality, manual testing verifies the user experience and visual rendering.

---

## Pre-Testing Setup

- [ ] Development server running: `npm run dev`
- [ ] Server URL confirmed: http://localhost:3002 (check console output)
- [ ] Browser: Chrome/Firefox with DevTools available
- [ ] Clear browser cache for accurate testing

---

## Test 1: Basic Capsule Page Load

**URL:** http://localhost:3002/capsules/cap_1_1

### Visual Elements
- [ ] Page loads without errors
- [ ] Capsule title displays in header (Leçon 1)
- [ ] Metadata displays: order, duration, difficulty
- [ ] Feedback stats shows thumbs up/down counts
- [ ] Feedback button present and clickable
- [ ] Section navigation sidebar visible on left
- [ ] First section (Hook/Accroche) is active by default
- [ ] Main content area displays Hook section content

### Header Elements
- [ ] Retour button with arrow icon
- [ ] Capsule title visible
- [ ] Leçon number displays
- [ ] Clock icon with duration
- [ ] Difficulty level shows

---

## Test 2: Section Navigation

**URL:** http://localhost:3002/capsules/cap_1_1

### Click Through All Sections
- [ ] Click Hook section - content changes, section highlights in blue
- [ ] Click Concept section - content changes, icons change
- [ ] Click Demo section - content changes, before/after shows
- [ ] Click Exercise section - content changes, textarea appears
- [ ] Click Recap section - content changes, key points show

### Verify Section Icons
- [ ] Hook has Target icon
- [ ] Concept has BookOpen icon
- [ ] Demo has Play icon
- [ ] Exercise has Trophy icon
- [ ] Recap has CheckCircle icon

---

## Test 3: Content Rendering

**URL:** http://localhost:3002/capsules/cap_1_1

### Hook Section
- [ ] Blue gradient background
- [ ] Target icon and title Pourquoi cette capsule va vous être utile
- [ ] Text content displays
- [ ] Duration shows with clock icon
- [ ] Multimedia content renders (if present)

### Concept Section
- [ ] White background with border
- [ ] BookOpen icon and title Concept clé
- [ ] Markdown content renders correctly
- [ ] Bold text styled in blue
- [ ] Code blocks have syntax highlighting
- [ ] Lists render with bullets/numbers
- [ ] Tables render if present

### Demo Section
- [ ] Green gradient background
- [ ] Play icon and title Démonstration pratique
- [ ] Version vague (red background) displays
- [ ] Version professionnelle (green background) displays
- [ ] Explanation text shows

### Exercise Section
- [ ] Amber gradient background
- [ ] Trophy icon and title À vous de jouer!
- [ ] Instructions display
- [ ] Starter prompt shows
- [ ] Textarea for user input
- [ ] Valider ma réponse button present
- [ ] After clicking, solution reveals
- [ ] Hints display (if present)

### Recap Section
- [ ] Purple gradient background
- [ ] CheckCircle icon and title Points clés à retenir
- [ ] Key point displays with lightbulb icon
- [ ] Next steps show
- [ ] Marquer la leçon comme terminée button present (if logged in)

---

## Test 4: Navigation Between Capsules

**URL:** http://localhost:3002/capsules/cap_1_2

### Previous Capsule Button
- [ ] Précédent button shows previous capsule title
- [ ] ChevronLeft icon displays
- [ ] Click navigates to previous capsule
- [ ] URL changes to previous capsule ID
- [ ] Content loads correctly

### Next Capsule Button
- [ ] Suivant button shows next capsule title
- [ ] ChevronRight icon displays
- [ ] Blue background styling
- [ ] Click navigates to next capsule
- [ ] URL changes to next capsule ID
- [ ] Content loads correctly

### First Capsule Edge Case
**URL:** http://localhost:3002/capsules/cap_1_1
- [ ] No Précédent button displays (first capsule)
- [ ] Suivant button still shows

### Last Capsule Edge Case
**URL:** http://localhost:3002/capsules/cap_3_36
- [ ] Précédent button shows
- [ ] Formation terminée! button instead of Suivant
- [ ] Green background styling
- [ ] Clicking goes to dashboard

---

## Test 5: Multiple Modules

### Module 1 Capsule
**URL:** http://localhost:3002/capsules/cap_1_5
- [ ] Loads successfully
- [ ] All sections render
- [ ] Navigation works

### Module 2 Capsule
**URL:** http://localhost:3002/capsules/cap_2_15
- [ ] Loads successfully
- [ ] All sections render
- [ ] Navigation works
- [ ] Different content from Module 1

### Module 3 Capsule
**URL:** http://localhost:3002/capsules/cap_3_30
- [ ] Loads successfully
- [ ] All sections render
- [ ] Navigation works
- [ ] Different content from Module 1 and 2

---

## Test 6: Error Handling

### Invalid Capsule ID
**URL:** http://localhost:3002/capsules/invalid_capsule_id
- [ ] Capsule non trouvée message displays
- [ ] Retour au dashboard link present
- [ ] Link works and navigates to dashboard
- [ ] No JavaScript errors in console

---

## Test 7: Browser Console Verification

### Console Errors
- [ ] Open DevTools (F12)
- [ ] Navigate to Console tab
- [ ] Load http://localhost:3002/capsules/cap_1_1
- [ ] Verify NO error messages (red text)
- [ ] Verify NO warning messages (yellow text)
- [ ] Only info messages allowed (if any)

### Network Tab - Lazy Loading
- [ ] Open DevTools Network tab
- [ ] Clear network log
- [ ] Load http://localhost:3002/capsules/cap_1_1
- [ ] Look for JSON file requests
- [ ] Verify specific capsule JSON loads (e.g., module1_capsules_1_3.json)
- [ ] Navigate to different capsule
- [ ] Verify different JSON file loads on demand
- [ ] Not all JSON files loaded at once

---

## Test 8: Performance Check

### Initial Load Time
- [ ] Open DevTools Network tab
- [ ] Clear cache (hard reload)
- [ ] Load http://localhost:3002/capsules/cap_1_1
- [ ] Check total page load time (should be fast)
- [ ] Check number of requests (should be reasonable)
- [ ] Check total bundle size (should be smaller than before optimization)

### Subsequent Load (Cache Test)
- [ ] Navigate to different capsule
- [ ] Navigate back to cap_1_1
- [ ] Second load should be faster (cache hit)
- [ ] Check Network tab for 304 Not Modified or cache hits

---

## Test 9: Responsive Design

### Desktop View (1920x1080)
- [ ] Section sidebar on left
- [ ] Content area uses remaining space
- [ ] Navigation buttons properly spaced

### Tablet View (768px)
- [ ] Layout adjusts appropriately
- [ ] All content readable
- [ ] Navigation still works

### Mobile View (375px)
- [ ] Section sidebar adapts or stacks
- [ ] Content readable on small screen
- [ ] Buttons accessible

---

## Test 10: Interactive Features

### Exercise Section
**URL:** http://localhost:3002/capsules/cap_1_1 (Exercise section)
- [ ] Type in textarea
- [ ] Text appears as typed
- [ ] Click Valider ma réponse
- [ ] Solution section reveals
- [ ] Solution text displays correctly
- [ ] Hints section displays (if present)

### Feedback Button
**URL:** http://localhost:3002/capsules/cap_1_1
- [ ] Click feedback button
- [ ] Modal or form opens
- [ ] Can submit feedback
- [ ] Feedback stats update (if logged in)

### Mark as Complete Button
**URL:** http://localhost:3002/capsules/cap_1_1 (Recap section, logged in)
- [ ] Button shows in Recap section
- [ ] Click button
- [ ] Loading state shows
- [ ] Success message appears
- [ ] Redirects to module or dashboard

---

## Test 11: Back Navigation

### Back to Module
**URL:** http://localhost:3002/capsules/cap_1_5
- [ ] Click Retour button
- [ ] Should navigate to /modules/fondamentaux
- [ ] Module page loads correctly
- [ ] Capsule marked as visited/completed if applicable

### Back to Dashboard (if module not found)
- [ ] Retour button works
- [ ] Falls back to /dashboard if no module context

---

## Summary Checklist

- [ ] All capsule pages load (cap_1_1, cap_1_5, cap_2_15, cap_3_30, cap_3_36)
- [ ] All content sections render correctly
- [ ] Navigation between capsules works
- [ ] No console errors
- [ ] JSON files load on-demand (Network tab)
- [ ] Performance is good (fast loads)
- [ ] Interactive features work
- [ ] Error handling works (invalid IDs)
- [ ] Responsive design works
- [ ] Back navigation works

---

## Test Results

**Tester Name:** _________________
**Date:** _________________
**Browser:** _________________
**Status:** ☐ PASS  ☐ FAIL

**Issues Found:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Sign-Off

**Tester Signature:** _________________
**Date:** _________________

**Status:**
- [ ] All tests PASSED - ready for next subtask
- [ ] Issues found - requires fixes before proceeding
