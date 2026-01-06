import { useState } from 'react';
import { articleTemplates, ArticleTemplate } from './article-templates/templateDefinitions';
import styles from './ArticleTemplates.module.css';

interface ArticleTemplatesProps {
  onSelectTemplate: (template: ArticleTemplate) => void;
  onClose: () => void;
}

export default function ArticleTemplates({ onSelectTemplate, onClose }: ArticleTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'feature' | 'short' | 'structured'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ArticleTemplate | null>(null);

  const filteredTemplates = selectedCategory === 'all'
    ? articleTemplates
    : articleTemplates.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: ArticleTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Choose an Article Template</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.categoryFilter}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? styles.categoryActive : styles.category}
          >
            All Templates
          </button>
          <button
            onClick={() => setSelectedCategory('feature')}
            className={selectedCategory === 'feature' ? styles.categoryActive : styles.category}
          >
            Feature Stories
          </button>
          <button
            onClick={() => setSelectedCategory('short')}
            className={selectedCategory === 'short' ? styles.categoryActive : styles.category}
          >
            Quick Reads
          </button>
          <button
            onClick={() => setSelectedCategory('structured')}
            className={selectedCategory === 'structured' ? styles.categoryActive : styles.category}
          >
            Structured Formats
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.templateGrid}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`${styles.templateCard} ${
                  selectedTemplate?.id === template.id ? styles.templateCardSelected : ''
                }`}
              >
                <div className={styles.templateIcon}>{template.icon}</div>
                <h3 className={styles.templateName}>{template.name}</h3>
                <p className={styles.templateDescription}>{template.description}</p>
                <div className={styles.templateMeta}>
                  <span className={styles.blockCount}>
                    {template.blocks.length} blocks
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className={styles.preview}>
              <div className={styles.previewHeader}>
                <h3>
                  {selectedTemplate.icon} {selectedTemplate.name}
                </h3>
                <p>{selectedTemplate.description}</p>
              </div>

              <div className={styles.previewStructure}>
                <h4>Template Structure:</h4>
                <ul>
                  {selectedTemplate.blocks.map((block, index) => (
                    <li key={index}>
                      {block.type === 'heading' && block.attrs?.level && (
                        <span>📝 Heading Level {block.attrs.level}</span>
                      )}
                      {block.type === 'paragraph' && <span>📄 Paragraph</span>}
                      {block.type === 'fullWidthImage' && <span>🖼️ Full Width Image</span>}
                      {block.type === 'imageTextLayout' && (
                        <span>🖼️➡️ Image + Text ({block.attrs?.imagePosition})</span>
                      )}
                      {block.type === 'pullQuote' && <span>💬 Pull Quote</span>}
                      {block.type === 'calloutBox' && (
                        <span>📦 Callout Box ({block.attrs?.variant})</span>
                      )}
                      {block.type === 'divider' && <span>─ Divider</span>}
                      {block.type === 'imageGallery' && <span>🖼️🖼️🖼️ Image Gallery</span>}
                      {block.type === 'videoEmbed' && <span>🎥 Video Embed</span>}
                      {block.type === 'authorBio' && <span>👤 Author Bio</span>}
                      {block.type === 'relatedArticles' && <span>📰 Related Articles</span>}
                      {block.type === 'buttonBlock' && <span>🔘 CTA Button</span>}
                      {block.type === 'twoColumnText' && <span>⚌ Two Column Text</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={handleApplyTemplate} className={styles.applyButton}>
                Apply Template
              </button>
            </div>
          )}
        </div>

        {!selectedTemplate && (
          <div className={styles.footer}>
            <p className={styles.hint}>
              💡 <strong>Tip:</strong> Select a template to see its structure and apply it to your article.
              All content is editable after applying.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
