import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/DepartmentLayout';
import { Department } from '../../../../lib/departments';
import styles from './Sequences.module.css';

interface Step {
  type: 'email' | 'wait' | 'task';
  emailTemplateId?: string;
  emailSubject?: string;
  waitDays?: number;
  taskDescription?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
}

export default function SequenceBuilderPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showStepModal, setShowStepModal] = useState(false);
  const [stepType, setStepType] = useState<'email' | 'wait' | 'task'>('email');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    autoUnenrollOnReply: true,
    steps: [] as Step[],
  });

  useEffect(() => {
    fetchTemplates();
    if (!isNew && id) {
      fetchSequence();
    }
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/crm/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchSequence = async () => {
    try {
      const res = await fetch(`/api/admin/crm/sequences/${id}`);
      const data = await res.json();
      setFormData({
        name: data.name,
        description: data.description || '',
        autoUnenrollOnReply: data.auto_unenroll_on_reply,
        steps: data.steps || [],
      });
    } catch (error) {
      console.error('Error fetching sequence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Please enter a sequence name');
      return;
    }

    setSaving(true);

    try {
      const url = isNew ? '/api/admin/crm/sequences' : `/api/admin/crm/sequences/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          steps: formData.steps,
          autoUnenrollOnReply: formData.autoUnenrollOnReply,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          router.push(`/admin/crm/sequences/${data.id}`);
        } else {
          alert('Sequence saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving sequence:', error);
      alert('Failed to save sequence');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    setShowStepModal(true);
  };

  const handleStepModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    let newStep: Step = { type: stepType };

    if (stepType === 'email') {
      newStep.emailTemplateId = formData.get('templateId') as string;
      const template = templates.find(t => t.id === newStep.emailTemplateId);
      newStep.emailSubject = template?.subject || '';
    } else if (stepType === 'wait') {
      newStep.waitDays = parseInt(formData.get('waitDays') as string);
    } else if (stepType === 'task') {
      newStep.taskDescription = formData.get('taskDescription') as string;
    }

    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));

    setShowStepModal(false);
  };

  const handleRemoveStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...formData.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

    setFormData(prev => ({
      ...prev,
      steps: newSteps,
    }));
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'wait': return '⏱️';
      case 'task': return '✓';
      default: return '•';
    }
  };

  const getStepDetails = (step: Step) => {
    if (step.type === 'email') {
      const template = templates.find(t => t.id === step.emailTemplateId);
      return template ? `Template: ${template.name}` : 'Email step';
    } else if (step.type === 'wait') {
      return `Wait ${step.waitDays} day${step.waitDays !== 1 ? 's' : ''}`;
    } else if (step.type === 'task') {
      return step.taskDescription || 'Task step';
    }
    return '';
  };

  if (loading) {
    return (
      <DepartmentLayout department={Department.CUSTOMER_SERVICE}>
        <div className={styles.loading}>Loading sequence...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout department={Department.CUSTOMER_SERVICE}>
      <div className={styles.container}>
        <a href="/admin/crm/sequences" className={styles.backLink}>
          ← Back to Sequences
        </a>

        <div className={styles.header}>
          <h1 className={styles.title}>{isNew ? 'New Sequence' : 'Edit Sequence'}</h1>
        </div>

        <div className={styles.builder}>
          <div className={styles.mainColumn}>
            {/* Basic Info */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Basic Information</h2>

              <div className={styles.formGroup}>
                <label>Sequence Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., New Lead Follow-up"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  className={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this sequence..."
                />
              </div>

              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.autoUnenrollOnReply}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoUnenrollOnReply: e.target.checked }))}
                />
                <label>Auto-unenroll when contact replies</label>
              </div>
            </div>

            {/* Steps */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Sequence Steps</h2>

              <div className={styles.stepsList}>
                {formData.steps.map((step, index) => (
                  <div key={index} className={styles.stepCard}>
                    <div className={styles.stepInfo}>
                      <div className={styles.stepType}>
                        <span className={styles.stepIcon}>{getStepIcon(step.type)}</span>
                        Step {index + 1}: {step.type}
                      </div>
                      <div className={styles.stepDetails}>{getStepDetails(step)}</div>
                    </div>
                    <div className={styles.stepActions}>
                      {index > 0 && (
                        <button
                          className={styles.iconButton}
                          onClick={() => handleMoveStep(index, 'up')}
                          title="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {index < formData.steps.length - 1 && (
                        <button
                          className={styles.iconButton}
                          onClick={() => handleMoveStep(index, 'down')}
                          title="Move down"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        className={styles.iconButton}
                        onClick={() => handleRemoveStep(index)}
                        title="Remove"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {formData.steps.length === 0 && (
                  <div className={styles.empty}>
                    No steps added yet. Click a button below to add your first step.
                  </div>
                )}
              </div>

              <div className={styles.addStepButtons}>
                <button
                  className={styles.addStepButton}
                  onClick={() => {
                    setStepType('email');
                    handleAddStep();
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📧</span>
                  Add Email Step
                </button>
                <button
                  className={styles.addStepButton}
                  onClick={() => {
                    setStepType('wait');
                    handleAddStep();
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                  Add Wait Step
                </button>
                <button
                  className={styles.addStepButton}
                  onClick={() => {
                    setStepType('task');
                    handleAddStep();
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                  Add Task Step
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Actions</h2>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Sequence'}
              </button>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Tips</h2>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>Email Steps:</strong> Send automated emails using templates
                </p>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>Wait Steps:</strong> Add delays between actions
                </p>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>Task Steps:</strong> Create reminders for manual follow-up
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step Modal */}
        {showStepModal && (
          <div className={styles.modal} onClick={() => setShowStepModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>
                Add {stepType === 'email' ? 'Email' : stepType === 'wait' ? 'Wait' : 'Task'} Step
              </h2>

              <form onSubmit={handleStepModalSubmit}>
                {stepType === 'email' && (
                  <div className={styles.formGroup}>
                    <label>Select Email Template *</label>
                    <select name="templateId" className={styles.input} required>
                      <option value="">Choose a template...</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {stepType === 'wait' && (
                  <div className={styles.formGroup}>
                    <label>Days to Wait *</label>
                    <input
                      type="number"
                      name="waitDays"
                      className={styles.input}
                      min="1"
                      defaultValue="1"
                      required
                    />
                  </div>
                )}

                {stepType === 'task' && (
                  <div className={styles.formGroup}>
                    <label>Task Description *</label>
                    <textarea
                      name="taskDescription"
                      className={styles.textarea}
                      placeholder="e.g., Call the prospect to discuss pricing"
                      required
                    />
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowStepModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveButton}>
                    Add Step
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}
