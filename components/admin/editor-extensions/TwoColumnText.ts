import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const TwoColumnText = Node.create({
  name: 'twoColumnText',
  group: 'block',
  content: 'block+',
  draggable: true,

  addAttributes() {
    return {
      leftContent: {
        default: '',
      },
      rightContent: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="two-column-text"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'two-column-text', class: 'two-column-text-block' }),
      [
        'div',
        { class: 'column-left' },
        ['div', { class: 'column-content', contenteditable: 'true' }, 0],
      ],
      [
        'div',
        { class: 'column-right' },
        ['div', { class: 'column-content', contenteditable: 'true' }, 0],
      ],
    ];
  },

  addCommands() {
    return {
      setTwoColumnText:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Left column text...' }],
              },
            ],
          });
        },
    } as Partial<RawCommands>;
  },
});
