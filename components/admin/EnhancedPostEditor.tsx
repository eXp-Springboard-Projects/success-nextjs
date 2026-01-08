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
import ArticleTemplates from './ArticleTemplates';
import { ArticleTemplate } from './article-templates/templateDefinitions';
import styles from './EnhancedPostEditor.module.css';
import blockStyles from './BlockEditor.module.css';
import { ContentPillar, getContentPillarLabel } from '../../lib/types';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  slug: string;
  title?: string;
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
  const [author, setAuthor] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [status, setStatus] = useState('draft');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  const [contentPillar, setContentPillar] = useState<ContentPillar | ''>('');
  const [featureOnHomepage, setFeatureOnHomepage] = useState(false);
  const [featureInPillar, setFeatureInPillar] = useState(false);
  const [featureTrending, setFeatureTrending] = useState(false);
  const [mainFeaturedArticle, setMainFeaturedArticle] = useState(false);
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [contentType, setContentType] = useState<'regular' | 'premium' | 'insider' | 'magazine' | 'press'>('regular');
  const [accessTier, setAccessTier] = useState<'free' | 'success_plus' | 'insider'>('free');
  const [initialContent, setInitialContent] = useState<string>('');
  const [wordpressId, setWordpressId] = useState<number | null>(null);
  const [generatingExcerpt, setGeneratingExcerpt] = useState(false);
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
        paragraph: {
          HTMLAttributes: {
            class: null,
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
        // Allow WordPress link attributes
        protocols: ['http', 'https', 'mailto'],
        autolink: true,
        linkOnPaste: true,
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            target: {
              default: null,
              parseHTML: element => element.getAttribute('target'),
              renderHTML: attributes => {
                if (!attributes.target) {
                  return {};
                }
                return { target: attributes.target };
              },
            },
            rel: {
              default: null,
              parseHTML: element => element.getAttribute('rel'),
              renderHTML: attributes => {
                if (!attributes.rel) {
                  return {};
                }
                return { rel: attributes.rel };
              },
            },
          };
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
    fetchAuthors();
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Set editor content when editor is ready and we have initial content
  useEffect(() => {
    if (editor && initialContent) {
      console.log('[DEBUG] Setting editor content:', {
        contentLength: initialContent.length,
        contentPreview: initialContent.substring(0, 200)
      });

      // Set content with HTML from WordPress
      editor.commands.setContent(initialContent);

      console.log('[DEBUG] Editor state after set:', {
        isEmpty: editor.isEmpty,
        textLength: editor.getText().length,
        htmlLength: editor.getHTML().length
      });
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
        author: author || null,
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
        contentPillar: contentPillar || null,
        customAuthorId: selectedAuthorId || null,
        featureOnHomepage,
        featureInPillar,
        featureTrending,
        mainFeaturedArticle,
        wordpressId: wordpressId, // Include WordPress ID for auto-save
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

  const fetchAuthors = async () => {
    try {
      const res = await fetch('/api/admin/authors?active=true');
      if (res.ok) {
        const data = await res.json();
        setAuthors(data);
      }
    } catch (error) {
    }
  };

  const handleGenerateExcerpt = async () => {
    if (!postId) {
      alert('Please save the post first before generating an excerpt');
      return;
    }

    setGeneratingExcerpt(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/generate-excerpt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: excerpt ? true : false }),
      });

      if (res.ok) {
        const data = await res.json();
        setExcerpt(data.excerpt);
        alert('Excerpt generated successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to generate excerpt: ${error.message || error.error}`);
      }
    } catch (error) {
      alert('Error generating excerpt. Please try again.');
    } finally {
      setGeneratingExcerpt(false);
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
      console.log('[DEBUG] Post data:', {
        hasContentRendered: !!post.content.rendered,
        hasContent: !!post.content,
        contentType: typeof post.content,
        contentLength: content?.length,
        contentPreview: content?.substring(0, 200)
      });
      setInitialContent(content);

      setExcerpt(post.excerpt?.rendered || post.excerpt || '');
      setAuthor(post.authorName || post._embedded?.author?.[0]?.name || '');
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

      // Load new fields
      setContentPillar(post.contentPillar || '');
      setSelectedAuthorId(post.customAuthorId || '');
      setFeatureOnHomepage(post.featureOnHomepage || false);
      setFeatureInPillar(post.featureInPillar || false);
      setFeatureTrending(post.featureTrending || false);
      setMainFeaturedArticle(post.mainFeaturedArticle || false);

      // Track if this is a WordPress post so we can save it properly
      setWordpressId(post.wordpressId || post.id || null);
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

  const applyTemplate = (template: ArticleTemplate) => {
    if (!editor) return;

    // Clear existing content
    editor.commands.clearContent();

    // Insert each block from the template
    template.blocks.forEach((block, index) => {
      // Add spacing between blocks
      if (index > 0) {
        editor.commands.insertContent('<p></p>');
      }

      switch (block.type) {
        case 'heading':
          editor.commands.insertContent({
            type: 'heading',
            attrs: { level: block.attrs?.level || 2 },
            content: block.content ? [{ type: 'text', text: block.content }] : []
          });
          break;

        case 'paragraph':
          editor.commands.insertContent({
            type: 'paragraph',
            content: block.content ? [{ type: 'text', text: block.content }] : []
          });
          break;

        case 'fullWidthImage':
          (editor.chain() as any).setFullWidthImage({
            src: block.attrs?.src || 'https://via.placeholder.com/1200x600',
            alt: block.attrs?.alt || 'Placeholder image',
            caption: block.attrs?.caption || ''
          }).run();
          break;

        case 'imageTextLayout':
          (editor.chain() as any).setImageTextLayout({
            imagePosition: block.attrs?.imagePosition || 'left',
            src: block.attrs?.src || 'https://via.placeholder.com/600x400',
            alt: block.attrs?.alt || 'Placeholder image',
            text: block.content || 'Add your text content here...'
          }).run();
          break;

        case 'pullQuote':
          (editor.chain() as any).setPullQuote({
            quote: block.content || 'Add your quote here...',
            author: block.attrs?.author
          }).run();
          break;

        case 'calloutBox':
          (editor.chain() as any).setCalloutBox({
            variant: block.attrs?.variant || 'info',
            title: block.attrs?.title,
            content: block.content || 'Add your callout content here...'
          }).run();
          break;

        case 'divider':
          (editor.chain() as any).setDivider({
            style: block.attrs?.style || 'solid'
          }).run();
          break;

        case 'imageGallery':
          (editor.chain() as any).setImageGallery({
            images: block.attrs?.images || [
              { src: 'https://via.placeholder.com/400x300', alt: 'Image 1' },
              { src: 'https://via.placeholder.com/400x300', alt: 'Image 2' },
              { src: 'https://via.placeholder.com/400x300', alt: 'Image 3' }
            ],
            columns: block.attrs?.columns || 3
          }).run();
          break;

        case 'videoEmbed':
          (editor.chain() as any).setVideoEmbed({
            src: block.attrs?.src || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            provider: block.attrs?.provider || 'youtube'
          }).run();
          break;

        case 'authorBio':
          (editor.chain() as any).setAuthorBio({
            name: block.attrs?.name || session?.user?.name || 'Author Name',
            title: block.attrs?.title || 'Author',
            bio: block.content || 'Author biography goes here...',
            avatar: block.attrs?.avatar
          }).run();
          break;

        case 'relatedArticles':
          (editor.chain() as any).setRelatedArticles({
            title: block.attrs?.title || 'Read More',
            articles: block.attrs?.articles || [
              { url: '#', title: 'Related Article 1', excerpt: 'Short description...' },
              { url: '#', title: 'Related Article 2', excerpt: 'Short description...' }
            ]
          }).run();
          break;

        case 'buttonBlock':
          (editor.chain() as any).setButtonBlock({
            text: block.attrs?.text || 'Click Here',
            url: block.attrs?.url || '#',
            variant: block.attrs?.variant || 'primary'
          }).run();
          break;

        case 'twoColumnText':
          (editor.chain() as any).setTwoColumnText({
            leftContent: block.attrs?.leftContent || 'Left column content...',
            rightContent: block.attrs?.rightContent || 'Right column content...'
          }).run();
          break;

        default:
          // Unknown block type, skip
          break;
      }
    });

    // Move cursor to the beginning
    editor.commands.focus('start');
  };

  const handleSave = async (publishStatus: string) => {
    if (!title || !editor?.getHTML()) {
      alert('Title and content are required');
      return;
    }

    if (!contentPillar) {
      alert('Content Pillar is required');
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
        authorName: author || null,
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
        contentPillar: contentPillar || null,
        customAuthorId: selectedAuthorId || null,
        featureOnHomepage,
        featureInPillar,
        featureTrending,
        mainFeaturedArticle,
        wordpressId: wordpressId, // Include WordPress ID for proper saving
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

                {/* Templates Button */}
                <div className={styles.toolbarGroup}>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className={styles.toolbarButton}
                    title="Choose Article Template"
                  >
                    📑 Templates
                  </button>
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
                <h3 className={styles.panelTitle}>Content Pillar *</h3>
                <select
                  value={contentPillar}
                  onChange={(e) => setContentPillar(e.target.value as ContentPillar)}
                  className={styles.select}
                  style={{ borderColor: !contentPillar ? '#ef4444' : undefined }}
                >
                  <option value="">-- Select a Content Pillar --</option>
                  {Object.values(ContentPillar).map((pillar) => (
                    <option key={pillar} value={pillar}>
                      {getContentPillarLabel(pillar)}
                    </option>
                  ))}
                </select>
                <small className={styles.helpText}>
                  {contentPillar ? '✓ Content pillar selected' : '⚠️ Required field'}
                </small>
              </div>

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Homepage Display</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={featureOnHomepage}
                      onChange={(e) => setFeatureOnHomepage(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Feature on Homepage</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={featureInPillar}
                      onChange={(e) => setFeatureInPillar(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Feature in Pillar Section</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={featureTrending}
                      onChange={(e) => setFeatureTrending(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Show in Trending</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={mainFeaturedArticle}
                      onChange={(e) => setMainFeaturedArticle(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span style={{ fontWeight: 600 }}>Main Featured Article (Hero)</span>
                  </label>
                </div>
                <small className={styles.helpText} style={{ marginTop: '0.5rem', display: 'block' }}>
                  {mainFeaturedArticle && '⚠️ Only one article can be the main featured article at a time'}
                </small>
              </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className={styles.panelTitle} style={{ margin: 0 }}>Excerpt / Dek</h3>
                  <button
                    type="button"
                    onClick={handleGenerateExcerpt}
                    disabled={generatingExcerpt || !postId}
                    className={styles.button}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.875rem',
                      background: generatingExcerpt ? '#ccc' : '#7C3AED',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: generatingExcerpt || !postId ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {generatingExcerpt ? '✨ Generating...' : excerpt ? '↻ Regenerate with AI' : '✨ Generate with AI'}
                  </button>
                </div>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Write a compelling 1-2 sentence excerpt (20-40 words) or generate with AI..."
                  rows={4}
                  className={styles.textarea}
                />
                <small style={{ color: '#666', fontSize: '0.875rem', display: 'block', marginTop: '0.5rem' }}>
                  {excerpt ? `${excerpt.split(' ').length} words` : 'Appears between headline and featured image'}
                  {excerpt && excerpt.split(' ').length < 20 && ' (aim for 20-40 words)'}
                </small>
              </div>

              <div className={styles.panelSection}>
                <h3 className={styles.panelTitle}>Author (Writer's Name)</h3>
                {authors.length > 0 && (
                  <select
                    value={selectedAuthorId}
                    onChange={(e) => {
                      setSelectedAuthorId(e.target.value);
                      const selectedAuthor = authors.find(a => a.id === e.target.value);
                      if (selectedAuthor) {
                        setAuthor(selectedAuthor.name);
                      } else if (e.target.value === '') {
                        setAuthor('');
                      }
                    }}
                    className={styles.input}
                    style={{ marginBottom: '0.75rem' }}
                  >
                    <option value="">Select existing author or type new name below...</option>
                    {authors.map(authorOption => (
                      <option key={authorOption.id} value={authorOption.id}>
                        {authorOption.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    setSelectedAuthorId(''); // Clear selection when manually typing
                  }}
                  placeholder="Or type author name manually (e.g., John Smith)"
                  className={styles.input}
                />
                <small style={{ color: '#666', fontSize: '0.875rem', display: 'block', marginTop: '0.5rem' }}>
                  ⚠️ This is the article WRITER's name (appears on frontend), NOT your admin username.
                </small>
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

      {/* Article Templates Modal */}
      {showTemplates && (
        <ArticleTemplates
          onSelectTemplate={(template) => {
            applyTemplate(template);
            setShowTemplates(false);
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
