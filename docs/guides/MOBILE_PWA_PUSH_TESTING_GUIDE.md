# Mobile PWA Push Notification Testing Guide

## Overview

This guide provides comprehensive instructions for testing PWA (Progressive Web App) push notifications on mobile devices for the Student Notification System.

**Test Objective**: Verify that push notifications work correctly on mobile devices (iOS Safari and Android Chrome) when the app is installed as a PWA.

---

## Prerequisites

### Required Devices
- [ ] iOS device (iPhone/iPad) running iOS 16.4+ (for push notification support)
- [ ] Android device running Android 5.0+ with Chrome browser

### Required Setup
- [ ] Development server accessible from mobile devices (same network or ngrok tunnel)
- [ ] HTTPS enabled (required for service workers and push notifications)
- [ ] Valid VAPID keys configured for Web Push (if using push protocol)
- [ ] Student account credentials for testing

### Network Setup Options

#### Option 1: Local Network Access
If your mobile device is on the same network as your dev machine:
```bash
# Find your local IP address
# On Windows:
ipconfig
# Look for IPv4 Address under your active network adapter

# On Mac/Linux:
ifconfig
# or
ip addr show

# Update your .env.local to allow external access
# Start dev server accessible from network
npm run dev -- -H 0.0.0.0
```
Access via: `https://<your-local-ip>:3000`

#### Option 2: ngrok Tunnel (Recommended for Testing)
```bash
# Install ngrok if not already installed
# https://ngrok.com/download

# Start your dev server
npm run dev

# In another terminal, create tunnel
ngrok http 3000

# Use the HTTPS URL provided by ngrok (e.g., https://abc123.ngrok.io)
```

---

## Part 1: iOS Safari Testing

### Limitations & Important Notes

⚠️ **iOS Push Notification Requirements:**
- iOS 16.4+ required (released March 2023)
- Only works with PWAs added to Home Screen
- Service Worker must be registered
- User must explicitly grant permission
- Push API uses Apple's Push Notification service

### Step 1: Install PWA on iOS

1. **Open Safari** on your iOS device
2. **Navigate** to your app URL (local IP or ngrok URL)
3. **Login** with a student account
4. **Tap the Share button** (square with arrow pointing up)
5. **Scroll down** and tap "Add to Home Screen"
6. **Customize the name** if desired (e.g., "Genia Student")
7. **Tap "Add"** in the top right corner
8. **Verify** the app icon appears on your home screen

### Step 2: Enable Push Notifications

1. **Open the PWA** from your home screen (NOT from Safari browser)
   - Important: It must open in standalone mode (no Safari UI)
2. **Navigate to Profile** settings
3. **Scroll to "Notification Preferences"** section
4. **Locate "Push Notifications" toggle**
5. **Tap to enable** push notifications
6. **Grant permission** when iOS system prompt appears:
   - Should show: "[App Name] Would Like to Send You Notifications"
   - Tap "Allow"

**Expected Result:** ✅ Toggle should show "Enabled" state

### Step 3: Trigger Test Notification

#### Method 1: Complete a Challenge
1. Navigate to Challenges section
2. Complete a daily challenge
3. Submit your work
4. **Wait 5-10 seconds** for notification processing

#### Method 2: Earn a Badge
1. Perform an action that earns a badge
2. **Wait 5-10 seconds** for notification processing

#### Method 3: Manual Trigger (via Database)
Using Supabase Dashboard or SQL:
```sql
-- Insert a test notification for your user
INSERT INTO student_notifications (
  user_id,
  type,
  title,
  message,
  created_at
) VALUES (
  '<your-user-id>',
  'daily_challenge',
  'Test Push Notification',
  'This is a test notification from the system',
  NOW()
);
```

### Step 4: Verify System Notification

1. **Lock your iPhone** or **switch to home screen**
2. **Check for notification banner** at the top
3. **Check Notification Center** (swipe down from top)
4. **Verify notification contains:**
   - App icon
   - Notification title
   - Notification message
   - Correct timestamp

**Expected Results:**
- ✅ Notification appears as iOS system notification
- ✅ Notification displays app icon
- ✅ Tapping notification opens the PWA
- ✅ Notification appears in Notification Center

### Step 5: Test Notification Interaction

