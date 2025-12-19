# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application that mirrors the SUCCESS Magazine website (www.success.com) using the WordPress REST API as a headless CMS. The project uses Next.js Pages Router with Static Site Generation (SSG) and Incremental Static Regeneration (ISR).

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Build and export static site
npm run export
```

## Architecture

### WordPress Integration

- **API Client**: `lib/wordpress.js` contains the `fetchWordPressData(endpoint)` function
- **API URL**: Configured via `WORDPRESS_API_URL` environment variable in `.env.local`
- **Data Source**: https://successcom.wpenginepowered.com/wp-json/wp/v2
- **Content Types**: Posts, categories, custom post types (videos, podcasts), authors

### Pages Structure

The application uses Next.js Pages Router with several dynamic routes:

- **Homepage** (`pages/index.tsx`): Multi-section layout with featured posts, trending, category sections, videos, podcasts
- **Blog Posts** (`pages/blog/[slug].tsx`): Individual article pages with author bio, share buttons, and related posts
- **Category Archives** (`pages/category/[slug].tsx`): Category listing pages with pagination support
- **Authors** (`pages/author/[slug].tsx`): Author archive pages
- **Videos/Podcasts** (`pages/video/[slug].tsx`, `pages/podcast/[slug].tsx`): Custom post type pages
- **Static Pages**: About, Magazine, Subscribe, Newsletter, Store, Legal pages

### Components

- **Layout** (`components/Layout.js`): Global layout wrapper with Header, Footer, and BackToTop
- **Header** (`components/Header.js`): Black navigation bar with mobile hamburger menu and search
- **Footer** (`components/Footer.js`): Dark theme footer with social icons and newsletter signup
- **PostCard** (`components/PostCard.tsx`): Reusable card component for displaying posts
- **Trending** (`components/Trending.js`): Sidebar widget for trending articles
- **MagazineHero** (`components/MagazineHero.js`): "Inside the Magazine" section on homepage

### Static Site Generation

All dynamic pages use ISR with these patterns:

```javascript
// getStaticProps returns props with revalidate: 600 (10 minutes)
export async function getStaticProps() {
  const data = await fetchWordPressData('posts?_embed&per_page=30');
  return {
    props: { data },
    revalidate: 600, // Regenerate page every 10 minutes
  };
}

// getStaticPaths uses fallback: true for on-demand generation
export async function getStaticPaths() {
  const items = await fetchWordPressData('posts?per_page=100');
  const paths = items.map(item => ({ params: { slug: item.slug } }));
  return {
    paths,
    fallback: true, // Enable ISR for unlisted paths
  };
}
```

### WordPress Category IDs

Key category IDs used in the homepage:

- AI & Technology: 14681 (NEW)
- Business & Branding: 4
- Culture & Workplace: 14677 (NEW)
- Entertainment: 14382
- Entrepreneurship: 14680 (NEW)
- Future of Work: 14061
- Health & Wellness: 14059
- Lifestyle: 14056
- Money: 14060

**Note**: SUCCESS.com category structure was updated in November 2025. The site now emphasizes AI & Technology as a primary content pillar.

### Styling

- CSS Modules for component-level styling (`.module.css` files)
- Global styles in `styles/globals.css`
- Modular, component-specific CSS with BEM-like naming conventions

### Environment Variables

Required in `.env.local`:

```
WORDPRESS_API_URL=https://successcom.wpenginepowered.com/wp-json/wp/v2
```

## Key Implementation Patterns

1. **Embedded Data**: Always use `_embed` parameter when fetching WordPress data to include featured images, authors, and taxonomy data in a single request
2. **TypeScript**: Mix of `.tsx` (pages, PostCard) and `.js` (components, lib) files
3. **Error Handling**: Pages return `{ notFound: true }` for missing content
4. **Read Time Calculation**: Posts calculate read time based on word count (200 words per minute)
5. **Responsive Design**: Mobile-first approach with hamburger menu and responsive grids
