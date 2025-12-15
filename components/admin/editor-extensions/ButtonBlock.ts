import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const ButtonBlock = Node.create({
  name: 'buttonBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      text: {
        default: 'Click Here',
      },
      url: {
        default: '#',
      },
      variant: {
        default: 'primary', // 'primary', 'secondary', 'outline', 'ghost'
      },
      size: {
        default: 'medium', // 'small', 'medium', 'large'
      },
      align: {
        default: 'left', // 'left', 'center', 'right'
      },
      newTab: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="button-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { text, url, variant, size, align, newTab } = HTMLAttributes;

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'button-block',
        class: `button-block align-${align}`,
      }),
      [
        'a',
        {
          href: url || '#',
          class: `cta-button button-${variant} button-${size}`,
          target: newTab ? '_blank' : '_self',
          rel: newTab ? 'noopener noreferrer' : '',
        },
        text || 'Click Here',
      ],
    ];
  },

  addCommands() {
    return {
      setButtonBlock:
        (options: {
          text?: string;
          url?: string;
          variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
          size?: 'small' | 'medium' | 'large';
          align?: 'left' | 'center' | 'right';
          newTab?: boolean;
        }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as Partial<RawCommands>;
  },
});
