import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { EnhancedImage } from './editor-extensions/EnhancedImage';
import { EnhancedTextStyle } from './editor-extensions/EnhancedTextStyle';
import { FullWidthImage } from './editor-extensions/FullWidthImage';
import { TwoColumnText } from './editor-extensions/TwoColumnText';
import { ImageTextLayout } from './editor-extensions/ImageTextLayout';
import { PullQuote } from './editor-extensions/PullQuote';
import { CalloutBox } from './editor-extensions/CalloutBox';
import { ImageGallery } from './editor-extensions/ImageGallery';
import { VideoEmbed } from './editor-extensions/VideoEmbed';
import { AuthorBio } from './editor-extensions/AuthorBio';
import { RelatedArticles } from './editor-extensions/RelatedArticles';
import { Divider } from './editor-extensions/Divider';
import { ButtonBlock } from './editor-extensions/ButtonBlock';
import MediaLibraryPicker from './MediaLibraryPicker';
import RevisionHistory from './RevisionHistory';
import ImageEditor from './ImageEditor';
import TextStylePanel from './TextStylePanel';
import BlockControls from './BlockControls';
import styles from './EnhancedPostEditor.module.css';
import blockStyles from './BlockEditor.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface EnhancedPostEditorProps {
  postId?: string;
}

