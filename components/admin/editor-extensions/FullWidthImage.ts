import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const FullWidthImage = Node.create({
  name: 'fullWidthImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="full-width-image"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'full-width-image', class: 'full-width-image-block' }),
      [
        'img',
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt || '',
          class: 'full-width-image',
        },
      ],
      HTMLAttributes.caption
        ? ['p', { class: 'image-caption' }, HTMLAttributes.caption]
        : '',
    ];
  },

  addCommands() {
    return {
      setFullWidthImage:
        (options: { src: string; alt?: string; caption?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as Partial<RawCommands>;
  },
});
