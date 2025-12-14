import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const Divider = Node.create({
  name: 'divider',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      style: {
        default: 'solid', // 'solid', 'dashed', 'dotted', 'double', 'stars'
      },
      thickness: {
        default: 'medium', // 'thin', 'medium', 'thick'
      },
      spacing: {
        default: 'normal', // 'tight', 'normal', 'loose'
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="divider"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { style, thickness, spacing } = HTMLAttributes;

    if (style === 'stars') {
      return [
        'div',
        mergeAttributes(HTMLAttributes, {
          'data-type': 'divider',
          class: `divider-block divider-stars spacing-${spacing}`,
        }),
        ['div', { class: 'divider-content' }, '⋆ ⋆ ⋆'],
      ];
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'divider',
        class: `divider-block divider-${style} thickness-${thickness} spacing-${spacing}`,
      }),
      ['hr', {}],
    ];
  },

  addCommands() {
    return {
      setDivider:
        (options?: {
          style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'stars';
          thickness?: 'thin' | 'medium' | 'thick';
          spacing?: 'tight' | 'normal' | 'loose';
        }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options || {},
          });
        },
    } as Partial<RawCommands>;
  },
});
