import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './CommentSection.module.css';

interface Comment {
  id: string;
  author: string;
  authorEmail: string;
  content: string;
  status: string;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  postTitle: string;
}

export default function CommentSection({ postId, postTitle }: CommentSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    author: '',
    authorEmail: '',
    content: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        author: session.user.name || '',
        authorEmail: session.user.email || ''
      }));
    }
  }, [session]);

  async function fetchComments() {
    try {
      const response = await fetch(`/api/comments/public?postId=${postId}&status=APPROVED`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!session) {
      router.push('/signin?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/comments/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          postTitle,
          content: formData.content
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Your comment has been submitted and is awaiting moderation.');
        setFormData(prev => ({ ...prev, content: '' }));

        // If auto-approved, refresh comments
        if (data.status === 'APPROVED') {
          await fetchComments();
        }
      } else {
        setMessage(data.error || 'Failed to submit comment');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <section className={styles.commentSection}>
      <h2 className={styles.title}>
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      <div className={styles.commentForm}>
        {session ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.userInfo}>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className={styles.avatar}
                />
              )}
              <div>
                <strong>{session.user.name}</strong>
                <p className={styles.email}>{session.user.email}</p>
              </div>
            </div>

            <textarea
              placeholder="Share your thoughts..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              className={styles.textarea}
              disabled={submitting}
              rows={4}
            />

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={submitting || !formData.content.trim()}
                className={styles.submitButton}
              >
                {submitting ? 'Submitting...' : 'Post Comment'}
              </button>
            </div>

            {message && (
              <div className={message.includes('error') || message.includes('Failed') ? styles.errorMessage : styles.successMessage}>
                {message}
              </div>
            )}
          </form>
        ) : (
          <div className={styles.loginPrompt}>
            <p>Please <a href={`/signin?redirect=${encodeURIComponent(router.asPath)}`}>sign in</a> to leave a comment.</p>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className={styles.commentsList}>
        {loading ? (
          <div className={styles.loading}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <strong className={styles.commentAuthor}>{comment.author}</strong>
                <time className={styles.commentDate}>{formatDate(comment.createdAt)}</time>
              </div>
              <div className={styles.commentContent}>
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
