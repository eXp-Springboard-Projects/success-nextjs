/**
 * Article Layout Templates
 * Pre-built layouts staff can use to quickly create professional articles
 */

export interface TemplateBlock {
  type: string;
  content?: string;
  attrs?: Record<string, any>;
}

export interface ArticleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'feature' | 'short' | 'structured';
  blocks: TemplateBlock[];
}

export const articleTemplates: ArticleTemplate[] = [
  {
    id: 'feature-story',
    name: 'Feature Story',
    description: 'Long-form article with hero image, pull quotes, and rich media',
    icon: '📰',
    category: 'feature',
    blocks: [
      {
        type: 'fullWidthImage',
        attrs: {
          src: 'https://via.placeholder.com/1200x600/667eea/ffffff?text=Hero+Image',
          alt: '[Add compelling hero image]',
          caption: '[Optional: Add photo credit or caption]'
        }
      },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: '[Your Compelling Article Title Goes Here]'
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: '[Engaging subtitle that expands on the main idea]'
      },
      {
        type: 'paragraph',
        content: '<em>By [Author Name] | [Publication Date]</em>'
      },
      {
        type: 'divider',
        attrs: { style: 'solid' }
      },
      {
        type: 'paragraph',
        content: '[Opening paragraph: Hook your readers with a compelling introduction that sets the stage for your story. Make it engaging and personal.]'
      },
      {
        type: 'paragraph',
        content: '[Continue your introduction, building context and drawing the reader deeper into the story.]'
      },
      {
        type: 'paragraph',
        content: '[Third intro paragraph: Establish the main theme or question your article will explore.]'
      },
      {
        type: 'pullQuote',
        content: '[Insert a powerful quote that captures the essence of your story]'
      },
      {
        type: 'imageTextLayout',
        attrs: {
          imagePosition: 'left',
          src: 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Supporting+Image',
          alt: '[Image description]'
        },
        content: '<p>[Continue your narrative here. This section pairs text with an image for visual interest.]</p><p>[Add more paragraphs to develop your point further.]</p>'
      },
      {
        type: 'paragraph',
        content: '[Main body paragraph: Develop your core argument or story elements.]'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'info' },
        content: '<strong>Key Takeaway:</strong> [Highlight an important insight or statistic that supports your narrative]'
      },
      {
        type: 'paragraph',
        content: '[Continue building your argument with supporting evidence and examples.]'
      },
      {
        type: 'paragraph',
        content: '[Additional context, expert opinions, or data that strengthens your points.]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: '[Section Heading: Break Up Long Content]'
      },
      {
        type: 'paragraph',
        content: '[New section content that explores a different aspect of your topic.]'
      },
      {
        type: 'paragraph',
        content: '[Continue developing this section with relevant details and insights.]'
      },
      {
        type: 'authorBio',
        attrs: {
          name: '[Author Name]',
          title: '[Author Title/Role]',
          bio: '[Brief author biography highlighting relevant expertise and accomplishments]'
        }
      },
      {
        type: 'relatedArticles',
        attrs: {
          title: 'Continue Reading',
          articles: [
            { url: '#', title: '[Related Article Title 1]', excerpt: '[Brief description of related content]' },
            { url: '#', title: '[Related Article Title 2]', excerpt: '[Brief description of related content]' }
          ]
        }
      }
    ]
  },

  {
    id: 'interview',
    name: 'Interview Format',
    description: 'Q&A style article with portrait and conversation flow',
    icon: '🎤',
    category: 'feature',
    blocks: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: '[Interview: Full Name of Subject]'
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: '[Subject's title and notable achievement or angle]'
      },
      {
        type: 'imageTextLayout',
        attrs: {
          imagePosition: 'right',
          src: 'https://via.placeholder.com/400x500/667eea/ffffff?text=Portrait',
          alt: '[Subject Name portrait]'
        },
        content: '<p>[Introduction: Brief background on the subject and why this conversation matters.]</p><p>[Context about their work, achievements, or current projects that make this interview timely and relevant.]</p>'
      },
      {
        type: 'divider',
        attrs: { style: 'solid' }
      },
      {
        type: 'paragraph',
        content: '<strong>Q: [First question that sets the tone for the interview]</strong>'
      },
      {
        type: 'paragraph',
        content: '[Subject's answer with engaging details and personal insights.]'
      },
      {
        type: 'pullQuote',
        content: '[Most powerful quote from this answer]'
      },
      {
        type: 'paragraph',
        content: '<strong>Q: [Follow-up question diving deeper into their experience]</strong>'
      },
      {
        type: 'paragraph',
        content: '[Detailed response with specific examples and anecdotes.]'
      },
      {
        type: 'paragraph',
        content: '<strong>Q: [Question about their journey or key turning point]</strong>'
      },
      {
        type: 'paragraph',
        content: '[Thoughtful answer revealing character and motivation.]'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'success' },
        content: '<strong>Quick Fire Round:</strong> [Fun rapid-fire questions and brief answers]'
      },
      {
        type: 'paragraph',
        content: '<strong>Q: [Future-looking question about plans or advice]</strong>'
      },
      {
        type: 'paragraph',
        content: '[Final inspiring answer that leaves readers with actionable insights.]'
      },
      {
        type: 'divider',
        attrs: { style: 'stars' }
      },
      {
        type: 'paragraph',
        content: '<em>[Closing thoughts or where readers can learn more about the subject]</em>'
      },
      {
        type: 'relatedArticles',
        attrs: {
          title: 'More Inspiring Interviews',
          articles: [
            { url: '#', title: '[Related Interview 1]', excerpt: '[Brief description]' },
            { url: '#', title: '[Related Interview 2]', excerpt: '[Brief description]' }
          ]
        }
      }
    ]
  },

  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Numbered list format (Top 10, 5 Ways, etc.) with images and tips',
    icon: '🔢',
    category: 'structured',
    blocks: [
      {
        type: 'fullWidthImage',
        attrs: {
          src: 'https://via.placeholder.com/1200x600/764ba2/ffffff?text=Listicle+Hero',
          alt: '[Listicle hero image]',
          caption: ''
        }
      },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: '[Number] [Action] to [Achieve Desired Outcome]'
      },
      {
        type: 'paragraph',
        content: '[Brief intro explaining why this list matters and what readers will gain.]'
      },
      {
        type: 'divider',
        attrs: { style: 'solid' }
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: '1. [First Item Title]'
      },
      {
        type: 'imageTextLayout',
        attrs: {
          imagePosition: 'left',
          src: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Item+1',
          alt: '[Item 1 image]'
        },
        content: '<p>[Explanation of first item with specific examples and actionable advice.]</p>'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'info' },
        content: '<strong>Pro Tip:</strong> [Quick tip or insider advice related to item 1]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: '2. [Second Item Title]'
      },
      {
        type: 'paragraph',
        content: '[Detailed explanation of second item with clear steps or reasoning.]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: '3. [Third Item Title]'
      },
      {
        type: 'imageTextLayout',
        attrs: {
          imagePosition: 'right',
          src: 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Item+3',
          alt: '[Item 3 image]'
        },
        content: '<p>[Explanation with real-world examples or case studies.]</p>'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: '4. [Fourth Item Title]'
      },
      {
        type: 'paragraph',
        content: '[Continue with remaining items following the same pattern...]'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'warning' },
        content: '<strong>Common Mistake:</strong> [Warning about what to avoid]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: '5. [Final Item Title]'
      },
      {
        type: 'paragraph',
        content: '[Strong conclusion that ties everything together and motivates action.]'
      },
      {
        type: 'divider',
        attrs: { style: 'solid' }
      },
      {
        type: 'buttonBlock',
        attrs: {
          text: '[Call to Action: Download Guide, Start Free Trial, etc.]',
          url: '#',
          variant: 'primary'
        }
      }
    ]
  },

  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    description: 'Step-by-step tutorial with clear instructions and visuals',
    icon: '📋',
    category: 'structured',
    blocks: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: 'How to [Achieve Specific Goal]'
      },
      {
        type: 'fullWidthImage',
        attrs: {
          src: 'https://via.placeholder.com/1200x500/667eea/ffffff?text=Tutorial+Hero',
          alt: '[How-to hero image]',
          caption: ''
        }
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: '[What you'll learn and why it matters]'
      },
      {
        type: 'paragraph',
        content: '[Brief overview explaining what readers will achieve by following this guide.]'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'info' },
        content: '<strong>Before You Start:</strong><br>• [Required tool or resource 1]<br>• [Required tool or resource 2]<br>• [Estimated time to complete]'
      },
      {
        type: 'divider',
        attrs: { style: 'solid' }
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Step 1: [First Action Step]'
      },
      {
        type: 'paragraph',
        content: '[Detailed instructions for step 1 with clear, actionable directions.]'
      },
      {
        type: 'fullWidthImage',
        attrs: {
          src: 'https://via.placeholder.com/1000x400/764ba2/ffffff?text=Step+1+Screenshot',
          alt: '[Step 1 visual guide]',
          caption: '[Caption explaining what the image shows]'
        }
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'warning' },
        content: '<strong>⚠️ Important:</strong> [Critical note or common pitfall to avoid]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Step 2: [Second Action Step]'
      },
      {
        type: 'paragraph',
        content: '[Clear instructions with specific details and expected outcomes.]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Step 3: [Third Action Step]'
      },
      {
        type: 'imageTextLayout',
        attrs: {
          imagePosition: 'left',
          src: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Step+3',
          alt: '[Step 3 illustration]'
        },
        content: '<p>[Instructions that can be shown alongside a visual reference.]</p>'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Step 4: [Completing the Process]'
      },
      {
        type: 'paragraph',
        content: '[Final steps to complete the tutorial with verification or testing instructions.]'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'success' },
        content: '<strong>✓ Success!</strong> [What success looks like and next steps]'
      },
      {
        type: 'divider',
        attrs: { style: 'solid' }
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Troubleshooting'
      },
      {
        type: 'paragraph',
        content: '[Common issues and solutions]'
      },
      {
        type: 'relatedArticles',
        attrs: {
          title: 'Related Guides',
          articles: [
            { url: '#', title: '[Related How-To 1]', excerpt: '[Brief description]' },
            { url: '#', title: '[Related How-To 2]', excerpt: '[Brief description]' }
          ]
        }
      }
    ]
  },

  {
    id: 'news-brief',
    name: 'News Brief',
    description: 'Concise, fast-read format for news and quick updates',
    icon: '⚡',
    category: 'short',
    blocks: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: '[Attention-Grabbing News Headline]'
      },
      {
        type: 'paragraph',
        content: '<em>[Location] – [Date]</em>'
      },
      {
        type: 'imageTextLayout',
        attrs: {
          imagePosition: 'right',
          src: 'https://via.placeholder.com/400x300/667eea/ffffff?text=News+Image',
          alt: '[News image]'
        },
        content: '<p>[Lead paragraph covering the 5 W's: Who, What, When, Where, Why]</p>'
      },
      {
        type: 'paragraph',
        content: '[Second paragraph with key details and context.]'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'info' },
        content: '<strong>Key Facts:</strong><br>• [Important statistic or detail]<br>• [Critical date or timeline]<br>• [Relevant quote or statement]'
      },
      {
        type: 'paragraph',
        content: '[Additional context or background information.]'
      },
      {
        type: 'pullQuote',
        content: '[Relevant quote from key figure or expert]'
      },
      {
        type: 'paragraph',
        content: '[Impact and implications of the news.]'
      },
      {
        type: 'paragraph',
        content: '[Closing paragraph with next steps or future developments to watch.]'
      },
      {
        type: 'divider',
        attrs: { style: 'solid' }
      },
      {
        type: 'relatedArticles',
        attrs: {
          title: 'Related Stories',
          articles: [
            { url: '#', title: '[Related News 1]', excerpt: '[Brief description]' },
            { url: '#', title: '[Related News 2]', excerpt: '[Brief description]' }
          ]
        }
      }
    ]
  },

  {
    id: 'profile',
    name: 'Profile/Biography',
    description: 'Personal story format with milestones and achievements',
    icon: '👤',
    category: 'feature',
    blocks: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: '[Subject Name]: [Compelling Description]'
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: '[Intriguing subtitle about their impact or achievement]'
      },
      {
        type: 'fullWidthImage',
        attrs: {
          src: 'https://via.placeholder.com/1200x600/764ba2/ffffff?text=Profile+Portrait',
          alt: '[Subject Name portrait]',
          caption: '[Photo credit]'
        }
      },
      {
        type: 'paragraph',
        content: '[Opening paragraph that hooks readers with the most compelling aspect of this person's story.]'
      },
      {
        type: 'pullQuote',
        content: '[Powerful quote that captures their philosophy or defining moment]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Early Beginnings'
      },
      {
        type: 'paragraph',
        content: '[Background and formative experiences that shaped who they became.]'
      },
      {
        type: 'paragraph',
        content: '[Key influences, challenges overcome, or pivotal moments in youth.]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'The Breakthrough'
      },
      {
        type: 'imageTextLayout',
        attrs: {
          imagePosition: 'left',
          src: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Career+Photo',
          alt: '[Career milestone image]'
        },
        content: '<p>[Story of their breakthrough moment or major achievement.]</p><p>[Details about what made this significant and how it changed their trajectory.]</p>'
      },
      {
        type: 'calloutBox',
        attrs: { variant: 'info' },
        content: '<strong>Timeline of Success:</strong><br>[Year]: [Achievement]<br>[Year]: [Milestone]<br>[Year]: [Award or Recognition]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Philosophy and Approach'
      },
      {
        type: 'paragraph',
        content: '[Their unique perspective, methodology, or principles that guide their work.]'
      },
      {
        type: 'pullQuote',
        content: '[Another impactful quote showcasing their wisdom or approach]'
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Current Work and Impact'
      },
      {
        type: 'paragraph',
        content: '[What they're doing now and the difference they're making.]'
      },
      {
        type: 'imageGallery',
        attrs: {
          images: [
            { src: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Gallery+1', alt: '[Gallery image 1]' },
            { src: 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Gallery+2', alt: '[Gallery image 2]' },
            { src: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Gallery+3', alt: '[Gallery image 3]' }
          ],
          columns: 3
        }
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: 'Looking Ahead'
      },
      {
        type: 'paragraph',
        content: '[Future plans, upcoming projects, or vision for the future.]'
      },
      {
        type: 'paragraph',
        content: '[Closing thoughts that leave readers inspired.]'
      },
      {
        type: 'divider',
        attrs: { style: 'stars' }
      },
      {
        type: 'buttonBlock',
        attrs: {
          text: 'Learn More About [Subject Name]',
          url: '#',
          variant: 'primary'
        }
      }
    ]
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ArticleTemplate | undefined {
  return articleTemplates.find(template => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'feature' | 'short' | 'structured'): ArticleTemplate[] {
  return articleTemplates.filter(template => template.category === category);
}