1. **Tap the notification**
2. **Verify:**
   - PWA opens to correct page
   - Notification is marked as read in the app
   - Badge count decreases

### Step 6: Test With App Closed

1. **Completely close the PWA** (swipe up in app switcher)
2. **Trigger another notification** (use one of the methods above)
3. **Verify notification still appears** as system notification
4. **Tap notification** and verify app opens

**Expected Result:** ✅ Notifications work even when app is closed

### Step 7: Test Notification Preferences

1. **Open the PWA**
2. **Go to Profile > Notification Preferences**
3. **Disable push notifications**
4. **Trigger a notification** (via challenge, badge, etc.)
5. **Verify NO system notification appears**
6. **Re-enable push notifications**
7. **Trigger another notification**
8. **Verify system notification DOES appear**

**Expected Result:** ✅ Preference toggle correctly controls push notifications

---

## Part 2: Android Chrome Testing

### Step 1: Install PWA on Android

1. **Open Chrome** on your Android device
2. **Navigate** to your app URL (local IP or ngrok URL)
3. **Login** with a student account
4. **Tap the menu button** (three dots) in Chrome
5. **Select "Install app"** or "Add to Home Screen"
   - Or look for the install banner prompt at the bottom
6. **Tap "Install"** when prompted
7. **Verify** the app icon appears on your home screen or app drawer

### Step 2: Enable Push Notifications

1. **Open the PWA** from your home screen
2. **Navigate to Profile** settings
3. **Scroll to "Notification Preferences"** section
4. **Locate "Push Notifications" toggle**
5. **Tap to enable** push notifications
6. **Grant permission** when Android system prompt appears:
   - Should show permission dialog for notifications
   - Tap "Allow"

**Expected Result:** ✅ Toggle should show "Enabled" state

### Step 3: Trigger Test Notification

Use the same methods as iOS (see Step 3 above):
- Complete a challenge
- Earn a badge
- Manual database insertion

### Step 4: Verify System Notification

1. **Swipe down** from the top to open notification shade
2. **Check for notification**
3. **Verify notification contains:**
   - App icon
   - Notification title
   - Notification message
   - Correct timestamp
   - Notification actions (if configured)

**Expected Results:**
- ✅ Notification appears in Android notification shade
- ✅ Notification displays app icon and badge
- ✅ Tapping notification opens the PWA
- ✅ Notification can be dismissed

### Step 5: Test Notification Interaction

1. **Tap the notification**
2. **Verify:**
   - PWA opens to correct page
   - Notification is marked as read
   - Badge count updates

### Step 6: Test With App in Background