export default function EnhancedPostEditor({ postId }: EnhancedPostEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [status, setStatus] = useState('draft');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activePanel, setActivePanel] = useState<'settings' | 'seo' | 'media'>('settings');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showFeaturedImagePicker, setShowFeaturedImagePicker] = useState(false);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockImageMode, setBlockImageMode] = useState<'fullwidth' | 'imageleft' | 'imageright' | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt?: string } | null>(null);
  const [showTextStylePanel, setShowTextStylePanel] = useState(false);
  const [showBlockControls, setShowBlockControls] = useState(false);
  const [blockControlsPosition, setBlockControlsPosition] = useState({ top: 0, left: 0 });
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [contentType, setContentType] = useState<'regular' | 'premium' | 'insider' | 'magazine' | 'press'>('regular');
  const [accessTier, setAccessTier] = useState<'free' | 'success_plus' | 'insider'>('free');
  const [initialContent, setInitialContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      EnhancedImage,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      EnhancedTextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      FullWidthImage,
      TwoColumnText,
      ImageTextLayout,
      PullQuote,
      CalloutBox,
      ImageGallery,
      VideoEmbed,
      AuthorBio,
      RelatedArticles,
      Divider,
      ButtonBlock,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: `${styles.editorContent} ${blockStyles.editorContent}`,
      },
    },
  });

  useEffect(() => {
    fetchCategories();
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Set editor content when editor is ready and we have initial content
  useEffect(() => {
    if (editor && initialContent && !editor.getText()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Word count and character count
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      setCharCount(text.length);
    }
  }, [editor?.state.doc]);

  // Auto-save functionality
  useEffect(() => {
    if (!editor || !title || !postId) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save after 3 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, editor?.state.doc, excerpt, selectedCategories, contentType, accessTier]);

  const handleAutoSave = async () => {
    if (!title || !editor?.getHTML() || !postId || saving) return;

    setAutoSaving(true);
    try {
      const postData = {
        title,
        slug,
        content: editor.getHTML(),
        excerpt,
        featuredImage: featuredImage || null,
        featuredImageAlt: featuredImageAlt || null,
        status: status === 'publish' ? 'publish' : 'draft', // Maintain publish status
        authorId: session?.user?.id,
        categories: selectedCategories,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        contentType,
        accessTier,
        scheduledDate: scheduledDate || null,
      };

      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
    } finally {
      setAutoSaving(false);
    }
  };

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
      const res = await fetch(`/api/admin/posts/${postId}`);
      const post = await res.json();

      setTitle(post.title.rendered || post.title);
      setSlug(post.slug);

      // Store content to be set when editor is ready
      const content = post.content.rendered || post.content;
      setInitialContent(content);

      setExcerpt(post.excerpt?.rendered || post.excerpt || '');
      setFeaturedImage(post._embedded?.['wp:featuredmedia']?.[0]?.source_url || post.featured_media_url || '');
      setFeaturedImageAlt(post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || post.featuredImageAlt || '');
      setStatus(post.status);

      // Get category IDs if available
      if (post._embedded?.['wp:term']?.[0]) {
        const categoryIds = post._embedded['wp:term'][0].map((cat: any) => cat.id);
        setSelectedCategories(categoryIds);
      } else if (post.categories) {
        const categoryIds = post.categories.map((cat: any) => cat.id);
        setSelectedCategories(categoryIds);
      }

      setSeoTitle(post.seoTitle || '');
      setSeoDescription(post.seoDescription || '');
      setContentType(post.contentType || 'regular');
      setAccessTier(post.accessTier || 'free');
      setScheduledDate(post.scheduledDate || '');
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
    if (!seoTitle) {
      setSeoTitle(value);
    }
  };

  const setLink = () => {
    const url = window.prompt('Enter URL');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    setShowMediaPicker(true);
  };

  const handleMediaSelect = (media: any) => {
    if (blockImageMode === 'fullwidth') {
      // Insert full width image block
      if (editor) {
        (editor.chain().focus() as any).setFullWidthImage({
          src: media.url,
          alt: media.alt || media.filename,
          caption: ''
        }).run();
      }
      setBlockImageMode(null);
    } else if (blockImageMode === 'imageleft') {
      // Insert image left + text block
      if (editor) {
        (editor.chain().focus() as any).setImageTextLayout({
          imagePosition: 'left',
          src: media.url,
          alt: media.alt || media.filename
        }).run();
      }
      setBlockImageMode(null);
    } else if (blockImageMode === 'imageright') {
      // Insert image right + text block
      if (editor) {
        (editor.chain().focus() as any).setImageTextLayout({
          imagePosition: 'right',
          src: media.url,
          alt: media.alt || media.filename
        }).run();
      }
      setBlockImageMode(null);
    } else {
      // Regular inline image
      if (editor) {
        editor.chain().focus().setImage({
          src: media.url,
          alt: media.alt || media.filename
        }).run();
      }
    }
  };

  const handleFeaturedImageSelect = (media: any) => {
    setFeaturedImage(media.url);
    setFeaturedImageAlt(media.alt || media.filename);
  };

  const handleRestoreRevision = (revision: any) => {
    setTitle(revision.title);
    setExcerpt(revision.excerpt || '');
    setFeaturedImage(revision.featuredImage || '');
    setFeaturedImageAlt(revision.featuredImageAlt || '');
    setStatus(revision.status);
    setSeoTitle(revision.seoTitle || '');
    setSeoDescription(revision.seoDescription || '');

    if (editor) {
      editor.commands.setContent(revision.content);
    }

    alert('Revision restored! Remember to save to make the changes permanent.');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const media = await res.json();
          if (editor) {
            editor.chain().focus().setImage({
              src: media.url,
              alt: media.alt || media.filename
            }).run();
          }
        }
      }
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditorDrop = async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    e.preventDefault();
    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const media = await res.json();
          if (editor) {
            editor.chain().focus().setImage({
              src: media.url,
              alt: media.alt || media.filename
            }).run();
          }
        }
      }
    } catch (error) {
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Block insertion functions
  const insertFullWidthImage = () => {
    setBlockImageMode('fullwidth');
    setShowBlockMenu(false);
    setShowMediaPicker(true);
  };

  const insertTwoColumnText = () => {
    if (editor) {
      (editor.chain().focus() as any).setTwoColumnText().run();
      setShowBlockMenu(false);
    }
  };

  const insertImageTextLayout = (position: 'left' | 'right') => {
    setBlockImageMode(position === 'left' ? 'imageleft' : 'imageright');
    setShowBlockMenu(false);
    setShowMediaPicker(true);
  };

  const insertPullQuote = () => {
    if (editor) {
      (editor.chain().focus() as any).setPullQuote().run();
      setShowBlockMenu(false);
    }
  };

  const insertCalloutBox = (variant: 'info' | 'warning' | 'success' | 'error') => {
    if (editor) {
      (editor.chain().focus() as any).setCalloutBox({ variant }).run();
      setShowBlockMenu(false);
    }
  };

  const insertImageGallery = () => {
    if (editor) {
      (editor.chain().focus() as any).setImageGallery({
        images: [
          { src: 'https://via.placeholder.com/400x300', alt: 'Image 1' },
          { src: 'https://via.placeholder.com/400x300', alt: 'Image 2' },
          { src: 'https://via.placeholder.com/400x300', alt: 'Image 3' },
        ],
        columns: 3
      }).run();
      setShowBlockMenu(false);
    }
  };

  const insertVideoEmbed = () => {
    const url = prompt('Enter YouTube or Vimeo URL:');
    if (url && editor) {
      const provider = url.includes('youtube') || url.includes('youtu.be') ? 'youtube' : 'vimeo';
      (editor.chain().focus() as any).setVideoEmbed({ src: url, provider }).run();
      setShowBlockMenu(false);
    }
  };

  const insertAuthorBio = () => {
    if (editor && session?.user) {
      (editor.chain().focus() as any).setAuthorBio({
        name: session.user.name || 'Author Name',
        title: 'Author',
        bio: 'Author biography goes here...'
      }).run();
      setShowBlockMenu(false);
    }
  };

  const insertRelatedArticles = () => {
    if (editor) {
      (editor.chain().focus() as any).setRelatedArticles({
        title: 'Read More',
        articles: [
          { url: '#', title: 'Related Article 1', excerpt: 'Short description...' },
          { url: '#', title: 'Related Article 2', excerpt: 'Short description...' },
        ]
      }).run();
      setShowBlockMenu(false);
    }
  };

  const insertDivider = (style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'stars') => {
    if (editor) {
      (editor.chain().focus() as any).setDivider({ style: style || 'solid' }).run();
      setShowBlockMenu(false);
    }
  };

  const insertButton = () => {
    const text = prompt('Enter button text:', 'Click Here');
    const url = prompt('Enter button URL:', '#');
    if (text && url && editor) {
      (editor.chain().focus() as any).setButtonBlock({ text, url, variant: 'primary' }).run();
      setShowBlockMenu(false);
    }
  };

  const handleSave = async (publishStatus: string) => {
    if (!title || !editor?.getHTML()) {
      alert('Title and content are required');
      return;
    }

    if (!session?.user?.id) {
      alert('You must be logged in to save posts');
      return;
    }

    setSaving(true);

    try {
      const postData = {
        title,
        slug,
        content: editor.getHTML(),
        excerpt: excerpt,
        featuredImage: featuredImage || null,
        featuredImageAlt: featuredImageAlt || null,
        status: publishStatus,
        authorId: session.user.id,
        categories: selectedCategories,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        contentType,
        accessTier,
        scheduledDate: scheduledDate || null,
      };

      const method = postId ? 'PUT' : 'POST';
      const url = postId ? `/api/admin/posts/${postId}` : '/api/admin/posts';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (res.ok) {
        const savedPost = await res.json();
        alert(`Post ${postId ? 'updated' : 'created'} successfully!`);

        // If it's a new post, redirect to edit page
        if (!postId && savedPost.id) {
          router.push(`/admin/posts/${savedPost.id}/edit`);
        } else {
          // Refresh the post data
          fetchPost();
        }
      } else {
        const error = await res.json();
        alert(`Failed to save post: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // For existing posts, use postId
    if (postId) {
      window.open(`/preview/post/${postId}`, '_blank');
      return;
    }

    // For new posts, save draft first then preview
    alert('Save as draft first to preview. Preview functionality requires the post to be saved.');
  };

  if (loading) {
    return <div className={styles.loading}>Loading post...</div>;
  }

  if (!editor) {
    return <div className={styles.loading}>Initializing editor...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button onClick={() => router.push('/admin/posts')} className={styles.backButton}>
            ← Back to Posts
          </button>
          <div className={styles.editorStats}>
            <span className={styles.statItem}>
              📝 {wordCount} words
            </span>
            <span className={styles.statItem}>
              📊 {charCount} characters
            </span>
            {autoSaving && (
              <span className={styles.autoSaving}>
                💾 Auto-saving...
              </span>
            )}
            {lastSaved && !autoSaving && (
              <span className={styles.lastSaved}>
                ✓ Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className={styles.topRight}>
          {postId && (
            <button onClick={() => setShowRevisionHistory(true)} className={styles.previewButton}>
              📜 History
            </button>
          )}
          <button onClick={() => setShowPreview(!showPreview)} className={styles.previewButton}>
            {showPreview ? '✏️ Edit' : '👁 Preview'}
          </button>
          <button onClick={handlePreview} className={styles.previewButton}>
            🌐 View Live
          </button>
          <button onClick={() => handleSave('draft')} disabled={saving} className={styles.draftButton}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave('publish')} disabled={saving} className={styles.publishButton}>
            {saving ? 'Publishing...' : scheduledDate ? 'Schedule' : 'Publish'}
          </button>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Main Content Area */}
        <div className={styles.mainContent}>
          <div className={styles.titleSection}>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Add title"
              className={styles.titleInput}
            />
            <div className={styles.slugRow}>
              <span className={styles.slugLabel}>Permalink:</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-slug"
                className={styles.slugInput}
              />
            </div>
          </div>

          {!showPreview ? (
            <>
              {/* Toolbar */}
              <div className={styles.toolbar}>
                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className={styles.toolbarButton}
                    title="Undo (Ctrl+Z)"
                  >
                    ↶
                  </button>
                  <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className={styles.toolbarButton}
                    title="Redo (Ctrl+Y)"
                  >
                    ↷
                  </button>
                </div>

                <div className={styles.toolbarDivider}></div>

                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Bold (Ctrl+B)"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Italic (Ctrl+I)"
                  >
                    <em>I</em>
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive('underline') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Underline (Ctrl+U)"
                  >
                    <u>U</u>
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Strikethrough"
                  >
                    <s>S</s>
                  </button>
                </div>

                <div className={styles.toolbarDivider}></div>

                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <button
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={editor.isActive('paragraph') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Paragraph"
                  >
                    P
                  </button>
                </div>

                <div className={styles.toolbarDivider}></div>

                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Bullet List"
                  >
                    • List
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Numbered List"
                  >
                    1. List
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Quote"
                  >
                    "
                  </button>
                </div>

                <div className={styles.toolbarDivider}></div>

                <div className={styles.toolbarGroup}>
                  <button onClick={setLink} className={styles.toolbarButton} title="Insert Link">
                    🔗
                  </button>
                  <button onClick={addImage} className={styles.toolbarButton} title="Browse Media Library">
                    🖼️ Library
                  </button>
                  <label className={styles.toolbarButton} title="Upload Image">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    📤 {uploading ? 'Uploading...' : 'Upload'}
                  </label>
                </div>

                <div className={styles.toolbarDivider}></div>

                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => setShowTextStylePanel(!showTextStylePanel)}
                    className={showTextStylePanel ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Text Styling"
                  >
                    🎨 Styles
                  </button>
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setBlockControlsPosition({ top: rect.bottom + 8, left: rect.left });
                      setShowBlockControls(!showBlockControls);
                    }}
                    className={showBlockControls ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Block Controls"
                  >
                    ⚙️ Block
                  </button>
                </div>

                <div className={styles.toolbarDivider}></div>

                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={editor.isActive({ textAlign: 'left' }) ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Align Left"
                  >
                    ⬅
                  </button>
                  <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={editor.isActive({ textAlign: 'center' }) ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Align Center"
                  >
                    ⬌
                  </button>
                  <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={editor.isActive({ textAlign: 'right' }) ? styles.toolbarButtonActive : styles.toolbarButton}
                    title="Align Right"
                  >
                    ➡
                  </button>
                </div>

                <div className={styles.toolbarDivider}></div>

                {/* Table Controls */}
                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className={styles.toolbarButton}
                    title="Insert Table"
                  >
                    ⊞ Table
                  </button>
                  {editor?.isActive('table') && (
                    <>
                      <button
                        onClick={() => editor.chain().focus().addColumnBefore().run()}
                        className={styles.toolbarButton}
                        title="Add Column Before"
                      >
                        ◀ Col
                      </button>
                      <button
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                        className={styles.toolbarButton}
                        title="Add Column After"
                      >
                        Col ▶
                      </button>
                      <button
                        onClick={() => editor.chain().focus().deleteColumn().run()}
                        className={styles.toolbarButton}
                        title="Delete Column"
                      >
                        ✕ Col
                      </button>
                      <button
                        onClick={() => editor.chain().focus().addRowBefore().run()}
                        className={styles.toolbarButton}
                        title="Add Row Before"
                      >
                        ▲ Row
                      </button>
                      <button
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                        className={styles.toolbarButton}
                        title="Add Row After"
                      >
                        Row ▼
                      </button>
                      <button
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        className={styles.toolbarButton}
                        title="Delete Row"
                      >
                        ✕ Row
                      </button>
                      <button
                        onClick={() => editor.chain().focus().deleteTable().run()}
                        className={styles.toolbarButton}
                        title="Delete Table"
                      >
                        ✕ Table
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.toolbarDivider}></div>

                {/* Block Menu */}
                <div className={styles.toolbarGroup} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowBlockMenu(!showBlockMenu)}
                    className={styles.addBlockButton}
                    title="Add Content Block"
                  >
                    ＋ Add Block
                  </button>

                  {showBlockMenu && (
                    <div ref={blockMenuRef} className={styles.blockMenu}>
                      <div className={styles.blockMenuSection}>
                        <h4 className={styles.blockMenuTitle}>Layout Blocks</h4>
                        <button onClick={insertFullWidthImage} className={styles.blockMenuItem}>
                          🖼️ Full Width Image
                        </button>
                        <button onClick={insertTwoColumnText} className={styles.blockMenuItem}>
                          ⚌ Two Column Text
                        </button>
                        <button onClick={() => insertImageTextLayout('left')} className={styles.blockMenuItem}>
                          ⬅️🖼️ Image Left + Text
                        </button>
                        <button onClick={() => insertImageTextLayout('right')} className={styles.blockMenuItem}>
                          🖼️➡️ Image Right + Text
                        </button>
                      </div>

                      <div className={styles.blockMenuSection}>
                        <h4 className={styles.blockMenuTitle}>Content Blocks</h4>
                        <button onClick={insertPullQuote} className={styles.blockMenuItem}>
                          💬 Pull Quote
                        </button>
                        <button onClick={() => insertCalloutBox('info')} className={styles.blockMenuItem}>
                          ℹ️ Callout Box (Info)
                        </button>
                        <button onClick={() => insertCalloutBox('warning')} className={styles.blockMenuItem}>
                          ⚠️ Callout Box (Warning)
                        </button>
                        <button onClick={() => insertCalloutBox('success')} className={styles.blockMenuItem}>
                          ✅ Callout Box (Success)
                        </button>
                      </div>

                      <div className={styles.blockMenuSection}>
                        <h4 className={styles.blockMenuTitle}>Media Blocks</h4>
                        <button onClick={insertImageGallery} className={styles.blockMenuItem}>
                          🖼️🖼️🖼️ Image Gallery
                        </button>
                        <button onClick={insertVideoEmbed} className={styles.blockMenuItem}>
                          🎥 Video Embed (YouTube/Vimeo)
                        </button>
                      </div>

                      <div className={styles.blockMenuSection}>
                        <h4 className={styles.blockMenuTitle}>Special Blocks</h4>
                        <button onClick={insertAuthorBio} className={styles.blockMenuItem}>
                          👤 Author Bio
                        </button>
                        <button onClick={insertRelatedArticles} className={styles.blockMenuItem}>
                          📰 Related Articles
                        </button>
                        <button onClick={() => insertDivider('solid')} className={styles.blockMenuItem}>
                          ─ Divider (Solid)
                        </button>
                        <button onClick={() => insertDivider('stars')} className={styles.blockMenuItem}>
                          ⋆⋆⋆ Divider (Stars)
                        </button>
                        <button onClick={insertButton} className={styles.blockMenuItem}>
                          🔘 CTA Button
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Editor Content with Drag & Drop */}
              <div
                onDrop={handleEditorDrop}
                onDragOver={(e) => e.preventDefault()}
                className={styles.editorWrapper}
              >
                {uploading && (
                  <div className={styles.uploadingOverlay}>
                    <div className={styles.uploadingSpinner}></div>
                    <p>Uploading images...</p>
                  </div>
                )}
                <EditorContent editor={editor} className={styles.editor} />
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className={styles.preview}>
              <h1>{title || 'Untitled Post'}</h1>
              <div dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Panel Tabs */}
          <div className={styles.panelTabs}>
            <button
              onClick={() => setActivePanel('settings')}
              className={activePanel === 'settings' ? styles.panelTabActive : styles.panelTab}
            >
              Settings
            </button>
            <button
              onClick={() => setActivePanel('media')}
              className={activePanel === 'media' ? styles.panelTabActive : styles.panelTab}
            >
              Media
            </button>
            <button
              onClick={() => setActivePanel('seo')}
              className={activePanel === 'seo' ? styles.panelTabActive : styles.panelTab}
            >
              SEO
            </button>
          </div>

          {/* Settings Panel */}
          {activePanel === 'settings' && (
            <div className={styles.panel}>
              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Content Type</h3>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="regular">Regular Post</option>
                  <option value="premium">Premium Content (SUCCESS+)</option>
                  <option value="insider">Insider Content (Exclusive)</option>
                  <option value="magazine">Magazine Article</option>
                  <option value="press">Press Release</option>
                </select>
              </div>

              {(contentType === 'premium' || contentType === 'insider') && (
                <div className={styles.panelSection}>
                  <h3 className={styles.panelTitle}>Access Tier</h3>
                  <select
                    value={accessTier}
                    onChange={(e) => setAccessTier(e.target.value as any)}
                    className={styles.select}
                  >
                    <option value="free">Free Preview (first 2 paragraphs)</option>
                    <option value="success_plus">SUCCESS+ Required</option>
                    <option value="insider">Insider Only (Top Tier)</option>
                  </select>
                  <small className={styles.helpText}>
                    {accessTier === 'free' && '✓ Non-members can see a preview'}
                    {accessTier === 'success_plus' && '🔒 Requires any SUCCESS+ subscription'}
                    {accessTier === 'insider' && '⭐ Requires highest tier subscription'}
                  </small>
                </div>
              )}

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Status</h3>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.select}>
                  <option value="draft">Draft</option>
                  <option value="publish">Published</option>
                  <option value="pending">Pending Review</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Schedule Publishing</h3>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={styles.input}
                />
                <small className={styles.helpText}>
                  {scheduledDate
                    ? `Will publish on ${new Date(scheduledDate).toLocaleString()}`
                    : 'Leave empty to publish immediately'
                  }
                </small>
              </div>

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Categories</h3>
                <div className={styles.categoryList}>
                  {categories.slice(0, 10).map((cat) => (
                    <label key={cat.id} className={styles.checkboxLabel}>
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
                        className={styles.checkbox}
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Excerpt</h3>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Write a short excerpt..."
                  rows={4}
                  className={styles.textarea}
                />
              </div>
            </div>
          )}

          {/* Media Panel */}
          {activePanel === 'media' && (
            <div className={styles.panel}>
              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Featured Image</h3>
                {featuredImage ? (
                  <>
                    <div className={styles.imagePreview}>
                      <img src={featuredImage} alt={featuredImageAlt || 'Featured'} />
                    </div>
                    <input
                      type="text"
                      value={featuredImageAlt}
                      onChange={(e) => setFeaturedImageAlt(e.target.value)}
                      placeholder="Alt text"
                      className={styles.input}
                      style={{ marginTop: '12px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => setShowFeaturedImagePicker(true)}
                        className={styles.previewButton}
                        style={{ flex: 1 }}
                      >
                        Replace Image
                      </button>
                      <button
                        onClick={() => {
                          setFeaturedImage('');
                          setFeaturedImageAlt('');
                        }}
                        className={styles.draftButton}
                        style={{ flex: 1 }}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setShowFeaturedImagePicker(true)}
                    className={styles.publishButton}
                    style={{ width: '100%' }}
                  >
                    Set Featured Image
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SEO Panel */}
          {activePanel === 'seo' && (
            <div className={styles.panel}>
              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>SEO Title</h3>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO Title"
                  className={styles.input}
                  maxLength={60}
                />
                <small className={styles.charCount}>{seoTitle.length}/60 characters</small>
              </div>

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Meta Description</h3>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description for search engines..."
                  rows={3}
                  className={styles.textarea}
                  maxLength={160}
                />
                <small className={styles.charCount}>{seoDescription.length}/160 characters</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Library Picker Modal - For Editor Content */}
      <MediaLibraryPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        filterType="image"
      />

      {/* Media Library Picker Modal - For Featured Image */}
      <MediaLibraryPicker
        isOpen={showFeaturedImagePicker}
        onClose={() => setShowFeaturedImagePicker(false)}
        onSelect={handleFeaturedImageSelect}
        filterType="image"
      />

      {/* Revision History Modal */}
      {postId && (
        <RevisionHistory
          isOpen={showRevisionHistory}
          onClose={() => setShowRevisionHistory(false)}
          postId={postId}
          onRestore={handleRestoreRevision}
        />
      )}

      {/* Image Editor Modal */}
      {showImageEditor && selectedImage && (
        <ImageEditor
          src={selectedImage.src}
          alt={selectedImage.alt}
          onSave={(updates) => {
            if (editor) {
              (editor.chain().focus() as any).updateImage(updates).run();
            }
            setShowImageEditor(false);
          }}
          onClose={() => setShowImageEditor(false)}
        />
      )}

      {/* Text Style Panel */}
      {showTextStylePanel && editor && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1000 }}>
          <TextStylePanel editor={editor} />
        </div>
      )}

      {/* Block Controls */}
      {showBlockControls && editor && (
        <BlockControls
          editor={editor}
          position={blockControlsPosition}
          onClose={() => setShowBlockControls(false)}
        />
      )}
    </div>
  );
}
