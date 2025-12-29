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
import ImageEditor from './ImageEditor';
import TextStylePanel from './TextStylePanel';
import BlockControls from './BlockControls';
import styles from './EnhancedPostEditor.module.css';
import blockStyles from './BlockEditor.module.css';

interface PageEditorProps {
  pageId?: string;
}

export default function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activePanel, setActivePanel] = useState<'settings' | 'seo'>('settings');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
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
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

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
    if (!editor || !title || !pageId) return;

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
  }, [title, editor?.state.doc]);

  const handleAutoSave = async () => {
    if (!title || !editor?.getHTML() || !pageId || saving) return;

    setAutoSaving(true);
    try {
      const pageData = {
        title,
        slug,
        content: editor.getHTML(),
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      };

      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
    } finally {
      setAutoSaving(false);
    }
  };

  const fetchPage = async () => {
    if (!pageId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`);
      const page = await res.json();

      setTitle(page.title);
      setSlug(page.slug);
      if (editor) {
        editor.commands.setContent(page.content);
      }
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

    setSaving(true);

    const pageData = {
      title,
      slug: slug || generateSlug(title),
      content: editor.getHTML(),
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
        const savedPage = await res.json();
        alert(`Page ${pageId ? 'updated' : 'created'} successfully!`);

        // If it's a new page, redirect to edit page
        if (!pageId && savedPage.id) {
          router.push(`/admin/pages/${savedPage.id}/edit`);
        } else {
          // Refresh the page data
          fetchPage();
        }
      } else {
        throw new Error('Failed to save page');
      }
    } catch (error) {
      alert('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (pageId) {
      window.open(`/preview/page/${pageId}`, '_blank');
    } else {
      alert('Save as draft first to preview.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading page...</div>;
  }

  if (!editor) {
    return <div className={styles.loading}>Initializing editor...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button onClick={() => router.push('/admin/pages')} className={styles.backButton}>
            ← Back to Pages
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
          <button onClick={() => setShowPreview(!showPreview)} className={styles.previewButton}>
            {showPreview ? '✏️ Edit' : '👁 Preview'}
          </button>
          <button onClick={handlePreview} className={styles.previewButton}>
            🌐 View Live
          </button>
          <button onClick={() => handleSave('DRAFT')} disabled={saving} className={styles.draftButton}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave('PUBLISHED')} disabled={saving} className={styles.publishButton}>
            {saving ? 'Publishing...' : 'Publish'}
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
                placeholder="page-slug"
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
              <h1>{title || 'Untitled Page'}</h1>
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
                <h3 className={styles.panelTitle}>Status</h3>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.select}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
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

      {/* Media Library Picker Modal */}
      <MediaLibraryPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        filterType="image"
      />

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
