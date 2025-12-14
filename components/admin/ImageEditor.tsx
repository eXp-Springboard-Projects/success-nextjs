import { useState, useRef, useEffect } from 'react';
import styles from './ImageEditor.module.css';

interface ImageEditorProps {
  src: string;
  alt?: string;
  onSave: (updates: {
    src: string;
    alt?: string;
    width?: string;
    align?: string;
    link?: string;
    filters?: {
      brightness?: number;
      contrast?: number;
      grayscale?: number;
    };
  }) => void;
  onClose: () => void;
}

export default function ImageEditor({ src, alt = '', onSave, onClose }: ImageEditorProps) {
  const [imageAlt, setImageAlt] = useState(alt);
  const [imageWidth, setImageWidth] = useState('100%');
  const [imageAlign, setImageAlign] = useState('left');
  const [imageLink, setImageLink] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);

  const getFilterStyle = () => {
    return `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`;
  };

  const handleSave = () => {
    onSave({
      src,
      alt: imageAlt,
      width: imageWidth,
      align: imageAlign,
      link: imageLink || undefined,
      filters: {
        brightness,
        contrast,
        grayscale,
      },
    });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Edit Image</h3>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.content}>
          <div className={styles.preview}>
            <img
              src={src}
              alt={imageAlt}
              style={{
                filter: getFilterStyle(),
                width: imageWidth,
                margin: imageAlign === 'center' ? '0 auto' : imageAlign === 'right' ? '0 0 0 auto' : '0',
                display: 'block',
              }}
            />
          </div>

          <div className={styles.controls}>
            <div className={styles.section}>
              <h4>Basic Settings</h4>

              <div className={styles.field}>
                <label>Alt Text</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe this image..."
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Link URL (optional)</label>
                <input
                  type="text"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  placeholder="https://..."
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Width</label>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => setImageWidth('25%')}
                    className={imageWidth === '25%' ? styles.buttonActive : styles.button}
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setImageWidth('50%')}
                    className={imageWidth === '50%' ? styles.buttonActive : styles.button}
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setImageWidth('75%')}
                    className={imageWidth === '75%' ? styles.buttonActive : styles.button}
                  >
                    75%
                  </button>
                  <button
                    onClick={() => setImageWidth('100%')}
                    className={imageWidth === '100%' ? styles.buttonActive : styles.button}
                  >
                    100%
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label>Alignment</label>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => setImageAlign('left')}
                    className={imageAlign === 'left' ? styles.buttonActive : styles.button}
                  >
                    ⬅ Left
                  </button>
                  <button
                    onClick={() => setImageAlign('center')}
                    className={imageAlign === 'center' ? styles.buttonActive : styles.button}
                  >
                    ⬌ Center
                  </button>
                  <button
                    onClick={() => setImageAlign('right')}
                    className={imageAlign === 'right' ? styles.buttonActive : styles.button}
                  >
                    ➡ Right
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h4>Filters</h4>

              <div className={styles.field}>
                <label>Brightness: {brightness}%</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <div className={styles.field}>
                <label>Contrast: {contrast}%</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <div className={styles.field}>
                <label>Grayscale: {grayscale}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => setGrayscale(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <button
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setGrayscale(0);
                }}
                className={styles.resetButton}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveButton}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
