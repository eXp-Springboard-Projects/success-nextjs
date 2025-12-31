import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@/lib/types';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from '../CRM.module.css';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface ContactList {
  id: string;
  name: string;
}

interface Action {
  type: 'send_email' | 'add_to_list' | 'add_tag' | 'wait' | 'update_field';
  templateId?: string;
  listId?: string;
  tagName?: string;
  delay?: number;
  fieldName?: string;
  fieldValue?: string;
}

export default function NewAutomationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'contact_created',
    triggerConfig: {} as any,
    conditions: [] as Array<{ field: string; operator: string; value: string }>,
    actions: [] as Action[],
    status: 'active',
  });

  useEffect(() => {
    fetchTemplates();
    fetchLists();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/crm/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/admin/crm/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { field: 'leadScore', operator: 'greater_than', value: '' },
      ],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const addAction = (type: Action['type']) => {
    const newAction: Action = { type };
    if (type === 'send_email') {
      newAction.templateId = templates[0]?.id || '';
      newAction.delay = 0;
    } else if (type === 'add_to_list') {
      newAction.listId = lists[0]?.id || '';
    } else if (type === 'wait') {
      newAction.delay = 60; // 1 hour default
    }
    setFormData({
      ...formData,
      actions: [...formData.actions, newAction],
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    const newActions = [...formData.actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newActions.length) {
      [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
      setFormData({ ...formData, actions: newActions });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.actions.length === 0) {
      alert('Please provide a name and at least one action');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/crm/automations');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create automation');
      }
    } catch (error) {
      alert('Failed to create automation');
    } finally {
      setLoading(false);
    }
  };

  const getTriggerIcon = (trigger: string) => {
    const icons: Record<string, string> = {
      contact_created: '👤',
      list_joined: '📋',
      form_submitted: '📝',
      email_opened: '📧',
      email_clicked: '🖱️',
      tag_added: '🏷️',
      lead_score_reached: '📈',
    };
    return icons[trigger] || '⚡';
  };

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      send_email: '📨',
      add_to_list: '📋',
      add_tag: '🏷️',
      wait: '⏱️',
      update_field: '✏️',
    };
    return icons[type] || '⚙️';
  };

  return (
    <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Create Automation">
      <div className={styles.automationBuilder}>
        {/* Progress Steps */}
        <div className={styles.progressSteps}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.progressStepActive : ''}`}>
            <div className={styles.progressStepNumber}>1</div>
            <div className={styles.progressStepLabel}>Basic Info</div>
          </div>
          <div className={styles.progressStepLine}></div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.progressStepActive : ''}`}>
            <div className={styles.progressStepNumber}>2</div>
            <div className={styles.progressStepLabel}>Trigger</div>
          </div>
          <div className={styles.progressStepLine}></div>
          <div className={`${styles.progressStep} ${step >= 3 ? styles.progressStepActive : ''}`}>
            <div className={styles.progressStepNumber}>3</div>
            <div className={styles.progressStepLabel}>Workflow</div>
          </div>
          <div className={styles.progressStepLine}></div>
          <div className={`${styles.progressStep} ${step >= 4 ? styles.progressStepActive : ''}`}>
            <div className={styles.progressStepNumber}>4</div>
            <div className={styles.progressStepLabel}>Review</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className={styles.builderStep}>
              <div className={styles.stepHeader}>
                <h2>📋 Basic Information</h2>
                <p>Give your automation a name and description</p>
              </div>

              <div className={styles.stepContent}>
                <div className={styles.formGroup}>
                  <label>Automation Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={styles.input}
                    placeholder="e.g., Welcome New Subscribers"
                    required
                  />
                  <p className={styles.helpText}>Choose a clear, descriptive name</p>
                </div>

                <div className={styles.formGroup}>
                  <label>Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={styles.textarea}
                    placeholder="Describe what this automation does..."
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.stepActions}>
                <button
                  type="button"
                  onClick={() => router.push('/admin/crm/automations')}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={styles.primaryButton}
                  disabled={!formData.name}
                >
                  Next: Set Trigger →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Trigger */}
          {step === 2 && (
            <div className={styles.builderStep}>
              <div className={styles.stepHeader}>
                <h2>⚡ Choose Trigger Event</h2>
                <p>What event should start this automation?</p>
              </div>

              <div className={styles.stepContent}>
                <div className={styles.triggerGrid}>
                  {[
                    { value: 'contact_created', label: 'Contact Created', desc: 'When a new contact is added' },
                    { value: 'list_joined', label: 'Joined List', desc: 'When contact joins a specific list' },
                    { value: 'form_submitted', label: 'Form Submitted', desc: 'When a form is completed' },
                    { value: 'email_opened', label: 'Email Opened', desc: 'When contact opens an email' },
                    { value: 'email_clicked', label: 'Link Clicked', desc: 'When contact clicks a link' },
                    { value: 'tag_added', label: 'Tag Added', desc: 'When a tag is applied' },
                    { value: 'lead_score_reached', label: 'Score Reached', desc: 'When lead score hits threshold' },
                  ].map((trigger) => (
                    <div
                      key={trigger.value}
                      className={`${styles.triggerCard} ${formData.trigger === trigger.value ? styles.triggerCardActive : ''}`}
                      onClick={() => setFormData({ ...formData, trigger: trigger.value })}
                    >
                      <div className={styles.triggerIcon}>{getTriggerIcon(trigger.value)}</div>
                      <h3>{trigger.label}</h3>
                      <p>{trigger.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Conditions Section */}
                <div className={styles.conditionsSection}>
                  <div className={styles.conditionsHeader}>
                    <h3>🎯 Add Conditions (Optional)</h3>
                    <button
                      type="button"
                      onClick={addCondition}
                      className={styles.secondaryButton}
                    >
                      + Add Condition
                    </button>
                  </div>

                  {formData.conditions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No conditions set. Automation will run for all matching triggers.</p>
                    </div>
                  ) : (
                    <div className={styles.conditionsList}>
                      {formData.conditions.map((condition, index) => (
                        <div key={index} className={styles.conditionRow}>
                          <select
                            value={condition.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            className={styles.select}
                          >
                            <option value="leadScore">Lead Score</option>
                            <option value="status">Status</option>
                            <option value="source">Source</option>
                            <option value="company">Company</option>
                            <option value="email">Email</option>
                          </select>
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                            className={styles.select}
                          >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="greater_than">Greater Than</option>
                            <option value="less_than">Less Than</option>
                            <option value="contains">Contains</option>
                          </select>
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className={styles.input}
                            placeholder="Value"
                          />
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className={styles.iconButton}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.stepActions}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={styles.secondaryButton}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={styles.primaryButton}
                >
                  Next: Build Workflow →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Workflow Builder */}
          {step === 3 && (
            <div className={styles.builderStep}>
              <div className={styles.stepHeader}>
                <h2>🔧 Build Workflow</h2>
                <p>Add actions that will be performed automatically</p>
              </div>

              <div className={styles.stepContent}>
                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    onClick={() => addAction('send_email')}
                    className={styles.actionTypeButton}
                  >
                    📨 Send Email
                  </button>
                  <button
                    type="button"
                    onClick={() => addAction('wait')}
                    className={styles.actionTypeButton}
                  >
                    ⏱️ Wait / Delay
                  </button>
                  <button
                    type="button"
                    onClick={() => addAction('add_to_list')}
                    className={styles.actionTypeButton}
                  >
                    📋 Add to List
                  </button>
                  <button
                    type="button"
                    onClick={() => addAction('add_tag')}
                    className={styles.actionTypeButton}
                  >
                    🏷️ Add Tag
                  </button>
                </div>

                {formData.actions.length === 0 ? (
                  <div className={styles.emptyWorkflow}>
                    <div className={styles.emptyWorkflowIcon}>🎯</div>
                    <h3>No actions yet</h3>
                    <p>Click the buttons above to add actions to your workflow</p>
                  </div>
                ) : (
                  <div className={styles.workflowCanvas}>
                    <div className={styles.workflowStart}>
                      <div className={styles.workflowNode}>
                        <div className={styles.workflowNodeIcon}>{getTriggerIcon(formData.trigger)}</div>
                        <div>Trigger: {formData.trigger.replace('_', ' ')}</div>
                      </div>
                    </div>

                    {formData.actions.map((action, index) => (
                      <div key={index} className={styles.workflowItem}>
                        <div className={styles.workflowConnector}>↓</div>
                        <div className={styles.workflowAction}>
                          <div className={styles.workflowActionHeader}>
                            <div className={styles.workflowActionTitle}>
                              <span className={styles.workflowActionIcon}>{getActionIcon(action.type)}</span>
                              <span>Action {index + 1}: {action.type.replace('_', ' ')}</span>
                            </div>
                            <div className={styles.workflowActionControls}>
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveAction(index, 'up')}
                                  className={styles.iconButton}
                                  title="Move up"
                                >
                                  ↑
                                </button>
                              )}
                              {index < formData.actions.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveAction(index, 'down')}
                                  className={styles.iconButton}
                                  title="Move down"
                                >
                                  ↓
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeAction(index)}
                                className={styles.iconButton}
                                title="Remove"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className={styles.workflowActionContent}>
                            {action.type === 'send_email' && (
                              <>
                                <div className={styles.formGroup}>
                                  <label>Email Template *</label>
                                  <select
                                    value={action.templateId || ''}
                                    onChange={(e) => updateAction(index, 'templateId', e.target.value)}
                                    className={styles.select}
                                    required
                                  >
                                    <option value="">Select template...</option>
                                    {templates.map(t => (
                                      <option key={t.id} value={t.id}>
                                        {t.name} - {t.subject}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className={styles.formGroup}>
                                  <label>Send Delay (minutes)</label>
                                  <input
                                    type="number"
                                    value={action.delay || 0}
                                    onChange={(e) => updateAction(index, 'delay', parseInt(e.target.value))}
                                    className={styles.input}
                                    min="0"
                                    placeholder="0 = Send immediately"
                                  />
                                </div>
                              </>
                            )}

                            {action.type === 'wait' && (
                              <div className={styles.formGroup}>
                                <label>Wait Time (minutes) *</label>
                                <input
                                  type="number"
                                  value={action.delay || 60}
                                  onChange={(e) => updateAction(index, 'delay', parseInt(e.target.value))}
                                  className={styles.input}
                                  min="1"
                                  placeholder="60"
                                  required
                                />
                                <p className={styles.helpText}>
                                  {action.delay ? `Wait ${Math.floor((action.delay || 0) / 60)} hours ${(action.delay || 0) % 60} minutes` : 'Enter wait time'}
                                </p>
                              </div>
                            )}

                            {action.type === 'add_to_list' && (
                              <div className={styles.formGroup}>
                                <label>Contact List *</label>
                                <select
                                  value={action.listId || ''}
                                  onChange={(e) => updateAction(index, 'listId', e.target.value)}
                                  className={styles.select}
                                  required
                                >
                                  <option value="">Select list...</option>
                                  {lists.map(l => (
                                    <option key={l.id} value={l.id}>
                                      {l.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {action.type === 'add_tag' && (
                              <div className={styles.formGroup}>
                                <label>Tag Name *</label>
                                <input
                                  type="text"
                                  value={action.tagName || ''}
                                  onChange={(e) => updateAction(index, 'tagName', e.target.value)}
                                  className={styles.input}
                                  placeholder="e.g., vip, newsletter-subscriber"
                                  required
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className={styles.workflowEnd}>
                      <div className={styles.workflowConnector}>↓</div>
                      <div className={styles.workflowNode}>
                        <div className={styles.workflowNodeIcon}>✓</div>
                        <div>Complete</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.stepActions}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={styles.secondaryButton}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className={styles.primaryButton}
                  disabled={formData.actions.length === 0}
                >
                  Next: Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Activate */}
          {step === 4 && (
            <div className={styles.builderStep}>
              <div className={styles.stepHeader}>
                <h2>✅ Review & Activate</h2>
                <p>Review your automation before activating</p>
              </div>

              <div className={styles.stepContent}>
                <div className={styles.reviewCard}>
                  <h3>Automation Summary</h3>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Name:</span>
                    <span className={styles.reviewValue}>{formData.name}</span>
                  </div>
                  {formData.description && (
                    <div className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Description:</span>
                      <span className={styles.reviewValue}>{formData.description}</span>
                    </div>
                  )}
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Trigger:</span>
                    <span className={styles.reviewValue}>
                      {getTriggerIcon(formData.trigger)} {formData.trigger.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Conditions:</span>
                    <span className={styles.reviewValue}>
                      {formData.conditions.length === 0 ? 'None (runs for all triggers)' : `${formData.conditions.length} condition(s)`}
                    </span>
                  </div>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Actions:</span>
                    <span className={styles.reviewValue}>{formData.actions.length} action(s)</span>
                  </div>
                </div>

                <div className={styles.reviewWorkflow}>
                  <h3>Workflow Preview</h3>
                  <ol className={styles.workflowPreview}>
                    <li>Trigger: {formData.trigger.replace('_', ' ')}</li>
                    {formData.actions.map((action, index) => (
                      <li key={index}>
                        {getActionIcon(action.type)} {action.type.replace('_', ' ')}
                        {action.type === 'send_email' && action.templateId && ` - Template: ${templates.find(t => t.id === action.templateId)?.name}`}
                        {action.type === 'add_to_list' && action.listId && ` - List: ${lists.find(l => l.id === action.listId)?.name}`}
                        {action.type === 'add_tag' && action.tagName && ` - Tag: ${action.tagName}`}
                        {action.delay && action.delay > 0 && ` (after ${action.delay} min)`}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={styles.activationSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'paused' })}
                    />
                    <div>
                      <strong>Activate automation immediately</strong>
                      <p>If unchecked, automation will be saved as draft and can be activated later</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.stepActions}>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={styles.secondaryButton}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : formData.status === 'active' ? '🚀 Create & Activate' : '💾 Save as Draft'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
