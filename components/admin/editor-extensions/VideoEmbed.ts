import { Node, mergeAttributes } from '@tiptap/core';

export const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      provider: {
        default: 'youtube', // 'youtube' or 'vimeo'
      },
      width: {
        default: '100%',
      },
      height: {
        default: '500px',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video-embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, provider, width, height } = HTMLAttributes;
    let embedUrl = src;

    // Convert regular YouTube/Vimeo URLs to embed URLs
    if (provider === 'youtube' && src) {
      const videoId = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (provider === 'vimeo' && src) {
      const videoId = src.match(/(?:vimeo\.com\/)([0-9]+)/)?.[1];
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'video-embed',
        class: 'video-embed-block',
      }),
      [
        'div',
        { class: 'video-wrapper', style: `padding-bottom: 56.25%` },
        [
          'iframe',
          {
            src: embedUrl,
            width: width || '100%',
            height: height || '500',
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: 'true',
          },
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setVideoEmbed:
        (options: { src: string; provider?: 'youtube' | 'vimeo' }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
