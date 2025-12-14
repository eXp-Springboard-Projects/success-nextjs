import { Node, mergeAttributes } from '@tiptap/core';

export const AuthorBio = Node.create({
  name: 'authorBio',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      photo: {
        default: null,
      },
      name: {
        default: '',
      },
      title: {
        default: '',
      },
      bio: {
        default: '',
      },
      twitter: {
        default: null,
      },
      linkedin: {
        default: null,
      },
      website: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="author-bio"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { photo, name, title, bio, twitter, linkedin, website } = HTMLAttributes;

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'author-bio',
        class: 'author-bio-block',
      }),
      [
        'div',
        { class: 'author-photo' },
        photo
          ? ['img', { src: photo, alt: name || 'Author' }]
          : ['div', { class: 'author-photo-placeholder' }, name?.charAt(0)?.toUpperCase() || 'A'],
      ],
      [
        'div',
        { class: 'author-info' },
        ['h4', { class: 'author-name' }, name || 'Author Name'],
        title ? ['p', { class: 'author-title' }, title] : '',
        bio ? ['p', { class: 'author-bio-text' }, bio] : '',
        [
          'div',
          { class: 'author-social' },
          ...(twitter
            ? [
                [
                  'a',
                  { href: `https://twitter.com/${twitter}`, target: '_blank', rel: 'noopener' },
                  '🐦 Twitter',
                ],
              ]
            : []),
          ...(linkedin
            ? [
                [
                  'a',
                  { href: linkedin, target: '_blank', rel: 'noopener' },
                  '💼 LinkedIn',
                ],
              ]
            : []),
          ...(website
            ? [
                [
                  'a',
                  { href: website, target: '_blank', rel: 'noopener' },
                  '🌐 Website',
                ],
              ]
            : []),
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setAuthorBio:
        (options: {
          photo?: string;
          name: string;
          title?: string;
          bio?: string;
          twitter?: string;
          linkedin?: string;
          website?: string;
        }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