1. **Press home button** (don't close the app)
2. **Trigger a notification**
3. **Verify notification appears** in notification shade
4. **Open another app**
5. **Trigger another notification**
6. **Verify notification still appears**

**Expected Result:** ✅ Notifications work when app is in background

### Step 7: Test With App Fully Closed

1. **Open recent apps** (square/overview button)
2. **Swipe away the PWA** to fully close it
3. **Trigger a notification**
4. **Verify notification appears**
5. **Tap notification**
6. **Verify app opens**

**Expected Result:** ✅ Notifications work even when app is fully closed

### Step 8: Test Notification Preferences

1. **Open the PWA**
2. **Go to Profile > Notification Preferences**
3. **Test each notification type toggle:**
   - Disable "Daily Challenge" notifications
   - Trigger a daily challenge notification
   - Verify NO notification appears
   - Re-enable and verify notification DOES appear
4. **Repeat for other notification types**

**Expected Result:** ✅ Each preference toggle correctly controls its notification type

---

## Part 3: Cross-Platform Advanced Testing

### Test 1: Multiple Notification Types

**Objective:** Verify different notification types display correctly

1. **Trigger each notification type:**
   - 🎯 Daily Challenge
   - 🔥 Streak Reminder
   - 🏆 Badge Earned
   - 👥 Peer Review
   - 📖 New Module
   - 💡 AI Nudge

2. **For each notification, verify:**
   - Correct icon displayed
   - Correct title
   - Correct message
   - Appropriate action when tapped

### Test 2: Notification Batching

**Objective:** Test multiple notifications arriving quickly

1. **Trigger 5+ notifications rapidly** (via database inserts)
2. **Verify:**
   - All notifications appear
   - Notifications are not lost
   - Badge count is accurate
   - Each notification is individually dismissible

### Test 3: Offline Behavior

**Objective:** Test notification behavior when offline

1. **Enable Airplane Mode** on device
2. **Trigger notifications** (via another device or scheduled)
3. **Wait 2-3 minutes**
4. **Disable Airplane Mode**
5. **Verify:**
   - Notifications appear when back online
   - In-app notifications sync correctly
   - No duplicate notifications

### Test 4: Permission Revocation

**Objective:** Test behavior when permission is revoked

**iOS:**
1. **Go to iOS Settings** > **[App Name]** > **Notifications**
2. **Disable "Allow Notifications"**
3. **Trigger a notification**
4. **Verify:** No system notification appears
5. **Open PWA** and check notification preferences
6. **Verify:** Toggle shows disabled or prompts to re-enable in Settings

**Android:**
1. **Long-press the app icon**
2. **Tap "App info"**
3. **Tap "Notifications"**
4. **Disable notifications**
5. **Trigger a notification**
6. **Verify:** No system notification appears
7. **Open PWA** and check notification preferences
8. **Verify:** Toggle reflects disabled state

### Test 5: Time Zone Handling

**Objective:** Verify timestamps display correctly

1. **Change device time zone**
2. **Trigger notifications**
3. **Verify:**
   - Timestamps are accurate for new time zone
   - "5 min ago" formatting is correct
   - Preferred notification time respects time zone

### Test 6: Do Not Disturb Mode

**Objective:** Test notification delivery during DND

1. **Enable Do Not Disturb** mode on device
2. **Trigger notifications**
3. **Verify:**
   - Notifications are delivered but silent
   - Notifications appear in notification center
   - Badge counts update

### Test 7: Battery Optimization

**Objective:** Test with battery saver enabled

**Android:**
1. **Enable Battery Saver** mode
2. **Trigger notifications**
3. **Verify:** Notifications still arrive (may have slight delay)

**iOS:**
1. **Enable Low Power Mode**
2. **Trigger notifications**
3. **Verify:** Notifications still arrive

---

## Part 4: Performance & Reliability Testing

### Test 1: Notification Delivery Time

**Objective:** Measure notification latency

1. **Note the time** when you trigger a notification
2. **Note the time** when notification appears
3. **Calculate delay**

**Expected Result:** Notification appears within 5-10 seconds

### Test 2: Large Volume Test

**Objective:** Test system with many notifications

1. **Insert 50+ notifications** via database
2. **Verify:**
   - App doesn't crash
   - Notifications load quickly
   - Scrolling is smooth
   - Mark all as read works

### Test 3: Service Worker Registration

**Objective:** Verify service worker is active

**Android Chrome:**
1. Open PWA
2. Open Chrome DevTools Remote Debugging
3. Navigate to Application > Service Workers
4. Verify service worker is "Activated and running"

**iOS Safari:**
1. Connect device to Mac with Safari Web Inspector
2. Develop > [Your Device] > [Your PWA]
3. Check Console for service worker registration logs

### Test 4: Subscription Persistence

**Objective:** Verify push subscription survives app restart

1. **Enable push notifications**
2. **Note the subscription status**
3. **Fully close and reopen the PWA**
4. **Check notification preferences**
5. **Verify:** Push still enabled
6. **Trigger a notification**
7. **Verify:** Notification appears

**Expected Result:** ✅ Subscription persists across app restarts

---

## Part 5: User Experience Testing

### Test 1: First-Time User Flow

**Objective:** Test the complete onboarding experience

1. **Install PWA** on a fresh device
2. **Create a new account** or login
3. **Navigate to profile**
4. **Observe notification preferences UI**
5. **Enable push notifications**
6. **Verify:**
   - Permission request is clear and understandable
   - Instructions are helpful (especially on iOS)
   - Toggle states are obvious
   - Success message appears

### Test 2: iOS Manual Installation Instructions

**Objective:** Test the iOS-specific installation guide

1. **On iOS, try to enable push** before adding to home screen
2. **Verify:**
   - Helpful message explains need to install PWA first
   - Instructions for adding to home screen are shown
   - Icons/screenshots are helpful

### Test 3: Accessibility

**Objective:** Verify notifications are accessible

1. **Enable VoiceOver (iOS)** or **TalkBack (Android)**
2. **Navigate to notification preferences**
3. **Verify:**
   - All toggles are properly labeled
   - Screen reader announces state changes
   - Notifications are announced when they arrive
4. **Trigger a notification**
5. **Verify:**
   - Notification content is read correctly
   - Actions are accessible

### Test 4: Notification Content Quality

**Objective:** Verify notification messages are clear

For each notification type, verify:
- ✅ Title is concise and descriptive
- ✅ Message provides clear value
- ✅ Icon is appropriate and recognizable
- ✅ Action (tap) leads to relevant page
- ✅ No spelling or grammar errors
- ✅ Localization is correct (if applicable)

---

## Common Issues & Troubleshooting

### Issue: Notifications Not Appearing on iOS

**Possible Causes & Solutions:**

1. **iOS version too old**
   - Check: Settings > General > About > Software Version
   - Solution: Update to iOS 16.4 or later

2. **App not installed as PWA**
   - Check: Look for Safari UI elements (if present, not a PWA)
   - Solution: Add to Home Screen via Safari Share menu

3. **Service Worker not registered**
   - Check: Console logs for service worker errors
   - Solution: Ensure HTTPS and valid manifest.json

4. **Permission not granted**
   - Check: iOS Settings > [App Name] > Notifications
   - Solution: Enable notifications in iOS Settings

5. **Web Push not supported in browser mode**
   - Issue: Safari browser doesn't support Web Push, only PWA mode
   - Solution: Must install as PWA

### Issue: Notifications Not Appearing on Android

**Possible Causes & Solutions:**

1. **Permission denied**
   - Check: App Info > Notifications
   - Solution: Enable notifications in system settings

2. **Service Worker not active**
   - Check: chrome://serviceworker-internals
   - Solution: Unregister and re-register service worker

3. **Battery optimization blocking**
   - Check: Settings > Battery > Battery Optimization
   - Solution: Exempt app from battery optimization

4. **Chrome version too old**
   - Check: Chrome version in About Chrome
   - Solution: Update Chrome to latest version

### Issue: Push Subscription Fails

**Possible Causes & Solutions:**

1. **VAPID keys not configured**
   - Check: Environment variables
   - Solution: Generate and configure VAPID keys

2. **Network error**
   - Check: Browser console for errors
   - Solution: Verify network connectivity and API endpoint

3. **User already has subscription**
   - Check: Database for existing subscription
   - Solution: Update existing subscription instead of creating new

### Issue: Notifications Delayed

**Possible Causes & Solutions:**

1. **Battery saver enabled**
   - Check: Device battery settings
   - Solution: Disable battery optimization for app

2. **Poor network connection**
   - Check: Network signal strength
   - Solution: Test on better connection

3. **Background processing restrictions**
   - Check: iOS Background App Refresh settings
   - Solution: Enable Background App Refresh for PWA

---

## Testing Checklist

Use this checklist to track your testing progress:

### iOS Safari

- [ ] PWA installs successfully via "Add to Home Screen"
- [ ] App opens in standalone mode (no Safari UI)
- [ ] Push notification toggle appears in preferences
- [ ] Permission prompt appears when enabling push
- [ ] System notification appears after granting permission
- [ ] Notification displays correct icon, title, message
- [ ] Tapping notification opens PWA to correct page
- [ ] Notification appears when app is closed
- [ ] Notification appears when device is locked
- [ ] Disabling push stops system notifications
- [ ] Re-enabling push resumes system notifications
- [ ] All notification types work correctly
- [ ] Subscription persists after app restart
- [ ] No console errors or warnings

### Android Chrome

- [ ] PWA installs successfully
- [ ] Install prompt appears automatically
- [ ] Push notification toggle appears in preferences
- [ ] Permission prompt appears when enabling push
- [ ] System notification appears in notification shade
- [ ] Notification displays correct icon, title, message
- [ ] Tapping notification opens PWA to correct page
- [ ] Notification appears when app is in background
- [ ] Notification appears when app is closed
- [ ] Notification action buttons work (if configured)
- [ ] Disabling push stops system notifications
- [ ] Re-enabling push resumes system notifications
- [ ] All notification types work correctly
- [ ] Subscription persists after app restart
- [ ] No console errors or warnings

### Cross-Platform

- [ ] All notification types tested
- [ ] Multiple notifications batch correctly
- [ ] Offline/online transitions handled
- [ ] Permission revocation handled gracefully
- [ ] Time zones handled correctly
- [ ] Do Not Disturb respected
- [ ] Battery saver doesn't break notifications
- [ ] Delivery time is acceptable (<10 seconds)
- [ ] Large volume (50+ notifications) works
- [ ] Service worker stays active
- [ ] Subscription persists
- [ ] First-time user flow is smooth
- [ ] Accessibility features work
- [ ] Notification content is high quality

---

## Test Results Documentation

### Test Session Information

**Date:** ________________
**Tester:** ________________
**App Version:** ________________
**Environment:** ☐ Development ☐ Staging ☐ Production

### iOS Testing Results

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| PWA Installation | ☐ | ☐ | |
| Permission Request | ☐ | ☐ | |
| Notification Display | ☐ | ☐ | |
| Notification Interaction | ☐ | ☐ | |
| App Closed Notifications | ☐ | ☐ | |
| Preference Controls | ☐ | ☐ | |
| All Notification Types | ☐ | ☐ | |
| Subscription Persistence | ☐ | ☐ | |

**iOS Device:** ________________
**iOS Version:** ________________
**Safari Version:** ________________

### Android Testing Results

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| PWA Installation | ☐ | ☐ | |
| Permission Request | ☐ | ☐ | |
| Notification Display | ☐ | ☐ | |
| Notification Interaction | ☐ | ☐ | |
| Background Notifications | ☐ | ☐ | |
| App Closed Notifications | ☐ | ☐ | |
| Preference Controls | ☐ | ☐ | |
| All Notification Types | ☐ | ☐ | |
| Subscription Persistence | ☐ | ☐ | |

**Android Device:** ________________
**Android Version:** ________________
**Chrome Version:** ________________

### Issues Found

**Issue #1:**
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low
**Description:** _____________________________________________
**Steps to Reproduce:** _______________________________________
**Expected:** _______________________________________________
**Actual:** ________________________________________________
**Screenshot/Video:** ________________________________________

**Issue #2:**
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low
**Description:** _____________________________________________
**Steps to Reproduce:** _______________________________________
**Expected:** _______________________________________________
**Actual:** ________________________________________________
**Screenshot/Video:** ________________________________________

### Overall Assessment

**iOS PWA Push Notifications:** ☐ Pass ☐ Fail ☐ Pass with Issues
**Android PWA Push Notifications:** ☐ Pass ☐ Fail ☐ Pass with Issues

**Ready for Production:** ☐ Yes ☐ No ☐ With Fixes

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## Developer Notes

### Service Worker Configuration

The service worker is configured in `next.config.js` using next-pwa:
- **Destination:** `public/`
- **Auto-register:** Enabled
- **Skip waiting:** Enabled
- **Reload on online:** Enabled
- **Disabled in dev:** Yes

### Push Notification Flow

1. **User enables push** in NotificationPreferences.tsx
2. **Permission requested** via `Notification.requestPermission()`
3. **Service worker registers** push subscription
4. **Subscription sent** to `/api/notifications/subscribe-push`
5. **Stored** in `notification_preferences.push_subscription`
6. **Server sends push** via Web Push protocol
7. **Service worker receives** push event
8. **Displays notification** via `registration.showNotification()`

### Key Files

- `src/components/notifications/NotificationPreferences.tsx` - UI for enabling push
- `src/hooks/usePWA.ts` - PWA utilities including push notification hooks
- `src/app/api/notifications/subscribe-push/route.ts` - Push subscription endpoint
- `src/lib/services/studentNotificationService.ts` - Notification service with push methods
- `public/sw.js` - Service worker (auto-generated by next-pwa)
- `next.config.js` - PWA configuration

### Environment Variables Required

```env
# Web Push VAPID Keys (if using Web Push Protocol)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your@email.com
```

### Generating VAPID Keys

```bash
npx web-push generate-vapid-keys
```

---

## Additional Resources

- [iOS Web Push Documentation](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Android Chrome Push Notifications](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)

---

## Sign-Off

**Tested By:** ______________________
**Date:** ______________________
**Signature:** ______________________

**QA Approved:** ☐ Yes ☐ No
**QA Lead:** ______________________
**Date:** ______________________

---

*This testing guide should be updated as the notification system evolves.*
