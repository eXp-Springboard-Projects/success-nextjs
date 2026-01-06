import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from './content-importer.module.css';

interface ParsedContent {
  title: string;
  sections: Array<{
    type: 'heading' | 'paragraph' | 'list' | 'quote';
    content: string;
    level?: number;
  }>;
  images: string[];
  links: Array<{ text: string; url: string }>;
}

export default function ContentImporter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rawContent, setRawContent] = useState('');
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
  const [processing, setProcessing] = useState(false);

  // Parse raw content into structured format
  const parseContent = (text: string): ParsedContent => {
    const lines = text.split('\n').filter(line => line.trim());
    const result: ParsedContent = {
      title: '',
      sections: [],
      images: [],
      links: []
    };

    let currentParagraph = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Extract title (first non-empty line or line with all caps/title case)
      if (!result.title && (line.length > 10 && line.length < 150)) {
        if (line === line.toUpperCase() || /^[A-Z][^.!?]*$/.test(line)) {
          result.title = line;
          continue;
        }
      }

      // Check for headings (ALL CAPS, or lines ending without punctuation)
      if (line === line.toUpperCase() && line.length < 100) {
        if (currentParagraph) {
          result.sections.push({ type: 'paragraph', content: currentParagraph.trim() });
          currentParagraph = '';
        }
        result.sections.push({
          type: 'heading',
          content: line,
          level: 2
        });
        continue;
      }

      // Check for subheadings (Title Case, shorter lines)
      if (/^[A-Z][a-z]/.test(line) && line.length < 80 && !line.match(/[.!?]$/)) {
        if (currentParagraph) {
          result.sections.push({ type: 'paragraph', content: currentParagraph.trim() });
          currentParagraph = '';
        }
        result.sections.push({
          type: 'heading',
          content: line,
          level: 3
        });
        continue;
      }

      // Check for bullet points or numbered lists
      if (/^[-•*]\s/.test(line) || /^\d+\.\s/.test(line)) {
        if (currentParagraph) {
          result.sections.push({ type: 'paragraph', content: currentParagraph.trim() });
          currentParagraph = '';
        }
        result.sections.push({
          type: 'list',
          content: line.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '')
        });
        continue;
      }

      // Check for quotes (lines starting with " or ')
      if (/^["']/.test(line)) {
        if (currentParagraph) {
          result.sections.push({ type: 'paragraph', content: currentParagraph.trim() });
          currentParagraph = '';
        }
        result.sections.push({
          type: 'quote',
          content: line.replace(/^["']|["']$/g, '')
        });
        continue;
      }

      // Extract image URLs
      const imageMatch = line.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi);
      if (imageMatch) {
        result.images.push(...imageMatch);
        continue;
      }

      // Extract links
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (linkMatch) {
        linkMatch.forEach(match => {
          const [, text, url] = match.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
          if (text && url) {
            result.links.push({ text, url });
          }
        });
      }

      // Regular paragraph text
      currentParagraph += (currentParagraph ? ' ' : '') + line;

      // If line ends with punctuation, consider it end of paragraph
      if (/[.!?]$/.test(line)) {
        result.sections.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
    }

    // Add any remaining paragraph
    if (currentParagraph) {
      result.sections.push({ type: 'paragraph', content: currentParagraph.trim() });
    }

    return result;
  };

  const handleParse = () => {
    setProcessing(true);
    try {
      const parsed = parseContent(rawContent);
      setParsedContent(parsed);
    } catch (error) {
      console.error('Error parsing content:', error);
      alert('Error parsing content. Please check the format.');
    } finally {
      setProcessing(false);
    }
  };

  const generateHTML = () => {
    if (!parsedContent) return '';

    let html = `<article>\n`;

    if (parsedContent.title) {
      html += `  <h1>${parsedContent.title}</h1>\n\n`;
    }

    let inList = false;

    parsedContent.sections.forEach((section, index) => {
      if (section.type === 'heading') {
        if (inList) {
          html += `  </ul>\n\n`;
          inList = false;
        }
        const tag = `h${section.level || 2}`;
        html += `  <${tag}>${section.content}</${tag}>\n\n`;
      } else if (section.type === 'paragraph') {
        if (inList) {
          html += `  </ul>\n\n`;
          inList = false;
        }
        html += `  <p>${section.content}</p>\n\n`;
      } else if (section.type === 'list') {
        if (!inList) {
          html += `  <ul>\n`;
          inList = true;
        }
        html += `    <li>${section.content}</li>\n`;
      } else if (section.type === 'quote') {
        if (inList) {
          html += `  </ul>\n\n`;
          inList = false;
        }
        html += `  <blockquote>\n    <p>${section.content}</p>\n  </blockquote>\n\n`;
      }
    });

    if (inList) {
      html += `  </ul>\n\n`;
    }

    html += `</article>`;
    return html;
  };

  const copyHTML = () => {
    const html = generateHTML();
    navigator.clipboard.writeText(html);
    alert('HTML copied to clipboard!');
  };

  const copyMarkdown = () => {
    if (!parsedContent) return;

    let md = '';

    if (parsedContent.title) {
      md += `# ${parsedContent.title}\n\n`;
    }

    parsedContent.sections.forEach(section => {
      if (section.type === 'heading') {
        const hashes = '#'.repeat(section.level || 2);
        md += `${hashes} ${section.content}\n\n`;
      } else if (section.type === 'paragraph') {
        md += `${section.content}\n\n`;
      } else if (section.type === 'list') {
        md += `- ${section.content}\n`;
      } else if (section.type === 'quote') {
        md += `> ${section.content}\n\n`;
      }
    });

    navigator.clipboard.writeText(md);
    alert('Markdown copied to clipboard!');
  };

  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user?.role)) {
    return (
      <div className={styles.unauthorized}>
        <h1>Unauthorized</h1>
        <p>You need admin or editor access to use this tool.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Content Importer - SUCCESS Admin</title>
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <h1>Content Importer</h1>
          <p className={styles.subtitle}>
            Paste raw content from any document and it will be automatically formatted
          </p>
        </header>

        <div className={styles.content}>
          <div className={styles.inputSection}>
            <label htmlFor="rawContent" className={styles.label}>
              Paste Your Content Here
            </label>
            <textarea
              id="rawContent"
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Paste your article content here... The system will automatically detect:&#10;- Title (first line or ALL CAPS)&#10;- Headings (ALL CAPS or Title Case)&#10;- Paragraphs&#10;- Bullet points (lines starting with -, •, or numbers)&#10;- Quotes (lines starting with quotes)&#10;- Images (URLs ending in .jpg, .png, etc.)&#10;- Links ([text](url) format)"
              className={styles.textarea}
              rows={20}
            />
            <div className={styles.inputActions}>
              <button
                onClick={handleParse}
                disabled={!rawContent.trim() || processing}
                className={styles.parseButton}
              >
                {processing ? 'Parsing...' : 'Parse Content'}
              </button>
              <button
                onClick={() => setRawContent('')}
                className={styles.clearButton}
              >
                Clear
              </button>
            </div>
          </div>

          {parsedContent && (
            <div className={styles.outputSection}>
              <div className={styles.previewHeader}>
                <h2>Preview</h2>
                <div className={styles.outputActions}>
                  <button onClick={copyHTML} className={styles.copyButton}>
                    Copy HTML
                  </button>
                  <button onClick={copyMarkdown} className={styles.copyButton}>
                    Copy Markdown
                  </button>
                </div>
              </div>

              <div className={styles.preview}>
                {parsedContent.title && (
                  <h1 className={styles.previewTitle}>{parsedContent.title}</h1>
                )}

                {parsedContent.sections.map((section, index) => {
                  if (section.type === 'heading') {
                    const HeadingTag = `h${section.level || 2}` as any;
                    return (
                      <HeadingTag key={index} className={styles.previewHeading}>
                        {section.content}
                      </HeadingTag>
                    );
                  } else if (section.type === 'paragraph') {
                    return (
                      <p key={index} className={styles.previewParagraph}>
                        {section.content}
                      </p>
                    );
                  } else if (section.type === 'list') {
                    return (
                      <li key={index} className={styles.previewListItem}>
                        {section.content}
                      </li>
                    );
                  } else if (section.type === 'quote') {
                    return (
                      <blockquote key={index} className={styles.previewQuote}>
                        {section.content}
                      </blockquote>
                    );
                  }
                  return null;
                })}
              </div>

              {parsedContent.images.length > 0 && (
                <div className={styles.imagesSection}>
                  <h3>Detected Images ({parsedContent.images.length})</h3>
                  <ul className={styles.imagesList}>
                    {parsedContent.images.map((img, index) => (
                      <li key={index}>
                        <img src={img} alt={`Image ${index + 1}`} className={styles.thumbnailImage} />
                        <code>{img}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedContent.links.length > 0 && (
                <div className={styles.linksSection}>
                  <h3>Detected Links ({parsedContent.links.length})</h3>
                  <ul className={styles.linksList}>
                    {parsedContent.links.map((link, index) => (
                      <li key={index}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.text}
                        </a>
                        <code>{link.url}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.htmlOutput}>
                <h3>Generated HTML</h3>
                <pre className={styles.codeBlock}>
                  <code>{generateHTML()}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
