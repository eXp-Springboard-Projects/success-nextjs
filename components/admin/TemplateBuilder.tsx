import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from './TemplateBuilder.module.css';

interface Block {
  id: string;
  type: string;
  content: any;
  styles: any;
}

interface TemplateBuilderProps {
  templateId?: string;
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  saving?: boolean;
}

const BLOCK_TYPES = [
  { type: 'heading', icon: '📝', label: 'Heading', defaultContent: { text: 'Heading', level: 2 } },
  { type: 'paragraph', icon: '📄', label: 'Paragraph', defaultContent: { text: 'Your content here...' } },
  { type: 'image', icon: '🖼️', label: 'Image', defaultContent: { src: '', alt: '', caption: '' } },
  { type: 'gallery', icon: '🎨', label: 'Gallery', defaultContent: { images: [] } },
  { type: 'video', icon: '🎬', label: 'Video', defaultContent: { url: '', provider: 'youtube' } },
  { type: 'quote', icon: '💬', label: 'Quote', defaultContent: { text: '', author: '' } },
  { type: 'callout', icon: '📢', label: 'Callout', defaultContent: { text: '', style: 'info' } },
  { type: 'divider', icon: '➖', label: 'Divider', defaultContent: { style: 'line' } },
  { type: 'button', icon: '🔘', label: 'Button', defaultContent: { text: 'Click me', url: '#', style: 'primary' } },
  { type: 'columns', icon: '📊', label: '2 Columns', defaultContent: { left: [], right: [] } },
  { type: 'hero', icon: '🌅', label: 'Hero Section', defaultContent: { title: '', subtitle: '', background: '' } },
  { type: 'list', icon: '📋', label: 'List', defaultContent: { items: ['Item 1', 'Item 2'], style: 'bullet' } },
  { type: 'table', icon: '📑', label: 'Table', defaultContent: { rows: 3, cols: 3, data: [] } },
  { type: 'code', icon: '💻', label: 'Code Block', defaultContent: { code: '', language: 'javascript' } },
  { type: 'embed', icon: '🔗', label: 'Embed', defaultContent: { html: '' } },
];

