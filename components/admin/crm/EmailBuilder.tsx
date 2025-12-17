import { useState, useRef } from 'react';
import styles from './EmailBuilder.module.css';

export interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'divider' | 'columns' | 'social' | 'footer';
  content: any;
  settings: any;
}

interface EmailBuilderProps {
  initialBlocks?: EmailBlock[];
  onChange?: (blocks: EmailBlock[]) => void;
}

const DEFAULT_SETTINGS = {
  header: { backgroundColor: '#ffffff', textColor: '#111827', padding: 20, align: 'center' },
  text: { fontSize: 16, textColor: '#374151', padding: 20, align: 'left' },
  image: { width: '100%', align: 'center', padding: 20 },
  button: { backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: 5, padding: 20, align: 'center' },
  divider: { color: '#e5e7eb', style: 'solid', thickness: 1, padding: 20 },
  columns: { columnCount: 2, gap: 20, padding: 20 },
  social: { iconSize: 32, gap: 10, padding: 20, align: 'center' },
  footer: { backgroundColor: '#f9fafb', textColor: '#6b7280', fontSize: 14, padding: 20, align: 'center' },
};

export default function EmailBuilder({ initialBlocks = [], onChange }: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const blockTemplates = [
    { type: 'header', label: 'Header', icon: '📰' },
    { type: 'text', label: 'Text', icon: '📝' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'button', label: 'Button', icon: '🔘' },
    { type: 'divider', label: 'Divider', icon: '➖' },
    { type: 'columns', label: 'Columns', icon: '📊' },
    { type: 'social', label: 'Social', icon: '🔗' },
    { type: 'footer', label: 'Footer', icon: '📄' },
  ] as const;

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: getDefaultContent(type),
      settings: { ...DEFAULT_SETTINGS[type] },
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    onChange?.(newBlocks);
  };

  const getDefaultContent = (type: EmailBlock['type']): any => {
    switch (type) {
      case 'header':
        return { logo: '', title: 'Email Header' };
      case 'text':
        return { html: '<p>Enter your text here...</p>' };
      case 'image':
        return { src: '', alt: '', link: '' };
      case 'button':
        return { text: 'Click Here', url: '' };
      case 'divider':
        return {};
      case 'columns':
        return { columns: [{ html: '<p>Column 1</p>' }, { html: '<p>Column 2</p>' }] };
      case 'social':
        return {
          links: [
            { platform: 'facebook', url: '' },
            { platform: 'twitter', url: '' },
            { platform: 'linkedin', url: '' },
            { platform: 'instagram', url: '' },
          ],
        };
      case 'footer':
        return { address: 'Your Company\n123 Street\nCity, State 12345', unsubscribeText: 'Unsubscribe' };
      default:
        return {};
    }
  };

  const updateBlockContent = (blockId: string, content: any) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, content: { ...block.content, ...content } } : block
    );
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const updateBlockSettings = (blockId: string, settings: any) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, settings: { ...block.settings, ...settings } } : block
    );
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const deleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(newBlocks);
    setSelectedBlockId(null);
    onChange?.(newBlocks);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveBlock(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const exportToHTML = () => {
    const html = generateHTML(blocks);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className={styles.builder}>
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Blocks</h3>
        <div className={styles.blockPalette}>
          {blockTemplates.map((template) => (
            <button
              key={template.type}
              className={styles.blockTemplate}
              onClick={() => addBlock(template.type)}
            >
              <span className={styles.blockIcon}>{template.icon}</span>
              <span className={styles.blockLabel}>{template.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.canvas}>
        <div className={styles.canvasToolbar}>
          <div className={styles.previewToggle}>
            <button
              className={previewMode === 'desktop' ? styles.previewActive : styles.previewButton}
              onClick={() => setPreviewMode('desktop')}
            >
              🖥️ Desktop
            </button>
            <button
              className={previewMode === 'mobile' ? styles.previewActive : styles.previewButton}
              onClick={() => setPreviewMode('mobile')}
            >
              📱 Mobile
            </button>
          </div>
          <button className={styles.exportButton} onClick={exportToHTML}>
            Export HTML
          </button>
        </div>

        <div
          ref={canvasRef}
          className={`${styles.canvasContent} ${previewMode === 'mobile' ? styles.mobileView : ''}`}
        >
          {blocks.length === 0 ? (
            <div className={styles.emptyCanvas}>
              <p>Drag blocks from the left sidebar to start building your email</p>
            </div>
          ) : (
            blocks.map((block, index) => (
              <div
                key={block.id}
                className={`${styles.blockWrapper} ${selectedBlockId === block.id ? styles.blockSelected : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedBlockId(block.id)}
              >
                <div className={styles.blockControls}>
                  <span className={styles.blockType}>{block.type}</span>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBlock(block.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.blockContent}>
                  {renderBlock(block)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.settingsSidebar}>
        {selectedBlock ? (
          <>
            <h3 className={styles.sidebarTitle}>Block Settings</h3>
            <div className={styles.settingsContent}>
              {renderBlockSettings(selectedBlock, updateBlockContent, updateBlockSettings)}
            </div>
          </>
        ) : (
          <div className={styles.noSelection}>
            <p>Select a block to edit its settings</p>
          </div>
        )}
      </div>
    </div>
  );

  function renderBlock(block: EmailBlock) {
    const { content, settings } = block;

    switch (block.type) {
      case 'header':
        return (
          <div style={{ backgroundColor: settings.backgroundColor, color: settings.textColor, padding: `${settings.padding}px`, textAlign: settings.align }}>
            {content.logo && <img src={content.logo} alt="Logo" style={{ maxHeight: '60px', marginBottom: '10px' }} />}
            <h1 style={{ margin: 0, fontSize: '24px' }}>{content.title}</h1>
          </div>
        );

      case 'text':
        return (
          <div
            style={{ fontSize: `${settings.fontSize}px`, color: settings.textColor, padding: `${settings.padding}px`, textAlign: settings.align }}
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        );

      case 'image':
        return (
          <div style={{ padding: `${settings.padding}px`, textAlign: settings.align }}>
            {content.src ? (
              content.link ? (
                <a href={content.link} target="_blank" rel="noopener noreferrer">
                  <img src={content.src} alt={content.alt} style={{ maxWidth: settings.width, display: 'inline-block' }} />
                </a>
              ) : (
                <img src={content.src} alt={content.alt} style={{ maxWidth: settings.width, display: 'inline-block' }} />
              )
            ) : (
              <div style={{ background: '#f3f4f6', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                Image placeholder
              </div>
            )}
          </div>
        );

      case 'button':
        return (
          <div style={{ padding: `${settings.padding}px`, textAlign: settings.align }}>
            <a
              href={content.url || '#'}
              style={{
                display: 'inline-block',
                backgroundColor: settings.backgroundColor,
                color: settings.textColor,
                padding: '12px 24px',
                borderRadius: `${settings.borderRadius}px`,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {content.text}
            </a>
          </div>
        );

      case 'divider':
        return (
          <div style={{ padding: `${settings.padding}px` }}>
            <hr style={{ border: 'none', borderTop: `${settings.thickness}px ${settings.style} ${settings.color}`, margin: 0 }} />
          </div>
        );

      case 'columns':
        return (
          <div style={{ display: 'flex', gap: `${settings.gap}px`, padding: `${settings.padding}px` }}>
            {content.columns.map((col: any, idx: number) => (
              <div key={idx} style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: col.html }} />
            ))}
          </div>
        );

      case 'social':
        return (
          <div style={{ padding: `${settings.padding}px`, textAlign: settings.align }}>
            <div style={{ display: 'inline-flex', gap: `${settings.gap}px` }}>
              {content.links.map((link: any, idx: number) => (
                link.url && (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <div style={{ width: `${settings.iconSize}px`, height: `${settings.iconSize}px`, background: '#3b82f6', borderRadius: '50%' }} />
                  </a>
                )
              ))}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div style={{ backgroundColor: settings.backgroundColor, color: settings.textColor, fontSize: `${settings.fontSize}px`, padding: `${settings.padding}px`, textAlign: settings.align }}>
            <p style={{ margin: '0 0 10px', whiteSpace: 'pre-line' }}>{content.address}</p>
            <a href="#unsubscribe" style={{ color: settings.textColor, textDecoration: 'underline' }}>
              {content.unsubscribeText}
            </a>
          </div>
        );

      default:
        return null;
    }
  }

  function renderBlockSettings(block: EmailBlock, updateContent: Function, updateSettings: Function) {
    const { content, settings } = block;

    return (
      <div className={styles.settingsForm}>
        {/* Content Settings */}
        <div className={styles.settingsSection}>
          <h4>Content</h4>

          {block.type === 'header' && (
            <>
              <label>Logo URL</label>
              <input
                type="text"
                value={content.logo}
                onChange={(e) => updateContent(block.id, { logo: e.target.value })}
                className={styles.input}
                placeholder="https://..."
              />
              <label>Title</label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => updateContent(block.id, { title: e.target.value })}
                className={styles.input}
              />
            </>
          )}

          {block.type === 'text' && (
            <>
              <label>Text Content</label>
              <textarea
                value={content.html.replace(/<[^>]*>/g, '')}
                onChange={(e) => updateContent(block.id, { html: `<p>${e.target.value}</p>` })}
                className={styles.textarea}
                rows={6}
              />
            </>
          )}

          {block.type === 'image' && (
            <>
              <label>Image URL</label>
              <input
                type="text"
                value={content.src}
                onChange={(e) => updateContent(block.id, { src: e.target.value })}
                className={styles.input}
                placeholder="https://..."
              />
              <label>Alt Text</label>
              <input
                type="text"
                value={content.alt}
                onChange={(e) => updateContent(block.id, { alt: e.target.value })}
                className={styles.input}
              />
              <label>Link URL (optional)</label>
              <input
                type="text"
                value={content.link}
                onChange={(e) => updateContent(block.id, { link: e.target.value })}
                className={styles.input}
                placeholder="https://..."
              />
            </>
          )}

          {block.type === 'button' && (
            <>
              <label>Button Text</label>
              <input
                type="text"
                value={content.text}
                onChange={(e) => updateContent(block.id, { text: e.target.value })}
                className={styles.input}
              />
              <label>Button URL</label>
              <input
                type="text"
                value={content.url}
                onChange={(e) => updateContent(block.id, { url: e.target.value })}
                className={styles.input}
                placeholder="https://..."
              />
            </>
          )}

          {block.type === 'columns' && (
            <>
              <label>Number of Columns</label>
              <select
                value={content.columns.length}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  const newColumns = Array(count).fill(null).map((_, i) => content.columns[i] || { html: `<p>Column ${i + 1}</p>` });
                  updateContent(block.id, { columns: newColumns });
                }}
                className={styles.select}
              >
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
              </select>
              {content.columns.map((col: any, idx: number) => (
                <div key={idx}>
                  <label>Column {idx + 1}</label>
                  <textarea
                    value={col.html.replace(/<[^>]*>/g, '')}
                    onChange={(e) => {
                      const newColumns = [...content.columns];
                      newColumns[idx] = { html: `<p>${e.target.value}</p>` };
                      updateContent(block.id, { columns: newColumns });
                    }}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              ))}
            </>
          )}

          {block.type === 'social' && (
            <>
              {content.links.map((link: any, idx: number) => (
                <div key={idx}>
                  <label>{link.platform.charAt(0).toUpperCase() + link.platform.slice(1)} URL</label>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...content.links];
                      newLinks[idx] = { ...link, url: e.target.value };
                      updateContent(block.id, { links: newLinks });
                    }}
                    className={styles.input}
                    placeholder="https://..."
                  />
                </div>
              ))}
            </>
          )}

          {block.type === 'footer' && (
            <>
              <label>Address</label>
              <textarea
                value={content.address}
                onChange={(e) => updateContent(block.id, { address: e.target.value })}
                className={styles.textarea}
                rows={3}
              />
              <label>Unsubscribe Text</label>
              <input
                type="text"
                value={content.unsubscribeText}
                onChange={(e) => updateContent(block.id, { unsubscribeText: e.target.value })}
                className={styles.input}
              />
            </>
          )}
        </div>

        {/* Style Settings */}
        <div className={styles.settingsSection}>
          <h4>Style</h4>

          {(block.type === 'header' || block.type === 'footer') && (
            <>
              <label>Background Color</label>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => updateSettings(block.id, { backgroundColor: e.target.value })}
                className={styles.colorInput}
              />
            </>
          )}

          {(block.type === 'header' || block.type === 'text' || block.type === 'footer') && (
            <>
              <label>Text Color</label>
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => updateSettings(block.id, { textColor: e.target.value })}
                className={styles.colorInput}
              />
            </>
          )}

          {(block.type === 'text' || block.type === 'footer') && (
            <>
              <label>Font Size</label>
              <input
                type="number"
                value={settings.fontSize}
                onChange={(e) => updateSettings(block.id, { fontSize: parseInt(e.target.value) })}
                className={styles.input}
                min="10"
                max="48"
              />
            </>
          )}

          {block.type === 'button' && (
            <>
              <label>Background Color</label>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => updateSettings(block.id, { backgroundColor: e.target.value })}
                className={styles.colorInput}
              />
              <label>Text Color</label>
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => updateSettings(block.id, { textColor: e.target.value })}
                className={styles.colorInput}
              />
              <label>Border Radius</label>
              <input
                type="number"
                value={settings.borderRadius}
                onChange={(e) => updateSettings(block.id, { borderRadius: parseInt(e.target.value) })}
                className={styles.input}
                min="0"
                max="50"
              />
            </>
          )}

          {block.type === 'divider' && (
            <>
              <label>Color</label>
              <input
                type="color"
                value={settings.color}
                onChange={(e) => updateSettings(block.id, { color: e.target.value })}
                className={styles.colorInput}
              />
              <label>Style</label>
              <select
                value={settings.style}
                onChange={(e) => updateSettings(block.id, { style: e.target.value })}
                className={styles.select}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
              <label>Thickness</label>
              <input
                type="number"
                value={settings.thickness}
                onChange={(e) => updateSettings(block.id, { thickness: parseInt(e.target.value) })}
                className={styles.input}
                min="1"
                max="10"
              />
            </>
          )}

          <label>Padding</label>
          <input
            type="number"
            value={settings.padding}
            onChange={(e) => updateSettings(block.id, { padding: parseInt(e.target.value) })}
            className={styles.input}
            min="0"
            max="100"
          />

          {(block.type === 'header' || block.type === 'text' || block.type === 'image' || block.type === 'button' || block.type === 'social' || block.type === 'footer') && (
            <>
              <label>Alignment</label>
              <select
                value={settings.align}
                onChange={(e) => updateSettings(block.id, { align: e.target.value })}
                className={styles.select}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </>
          )}
        </div>
      </div>
    );
  }
}

export function generateHTML(blocks: EmailBlock[]): string {
  const blockHTML = blocks.map(block => {
    const { content, settings } = block;

    switch (block.type) {
      case 'header':
        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${settings.backgroundColor};">
            <tr>
              <td style="padding: ${settings.padding}px; text-align: ${settings.align};">
                ${content.logo ? `<img src="${content.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
                <h1 style="color: ${settings.textColor}; margin: 0; font-size: 24px;">${content.title}</h1>
              </td>
            </tr>
          </table>
        `;

      case 'text':
        return `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: ${settings.padding}px; font-size: ${settings.fontSize}px; color: ${settings.textColor}; text-align: ${settings.align};">
                ${content.html}
              </td>
            </tr>
          </table>
        `;

      case 'image':
        const img = content.src ? `<img src="${content.src}" alt="${content.alt}" style="max-width: ${settings.width}; height: auto;" />` : '';
        const imageContent = content.link ? `<a href="${content.link}">${img}</a>` : img;
        return `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: ${settings.padding}px; text-align: ${settings.align};">
                ${imageContent}
              </td>
            </tr>
          </table>
        `;

      case 'button':
        return `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: ${settings.padding}px; text-align: ${settings.align};">
                <a href="${content.url || '#'}" style="display: inline-block; background-color: ${settings.backgroundColor}; color: ${settings.textColor}; padding: 12px 24px; border-radius: ${settings.borderRadius}px; text-decoration: none; font-weight: 600;">
                  ${content.text}
                </a>
              </td>
            </tr>
          </table>
        `;

      case 'divider':
        return `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: ${settings.padding}px;">
                <hr style="border: none; border-top: ${settings.thickness}px ${settings.style} ${settings.color}; margin: 0;" />
              </td>
            </tr>
          </table>
        `;

      case 'columns':
        const colWidth = `${100 / content.columns.length}%`;
        const columns = content.columns.map((col: any) => `
          <td style="width: ${colWidth}; padding: 0 ${settings.gap / 2}px;">
            ${col.html}
          </td>
        `).join('');
        return `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: ${settings.padding}px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>${columns}</tr>
                </table>
              </td>
            </tr>
          </table>
        `;

      case 'social':
        const socialLinks = content.links.filter((l: any) => l.url).map((link: any) => `
          <a href="${link.url}" style="margin: 0 ${settings.gap / 2}px;">
            <img src="https://via.placeholder.com/${settings.iconSize}" alt="${link.platform}" style="width: ${settings.iconSize}px; height: ${settings.iconSize}px; border-radius: 50%;" />
          </a>
        `).join('');
        return `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: ${settings.padding}px; text-align: ${settings.align};">
                ${socialLinks}
              </td>
            </tr>
          </table>
        `;

      case 'footer':
        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${settings.backgroundColor};">
            <tr>
              <td style="padding: ${settings.padding}px; font-size: ${settings.fontSize}px; color: ${settings.textColor}; text-align: ${settings.align};">
                <p style="margin: 0 0 10px; white-space: pre-line;">${content.address}</p>
                <a href="#unsubscribe" style="color: ${settings.textColor}; text-decoration: underline;">
                  ${content.unsubscribeText}
                </a>
              </td>
            </tr>
          </table>
        `;

      default:
        return '';
    }
  }).join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px;">
          ${blockHTML}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
