import { useState, useEffect } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from '../../forms/Forms.module.css';

interface ScoringRule {
  id: string;
  name: string;
  eventType: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

interface TopLead {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  leadScore: number;
}

export default function LeadScoringSettings() {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [topLeads, setTopLeads] = useState<TopLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    eventType: 'email_opened',
    points: 0,
  });

  useEffect(() => {
    fetchRules();
    fetchTopLeads();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/crm/lead-scoring/rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopLeads = async () => {
    try {
      const res = await fetch('/api/admin/crm/lead-scoring/top-leads?limit=10');
      const data = await res.json();
      setTopLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching top leads:', error);
    }
  };

  const saveRule = async () => {
    try {
      const url = editingRule
        ? `/api/admin/crm/lead-scoring/rules/${editingRule.id}`
        : '/api/admin/crm/lead-scoring/rules';
      const method = editingRule ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchRules();
        setEditingRule(null);
        setShowAddForm(false);
        setFormData({ name: '', eventType: 'email_opened', points: 0 });
      } else {
        alert('Failed to save rule');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Error saving rule');
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const res = await fetch(`/api/admin/crm/lead-scoring/rules/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchRules();
      } else {
        alert('Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Error deleting rule');
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/crm/lead-scoring/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (res.ok) {
        fetchRules();
      } else {
        alert('Failed to toggle rule');
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Error toggling rule');
    }
  };

  const recalculateScores = async () => {
    if (!confirm('This will recalculate all lead scores. This may take a while. Continue?')) return;

    setRecalculating(true);
    try {
      const res = await fetch('/api/admin/crm/lead-scoring/recalculate', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Recalculation complete! Processed ${data.processedCount} contacts.`);
        fetchTopLeads();
      } else {
        alert('Failed to recalculate scores');
      }
    } catch (error) {
      console.error('Error recalculating scores:', error);
      alert('Error recalculating scores');
    } finally {
      setRecalculating(false);
    }
  };

  const getScoreBadge = (score: number) => {
    let color = '#6c757d';
    let label = 'None';

    if (score >= 100) {
      color = '#dc3545';
      label = 'Hot';
    } else if (score >= 50) {
      color = '#fd7e14';
      label = 'Warm';
    } else if (score >= 20) {
      color = '#ffc107';
      label = 'Medium';
    } else if (score > 0) {
      color = '#17a2b8';
      label = 'Cold';
    }

    return (
      <span style={{
        background: color,
        color: '#fff',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}>
        {score} - {label}
      </span>
    );
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="Lead Scoring"
      description="Configure scoring rules to automatically rank leads"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Lead Scoring Rules</h1>
            <p>Automatically score and rank your leads based on their engagement</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className={styles.buttonSecondary}
              onClick={recalculateScores}
              disabled={recalculating}
            >
              {recalculating ? 'Recalculating...' : 'Recalculate All Scores'}
            </button>
            <button
              className={styles.primaryButton}
              onClick={() => {
                setShowAddForm(true);
                setEditingRule(null);
                setFormData({ name: '', eventType: 'email_opened', points: 0 });
              }}
            >
              + Add Rule
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Scoring Rules */}
          <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Scoring Rules</h2>

            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Rule Name</th>
                      <th>Event Type</th>
                      <th>Points</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id}>
                        <td><strong>{rule.name}</strong></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{rule.eventType}</td>
                        <td>
                          <span style={{
                            color: rule.points > 0 ? '#28a745' : '#dc3545',
                            fontWeight: 600,
                          }}>
                            {rule.points > 0 ? '+' : ''}{rule.points}
                          </span>
                        </td>
                        <td>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={rule.isActive}
                              onChange={(e) => toggleRule(rule.id, e.target.checked)}
                            />
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </label>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.actionButton}
                              onClick={() => {
                                setEditingRule(rule);
                                setFormData({
                                  name: rule.name,
                                  eventType: rule.eventType,
                                  points: rule.points,
                                });
                                setShowAddForm(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => deleteRule(rule.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                background: '#fff',
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
                  {editingRule ? 'Edit Rule' : 'Add New Rule'}
                </h3>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>Rule Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Email Opened"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Event Type</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    >
                      <option value="email_opened">Email Opened</option>
                      <option value="email_clicked">Email Clicked</option>
                      <option value="form_submitted">Form Submitted</option>
                      <option value="page_visited">Page Visited</option>
                      <option value="purchase">Purchase</option>
                      <option value="deal_created">Deal Created</option>
                      <option value="ticket_created">Ticket Created</option>
                      <option value="unsubscribed">Unsubscribed</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Points</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <small style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      Use negative numbers to deduct points (e.g., -50 for unsubscribe)
                    </small>
                  </div>
                  <div className={styles.buttonGroup}>
                    <button
                      className={`${styles.button} ${styles.buttonPrimary}`}
                      onClick={saveRule}
                    >
                      {editingRule ? 'Update Rule' : 'Add Rule'}
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingRule(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Leads Preview */}
          <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>🔥 Top 10 Leads</h2>
            <div style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              {topLeads.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
                  No scored leads yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {topLeads.map((lead, index) => (
                    <div
                      key={lead.id}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          #{index + 1} {lead.firstName || lead.lastName ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : lead.email}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {lead.email}
                        </div>
                      </div>
                      {getScoreBadge(lead.leadScore)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
