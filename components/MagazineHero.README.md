# MagazineHero Component

**Location:** `components/MagazineHero.js`
**Type:** Magazine Feature Banner Component
**Status:** ✅ Production Ready

---

## Overview

The MagazineHero component displays a featured magazine issue in a split-layout banner with:
- Magazine cover image (right side, 55% width)
- Magazine details and related articles (left side, 45% width)
- Fully responsive design that stacks on mobile

---

## Usage

```jsx
import MagazineHero from '../components/MagazineHero';

function MyPage({ latestMagazine }) {
  return (
    <div>
      <MagazineHero magazine={latestMagazine} />
    </div>
  );
}

export async function getStaticProps() {
  const magazines = await fetchWordPressData('magazines?per_page=1&_embed');
  const latestMagazine = magazines?.[0] || null;

  return {
    props: { latestMagazine },
    revalidate: 3600,
  };
}
```

---

## Props

### `magazine` (object | null)

The magazine object from WordPress API with the following structure:

```typescript
{
  id: number;
  slug: string;
  title: { rendered: string };
  _embedded: {
    'wp:featuredmedia': [{
      source_url: string; // Hero image URL
    }]
  };
  meta_data: {
    'magazine-banner-heading': [string];           // Main title
    'magazine-published-text': [string];           // Date text (e.g., "NOVEMBER 2025")
    'magazine-banner-description': [string];       // Description text
    'magazine-banner-description-link': [string];  // Optional link for description
    'magazine-banner-related-data': [string];      // PHP serialized related articles
    'image-for-listing-page': [string];            // Fallback image URL
  };
}
```

**Related Articles Data Structure** (PHP serialized):
```php
a:2:{
  s:6:"item-0";a:3:{
    s:25:"banner-related-data-title";s:30:"ARTICLE TITLE";
    s:31:"banner-related-data-description";s:39:"Article description text";
    s:24:"banner-related-data-link";s:37:"https://labs.success.com/url";
  }
  s:6:"item-1";a:3:{...}
}
```

---

## Features

### ✅ Core Features
- Split-layout design (text left, image right)
- Automatic PHP data unserialization
- Loading state when data unavailable
- Fallback error handling
- Fully responsive (mobile-first)

### ✅ Accessibility
- ARIA labels on section and links
- Keyboard navigation support
- Focus-visible styles (2px white outline)
- Descriptive link text for screen readers

### ✅ Performance
- Next.js Image component with automatic optimization
- Responsive image sizes: `(max-width: 992px) 100vw, 55vw`
- Priority loading for above-the-fold content
- Proper object-fit and positioning

### ✅ Interactions
- Hover effects on links (opacity/slide)
- Clickable related articles
- Optional clickable description

---

## Layout Behavior

### Desktop (> 992px)
```
┌─────────────────────────────────────────────┐
│ ┌─────────────────┐  ┌──────────────────┐  │
│ │  Text Content   │  │   Magazine       │  │
│ │  (45% width)    │  │   Cover Image    │  │
│ │  - Header       │  │   (55% width)    │  │
│ │  - Title        │  │                  │  │
│ │  - Description  │  │                  │  │
│ │  - Features     │  │                  │  │
│ └─────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────┘
```

### Mobile (≤ 992px)
```
┌─────────────────────┐
│   Magazine Cover    │
│   (100% width)      │
│   Image on top      │
└─────────────────────┘
┌─────────────────────┐
│   Text Content      │
│   (100% width)      │
│   Below image       │
└─────────────────────┘
```

---

## Styling

The component uses CSS Modules: `MagazineHero.module.css`

### Key Classes
- `.hero` - Main container (CSS Grid)
- `.overlay` - Text content wrapper
- `.heroImage` - Image container
- `.mainFeature` - Title and description area
- `.sideFeatures` - Related articles section
- `.featureLink` - Clickable related article
- `.descriptionLink` - Optional description link

### Customization Points

**Colors:**
```css
Background: #000 (black)
Text: #fff (white)
Links: Inherit (white) with hover effects
Borders: rgba(255, 255, 255, 0.3)
```

**Typography:**
```css
Header: 1rem, 800 weight, uppercase, 2px letter-spacing
Title: 3rem (desktop), 2rem (mobile), 900 weight
Description: 1.125rem
Features: 1.25rem titles
```

**Spacing:**
```css
Desktop padding: 4rem 3rem
Mobile padding: 1.5rem 1rem
Gap between elements: 2-3rem
```

---

## Data Source

**WordPress Endpoint:**
```
GET https://successcom.wpenginepowered.com/wp-json/wp/v2/magazines?per_page=1&_embed
```

