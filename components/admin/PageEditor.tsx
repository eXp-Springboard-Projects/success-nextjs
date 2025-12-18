import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from './PostEditor.module.css';

// Dynamic import to avoid SSR issues with react-quill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface PageEditorProps {
  pageId?: string;
}

export default function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

  const fetchPage = async () => {
    if (!pageId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`);
      const page = await res.json();

      setTitle(page.title);
      setSlug(page.slug);
      setContent(page.content);
      setStatus(page.status);
      setSeoTitle(page.seoTitle || '');
      setSeoDescription(page.seoDescription || '');
    } catch (error) {
      alert('Failed to load page');
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
    if (!pageId && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async (publishStatus: string) => {
    if (!title || !content) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);

    const pageData = {
      title,
      slug: slug || generateSlug(title),
      content,
      status: publishStatus,
      seoTitle,
      seoDescription,
      publishedAt: publishStatus === 'PUBLISHED' ? new Date().toISOString() : null,
    };

    try {
      const url = pageId ? `/api/pages/${pageId}` : '/api/pages';
      const method = pageId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      if (res.ok) {
        alert(pageId ? 'Page updated!' : 'Page created!');
        router.push('/admin/pages');
      } else {
        throw new Error('Failed to save page');
      }
    } catch (error) {
      alert('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading page...</div>;
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
        <h1>{pageId ? 'Edit Page' : 'Create New Page'}</h1>
        <div className={styles.actions}>
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
              placeholder="Enter page title..."
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
              placeholder="page-url-slug"
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
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3>SEO Settings</h3>
            <div className={styles.field}>
              <label htmlFor="seoTitle">SEO Title</label>
              <input
                id="seoTitle"
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO-optimized title"
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="seoDescription">SEO Description</label>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description for search engines"
                rows={3}
                className={styles.textarea}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
