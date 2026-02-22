# Student Notification System - Testing Guide

## Automated Test Results

✅ **E2E Tests**: 7/7 passing
- API endpoints available
- Component rendering works
- TypeScript types valid
- Service layer functional

Run automated tests with:
```bash
npm run test:e2e -- tests/e2e/notifications.spec.ts
```

---

## Manual Testing Checklist

### Prerequisites
- [ ] Login as a student user
- [ ] Ensure development server is running (`npm run dev`)
- [ ] Open browser DevTools console to monitor for errors

### 1. Notification Bell Icon
**Location**: Dashboard navigation bar

- [ ] Navigate to `/dashboard`
- [ ] Verify bell icon (🔔) appears in top navigation
- [ ] Check if unread badge count displays (red circle with number)
- [ ] Badge should show "9+" for counts over 9

**Expected**: Bell icon visible with appropriate badge count

---

### 2. Notification Center Panel
**Location**: Click bell icon to open

- [ ] Click the bell icon
- [ ] Verify notification panel opens (dropdown from bell)
- [ ] Check panel header shows "Notifications" title
- [ ] Verify unread count badge appears in header ("X nouvelles")
- [ ] Check close button (X) is visible in top-right

**Expected**: Panel opens smoothly with proper layout

---

### 3. Notification Display
**Location**: Inside notification panel

- [ ] Verify notifications display with appropriate icons:
  - 🎯 Daily Challenge (blue Target icon)
  - 🔥 Streak Reminder (orange Flame icon)
  - 🏆 Badge Earned (yellow Trophy icon)
  - 👥 Peer Review (purple Users icon)
  - 📖 New Module (green BookOpen icon)
  - 💡 AI Nudge (indigo Lightbulb icon)
- [ ] Check unread notifications have blue background
- [ ] Verify read notifications have white background
- [ ] Check time stamps display correctly ("5min", "2h", "3j")
- [ ] Verify notification title and message are readable

**Expected**: All notifications display with correct styling and icons

---

### 4. Notification Filters
**Location**: Filter bar below header in panel

- [ ] Check "Toutes" (All) filter button shows total count
- [ ] Verify filter buttons appear only for notification types present
- [ ] Click different filter buttons
- [ ] Verify notifications filter correctly
- [ ] Check active filter has blue background
- [ ] Verify inactive filters have white background

**Expected**: Filtering works smoothly, showing only selected types

---

### 5. Mark as Read (Individual)
**Location**: Click on unread notification

- [ ] Find an unread notification (blue background)
- [ ] Note the current unread badge count
- [ ] Click the notification
- [ ] Verify notification background changes to white
- [ ] Check unread badge count decreases by 1
- [ ] Reload page and verify change persists

**Expected**: Notification marked as read, badge count updates

---

### 6. Mark All as Read
**Location**: Checkmark button in panel header

- [ ] Ensure there are unread notifications
- [ ] Click the checkmark (✓) icon in header
- [ ] Verify all notifications become white (read)
- [ ] Check badge count goes to 0
- [ ] Verify badge disappears from bell icon
- [ ] Reload page and verify all still marked as read

**Expected**: All notifications marked as read in one action

---

### 7. Cleanup Old Notifications
**Location**: Footer of notification panel

- [ ] Open notification panel
- [ ] Click "Nettoyer anciennes" button (trash icon)
- [ ] Wait for action to complete
- [ ] Verify no error messages appear
- [ ] Check old notifications are removed

**Expected**: Old notifications cleaned up without errors

---

### 8. Notification Preferences
**Location**: `/profile` page

- [ ] Navigate to `/profile`
- [ ] Scroll to "Notification Preferences" section
- [ ] Verify all notification type toggles are present:
  - [ ] Daily Challenge
  - [ ] Streak Reminder
  - [ ] Badge Earned
  - [ ] Peer Review
  - [ ] New Module
  - [ ] AI Nudge
- [ ] Toggle each preference on/off
- [ ] Check toggle states update visually
- [ ] Verify "Save" or auto-save functionality works
- [ ] Reload page and verify preferences persist

**Expected**: All preferences toggleable and persistent

---

### 9. Email Digest Settings
**Location**: `/profile` → Notification Preferences

- [ ] Find "Email Digest Frequency" dropdown/selector
- [ ] Verify options available:
  - [ ] Immediate
  - [ ] Daily Summary
  - [ ] Weekly Summary
  - [ ] Off
- [ ] Change selection
- [ ] Save/verify auto-save
- [ ] Reload page and verify preference persists

**Expected**: Email digest preference saved correctly

---

### 10. Preferred Notification Time
**Location**: `/profile` → Notification Preferences

- [ ] Find "Preferred Time" time picker
- [ ] Click to open time selector
- [ ] Select a specific time
- [ ] Save/verify auto-save
- [ ] Reload page and verify time persists

**Expected**: Preferred time saved and displays correctly

---

### 11. Push Notifications Permission
**Location**: `/profile` → Notification Preferences

- [ ] Find "Push Notifications" toggle
- [ ] Check browser support message (if unsupported browser)
- [ ] Click toggle to enable
- [ ] Verify browser permission prompt appears
- [ ] Grant permission
- [ ] Check toggle shows enabled state
- [ ] Disable push notifications
- [ ] Verify toggle shows disabled state