export default function TemplateBuilder({ templateId, initialData, onSave, saving }: TemplateBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'article');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [blocks, setBlocks] = useState<Block[]>(initialData?.structure || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const dragOverBlockId = useRef<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    await onSave({
      name,
      description,
      category,
      isPublic,
      structure: blocks,
    });
  };

  const addBlock = (type: string) => {
    const blockType = BLOCK_TYPES.find(b => b.type === type);
    if (!blockType) return;

    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: blockType.defaultContent,
      styles: {},
    };

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setBlocks(newBlocks);
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    dragOverBlockId.current = blockId;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBlockId || !dragOverBlockId.current) return;

    const fromIndex = blocks.findIndex(b => b.id === draggedBlockId);
    const toIndex = blocks.findIndex(b => b.id === dragOverBlockId.current);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      moveBlock(fromIndex, toIndex);
    }

    setDraggedBlockId(null);
    dragOverBlockId.current = null;
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <input
            type="text"
            placeholder="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.nameInput}
          />
        </div>
        <div className={styles.topRight}>
          <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
            {saving ? 'Saving...' : '💾 Save Template'}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Blocks Palette */}
        <div className={styles.palette}>
          <h3>Add Blocks</h3>
          <div className={styles.blockTypes}>
            {BLOCK_TYPES.map(blockType => (
              <button
                key={blockType.type}
                onClick={() => addBlock(blockType.type)}
                className={styles.blockTypeButton}
                title={blockType.label}
              >
                <span className={styles.blockIcon}>{blockType.icon}</span>
                <span className={styles.blockLabel}>{blockType.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.paletteSection}>
            <h4>Template Settings</h4>
            <div className={styles.settingGroup}>
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this template..."
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.settingGroup}>
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.select}>
                <option value="article">Article Layout</option>
                <option value="landing">Landing Page</option>
                <option value="newsletter">Newsletter</option>
                <option value="email">Email Template</option>
                <option value="page">Page Layout</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span>Make this template public</span>
              </label>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className={styles.canvas}>
          <div className={styles.canvasContent}>
            {blocks.length === 0 ? (
              <div className={styles.emptyCanvas}>
                <div className={styles.emptyIcon}>✨</div>
                <h3>Start Building Your Template</h3>
                <p>Add blocks from the left panel to create your template structure</p>
              </div>
            ) : (
              <div className={styles.blocksList}>
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`${styles.blockItem} ${selectedBlockId === block.id ? styles.blockSelected : ''} ${draggedBlockId === block.id ? styles.blockDragging : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block.id)}
                    onDragOver={(e) => handleDragOver(e, block.id)}
                    onDrop={handleDrop}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <div className={styles.blockHandle}>⋮⋮</div>
                    <div className={styles.blockContent}>
                      <div className={styles.blockType}>
                        {BLOCK_TYPES.find(t => t.type === block.type)?.icon} {block.type}
                      </div>
                      <BlockPreview block={block} />
                    </div>
                    <div className={styles.blockActions}>
                      {index > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(index, index - 1); }} className={styles.moveButton}>
                          ↑
                        </button>
                      )}
                      {index < blocks.length - 1 && (
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(index, index + 1); }} className={styles.moveButton}>
                          ↓
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className={styles.deleteButton}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className={styles.properties}>
          <h3>Block Properties</h3>
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
            />
          ) : (
            <div className={styles.noSelection}>
              <p>Select a block to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return <div className="preview-heading">{block.content.text || 'Heading'}</div>;
    case 'paragraph':
      return <div className="preview-paragraph">{block.content.text || 'Paragraph'}</div>;
    case 'image':
      return <div className="preview-image">🖼️ {block.content.alt || 'Image'}</div>;
    case 'quote':
      return <div className="preview-quote">"{block.content.text || 'Quote'}"</div>;
    case 'button':
      return <div className="preview-button">🔘 {block.content.text || 'Button'}</div>;
    default:
      return <div>{block.type}</div>;
  }
}

function BlockEditor({ block, onUpdate }: { block: Block; onUpdate: (updates: Partial<Block>) => void }) {
  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: {
        ...block.content,
        [key]: value,
      },
    });
  };

  switch (block.type) {
    case 'heading':
      return (
        <div className={styles.editorPanel}>
          <div className={styles.formGroup}>
            <label>Text</label>
            <input
              type="text"
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Level</label>
            <select value={block.content.level || 2} onChange={(e) => updateContent('level', parseInt(e.target.value))} className={styles.select}>
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
              <option value="4">H4</option>
              <option value="5">H5</option>
              <option value="6">H6</option>
            </select>
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <div className={styles.editorPanel}>
          <div className={styles.formGroup}>
            <label>Text</label>
            <textarea
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className={styles.textarea}
              rows={5}
            />
          </div>
        </div>
      );

    case 'image':
      return (
        <div className={styles.editorPanel}>
          <div className={styles.formGroup}>
            <label>Image URL</label>
            <input
              type="text"
              value={block.content.src || ''}
              onChange={(e) => updateContent('src', e.target.value)}
              className={styles.input}
              placeholder="https://..."
            />
          </div>
          <div className={styles.formGroup}>
            <label>Alt Text</label>
            <input
              type="text"
              value={block.content.alt || ''}
              onChange={(e) => updateContent('alt', e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Caption</label>
            <input
              type="text"
              value={block.content.caption || ''}
              onChange={(e) => updateContent('caption', e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      );

    case 'button':
      return (
        <div className={styles.editorPanel}>
          <div className={styles.formGroup}>
            <label>Button Text</label>
            <input
              type="text"
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>URL</label>
            <input
              type="text"
              value={block.content.url || ''}
              onChange={(e) => updateContent('url', e.target.value)}
              className={styles.input}
              placeholder="https://..."
            />
          </div>
          <div className={styles.formGroup}>
            <label>Style</label>
            <select value={block.content.style || 'primary'} onChange={(e) => updateContent('style', e.target.value)} className={styles.select}>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className={styles.editorPanel}>
          <div className={styles.formGroup}>
            <label>Quote Text</label>
            <textarea
              value={block.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              className={styles.textarea}
              rows={4}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Author</label>
            <input
              type="text"
              value={block.content.author || ''}
              onChange={(e) => updateContent('author', e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className={styles.editorPanel}>
          <p>No editor available for this block type</p>
        </div>
      );
  }
}
