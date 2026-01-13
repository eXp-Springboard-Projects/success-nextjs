import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function BulkUpdateAuthors() {
  const { data: session } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const articlesToUpdate = [
    { slug: '4-benefits-of-having-a-pet-that-promotes-success', newAuthor: 'Jaclyn Greenberg' },
    { slug: 'mental-health-day-signs', newAuthor: 'Jaclyn Greenberg' }
  ];

  const handleUpdate = async () => {
    setLoading(true);
    setResults([]);
    const logs: string[] = [];

    for (const article of articlesToUpdate) {
      try {
        // Search for the post
        const searchRes = await fetch(`/api/admin/posts?search=${article.slug}&per_page=100`);

        if (!searchRes.ok) {
          logs.push(`❌ Failed to search for ${article.slug}: ${searchRes.statusText}`);
          continue;
        }

        const searchData = await searchRes.json();
        const posts = searchData.posts || [];

        const post = posts.find((p: any) => p.slug === article.slug);

        if (!post) {
          logs.push(`❌ Not found: ${article.slug}`);
          continue;
        }

        logs.push(`✅ Found: ${post.title.rendered || post.title}`);
        logs.push(`   Current author: ${post.authorName || 'Unknown'}`);

        // Update the post
        const updateRes = await fetch(`/api/admin/posts/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: post.title.rendered || post.title,
            slug: post.slug,
            content: post.content.rendered || post.content,
            excerpt: post.excerpt?.rendered || post.excerpt || '',
            authorName: article.newAuthor,
            featuredImage: post.featured_media_url || post.featuredImage || null,
            featuredImageAlt: post.featuredImageAlt || null,
            status: post.status,
            authorId: session?.user?.id,
            categories: post.categories?.map((c: any) => c.id) || [],
            seoTitle: post.seoTitle || null,
            seoDescription: post.seoDescription || null,
            contentType: post.contentType || 'regular',
            accessTier: post.accessTier || 'free',
            scheduledDate: post.scheduledDate || null,
            contentPillar: post.contentPillar || null,
            featureOnHomepage: post.featureOnHomepage || false,
            featureInPillar: post.featureInPillar || false,
            featureTrending: post.featureTrending || false,
            mainFeaturedArticle: post.mainFeaturedArticle || false,
            wordpressId: post.wordpressId || null,
          }),
        });

        if (updateRes.ok) {
          logs.push(`   ✅ Updated to: ${article.newAuthor}`);
        } else {
          const error = await updateRes.json();
          logs.push(`   ❌ Update failed: ${error.message || error.error}`);
        }

        logs.push('');
      } catch (error) {
        logs.push(`❌ Error updating ${article.slug}: ${error}`);
        logs.push('');
      }
    }

    setResults(logs);
    setLoading(false);
  };

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <h1>Bulk Update Authors</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Update bylines for specific articles
        </p>

        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Articles to update:</h3>
          <ul>
            {articlesToUpdate.map(a => (
              <li key={a.slug}>
                <strong>{a.slug}</strong> → {a.newAuthor}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#ccc' : '#1e3a8a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '2rem',
          }}
        >
          {loading ? 'Updating...' : 'Run Update'}
        </button>

        {results.length > 0 && (
          <div style={{
            padding: '1rem',
            background: '#1f2937',
            color: '#fff',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
          }}>
            {results.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