**Expected**: Browser permission prompt appears, state updates

---

### 12. Real-Time Updates
**Location**: Open two browser tabs/windows

Tab 1:
- [ ] Login and open `/dashboard`
- [ ] Open notification panel
- [ ] Note current notification count

Tab 2:
- [ ] Login with same account
- [ ] Trigger a notification (complete a challenge)

Back to Tab 1:
- [ ] WITHOUT refreshing, check notification panel
- [ ] Verify new notification appears automatically
- [ ] Check badge count updates
- [ ] Verify notification displays with correct content

**Expected**: Real-time updates via Supabase subscription work

---

### 13. Notification Triggers

#### Challenge Completion
- [ ] Complete a daily challenge
- [ ] Open notification panel
- [ ] Verify notification appears for challenge completion
- [ ] Check notification has correct icon and message

#### Badge Earned
- [ ] Perform action that earns a badge
- [ ] Open notification panel
- [ ] Verify "Badge Earned" notification appears
- [ ] Check badge name is displayed correctly

#### Peer Review Received
- [ ] Have another user submit peer review for your work
- [ ] Open notification panel
- [ ] Verify peer review notification appears
- [ ] Check reviewer name is mentioned

**Expected**: All event triggers create appropriate notifications

---

### 14. No Console Errors
**Location**: Browser DevTools Console

Throughout all above tests:
- [ ] Monitor console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify no 500 errors
- [ ] Confirm no JavaScript exceptions
- [ ] Expected 401 errors are OK if not authenticated

**Expected**: No unexpected errors or warnings

---

### 15. Mobile Responsive Design
**Location**: Use DevTools device emulation

- [ ] Open DevTools
- [ ] Switch to mobile device view (iPhone, Android)
- [ ] Navigate to `/dashboard`
- [ ] Check bell icon is visible and clickable
- [ ] Open notification panel
- [ ] Verify panel fits screen width
- [ ] Check all interactions work on touch
- [ ] Verify text is readable
- [ ] Test on actual mobile device if possible

**Expected**: Fully responsive on mobile devices

---

## Performance Testing

### Load Time
- [ ] Measure time to load dashboard with notifications
- [ ] Check notification panel opens quickly (< 200ms)
- [ ] Verify real-time subscription connects fast
- [ ] Monitor memory usage over time

**Expected**: No performance degradation

### Large Notification Count
- [ ] Test with 50+ notifications
- [ ] Verify scrolling is smooth
- [ ] Check filtering still works quickly
- [ ] Verify mark all as read handles bulk update

**Expected**: Handles large data sets efficiently

---

## Accessibility Testing

- [ ] Navigate using keyboard only (Tab, Enter, Esc)
- [ ] Verify bell icon is keyboard accessible
- [ ] Check panel closes with Esc key
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify ARIA labels are present
- [ ] Check color contrast meets WCAG AA standards

**Expected**: Fully accessible to assistive technologies

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Expected**: Works consistently across all browsers

---

## Integration with Existing Features

### Daily Challenges
- [ ] Complete a challenge
- [ ] Verify notification appears
- [ ] Check notification links to challenge

### Badge System
- [ ] Earn a badge
- [ ] Verify notification appears
- [ ] Check badge details are correct

### Peer Review
- [ ] Submit peer review
- [ ] Verify recipient gets notification
- [ ] Check notification content is accurate

**Expected**: Seamless integration with all features

---

## Error Handling

### Network Failures
- [ ] Disconnect network
- [ ] Try to load notifications
- [ ] Verify graceful error handling
- [ ] Reconnect network
- [ ] Check notifications load correctly

### Invalid Data
- [ ] Test with corrupted notification data (via DB)
- [ ] Verify app doesn't crash
- [ ] Check error is logged appropriately

**Expected**: Graceful degradation, no crashes

---

## Test Results

| Test Category | Pass | Fail | Notes |
|--------------|------|------|-------|
| Bell Icon | ☐ | ☐ | |
| Panel Display | ☐ | ☐ | |
| Mark as Read | ☐ | ☐ | |
| Preferences | ☐ | ☐ | |
| Real-Time | ☐ | ☐ | |
| Triggers | ☐ | ☐ | |
| Mobile | ☐ | ☐ | |
| Accessibility | ☐ | ☐ | |
| Browser Compat | ☐ | ☐ | |

---

## Issue Reporting Template

If you find a bug during testing:

```
**Issue**: Brief description
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**: What should happen
**Actual Behavior**: What actually happened
**Browser**: Chrome 120
**Device**: Desktop/Mobile
**Screenshot**: Attach if available
**Console Errors**: Copy any errors from console
```

---

## Sign-Off

- **Tester Name**: _______________
- **Date**: _______________
- **Version**: _______________
- **Overall Status**: ☐ Pass ☐ Fail ☐ Pass with Issues
- **Notes**: _______________________________________________

---

## Automated Verification

After manual testing, run automated checks:

```bash
# TypeScript compilation
npx tsc --noEmit

# Build verification
npm run build

# E2E tests
npm run test:e2e -- tests/e2e/notifications.spec.ts
```

All automated checks should pass: ✅
