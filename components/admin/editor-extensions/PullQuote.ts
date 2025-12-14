import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const PullQuote = Node.create({
  name: 'pullQuote',
  group: 'block',
  content: 'inline*',
  draggable: true,

  addAttributes() {
    return {
      author: {
        default: null,
      },
      cite: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote[data-type="pull-quote"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      mergeAttributes(HTMLAttributes, { 'data-type': 'pull-quote', class: 'pull-quote-block' }),
      ['div', { class: 'pull-quote-content' }, 0],
      HTMLAttributes.author
        ? ['cite', { class: 'pull-quote-author' }, `— ${HTMLAttributes.author}`]
        : '',
    ];
  },

  addCommands() {
    return {
      setPullQuote:
        (options?: { author?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: [
              {
                type: 'text',
                text: 'Enter your quote here...',
              },
            ],
          });
        },
    } as Partial<RawCommands>;
  },
});
