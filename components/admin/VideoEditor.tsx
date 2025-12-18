import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SimpleRichTextEditor from './SimpleRichTextEditor';
import styles from './PostEditor.module.css';

interface VideoEditorProps {
  videoId?: string;
}

export default function VideoEditor({ videoId }: VideoEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoSource, setVideoSource] = useState<'url' | 'upload'>('url');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`);
      const video = await res.json();

      setTitle(video.title);
      setSlug(video.slug);
      setDescription(video.description || '');
      setVideoUrl(video.videoUrl);
      setThumbnail(video.thumbnail || '');
      setDuration(video.duration ? String(video.duration) : '');
      setStatus(video.status);
      setSeoTitle(video.seoTitle || '');
      setSeoDescription(video.seoDescription || '');
      setFeaturedImage(video.featuredImage || '');
      setFeaturedImageAlt(video.featuredImageAlt || '');
    } catch (error) {
      console.error('Error fetching video:', error);
      alert('Failed to load video');
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
    if (!videoId && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processVideoFile(file);
  };

  const processVideoFile = async (file: File) => {

    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      alert('Video file is too large. Maximum size is 500MB.');
      return;
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid video format. Supported formats: MP4, MOV, AVI, WebM');
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'video');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setVideoUrl(data.url);

        // Create preview
        const videoPreviewUrl = URL.createObjectURL(file);
        setVideoPreview(videoPreviewUrl);

        // Try to get video duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          setDuration(Math.floor(video.duration).toString());
        };
        video.src = videoPreviewUrl;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again or use a video URL instead.');
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB for thumbnails)
    if (file.size > 5 * 1024 * 1024) {
      alert('Thumbnail image is too large. Maximum size is 5MB.');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid image format. Supported formats: JPG, PNG, WebP, GIF');
      return;
    }

    setUploadingThumbnail(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setThumbnail(data.url);
        setThumbnailPreview(URL.createObjectURL(file));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSave = async (publishStatus: string) => {
    if (!title || !videoUrl) {
      alert('Title and video are required');
      return;
    }

    setSaving(true);

    const videoData = {
      title,
      slug: slug || generateSlug(title),
      description,
      videoUrl,
      thumbnail,
      duration: duration ? parseInt(duration) : null,
      status: publishStatus,
      publishedAt: publishStatus === 'PUBLISHED' ? new Date().toISOString() : null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      featuredImage: featuredImage || null,
      featuredImageAlt: featuredImageAlt || null,
    };

    try {
      const url = videoId ? `/api/admin/videos/${videoId}` : '/api/admin/videos';
      const method = videoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData),
      });

      if (res.ok) {
        alert(videoId ? 'Video updated!' : 'Video created!');
        router.push('/admin/videos');
      } else {
        throw new Error('Failed to save video');
      }
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading video...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{videoId ? 'Edit Video' : 'Add New Video'}</h1>
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
              placeholder="Enter video title..."
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
              placeholder="video-url-slug"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>Video Source *</label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setVideoSource('url')}
                className={videoSource === 'url' ? styles.activeTab : styles.inactiveTab}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  background: videoSource === 'url' ? '#c41e3a' : 'white',
                  color: videoSource === 'url' ? 'white' : '#333',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Video URL
              </button>
              <button
                type="button"
                onClick={() => setVideoSource('upload')}
                className={videoSource === 'upload' ? styles.activeTab : styles.inactiveTab}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  background: videoSource === 'upload' ? '#c41e3a' : 'white',
                  color: videoSource === 'upload' ? 'white' : '#333',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Upload Video
              </button>
            </div>

            {videoSource === 'url' ? (
              <div>
                <label htmlFor="videoUrl" style={{ fontSize: '0.9rem', color: '#666' }}>
                  YouTube, Vimeo, or direct video URL
                </label>
                <input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={styles.input}
                />
              </div>
            ) : (
              <div>
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragActive ? '#c41e3a' : '#ddd'}`,
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    background: dragActive ? '#fff5f5' : '#fafafa',
                    transition: 'all 0.3s',
                    marginBottom: '1rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('videoFile')?.click()}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {uploadingVideo ? '⏳' : '🎬'}
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
                    {dragActive ? 'Drop video here' : 'Drag and drop video file'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                    or click to browse
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#999' }}>
                    Supported: MP4, MOV, AVI, WebM • Max 500MB
                  </p>
                </div>

                <input
                  id="videoFile"
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  style={{ display: 'none' }}
                />

                {/* Upload Progress */}
                {uploadingVideo && (
                  <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      height: '32px',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        background: 'linear-gradient(90deg, #c41e3a 0%, #e63946 100%)',
                        height: '100%',
                        width: `${uploadProgress}%`,
                        transition: 'width 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {uploadProgress > 0 && `${uploadProgress}%`}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.75rem', textAlign: 'center' }}>
                      ⏳ Uploading video... This may take a few minutes for large files.
                    </p>
                  </div>
                )}

                {/* Video Preview */}
                {videoPreview && !uploadingVideo && (
                  <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      padding: '1rem',
                      background: '#e8f5e9',
                      border: '2px solid #4caf50',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>✅</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2e7d32' }}>
                            Video uploaded successfully!
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoPreview(null);
                            setVideoUrl('');
                          }}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Video Player Preview */}
                      <video
                        src={videoPreview}
                        controls
                        style={{
                          width: '100%',
                          maxHeight: '300px',
                          borderRadius: '4px',
                          background: '#000'
                        }}
                      />

                      {duration && (
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.75rem', textAlign: 'center' }}>
                          Duration: {Math.floor(parseInt(duration) / 60)}:{(parseInt(duration) % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <SimpleRichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe your video..."
            />
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3>Video Details</h3>
            <div className={styles.field}>
              <label htmlFor="thumbnail">Thumbnail Image</label>

              {/* URL Input */}
              <input
                id="thumbnail"
                type="url"
                value={thumbnail}
                onChange={(e) => {
                  setThumbnail(e.target.value);
                  setThumbnailPreview(e.target.value);
                }}
                placeholder="https://..."
                className={styles.input}
                style={{ marginBottom: '0.5rem' }}
              />

              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', textAlign: 'center' }}>
                or
              </div>

              {/* File Upload Button */}
              <label
                htmlFor="thumbnailFile"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: uploadingThumbnail ? 'not-allowed' : 'pointer',
                  background: uploadingThumbnail ? '#f5f5f5' : '#fafafa',
                  transition: 'all 0.3s',
                  marginBottom: '1rem'
                }}
                onMouseEnter={(e) => {
                  if (!uploadingThumbnail) e.currentTarget.style.borderColor = '#c41e3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#ddd';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {uploadingThumbnail ? '⏳' : '🖼️'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 'bold' }}>
                  {uploadingThumbnail ? 'Uploading...' : 'Click to upload thumbnail'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                  JPG, PNG, WebP, GIF • Max 5MB
                </div>
              </label>

              <input
                id="thumbnailFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleThumbnailUpload}
                disabled={uploadingThumbnail}
                style={{ display: 'none' }}
              />
            </div>

            {/* Thumbnail Preview */}
            {thumbnailPreview && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Preview:
                </label>
                <div style={{ position: 'relative' }}>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    style={{
                      maxWidth: '100%',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailPreview(null);
                      setThumbnail('');
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}
                    title="Remove thumbnail"
                  >
                    ×
                  </button>
                </div>
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

          <div className={styles.panel} style={{ marginTop: '1rem' }}>
            <h3>SEO Settings</h3>
            <div className={styles.field}>
              <label htmlFor="seoTitle">SEO Title</label>
              <input
                id="seoTitle"
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO title for search engines"
                className={styles.input}
                maxLength={60}
              />
              <small style={{ fontSize: '0.8rem', color: '#666' }}>{seoTitle.length}/60 characters</small>
            </div>
            <div className={styles.field}>
              <label htmlFor="seoDescription">SEO Description</label>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description for search engines"
                className={styles.input}
                rows={3}
                maxLength={160}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <small style={{ fontSize: '0.8rem', color: '#666' }}>{seoDescription.length}/160 characters</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
