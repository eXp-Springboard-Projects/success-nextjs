import Image from '@tiptap/extension-image';
import { mergeAttributes, RawCommands } from '@tiptap/core';

export const EnhancedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('data-width'),
        renderHTML: attributes => ({
          'data-width': attributes.width,
          style: `width: ${attributes.width}`,
        }),
      },
      align: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: attributes => ({
          'data-align': attributes.align,
        }),
      },
      link: {
        default: null,
        parseHTML: element => element.getAttribute('data-link'),
        renderHTML: attributes => ({
          'data-link': attributes.link,
        }),
      },
      brightness: {
        default: 100,
        parseHTML: element => element.getAttribute('data-brightness'),
        renderHTML: attributes => ({
          'data-brightness': attributes.brightness,
        }),
      },
      contrast: {
        default: 100,
        parseHTML: element => element.getAttribute('data-contrast'),
        renderHTML: attributes => ({
          'data-contrast': attributes.contrast,
        }),
      },
      grayscale: {
        default: 0,
        parseHTML: element => element.getAttribute('data-grayscale'),
        renderHTML: attributes => ({
          'data-grayscale': attributes.grayscale,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { link, width, align, brightness, contrast, grayscale, ...attrs } = HTMLAttributes;

    const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`;
    const alignStyle = align === 'center' ? 'margin: 0 auto; display: block;' :
                      align === 'right' ? 'margin: 0 0 0 auto; display: block;' : '';

    const imgAttrs = mergeAttributes(attrs, {
      'data-width': width,
      'data-align': align,
      'data-brightness': brightness,
      'data-contrast': contrast,
      'data-grayscale': grayscale,
      style: `width: ${width}; filter: ${filterStyle}; ${alignStyle}`,
    });

    if (link) {
      return [
        'a',
        { href: link, 'data-link': link },
        ['img', imgAttrs],
      ];
    }

    return ['img', imgAttrs];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      updateImage: (attributes: any) => ({ commands }: any) => {
        return commands.updateAttributes('image', attributes);
      },
    } as Partial<RawCommands>;
  },
});
