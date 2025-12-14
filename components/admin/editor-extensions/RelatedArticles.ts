import { Node, mergeAttributes, RawCommands } from '@tiptap/core';

export const RelatedArticles = Node.create({
  name: 'relatedArticles',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Read More',
      },
      articles: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute('data-articles');
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          return {
            'data-articles': JSON.stringify(attributes.articles),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="related-articles"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { title, articles } = HTMLAttributes;

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'related-articles',
        class: 'related-articles-block',
      }),
      ['h3', { class: 'related-articles-title' }, title || 'Read More'],
      [
        'div',
        { class: 'related-articles-grid' },
        ...(articles || []).map((article: { url: string; title: string; image?: string; excerpt?: string }) => [
          'a',
          { href: article.url, class: 'related-article-card' },
          article.image
            ? [
                'div',
                { class: 'related-article-image' },
                ['img', { src: article.image, alt: article.title }],
              ]
            : '',
          [
            'div',
            { class: 'related-article-content' },
            ['h4', {}, article.title],
            article.excerpt ? ['p', {}, article.excerpt] : '',
          ],
        ]),
      ],
    ];
  },

  addCommands() {
    return {
      setRelatedArticles:
        (options: {
          title?: string;
          articles: Array<{ url: string; title: string; image?: string; excerpt?: string }>;
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
