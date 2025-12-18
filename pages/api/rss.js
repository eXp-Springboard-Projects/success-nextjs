import { fetchWordPressData } from '../../lib/wordpress';

export default async function handler(req, res) {
  try {
    // Fetch latest posts
    const posts = await fetchWordPressData('posts?_embed&per_page=50');

    const siteUrl = 'https://www.success.com';
    const feedTitle = 'SUCCESS Magazine';
    const feedDescription = 'Your Trusted Guide to the Future of Work';

    // Generate RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${feedTitle}</title>
    <link>${siteUrl}</link>
    <description>${feedDescription}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${posts
      .map((post) => {
        const author = post._embedded?.author?.[0];
        const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];
        const category = post._embedded?.['wp:term']?.[0]?.[0];

        // Strip HTML tags from content for description
        const plainTextContent = post.content?.rendered?.replace(/<[^>]*>/g, '') || '';
        const description = post.excerpt?.rendered?.replace(/<[^>]*>/g, '') || plainTextContent.substring(0, 300) + '...';

        return `
    <item>
      <title><![CDATA[${post.title.rendered}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${post.content.rendered}]]></content:encoded>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      ${author ? `<author><![CDATA[${author.name}]]></author>` : ''}
      ${category ? `<category><![CDATA[${category.name}]]></category>` : ''}
      ${featuredImage ? `<enclosure url="${featuredImage.source_url}" type="${featuredImage.mime_type}" />` : ''}
    </item>`;
      })
      .join('')}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(rss);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate RSS feed', error: error.message });
  }
}
