import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Type, Image, Columns, Square, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Link, Code, List, ListOrdered,
  Save, Eye, Settings, Undo, Redo, Plus, Trash2, Copy, Move,
  ChevronDown, Palette, Spacing, LayoutTemplate
} from 'lucide-react';
import styles from './VisualPageBuilder.module.css';

interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'button' | 'columns' | 'spacer';
  content: string;
  styles: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: string;
    marginTop?: string;
    marginBottom?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    width?: string;
    height?: string;
    borderRadius?: string;
  };
  children?: Block[];
}

interface VisualPageBuilderProps {
  pageId?: string;
  initialContent?: Block[];
  onSave?: (content: Block[]) => void;
}

export default function VisualPageBuilder({ pageId, initialContent = [], onSave }: VisualPageBuilderProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(initialContent);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Add new block
  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      content: type === 'heading' ? 'Heading Text' : type === 'paragraph' ? 'Paragraph text...' : type === 'image' ? '' : type === 'button' ? 'Click Me' : '',
      styles: {
        fontSize: type === 'heading' ? '32px' : '16px',
        color: '#000000',
        marginBottom: '20px',
        textAlign: 'left'
      }
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setShowStylePanel(true);
  };

  // Update block content
  const updateBlockContent = (blockId: string, content: string) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content } : b));
  };

  // Update block styles
  const updateBlockStyle = (blockId: string, styleName: string, value: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId
        ? { ...b, styles: { ...b.styles, [styleName]: value } }
        : b
    ));
  };

  // Delete block
  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      setShowStylePanel(false);
    }
  };

  // Duplicate block
  const duplicateBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = { ...block, id: `block_${Date.now()}` };
      const index = blocks.findIndex(b => b.id === blockId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    }
  };

  // Move block up/down
  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  // Save page
  const handleSave = async () => {
    setSaving(true);
    if (onSave) {
      await onSave(blocks);
    }
    setSaving(false);
  };

  return (
    <div className={styles.builder}>
      {/* Top Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            className={styles.toolbarButton}
            onClick={() => router.back()}
          >
            ← Back
          </button>
          <div className={styles.toolbarDivider} />
          <button className={styles.toolbarButton}>
            <Undo size={18} />
          </button>
          <button className={styles.toolbarButton}>
            <Redo size={18} />
          </button>
        </div>

        <div className={styles.toolbarCenter}>
          <button
            className={`${styles.modeButton} ${!previewMode ? styles.active : ''}`}
            onClick={() => setPreviewMode(false)}
          >
            <Settings size={16} /> Edit
          </button>
          <button
            className={`${styles.modeButton} ${previewMode ? styles.active : ''}`}
            onClick={() => setPreviewMode(true)}
          >
            <Eye size={16} /> Preview
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className={styles.builderContent}>
        {/* Left Sidebar - Add Elements */}
        {!previewMode && (
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <Plus size={16} />
              <span>Add Elements</span>
            </div>

            <div className={styles.elementsList}>
              <div className={styles.elementsGroup}>
                <div className={styles.groupLabel}>Basic</div>
                <button
                  className={styles.elementButton}
                  onClick={() => addBlock('heading')}
                >
                  <Type size={20} />
                  <span>Heading</span>
                </button>
                <button
                  className={styles.elementButton}
                  onClick={() => addBlock('paragraph')}
                >
                  <AlignLeft size={20} />
                  <span>Text</span>
                </button>
                <button
                  className={styles.elementButton}
                  onClick={() => addBlock('image')}
                >
                  <Image size={20} />
                  <span>Image</span>
                </button>
                <button
                  className={styles.elementButton}
                  onClick={() => addBlock('button')}
                >
                  <Square size={20} />
                  <span>Button</span>
                </button>
              </div>

              <div className={styles.elementsGroup}>
                <div className={styles.groupLabel}>Layout</div>
                <button
                  className={styles.elementButton}
                  onClick={() => addBlock('columns')}
                >
                  <Columns size={20} />
                  <span>Columns</span>
                </button>
                <button
                  className={styles.elementButton}
                  onClick={() => addBlock('spacer')}
                >
                  <Spacing size={20} />
                  <span>Spacer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center - Canvas */}
        <div className={styles.canvas} ref={canvasRef}>
          <div className={styles.canvasInner}>
            {blocks.length === 0 ? (
              <div className={styles.emptyState}>
                <LayoutTemplate size={48} />
                <h3>Start Building Your Page</h3>
                <p>Add elements from the left sidebar to get started</p>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`${styles.block} ${selectedBlockId === block.id ? styles.blockSelected : ''}`}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setShowStylePanel(true);
                  }}
                  style={{
                    ...block.styles,
                    cursor: previewMode ? 'default' : 'pointer'
                  }}
                >
                  {/* Block Controls (Edit Mode Only) */}
                  {!previewMode && selectedBlockId === block.id && (
                    <div className={styles.blockControls}>
                      <button
                        className={styles.blockControlButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'up');
                        }}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        className={styles.blockControlButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'down');
                        }}
                        disabled={index === blocks.length - 1}
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        className={styles.blockControlButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateBlock(block.id);
                        }}
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className={`${styles.blockControlButton} ${styles.delete}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this block?')) {
                            deleteBlock(block.id);
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* Block Content */}
                  {block.type === 'heading' && (
                    <h2
                      contentEditable={!previewMode}
                      suppressContentEditableWarning
                      onBlur={(e) => updateBlockContent(block.id, e.currentTarget.textContent || '')}
                      style={{ outline: 'none' }}
                    >
                      {block.content}
                    </h2>
                  )}

                  {block.type === 'paragraph' && (
                    <p
                      contentEditable={!previewMode}
                      suppressContentEditableWarning
                      onBlur={(e) => updateBlockContent(block.id, e.currentTarget.textContent || '')}
                      style={{ outline: 'none' }}
                    >
                      {block.content}
                    </p>
                  )}

                  {block.type === 'image' && (
                    <div className={styles.imageBlock}>
                      {block.content ? (
                        <img src={block.content} alt="" style={{ maxWidth: '100%' }} />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <Image size={48} />
                          <p>Click to add image</p>
                        </div>
                      )}
                    </div>
                  )}

                  {block.type === 'button' && (
                    <button
                      className={styles.buttonBlock}
                      contentEditable={!previewMode}
                      suppressContentEditableWarning
                      onBlur={(e) => updateBlockContent(block.id, e.currentTarget.textContent || '')}
                    >
                      {block.content}
                    </button>
                  )}

                  {block.type === 'spacer' && (
                    <div
                      className={styles.spacerBlock}
                      style={{ height: block.styles.height || '40px' }}
                    >
                      {!previewMode && <span className={styles.spacerLabel}>Spacer</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar - Style Panel */}
        {!previewMode && showStylePanel && selectedBlock && (
          <div className={styles.stylePanel}>
            <div className={styles.stylePanelHeader}>
              <Palette size={16} />
              <span>Style Settings</span>
              <button
                className={styles.closePanelButton}
                onClick={() => setShowStylePanel(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.stylePanelContent}>
              {/* Typography */}
              {(selectedBlock.type === 'heading' || selectedBlock.type === 'paragraph') && (
                <div className={styles.styleSection}>
                  <div className={styles.sectionLabel}>Typography</div>

                  <div className={styles.styleControl}>
                    <label>Font Size</label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={parseInt(selectedBlock.styles.fontSize || '16')}
                      onChange={(e) => updateBlockStyle(selectedBlock.id, 'fontSize', `${e.target.value}px`)}
                      className={styles.rangeInput}
                    />
                    <span className={styles.rangeValue}>{selectedBlock.styles.fontSize}</span>
                  </div>

                  <div className={styles.styleControl}>
                    <label>Color</label>
                    <input
                      type="color"
                      value={selectedBlock.styles.color || '#000000'}
                      onChange={(e) => updateBlockStyle(selectedBlock.id, 'color', e.target.value)}
                      className={styles.colorInput}
                    />
                  </div>

                  <div className={styles.styleControl}>
                    <label>Text Align</label>
                    <div className={styles.buttonGroup}>
                      <button
                        className={selectedBlock.styles.textAlign === 'left' ? styles.active : ''}
                        onClick={() => updateBlockStyle(selectedBlock.id, 'textAlign', 'left')}
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button
                        className={selectedBlock.styles.textAlign === 'center' ? styles.active : ''}
                        onClick={() => updateBlockStyle(selectedBlock.id, 'textAlign', 'center')}
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button
                        className={selectedBlock.styles.textAlign === 'right' ? styles.active : ''}
                        onClick={() => updateBlockStyle(selectedBlock.id, 'textAlign', 'right')}
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Spacing */}
              <div className={styles.styleSection}>
                <div className={styles.sectionLabel}>Spacing</div>

                <div className={styles.styleControl}>
                  <label>Margin Top</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={parseInt(selectedBlock.styles.marginTop || '0')}
                    onChange={(e) => updateBlockStyle(selectedBlock.id, 'marginTop', `${e.target.value}px`)}
                    className={styles.rangeInput}
                  />
                  <span className={styles.rangeValue}>{selectedBlock.styles.marginTop || '0px'}</span>
                </div>

                <div className={styles.styleControl}>
                  <label>Margin Bottom</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={parseInt(selectedBlock.styles.marginBottom || '0')}
                    onChange={(e) => updateBlockStyle(selectedBlock.id, 'marginBottom', `${e.target.value}px`)}
                    className={styles.rangeInput}
                  />
                  <span className={styles.rangeValue}>{selectedBlock.styles.marginBottom || '0px'}</span>
                </div>

                <div className={styles.styleControl}>
                  <label>Padding</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={parseInt(selectedBlock.styles.paddingTop || '0')}
                    onChange={(e) => {
                      const val = `${e.target.value}px`;
                      updateBlockStyle(selectedBlock.id, 'paddingTop', val);
                      updateBlockStyle(selectedBlock.id, 'paddingBottom', val);
                      updateBlockStyle(selectedBlock.id, 'paddingLeft', val);
                      updateBlockStyle(selectedBlock.id, 'paddingRight', val);
                    }}
                    className={styles.rangeInput}
                  />
                  <span className={styles.rangeValue}>{selectedBlock.styles.paddingTop || '0px'}</span>
                </div>
              </div>

              {/* Background */}
              <div className={styles.styleSection}>
                <div className={styles.sectionLabel}>Background</div>

                <div className={styles.styleControl}>
                  <label>Background Color</label>
                  <input
                    type="color"
                    value={selectedBlock.styles.backgroundColor || '#ffffff'}
                    onChange={(e) => updateBlockStyle(selectedBlock.id, 'backgroundColor', e.target.value)}
                    className={styles.colorInput}
                  />
                </div>
              </div>

              {/* Image Settings */}
              {selectedBlock.type === 'image' && (
                <div className={styles.styleSection}>
                  <div className={styles.sectionLabel}>Image</div>

                  <div className={styles.styleControl}>
                    <label>Image URL</label>
                    <input
                      type="text"
                      value={selectedBlock.content}
                      onChange={(e) => updateBlockContent(selectedBlock.id, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.styleControl}>
                    <label>Width</label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={parseInt(selectedBlock.styles.width || '100')}
                      onChange={(e) => updateBlockStyle(selectedBlock.id, 'width', `${e.target.value}%`)}
                      className={styles.rangeInput}
                    />
                    <span className={styles.rangeValue}>{selectedBlock.styles.width || '100%'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
