import { useState } from 'react';
import { useRouter } from 'next/router';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from '../SuccessPlus.module.css';

export default function NewNewsletterPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    preheader: '',
    content: '',
    recipientFilter: 'all',
    scheduledFor: '',
  });

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'schedule' | 'send') => {
    e.preventDefault();

    if (!formData.subject || !formData.content) {
      alert('Please fill in subject and content');
      return;
    }

    if (action === 'schedule' && !formData.scheduledFor) {
      alert('Please select a date and time to schedule');
      return;
    }

    if (action === 'send' && !confirm('Are you sure you want to send this newsletter now?')) {
      return;
    }

    setSaving(true);

    try {
      const status = action === 'send' ? 'sent' : action === 'schedule' ? 'scheduled' : 'draft';

      const res = await fetch('/api/admin/success-plus/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status,
          sendNow: action === 'send',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push('/admin/success-plus/newsletters');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create newsletter');
      }
    } catch (error) {
      console.error('Error creating newsletter:', error);
      alert('Error creating newsletter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Create Newsletter"
      description="Create a new newsletter for SUCCESS+ members"
    >
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <Link href="/admin/success-plus/newsletters" className={styles.backButton}>
              ← Back to Newsletters
            </Link>
            <h1>Create Newsletter</h1>
            <p className={styles.pageDescription}>
              Compose and send a newsletter to SUCCESS+ members
            </p>
          </div>
        </div>

        {/* Form */}
        <form className={styles.form}>
          <div className={styles.formSection}>
            <h2>Newsletter Details</h2>

            <div className={styles.formGroup}>
              <label htmlFor="subject" className={styles.label}>
                Subject Line *
              </label>
              <input
                type="text"
                id="subject"
                className={styles.input}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject line"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="preheader" className={styles.label}>
                Preheader Text
              </label>
              <input
                type="text"
                id="preheader"
                className={styles.input}
                value={formData.preheader}
                onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                placeholder="Preview text that appears after subject (optional)"
              />
              <small className={styles.helpText}>
                This appears next to the subject line in most email clients
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content" className={styles.label}>
                Newsletter Content *
              </label>
              <textarea
                id="content"
                className={styles.textarea}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your newsletter content here... (HTML supported)"
                rows={20}
                required
              />
              <small className={styles.helpText}>
                HTML is supported. Use standard HTML tags for formatting.
              </small>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2>Recipients</h2>

            <div className={styles.formGroup}>
              <label htmlFor="recipientFilter" className={styles.label}>
                Send To
              </label>
              <select
                id="recipientFilter"
                className={styles.select}
                value={formData.recipientFilter}
                onChange={(e) => setFormData({ ...formData, recipientFilter: e.target.value })}
              >
                <option value="all">All SUCCESS+ Members</option>
                <option value="active">Active Subscribers Only</option>
                <option value="trial">Trial Users</option>
                <option value="newsletter_list">Newsletter Subscribers</option>
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2>Scheduling</h2>

            <div className={styles.formGroup}>
              <label htmlFor="scheduledFor" className={styles.label}>
                Schedule Send (Optional)
              </label>
              <input
                type="datetime-local"
                id="scheduledFor"
                className={styles.input}
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              />
              <small className={styles.helpText}>
                Leave blank to save as draft or send immediately
              </small>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.formActions}>
            <Link href="/admin/success-plus/newsletters" className={styles.secondaryButton}>
              Cancel
            </Link>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'save')}
                className={styles.secondaryButton}
                disabled={saving}
              >
                Save as Draft
              </button>
              {formData.scheduledFor && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'schedule')}
                  className={styles.primaryButton}
                  disabled={saving}
                >
                  Schedule Send
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'send')}
                className={styles.primaryButton}
                disabled={saving}
              >
                {saving ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
