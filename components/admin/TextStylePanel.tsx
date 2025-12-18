import { Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import styles from './TextStylePanel.module.css';

interface TextStylePanelProps {
  editor: Editor;
}

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

// System fonts + Google Fonts
const FONT_FAMILIES = [
  // System Fonts
  { name: 'Arial', value: 'Arial, sans-serif', category: 'System' },
  { name: 'Georgia', value: 'Georgia, serif', category: 'System' },
  { name: 'Times New Roman', value: '"Times New Roman", serif', category: 'System' },
  { name: 'Courier New', value: '"Courier New", monospace', category: 'System' },
  { name: 'Verdana', value: 'Verdana, sans-serif', category: 'System' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif', category: 'System' },

  // Google Fonts - Sans Serif
  { name: 'Inter', value: '"Inter", sans-serif', category: 'Google Fonts', googleFont: 'Inter:wght@300;400;500;600;700' },
  { name: 'Roboto', value: '"Roboto", sans-serif', category: 'Google Fonts', googleFont: 'Roboto:wght@300;400;500;700' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'Google Fonts', googleFont: 'Open+Sans:wght@300;400;600;700' },
  { name: 'Lato', value: '"Lato", sans-serif', category: 'Google Fonts', googleFont: 'Lato:wght@300;400;700' },
  { name: 'Montserrat', value: '"Montserrat", sans-serif', category: 'Google Fonts', googleFont: 'Montserrat:wght@300;400;500;600;700' },
  { name: 'Poppins', value: '"Poppins", sans-serif', category: 'Google Fonts', googleFont: 'Poppins:wght@300;400;500;600;700' },
  { name: 'Raleway', value: '"Raleway", sans-serif', category: 'Google Fonts', googleFont: 'Raleway:wght@300;400;500;600;700' },

  // Google Fonts - Serif
  { name: 'Playfair Display', value: '"Playfair Display", serif', category: 'Google Fonts', googleFont: 'Playfair+Display:wght@400;500;600;700' },
  { name: 'Merriweather', value: '"Merriweather", serif', category: 'Google Fonts', googleFont: 'Merriweather:wght@300;400;700' },
  { name: 'Lora', value: '"Lora", serif', category: 'Google Fonts', googleFont: 'Lora:wght@400;500;600;700' },

  // Google Fonts - Monospace
  { name: 'Fira Code', value: '"Fira Code", monospace', category: 'Google Fonts', googleFont: 'Fira+Code:wght@300;400;500;600' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace', category: 'Google Fonts', googleFont: 'JetBrains+Mono:wght@300;400;500;600' },

  // Google Fonts - Display/Decorative
  { name: 'Pacifico', value: '"Pacifico", cursive', category: 'Google Fonts', googleFont: 'Pacifico' },
  { name: 'Dancing Script', value: '"Dancing Script", cursive', category: 'Google Fonts', googleFont: 'Dancing+Script:wght@400;500;600;700' },
  { name: 'Bebas Neue', value: '"Bebas Neue", sans-serif', category: 'Google Fonts', googleFont: 'Bebas+Neue' },
];

const LINE_HEIGHTS = [
  { label: 'Tight', value: '1.2' },
  { label: 'Normal', value: '1.5' },
  { label: 'Relaxed', value: '1.75' },
  { label: 'Loose', value: '2' },
];

const LETTER_SPACINGS = [
  { label: 'Tight', value: '-0.05em' },
  { label: 'Normal', value: '0' },
  { label: 'Wide', value: '0.05em' },
  { label: 'Wider', value: '0.1em' },
];

const FONT_WEIGHTS = [
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
];

export default function TextStylePanel({ editor }: TextStylePanelProps) {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [customFontUrl, setCustomFontUrl] = useState('');
  const [customFontName, setCustomFontName] = useState('');
  const [showCustomFontInput, setShowCustomFontInput] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#000000');
  const [customHighlightColor, setCustomHighlightColor] = useState('#FFFF00');

  // Load Google Fonts dynamically
  useEffect(() => {
    const googleFonts = FONT_FAMILIES.filter(f => f.googleFont).map(f => f.googleFont!);
    if (googleFonts.length > 0) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f}`).join('&')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const setFontSize = (size: number) => {
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
  };

  const setFontFamily = (family: string, googleFont?: string) => {
    // Load Google Font if not already loaded
    if (googleFont && !loadedFonts.has(googleFont)) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${googleFont}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      setLoadedFonts(new Set([...loadedFonts, googleFont]));
    }

    editor.chain().focus().setMark('textStyle', { fontFamily: family }).run();
  };

  const addCustomFont = () => {
    if (customFontUrl && customFontName) {
      // Add custom font via @font-face
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: "${customFontName}";
          src: url('${customFontUrl}');
        }
      `;
      document.head.appendChild(style);

      // Apply the custom font
      editor.chain().focus().setMark('textStyle', { fontFamily: `"${customFontName}", sans-serif` }).run();

      // Reset inputs
      setCustomFontUrl('');
      setCustomFontName('');
      setShowCustomFontInput(false);
    }
  };

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const setBackgroundColor = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const setLineHeight = (height: string) => {
    editor.chain().focus().setMark('textStyle', { lineHeight: height }).run();
  };

  const setLetterSpacing = (spacing: string) => {
    editor.chain().focus().setMark('textStyle', { letterSpacing: spacing }).run();
  };

  const setFontWeight = (weight: string) => {
    editor.chain().focus().setMark('textStyle', { fontWeight: weight }).run();
  };

  const applyCustomTextColor = () => {
    if (customTextColor) {
      editor.chain().focus().setColor(customTextColor).run();
    }
  };

  const applyCustomHighlightColor = () => {
    if (customHighlightColor) {
      editor.chain().focus().toggleHighlight({ color: customHighlightColor }).run();
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Font</h4>

        <div className={styles.field}>
          <label>Font Size</label>
          <select
            onChange={(e) => setFontSize(Number(e.target.value))}
            className={styles.select}
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Font Weight</label>
          <div className={styles.buttonGroup}>
            {FONT_WEIGHTS.map(fw => (
              <button
                key={fw.value}
                onClick={() => setFontWeight(fw.value)}
                className={styles.button}
                style={{ fontWeight: fw.value }}
              >
                {fw.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label>Font Family</label>
          <div className={styles.fontList}>
            {FONT_FAMILIES.map(font => (
              <button
                key={font.value}
                onClick={() => setFontFamily(font.value, font.googleFont)}
                className={styles.fontOption}
                style={{ fontFamily: font.value }}
              >
                <span className={styles.fontName}>{font.name}</span>
                <span className={styles.fontPreview} style={{ fontFamily: font.value }}>
                  The quick brown fox
                </span>
                {font.category === 'Google Fonts' && (
                  <span className={styles.fontBadge}>Google</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustomFontInput(!showCustomFontInput)}
            className={styles.addCustomButton}
          >
            + Add Custom Font
          </button>

          {showCustomFontInput && (
            <div className={styles.customFontForm}>
              <input
                type="text"
                placeholder="Font Name (e.g., My Custom Font)"
                value={customFontName}
                onChange={(e) => setCustomFontName(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Font URL (.woff2, .woff, .ttf)"
                value={customFontUrl}
                onChange={(e) => setCustomFontUrl(e.target.value)}
                className={styles.input}
              />
              <div className={styles.customFontActions}>
                <button onClick={addCustomFont} className={styles.applyButton}>
                  Apply Font
                </button>
                <button
                  onClick={() => {
                    setShowCustomFontInput(false);
                    setCustomFontUrl('');
                    setCustomFontName('');
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Colors</h4>

        <div className={styles.field}>
          <label>Text Color</label>
          <div className={styles.colorGrid}>
            {['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
              '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (
              <button
                key={color}
                onClick={() => setTextColor(color)}
                className={styles.colorButton}
                style={{ background: color }}
                title={color}
              />
            ))}
          </div>
          <div className={styles.customColorPicker}>
            <input
              type="color"
              value={customTextColor}
              onChange={(e) => setCustomTextColor(e.target.value)}
              className={styles.colorInput}
            />
            <input
              type="text"
              value={customTextColor}
              onChange={(e) => setCustomTextColor(e.target.value)}
              placeholder="#000000"
              className={styles.hexInput}
              maxLength={7}
            />
            <button onClick={applyCustomTextColor} className={styles.applyButton}>
              Apply
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label>Highlight Color</label>
          <div className={styles.colorGrid}>
            {['#FEF3C7', '#DBEAFE', '#D1FAE5', '#FCE7F3', '#E0E7FF', '#F3E8FF'].map(color => (
              <button
                key={color}
                onClick={() => setBackgroundColor(color)}
                className={styles.colorButton}
                style={{ background: color }}
                title={color}
              />
            ))}
          </div>
          <div className={styles.customColorPicker}>
            <input
              type="color"
              value={customHighlightColor}
              onChange={(e) => setCustomHighlightColor(e.target.value)}
              className={styles.colorInput}
            />
            <input
              type="text"
              value={customHighlightColor}
              onChange={(e) => setCustomHighlightColor(e.target.value)}
              placeholder="#FFFF00"
              className={styles.hexInput}
              maxLength={7}
            />
            <button onClick={applyCustomHighlightColor} className={styles.applyButton}>
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Spacing</h4>

        <div className={styles.field}>
          <label>Line Height</label>
          <div className={styles.buttonGroup}>
            {LINE_HEIGHTS.map(lh => (
              <button
                key={lh.value}
                onClick={() => setLineHeight(lh.value)}
                className={styles.button}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label>Letter Spacing</label>
          <div className={styles.buttonGroup}>
            {LETTER_SPACINGS.map(ls => (
              <button
                key={ls.value}
                onClick={() => setLetterSpacing(ls.value)}
                className={styles.button}
              >
                {ls.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
