# Visual Page Editor - Staff Guide

## Quick Start

The Visual Page Editor allows you to edit ANY page on SUCCESS.com without touching code!

### Access the Editor

1. Go to **https://www.success.com/admin/page-editor**
2. Select a page from the list (Press, About, Magazine, etc.)
3. Add CSS overrides to change colors, fonts, sizes, etc.
4. Click "Save Changes"
5. Refresh the page to see your changes live!

---

## How to Edit a Page

### Step 1: Find the Element

1. Open the page you want to edit: **https://www.success.com/press**
2. Right-click the text/element you want to change
3. Select **"Inspect"** (Chrome/Edge) or **"Inspect Element"** (Firefox)
4. Look for the CSS class or ID in the Inspector:
   - Classes start with a dot: `.title`
   - IDs start with a hash: `#header`

### Step 2: Add an Override

In the Page Editor:

1. **CSS Selector**: Enter the class or ID you found (e.g., `.title`)
2. **CSS Property**: Enter what you want to change (e.g., `color`, `font-size`)
3. **Value**: Enter the new value (e.g., `#FF0000`, `32px`)
4. Click **"Add Override"**

### Step 3: Save & Preview

1. Click **"💾 Save Changes"**
2. Click **"👁️ Preview Page"** to see it in a new tab
3. Refresh the preview to see your changes

---

## Common Edits

### Change Text Color

- **Selector**: `.title` or the class name you found
- **Property**: `color`
- **Value**: `#FF0000` (red), `#0066CC` (blue), `#000000` (black)

### Change Font Size

- **Selector**: `.title`
- **Property**: `fontSize` or `font-size`
- **Value**: `24px`, `2rem`, `32px`

### Change Background Color

- **Selector**: `.hero` or section class
- **Property**: `backgroundColor` or `background-color`
- **Value**: `#FFFFFF` (white), `#F5F5F5` (light gray)

### Change Font Weight (Bold)

- **Selector**: `.title`
- **Property**: `fontWeight` or `font-weight`
- **Value**: `bold`, `600`, `700`

---

## Examples

### Example 1: Change Press Page Title Color

1. Page: `/press`
2. Element: "Press & Media" heading
3. Override:
   - **Selector**: `.title`
   - **Property**: `color`
   - **Value**: `#0066CC`

### Example 2: Make About Page Subtitle Bigger

1. Page: `/about`
2. Element: Subtitle text
3. Override:
   - **Selector**: `.subtitle`
   - **Property**: `fontSize`
   - **Value**: `1.5rem`

---

## Tips & Tricks

### Finding the Right Selector

- Use **Chrome DevTools** (F12) to inspect elements
- Look for unique class names like `.hero`, `.title`, `.subtitle`
- If multiple elements share a class, use a more specific selector like `.hero .title`

### Color Codes

- Use hex codes: `#FF0000` (red), `#00FF00` (green), `#0000FF` (blue)
- Or color names: `red`, `blue`, `white`, `black`
- Or RGB: `rgb(255, 0, 0)`

### Font Sizes

- Pixels: `16px`, `24px`, `32px`
- Relative: `1rem`, `1.5rem`, `2rem`
- Percentages: `125%`, `150%`

### Reset Everything

If you mess up, click **"🔄 Reset All"** to remove all overrides for that page.

---

## Available Pages

You can edit these pages from the admin dashboard:

- `/press` - Press & Media
- `/about` - About Us
- `/magazine` - Magazine
- `/subscribe` - Subscribe
- `/contact` - Contact
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/advertise` - Advertise
- `/store` - Store
- `/help` - Help Center

---

## Need Help?

- **Test on staging first** before making changes to production
- **Use the Preview button** to see changes before saving
- **Reset if needed** - you can always undo changes
- **Ask for help** if you're not sure about a CSS property

Happy editing! 🎨
