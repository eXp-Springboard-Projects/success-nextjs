import { Editor } from '@tiptap/react';
import styles from './BlockControls.module.css';

interface BlockControlsProps {
  editor: Editor;
  position: { top: number; left: number };
  onClose: () => void;
}

const BLOCK_WIDTHS = [
  { label: '25%', value: '25%' },
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '100%', value: '100%' },
];

const PADDING_OPTIONS = [
  { label: 'None', value: '0' },
  { label: 'Small', value: '1rem' },
  { label: 'Medium', value: '2rem' },
  { label: 'Large', value: '3rem' },
];

const BACKGROUND_COLORS = [
  { label: 'None', value: 'transparent' },
  { label: 'Light Gray', value: '#f5f5f5' },
  { label: 'Light Blue', value: '#dbeafe' },
  { label: 'Light Green', value: '#d1fae5' },
  { label: 'Light Yellow', value: '#fef3c7' },
  { label: 'Light Purple', value: '#e0e7ff' },
];

export default function BlockControls({ editor, position, onClose }: BlockControlsProps) {
  const applyBlockStyle = (style: string, value: string) => {
    const { from } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node) {
      editor.chain().focus().updateAttributes(node.type.name, {
        [style]: value,
      }).run();
    }
  };

  const duplicateBlock = () => {
    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node) {
      editor
        .chain()
        .focus()
        .insertContentAt(to + 1, node.toJSON())
        .run();
    }
    onClose();
  };

  const deleteBlock = () => {
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).run();
    onClose();
  };

  const moveBlockUp = () => {
    const { $from } = editor.state.selection;
    const currentPos = $from.before($from.depth);

    if (currentPos > 0) {
      const node = editor.state.doc.nodeAt(currentPos);
      if (node) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: currentPos, to: currentPos + node.nodeSize })
          .insertContentAt(Math.max(0, currentPos - 2), node.toJSON())
          .run();
      }
    }
    onClose();
  };

  const moveBlockDown = () => {
    const { $from } = editor.state.selection;
    const currentPos = $from.before($from.depth);
    const node = editor.state.doc.nodeAt(currentPos);

    if (node) {
      const nextPos = currentPos + node.nodeSize;
      editor
        .chain()
        .focus()
        .deleteRange({ from: currentPos, to: nextPos })
        .insertContentAt(nextPos, node.toJSON())
        .run();
    }
    onClose();
  };

  return (
    <div
      className={styles.panel}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
      }}
    >
      <div className={styles.header}>
        <h4>Block Controls</h4>
        <button onClick={onClose} className={styles.closeButton}>✕</button>
      </div>

      <div className={styles.section}>
        <label>Width</label>
        <div className={styles.buttonGroup}>
          {BLOCK_WIDTHS.map(width => (
            <button
              key={width.value}
              onClick={() => applyBlockStyle('width', width.value)}
              className={styles.button}
            >
              {width.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label>Padding</label>
        <div className={styles.buttonGroup}>
          {PADDING_OPTIONS.map(padding => (
            <button
              key={padding.value}
              onClick={() => applyBlockStyle('padding', padding.value)}
              className={styles.button}
            >
              {padding.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label>Background</label>
        <select
          onChange={(e) => applyBlockStyle('backgroundColor', e.target.value)}
          className={styles.select}
        >
          {BACKGROUND_COLORS.map(bg => (
            <option key={bg.value} value={bg.value}>{bg.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label>Border</label>
        <div className={styles.field}>
          <input
            type="number"
            placeholder="Width (px)"
            onChange={(e) => applyBlockStyle('borderWidth', `${e.target.value}px`)}
            className={styles.input}
            min="0"
            max="10"
          />
          <input
            type="color"
            onChange={(e) => applyBlockStyle('borderColor', e.target.value)}
            className={styles.colorInput}
          />
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.actions}>
        <button onClick={moveBlockUp} className={styles.actionButton}>
          ⬆️ Move Up
        </button>
        <button onClick={moveBlockDown} className={styles.actionButton}>
          ⬇️ Move Down
        </button>
        <button onClick={duplicateBlock} className={styles.actionButton}>
          📋 Duplicate
        </button>
        <button onClick={deleteBlock} className={styles.deleteButton}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
