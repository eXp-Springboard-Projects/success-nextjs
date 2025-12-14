import { Node, mergeAttributes } from '@tiptap/core';

export const ImageTextLayout = Node.create({
  name: 'imageTextLayout',
  group: 'block',
  content: 'block+',
  draggable: true,

  addAttributes() {
    return {
      imagePosition: {
        default: 'left', // 'left' or 'right'
      },
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-text-layout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const imagePosition = HTMLAttributes.imagePosition || 'left';
    const imageBlock = [
      'div',
      { class: 'image-side' },
      [
        'img',
        {
          src: HTMLAttributes.src || '',
          alt: HTMLAttributes.alt || '',
        },
      ],
    ];
    const textBlock = ['div', { class: 'text-side', contenteditable: 'true' }, 0];

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'image-text-layout',
        class: `image-text-layout-block image-${imagePosition}`,
      }),
      ...(imagePosition === 'left' ? [imageBlock, textBlock] : [textBlock, imageBlock]),
    ];
  },

  addCommands() {
    return {
      setImageTextLayout:
        (options: { imagePosition: 'left' | 'right'; src: string; alt?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Add your text here...' }],
              },
            ],
          });
        },
    };
  },
});
