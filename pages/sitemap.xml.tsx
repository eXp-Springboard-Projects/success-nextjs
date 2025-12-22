import { GetServerSideProps } from 'next';
import { fetchWordPressData } from '../lib/wordpress';

function generateSiteMap(posts: any[], categories: any[], authors: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Static pages -->
     <url>
       <loc>https://www.success.com</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>https://www.success.com/about</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>https://www.success.com/magazine</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>https://www.success.com/videos</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>https://www.success.com/podcasts</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.7</priority>
     </url>
     <!-- Blog posts -->
     ${posts
       .map((post) => {
         return `
       <url>
           <loc>https://www.success.com/${post.slug}</loc>
           <lastmod>${new Date(post.modified).toISOString()}</lastmod>
           <changefreq>monthly</changefreq>
           <priority>0.6</priority>
       </url>
     `;
       })
       .join('')}
     <!-- Categories -->
     ${categories
       .map((category) => {
         return `
       <url>
           <loc>https://www.success.com/category/${category.slug}</loc>
           <lastmod>${new Date().toISOString()}</lastmod>
           <changefreq>weekly</changefreq>
           <priority>0.7</priority>
       </url>
     `;
       })
       .join('')}
     <!-- Authors -->
     ${authors
       .map((author) => {
         return `
       <url>
           <loc>https://www.success.com/author/${author.slug}</loc>
           <lastmod>${new Date().toISOString()}</lastmod>
           <changefreq>weekly</changefreq>
           <priority>0.5</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // Fetch all posts, categories, and authors
    const posts = await fetchWordPressData('posts?per_page=100');
    const categories = await fetchWordPressData('categories?per_page=100');
    const authors = await fetchWordPressData('users?per_page=100');

    // Generate the XML sitemap
    const sitemap = generateSiteMap(posts, categories, authors);

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    res.statusCode = 500;
    res.end();
    return {
      props: {},
    };
  }
};

export default SiteMap;
