import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import styles from './PostEditor.module.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface PodcastEditorProps {
  podcastId?: string;
}

export default function PodcastEditor({ podcastId }: PodcastEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (podcastId) {
      fetchPodcast();
    }
  }, [podcastId]);

  const fetchPodcast = async () => {
    if (!podcastId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/podcasts/${podcastId}`);
      const podcast = await res.json();

      setTitle(podcast.title);
      setSlug(podcast.slug);
      setDescription(podcast.description || '');
      setAudioUrl(podcast.audioUrl);
      setThumbnail(podcast.thumbnail || '');
      setDuration(podcast.duration ? String(podcast.duration) : '');
      setStatus(podcast.status);
    } catch (error) {
      alert('Failed to load podcast');
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
    if (!podcastId && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async (publishStatus: string) => {
    if (!title || !audioUrl) {
      alert('Title and audio URL are required');
      return;
    }

    setSaving(true);

    const podcastData = {
      title,
      slug: slug || generateSlug(title),
      description,
      audioUrl,
      thumbnail,
      duration: duration ? parseInt(duration) : null,
      status: publishStatus,
      publishedAt: publishStatus === 'PUBLISHED' ? new Date().toISOString() : null,
    };

    try {
      const url = podcastId ? `/api/podcasts/${podcastId}` : '/api/podcasts';
      const method = podcastId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podcastData),
      });

      if (res.ok) {
        alert(podcastId ? 'Podcast updated!' : 'Podcast created!');
        router.push('/admin/podcasts');
      } else {
        throw new Error('Failed to save podcast');
      }
    } catch (error) {
      alert('Failed to save podcast');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading podcast...</div>;
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{podcastId ? 'Edit Podcast' : 'Add New Podcast'}</h1>
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
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter podcast title..."
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
              placeholder="podcast-url-slug"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="audioUrl">Audio URL * (MP3, Spotify, Apple Podcasts, etc.)</label>
            <input
              id="audioUrl"
              type="url"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://..."
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <ReactQuill
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={modules}
              className={styles.editor}
            />
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3>Podcast Details</h3>
            <div className={styles.field}>
              <label htmlFor="thumbnail">Thumbnail URL</label>
              <input
                id="thumbnail"
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://..."
                className={styles.input}
              />
            </div>
            {thumbnail && (
              <div className={styles.imagePreview}>
                <img src={thumbnail} alt="Preview" />
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="duration">Duration (seconds)</label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="300"
                className={styles.input}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
