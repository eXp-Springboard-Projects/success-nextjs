import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './New.module.css';

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface List {
  id: string;
  name: string;
  memberCount: number;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Setup
  const [campaignName, setCampaignName] = useState('');
  const [emailType, setEmailType] = useState('newsletter');
  const [fromName, setFromName] = useState('SUCCESS Magazine');
  const [fromEmail, setFromEmail] = useState('hello@success.com');

  // Step 2: Content
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [templates, setTemplates] = useState<Template[]>([]);

  // Step 3: Recipients
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [exclusionLists, setExclusionLists] = useState<string[]>([]);
  const [excludeRecentDays, setExcludeRecentDays] = useState(0);
  const [estimatedRecipients, setEstimatedRecipients] = useState(0);
  const [lists, setLists] = useState<List[]>([]);

  // Step 4: Review
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchLists();
  }, []);

  useEffect(() => {
    if (step === 3) {
      calculateRecipients();
    }
  }, [selectedLists, exclusionLists, excludeRecentDays, step]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/crm/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
    }
  };

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/admin/crm/lists');
      const data = await res.json();
      setLists(Array.isArray(data) ? data : data.lists || []);
    } catch (error) {
    }
  };

  const calculateRecipients = async () => {
    try {
      const params = new URLSearchParams({
        lists: selectedLists.join(','),
        exclusions: exclusionLists.join(','),
        excludeRecentDays: excludeRecentDays.toString(),
      });
      const res = await fetch(`/api/admin/crm/campaigns/estimate-recipients?${params}`);
      const data = await res.json();
      setEstimatedRecipients(data.count || 0);
    } catch (error) {
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setEmailContent(template.content);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    try {
      await fetch('/api/admin/crm/campaigns/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject,
          content: emailContent,
          fromName,
          fromEmail,
        }),
      });
      alert('Test email sent!');
    } catch (error) {
      alert('Failed to send test email');
    }
  };

  const handleCreateAndSend = async () => {
    setLoading(true);
    try {
      // Create campaign
      const createRes = await fetch('/api/admin/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          subject,
          previewText,
          fromName,
          fromEmail,
          emailType,
          templateId: selectedTemplate,
          content: emailContent,
          selectedLists,
          exclusionLists,
          excludeRecentDays,
          scheduledAt: scheduledDate && scheduledTime
            ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
            : null,
        }),
      });

      const campaign = await createRes.json();

      // Send or schedule
      if (scheduledDate && scheduledTime) {
        await fetch(`/api/admin/crm/campaigns/${campaign.id}/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledAt: new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
          }),
        });
        alert('Campaign scheduled successfully!');
      } else {
        await fetch(`/api/admin/crm/campaigns/${campaign.id}/send`, {
          method: 'POST',
        });
        alert('Campaign sent successfully!');
      }

      router.push(`/admin/crm/campaigns/${campaign.id}`);
    } catch (error) {
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return campaignName && emailType && fromName && fromEmail;
      case 2:
        return subject && emailContent;
      case 3:
        return selectedLists.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const insertToken = (token: string) => {
    setSubject(prev => prev + `{{${token}}}`);
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="Create Campaign"
      description="Send newsletters and promotional emails"
    >
      <div className={styles.container}>
        {/* Progress Steps */}
        <div className={styles.progressBar}>
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`${styles.progressStep} ${step >= num ? styles.progressStepActive : ''}`}
            >
              <div className={styles.progressNumber}>{num}</div>
              <div className={styles.progressLabel}>
                {num === 1 && 'Setup'}
                {num === 2 && 'Content'}
                {num === 3 && 'Recipients'}
                {num === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Setup */}
        {step === 1 && (
          <div className={styles.stepContainer}>
            <h2 className={styles.stepTitle}>Campaign Setup</h2>

            <div className={styles.formGroup}>
              <label>Campaign Name *</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., February Newsletter 2025"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Type *</label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className={styles.select}
              >
                <option value="newsletter">Newsletter</option>
                <option value="promotional">Promotional</option>
                <option value="announcement">Announcement</option>
                <option value="transactional">Transactional</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>From Name *</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>From Email *</label>
                <select
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className={styles.select}
                >
                  <option value="hello@success.com">hello@success.com</option>
                  <option value="news@success.com">news@success.com</option>
                  <option value="support@success.com">support@success.com</option>
                  <option value="noreply@success.com">noreply@success.com</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Content */}
        {step === 2 && (
          <div className={styles.stepContainer}>
            <h2 className={styles.stepTitle}>Email Content</h2>

            <div className={styles.formGroup}>
              <label>Subject Line *</label>
              <div className={styles.subjectRow}>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your email subject..."
                  className={styles.input}
                />
                <div className={styles.tokens}>
                  <button onClick={() => insertToken('firstName')} className={styles.tokenBtn}>
                    +First Name
                  </button>
                  <button onClick={() => insertToken('lastName')} className={styles.tokenBtn}>
                    +Last Name
                  </button>
                  <button onClick={() => insertToken('company')} className={styles.tokenBtn}>
                    +Company
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Preview Text</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Text shown in inbox preview..."
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Select Template</label>
              <select
                value={selectedTemplate || ''}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className={styles.select}
              >
                <option value="">Write from scratch</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.editorHeader}>
                <label>Email Content *</label>
                <div className={styles.previewToggle}>
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`${styles.previewBtn} ${previewMode === 'desktop' ? styles.previewBtnActive : ''}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`${styles.previewBtn} ${previewMode === 'mobile' ? styles.previewBtnActive : ''}`}
                  >
                    Mobile
                  </button>
                </div>
              </div>
              <div className={styles.editorContainer}>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className={styles.editor}
                  placeholder="Write your email content here. You can use HTML."
                />
                <div className={`${styles.preview} ${previewMode === 'mobile' ? styles.previewMobile : ''}`}>
                  <div className={styles.previewHeader}>Preview</div>
                  <div dangerouslySetInnerHTML={{ __html: emailContent || '<p>Your email preview will appear here...</p>' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Recipients */}
        {step === 3 && (
          <div className={styles.stepContainer}>
            <h2 className={styles.stepTitle}>Select Recipients</h2>

            <div className={styles.formGroup}>
              <label>Select Lists *</label>
              <div className={styles.listGrid}>
                {lists.map((list) => (
                  <label key={list.id} className={styles.listCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedLists.includes(list.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLists([...selectedLists, list.id]);
                        } else {
                          setSelectedLists(selectedLists.filter(id => id !== list.id));
                        }
                      }}
                    />
                    <div>
                      <div className={styles.listName}>{list.name}</div>
                      <div className={styles.listCount}>{list.memberCount.toLocaleString()} contacts</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Exclusion Lists (Optional)</label>
              <div className={styles.listGrid}>
                {lists.map((list) => (
                  <label key={list.id} className={styles.listCheckbox}>
                    <input
                      type="checkbox"
                      checked={exclusionLists.includes(list.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExclusionLists([...exclusionLists, list.id]);
                        } else {
                          setExclusionLists(exclusionLists.filter(id => id !== list.id));
                        }
                      }}
                    />
                    <div>
                      <div className={styles.listName}>{list.name}</div>
                      <div className={styles.listCount}>{list.memberCount.toLocaleString()} contacts</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Exclude Recent Recipients</label>
              <select
                value={excludeRecentDays}
                onChange={(e) => setExcludeRecentDays(Number(e.target.value))}
                className={styles.select}
              >
                <option value="0">Don't exclude</option>
                <option value="1">Last 1 day</option>
                <option value="3">Last 3 days</option>
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>

            <div className={styles.recipientCount}>
              <div className={styles.recipientCountLabel}>Estimated Recipients:</div>
              <div className={styles.recipientCountValue}>{estimatedRecipients.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Send */}
        {step === 4 && (
          <div className={styles.stepContainer}>
            <h2 className={styles.stepTitle}>Review & Send</h2>

            <div className={styles.summaryCard}>
              <h3>Campaign Summary</h3>
              <div className={styles.summaryRow}>
                <span>Name:</span>
                <span>{campaignName}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Type:</span>
                <span>{emailType}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>From:</span>
                <span>{fromName} &lt;{fromEmail}&gt;</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Subject:</span>
                <span>{subject}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Recipients:</span>
                <span>{estimatedRecipients.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Send Test Email</label>
              <div className={styles.testEmailRow}>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={styles.input}
                />
                <button onClick={handleSendTest} className={styles.buttonSecondary}>
                  Send Test
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Schedule Send (Optional)</label>
              <div className={styles.scheduleRow}>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={styles.input}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={styles.input}
                />
              </div>
              {scheduledDate && scheduledTime && (
                <div className={styles.scheduleNote}>
                  Campaign will be sent on {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.buttonRow}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className={styles.buttonSecondary}
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={styles.buttonPrimary}
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!canProceed() || loading}
              className={styles.buttonPrimary}
            >
              {loading ? 'Sending...' : scheduledDate ? 'Schedule Campaign' : 'Send Now'}
            </button>
          )}
        </div>

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Confirm Send</h3>
              <p>
                You are about to {scheduledDate ? 'schedule' : 'send'} this campaign to{' '}
                <strong>{estimatedRecipients.toLocaleString()}</strong> recipients.
              </p>
              {scheduledDate && scheduledTime && (
                <p>
                  Scheduled for: <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}</strong>
                </p>
              )}
              <p>Are you sure you want to proceed?</p>
              <div className={styles.modalButtons}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className={styles.buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndSend}
                  className={styles.buttonPrimary}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
