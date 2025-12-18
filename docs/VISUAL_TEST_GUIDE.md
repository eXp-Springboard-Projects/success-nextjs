# Visual Testing Guide - Featured PostCard Fix

**Date:** November 6, 2025
**Test Server:** http://localhost:3001
**Component:** Featured PostCard on Homepage

---

## 🎯 What to Test

Visit **http://localhost:3001** and check the **featured article** (large article at top of homepage).

---

## ✅ Expected Results

### Desktop View (> 768px)

**What you should see:**
1. ✅ **Face visible in upper portion** - No text covering the person's face
2. ✅ **Text in bottom 40%** - Title, excerpt, and metadata confined to bottom area
3. ✅ **Dark gradient background** - Text has strong dark background for readability
4. ✅ **No overflow** - Text doesn't expand beyond the dark overlay area

**Visual Check:**
```
┌─────────────────────────────────┐
│                                 │
│         [FACE AREA]             │ ← Top 60%
│       Should be clear           │   No text here
│                                 │
│         👤 Visible              │
├─────────────────────────────────┤ ← Dividing line
│  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■  │
│  ▓  CATEGORY                    │ ← Bottom 40%
│  ▓  Article Title Here          │   Text only
│  ▓  By Author Name              │
│  ▓  Excerpt text...             │
│  ▓  Read More →                 │
└─────────────────────────────────┘
```

### Tablet View (≤ 768px)

**Resize browser to ~768px width or less**

**What you should see:**
1. ✅ **Same 40% constraint** - Text still in bottom 40%
2. ✅ **Smaller fonts** - Text scales down but still readable
3. ✅ **Face still visible** - Upper 60% remains clear
4. ✅ **Gradient adjusted** - Proportional to smaller container

### Mobile View (≤ 480px)

**Resize browser to ~480px width or less**

**What you should see:**
1. ✅ **40% constraint maintained** - Text still confined to bottom
2. ✅ **Compact text** - Even smaller fonts but still clear
3. ✅ **Face visible** - Protection maintained on small screens
4. ✅ **No horizontal scrolling** - Content fits width

---

## ❌ What Should NOT Happen

### Red Flags (Report if you see):
1. ❌ **Text covering face** - Any text overlapping the person's face
2. ❌ **Text extending above midpoint** - Overlay should never reach 50% or higher
3. ❌ **Weak background** - Text should have strong dark background
4. ❌ **Text overflow** - No text should be cut off awkwardly
5. ❌ **Layout shift** - Page should not "jump" when loading

---

## 🔍 Specific Test Cases

### Test 1: Measure Overlay Height
1. Open browser DevTools (F12)
2. Inspect the featured article
3. Find element with class `featuredOverlay`
4. Check computed height
5. **Expected:** Height should be ≤ 40% of parent container

**How to verify:**
```javascript
// In browser console:
const container = document.querySelector('.featuredImageContainer');
const overlay = document.querySelector('.featuredOverlay');
const containerHeight = container.offsetHeight;
const overlayHeight = overlay.offsetHeight;
const percentage = (overlayHeight / containerHeight * 100).toFixed(1);
console.log(`Overlay is ${percentage}% of container`);
// Should show: "Overlay is 40.0% of container" or less
```

### Test 2: Long Title Check
**If the current article has a short title**, test with a long one:
1. Open DevTools
2. Find the `.featured .title` element
3. Right-click → Edit as HTML
4. Paste a very long title: "This Is An Extremely Long Article Title That Should Be Truncated To Exactly Two Lines And Not Expand Beyond That Limit"
5. **Expected:** Title should show only 2 lines with "..." at the end

### Test 3: Long Excerpt Check
Same as above but edit the `.featured .excerpt`:
1. Find excerpt element
2. Edit HTML with very long text
3. **Expected:** Only 2 lines show, rest is hidden

### Test 4: Face Position Verification
1. Look at the featured image
2. Locate the person's face in the image
3. Visually confirm face is in the **upper 60%** of the image
4. **Expected:** No text overlay on or near the face

---

## 📱 Responsive Testing Checklist

