import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { exportPostToPDF } from '../../lib/pdfExport';
import styles from './PostEditor.module.css';

// Dynamic import to avoid SSR issues with react-quill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostEditorProps {
  postId?: string;
}

export default function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?per_page=100');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
    }
  };

  const fetchPost = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}?_embed=true`);
      const post = await res.json();

      setTitle(post.title.rendered);
      setSlug(post.slug);
      setContent(post.content.rendered);
      setExcerpt(post.excerpt?.rendered || '');
      setFeaturedImage(post.featured_media_url || '');
      setFeaturedImageAlt(post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '');
      setStatus(post.status.toUpperCase());
      setSelectedCategories(post._embedded?.['wp:term']?.[0]?.map((c: any) => c.id) || []);
    } catch (error) {
      alert('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!postId && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleExportPDF = async () => {
    if (!title || !content) {
      alert('Please add title and content before exporting');
      return;
    }

    try {
      await exportPostToPDF(
        title,
        content,
        session?.user?.name || 'Unknown Author',
        new Date().toLocaleDateString()
      );
    } catch (error) {
      alert('Failed to export PDF');
    }
  };

  const handleSave = async (publishStatus: string) => {
    if (!title || !content) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);

    const postData = {
      title,
      slug: slug || generateSlug(title),
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      status: publishStatus,
      authorId: session?.user?.id,
      categories: selectedCategories,
      tags: [],
    };

    try {
      const url = postId ? `/api/posts/${postId}` : '/api/posts';
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (res.ok) {
        alert(postId ? 'Post updated!' : 'Post created!');
        router.push('/admin/posts');
      } else {
        throw new Error('Failed to save post');
      }
    } catch (error) {
      alert('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading post...</div>;
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image', 'video'],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{postId ? 'Edit Post' : 'Create New Post'}</h1>
        <div className={styles.actions}>
          <button
            onClick={handleExportPDF}
            className={styles.exportButton}
            type="button"
          >
            📄 Export PDF
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className={styles.draftButton}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className={styles.publishButton}
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className={styles.editorGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.field}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title..."
              className={styles.titleInput}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="slug">Slug</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-url-slug"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>Content</label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className={styles.editor}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the post..."
              rows={3}
              className={styles.textarea}
            />
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3>Featured Image</h3>
            <div className={styles.field}>
              <label htmlFor="featuredImage">Image URL</label>
              <input
                id="featuredImage"
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://..."
                className={styles.input}
              />
            </div>
            {featuredImage && (
              <div className={styles.imagePreview}>
                <img src={featuredImage} alt="Preview" />
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="featuredImageAlt">Alt Text</label>
              <input
                id="featuredImageAlt"
                type="text"
                value={featuredImageAlt}
                onChange={(e) => setFeaturedImageAlt(e.target.value)}
                placeholder="Image description"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.panel}>
            <h3>Categories</h3>
            <div className={styles.checkboxList}>
              {categories.map((cat) => (
                <label key={cat.id} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                      }
                    }}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
