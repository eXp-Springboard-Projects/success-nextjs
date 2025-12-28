import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from './TemplatePreview.module.css';

export default function TemplatePreview() {
  const router = useRouter();
  const { id } = router.query;
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/admin/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const renderBlock = (block: any) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.content.level || 2}` as keyof React.JSX.IntrinsicElements;
        return <HeadingTag className={styles.heading}>{block.content.text}</HeadingTag>;

      case 'paragraph':
        return <p className={styles.paragraph}>{block.content.text}</p>;

      case 'image':
        return (
          <figure className={styles.image}>
            {block.content.src && <img src={block.content.src} alt={block.content.alt} />}
            {block.content.caption && <figcaption>{block.content.caption}</figcaption>}
          </figure>
        );

      case 'quote':
        return (
          <blockquote className={styles.quote}>
            <p>"{block.content.text}"</p>
            {block.content.author && <cite>— {block.content.author}</cite>}
          </blockquote>
        );

      case 'button':
        return (
          <div className={styles.buttonContainer}>
            <a
              href={block.content.url}
              className={`${styles.button} ${styles[block.content.style || 'primary']}`}
            >
              {block.content.text}
            </a>
          </div>
        );

      case 'divider':
        return <hr className={styles.divider} />;

      case 'list':
        const ListTag = block.content.style === 'numbered' ? 'ol' : 'ul';
        return (
          <ListTag className={styles.list}>
            {block.content.items?.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ListTag>
        );

      default:
        return (
          <div className={styles.placeholder}>
            [{block.type} block - Preview not available]
          </div>
        );
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading preview...</div>
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout>
        <div className={styles.error}>Template not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <h1>{template.name}</h1>
          <a href={`/admin/templates/${id}`} className={styles.editButton}>
            Edit Template
          </a>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewContent}>
            {template.structure?.map((block: any) => (
              <div key={block.id} className={styles.block}>
                {renderBlock(block)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