### Desktop (1920×1080)
- [ ] Face visible in upper area
- [ ] Text confined to bottom 40%
- [ ] Strong dark gradient
- [ ] No text overflow
- [ ] Read More button visible

### Laptop (1366×768)
- [ ] Same as desktop
- [ ] Layout proportional

### Tablet Landscape (1024×768)
- [ ] 40% rule maintained
- [ ] Text smaller but readable
- [ ] Face still protected

### Tablet Portrait (768×1024)
- [ ] Vertical layout works
- [ ] 40% rule maintained
- [ ] Gradient proportional

### Mobile (375×667 - iPhone SE)
- [ ] 40% rule maintained
- [ ] Compact but readable
- [ ] Face visible
- [ ] No horizontal scroll

### Large Mobile (414×896 - iPhone 11)
- [ ] Same as mobile
- [ ] Proportional spacing

---

## 🎨 Visual Quality Checks

### Typography
- [ ] Title is bold and prominent
- [ ] Excerpt is readable (not too small)
- [ ] Author name visible
- [ ] Category tag visible
- [ ] "Read More" link clear

### Colors & Contrast
- [ ] White text on dark background
- [ ] Category in accent color (red/pink)
- [ ] Gradient smooth (no banding)
- [ ] High contrast for readability

### Layout
- [ ] Elements vertically aligned
- [ ] Consistent spacing
- [ ] No awkward gaps
- [ ] Hover effects work

---

## 🐛 Known Issues (Acceptable)

### These are NORMAL and not bugs:
1. **Duplicate page warnings** in console - Harmless, doesn't affect users
2. **Image loading delay** - Normal, especially on slow connections
3. **Port 3001 instead of 3000** - Both servers running, 3001 is fine

---

## 🚀 Performance Checks

### Load Time
- [ ] Featured article visible within 2 seconds
- [ ] Image loads progressively
- [ ] No layout shift during load
- [ ] Text readable immediately

### Interactions
- [ ] Hover effects smooth
- [ ] Click/tap responsive
- [ ] No lag or jank
- [ ] Transitions smooth

---

## 📸 Screenshot Comparison

### Before Fix:
**Problem:** Text could cover faces

### After Fix:
**Solution:** Text confined to bottom 40%, faces always visible

**To capture:**
1. Take screenshot of homepage
2. Draw horizontal line at 60% mark
3. Verify all text is below that line
4. Verify face is above that line

---

## 🎯 Pass/Fail Criteria

### ✅ PASS if:
- Face completely visible (no text over it)
- Text stays in bottom 40% of image
- All text readable on dark background
- Works on all screen sizes tested
- No console errors related to PostCard

### ❌ FAIL if:
- Any text covers the face
- Overlay extends beyond 40%
- Text unreadable (poor contrast)
- Layout breaks on any screen size
- Console shows PostCard errors

---

## 🔧 If Issues Found

### Reporting Template:
```
Issue: [Brief description]
Screen size: [Width × Height]
Browser: [Chrome/Firefox/Safari]
Steps to reproduce:
1.
2.
3.

Expected: [What should happen]
Actual: [What actually happened]

Screenshot: [Attach if possible]
Console errors: [Copy any errors]
```

---

## ✅ Final Verification

After all tests pass:
1. [ ] Test on Chrome
2. [ ] Test on Firefox
3. [ ] Test on Safari (if Mac)
4. [ ] Test on mobile device (physical or emulator)
5. [ ] Test with different articles (if possible)
6. [ ] Verify no console errors
7. [ ] Verify no layout shifts
8. [ ] Verify faces always visible

---

## 📝 Test Results Template

```
Date: November 6, 2025
Tester: [Your name]
Browser: [Chrome/Firefox/Safari]
Version: [Browser version]

✅ Desktop (1920×1080)
✅ Laptop (1366×768)
✅ Tablet (768×1024)
✅ Mobile (375×667)

Issues found: None / [List issues]

Overall status: PASS / FAIL

Notes:
[Any additional observations]
```

---

**Testing URL:** http://localhost:3001
**Component:** Featured PostCard
**Expected Result:** Face always visible, text in bottom 40%

*Happy Testing!* 🎉
