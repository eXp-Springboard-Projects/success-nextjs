import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const CalloutBox = Node.create({
  name: 'calloutBox',
  group: 'block',
  content: 'block+',
  draggable: true,

  addAttributes() {
    return {
      variant: {
        default: 'info', // 'info', 'warning', 'success', 'error'
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout-box"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const variant = HTMLAttributes.variant || 'info';
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout-box',
        class: `callout-box-block callout-${variant}`,
      }),
      [
        'div',
        { class: 'callout-header' },
        ['span', { class: 'callout-icon' }, icons[variant as keyof typeof icons] || icons.info],
        HTMLAttributes.title
          ? ['span', { class: 'callout-title' }, HTMLAttributes.title]
          : '',
      ],
      ['div', { class: 'callout-content', contenteditable: 'true' }, 0],
    ];
  },

  addCommands() {
    return {
      setCalloutBox:
        (options?: { variant?: 'info' | 'warning' | 'success' | 'error'; title?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Add your callout text here...' }],
              },
            ],
          });
        },
    } as Partial<RawCommands>;
  },
});
