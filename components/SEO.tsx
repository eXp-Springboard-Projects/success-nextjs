import Head from 'next/head';
import { decodeHtmlEntities } from '../lib/htmlDecode';

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string;
};

export default function SEO({
  title = 'SUCCESS - Your Trusted Guide to the Future of Work',
  description = 'SUCCESS is the leading source of inspiration, motivation, and practical advice for entrepreneurs, business leaders, and professionals seeking personal and professional growth.',
  image = 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/success-logo.png',
  url = 'https://www.success.com',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  keywords,
}: SEOProps) {
  // Decode HTML entities from title, description, author, and keywords
  const decodedTitle = decodeHtmlEntities(title);
  const decodedDescription = decodeHtmlEntities(description);
  const decodedAuthor = author ? decodeHtmlEntities(author) : undefined;
  const decodedKeywords = keywords ? decodeHtmlEntities(keywords) : undefined;

  const fullTitle = decodedTitle.includes('SUCCESS') ? decodedTitle : `${decodedTitle} | SUCCESS`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={decodedDescription} />
      {decodedKeywords && <meta name="keywords" content={decodedKeywords} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={decodedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="SUCCESS" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {decodedAuthor && <meta property="article:author" content={decodedAuthor} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={decodedDescription} />
      <meta property="twitter:image" content={image} />
      <meta name="twitter:site" content="@SUCCESSMagazine" />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <link rel="canonical" href={url} />
    </Head>
  );
}
