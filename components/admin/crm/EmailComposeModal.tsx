import { useState } from 'react';
import styles from './EmailComposeModal.module.css';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string;
  contactId?: string;
}

export default function EmailComposeModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  contactId,
}: EmailComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      setError('Subject and content are required');
      return;
    }

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/crm/emails/send-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          content,
          contactId,
          fromName: 'SUCCESS Magazine',
          fromEmail: 'hello@success.com',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to send email');
      }

      alert(`Email sent successfully to ${recipientEmail}`);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setContent('');
    setError('');
    onClose();
  };

  const insertToken = (token: string) => {
    setContent(prev => prev + `{{${token}}}`);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Send Email</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.recipientInfo}>
            <strong>To:</strong> {recipientName || recipientEmail} &lt;{recipientEmail}&gt;
          </div>

          <div className={styles.formGroup}>
            <label>Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className={styles.input}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.editorHeader}>
              <label>Message *</label>
              <div className={styles.tokens}>
                <button onClick={() => insertToken('firstName')} className={styles.tokenBtn} type="button">
                  +First Name
                </button>
                <button onClick={() => insertToken('lastName')} className={styles.tokenBtn} type="button">
                  +Last Name
                </button>
                <button onClick={() => insertToken('company')} className={styles.tokenBtn} type="button">
                  +Company
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message here. You can use HTML."
              className={styles.textarea}
              rows={12}
            />
            <div className={styles.hint}>
              Tip: You can use HTML for formatting (e.g., &lt;strong&gt;, &lt;p&gt;, &lt;a&gt;)
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={handleClose} className={styles.cancelButton} disabled={sending}>
            Cancel
          </button>
          <button onClick={handleSend} className={styles.sendButton} disabled={sending}>
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
