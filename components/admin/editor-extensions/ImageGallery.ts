import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const ImageGallery = Node.create({
  name: 'imageGallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute('data-images');
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          return {
            'data-images': JSON.stringify(attributes.images),
          };
        },
      },
      columns: {
        default: 3, // 2 or 3 columns
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-gallery"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const images = HTMLAttributes.images || [];
    const columns = HTMLAttributes.columns || 3;

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'image-gallery',
        class: `image-gallery-block gallery-columns-${columns}`,
      }),
      [
        'div',
        { class: 'gallery-grid' },
        ...images.map((img: { src: string; alt: string; caption?: string }) => [
          'div',
          { class: 'gallery-item' },
          ['img', { src: img.src, alt: img.alt || '' }],
          img.caption ? ['p', { class: 'gallery-caption' }, img.caption] : '',
        ]),
      ],
    ];
  },

  addCommands() {
    return {
      setImageGallery:
        (options: { images: Array<{ src: string; alt?: string; caption?: string }>; columns?: number }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as Partial<RawCommands>;
  },
});