**Required Query Parameters:**
- `per_page=1` - Get latest magazine only
- `_embed` - Include featured media and embedded data

**ISR Configuration:**
```javascript
revalidate: 3600  // Regenerate every hour
```

---

## Dependencies

### npm Packages
- `next/image` - Image optimization
- `phpunserialize` - Parse PHP serialized data from WordPress

### Project Modules
- `lib/htmlDecode` - Decode HTML entities in WordPress content
- `MagazineHero.module.css` - Component styles

---

## Error Handling

The component handles multiple failure scenarios:

1. **No Magazine Data**
   - Shows loading state UI
   - Displays "Loading magazine content..." message

2. **PHP Parsing Failure**
   - Primary: `phpunserialize()` attempt
   - Fallback: Regex pattern matching
   - Silent fail: Component continues without related articles

3. **Missing Images**
   - Falls back to `image-for-listing-page` custom field
   - Component still renders text content

4. **Missing Custom Fields**
   - Uses fallback values or empty strings
   - Component remains functional with reduced content

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 not tested/supported (Next.js 14 doesn't support IE11)

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| LCP | Optimized | Priority image loading |
| CLS | Stable | Fixed dimensions prevent layout shift |
| FID | Good | Minimal JS interaction |
| Bundle Size | ~5KB | Includes component + CSS |

---

## Testing Checklist

- [x] Builds without errors
- [x] Renders with valid magazine data
- [x] Shows loading state without data
- [x] Related articles clickable
- [x] Description link works (when present)
- [x] Image loads and optimizes
- [x] Responsive on mobile
- [x] Keyboard navigation works
- [x] Screen reader compatible
- [x] Hover effects functional

---

## Maintenance

### When to Update

1. **WordPress API changes** - If custom field names change
2. **Design updates** - Modify `.module.css` file
3. **New magazine fields** - Add to component logic
4. **Performance issues** - Adjust image sizes or loading strategy

### Common Modifications

**Change image size:**
```javascript
// In MagazineHero.js
<Image
  sizes="(max-width: 992px) 100vw, 60vw"  // Increase from 55vw to 60vw
  ...
/>
```

**Add more related articles:**
```javascript
// In MagazineHero.js, line 41
['item-0', 'item-1', 'item-2'].forEach(key => {  // Add item-2
  // ...
});
```

**Adjust responsive breakpoint:**
```css
/* In MagazineHero.module.css */
@media (max-width: 1200px) {  /* Change from 992px */
  .hero {
    grid-template-columns: 1fr;
  }
}
```

---

## Troubleshooting

### Issue: Image not loading
- Check `_embedded['wp:featuredmedia'][0].source_url` exists
- Verify image URL is accessible
- Check Next.js `images.domains` config in `next.config.js`

### Issue: Related articles not showing
- Verify `magazine-banner-related-data` exists in WordPress
- Check browser console for parsing errors
- Test with different magazine issues

### Issue: Layout broken on mobile
- Clear browser cache
- Check CSS media queries
- Verify responsive image sizes

### Issue: Links not working
- Ensure `banner-related-data-link` exists in WordPress data
- Check for proper URL format in custom fields
- Verify link extraction in parsing logic

---

## Related Files

```
components/
├── MagazineHero.js              # Main component
├── MagazineHero.module.css      # Styles
├── MagazineHero.README.md       # This file
└── Layout.js                     # Parent layout

pages/
└── index.tsx                     # Usage example (line 58)

docs/
└── MAGAZINEHERO_IMPROVEMENTS.md  # Detailed improvements log

lib/
└── wordpress.js                  # API fetch helper
```

---

## Version History

### v2.0 (2025-11-05) - Current
- ✅ Added phpunserialize for robust data parsing
- ✅ Implemented loading states
- ✅ Made related articles clickable
- ✅ Added accessibility improvements
- ✅ Converted to Next.js Image component
- ✅ Fixed image positioning

### v1.0 (Previous)
- Basic split-layout implementation
- Regex-based PHP parsing
- No error handling

---

## Support

**Documentation:**
- Component README: This file
- Improvements Log: `MAGAZINEHERO_IMPROVEMENTS.md`
- Project README: `CLAUDE.md`

**WordPress API:**
- Endpoint: https://successcom.wpenginepowered.com/wp-json/wp/v2/magazines
- Docs: https://developer.wordpress.org/rest-api/

**Next.js Image:**
- Docs: https://nextjs.org/docs/api-reference/next/image

---

*Last Updated: 2025-11-05*
*Component Version: 2.0*
*Maintained by: Development Team*
