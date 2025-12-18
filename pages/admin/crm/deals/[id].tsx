import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import styles from './Deals.module.css';

interface Stage {
  id: string;
  name: string;
  color: string;
  probability: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  created_by: string;
}

interface Deal {
  id: string;
  name: string;
  company_name: string;
  value: number;
  currency: string;
  stage_id: string;
  stage_name: string;
  stage_color: string;
  probability: number;
  expected_close_date: string;
  actual_close_date: string;
  owner_id: string;
  owner_name: string;
  source: string;
  notes: string;
  status: string;
  lost_reason: string;
  contact_id: string;
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  contact_company: string;
  custom_fields: Record<string, any>;
  activities: Activity[];
}

export default function DealDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchStages();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      const res = await fetch(`/api/admin/crm/deals/${id}`);
      const data = await res.json();
      setDeal(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/admin/crm/deals/stats');
      const data = await res.json();
      setStages(data.stages || []);
    } catch (error) {
    }
  };

  const handleStageChange = async (stageId: string) => {
    try {
      await fetch(`/api/admin/crm/deals/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId }),
      });
      fetchDeal();
    } catch (error) {
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await fetch(`/api/admin/crm/deals/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          description: newNote,
        }),
      });
      setNewNote('');
      fetchDeal();
    } catch (error) {
    }
  };

  const handleMarkWon = async () => {
    if (!confirm('Mark this deal as won?')) return;

    try {
      await fetch(`/api/admin/crm/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'won',
          actualCloseDate: new Date().toISOString().split('T')[0],
        }),
      });
      fetchDeal();
    } catch (error) {
    }
  };

  const handleMarkLost = async () => {
    const reason = prompt('Why was this deal lost?');
    if (!reason) return;

    try {
      await fetch(`/api/admin/crm/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'lost',
          lostReason: reason,
          actualCloseDate: new Date().toISOString().split('T')[0],
        }),
      });
      fetchDeal();
    } catch (error) {
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Deal Details">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading deal...</div>
      </DepartmentLayout>
    );
  }

  if (!deal) {
    return (
      <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Deal Not Found">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Deal not found</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Deal Details">
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <a
            href="/admin/crm/deals"
            style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Pipeline
          </a>
        </div>

        {/* Header */}
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                {deal.name}
              </h1>
              {deal.company_name && (
                <p style={{ color: '#6b7280', margin: 0 }}>{deal.company_name}</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.5rem' }}>
                {formatCurrency(Number(deal.value), deal.currency)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {deal.probability}% probability
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>Stage:</label>
            <select
              value={deal.stage_id}
              onChange={(e) => handleStageChange(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: `${deal.stage_color}20`,
                color: deal.stage_color,
              }}
            >
              {deal.stage_name}
            </span>
          </div>

          {deal.status === 'open' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleMarkWon}
                style={{
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark as Won
              </button>
              <button
                onClick={handleMarkLost}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark as Lost
              </button>
            </div>
          )}

          {deal.status !== 'open' && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                background: deal.status === 'won' ? '#f0fdf4' : '#fef2f2',
                color: deal.status === 'won' ? '#166534' : '#991b1b',
                fontWeight: 600,
              }}
            >
              Deal {deal.status === 'won' ? 'Won' : 'Lost'} on {formatDate(deal.actual_close_date)}
              {deal.lost_reason && ` - ${deal.lost_reason}`}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Activities */}
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                marginBottom: '2rem',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                Activity Timeline
              </h2>

              <form onSubmit={handleAddNote} style={{ marginBottom: '2rem' }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note or activity..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '80px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add Note
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {deal.activities?.map(activity => (
                  <div
                    key={activity.id}
                    style={{
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      borderLeft: '3px solid #3b82f6',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                      {activity.type.replace('_', ' ')}
                    </div>
                    <div style={{ color: '#374151', marginBottom: '0.5rem' }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatDateTime(activity.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {deal.notes && (
              <div
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                }}
              >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Notes
                </h2>
                <p style={{ color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {deal.notes}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Contact Info */}
            {deal.contact_id && (
              <div
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  marginBottom: '1.5rem',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Contact
                </h3>
                <div style={{ fontSize: '0.875rem' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    {deal.contact_first_name} {deal.contact_last_name}
                  </p>
                  {deal.contact_email && (
                    <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                      {deal.contact_email}
                    </p>
                  )}
                  {deal.contact_phone && (
                    <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                      {deal.contact_phone}
                    </p>
                  )}
                  {deal.contact_company && (
                    <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                      {deal.contact_company}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Deal Info */}
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Deal Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Owner</div>
                  <div style={{ fontWeight: 600 }}>{deal.owner_name || 'Unassigned'}</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Expected Close</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(deal.expected_close_date)}</div>
                </div>
                {deal.source && (
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Source</div>
                    <div style={{ fontWeight: 600 }}>{deal.source}</div>
                  </div>
                )}
                <div>
                  <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Status</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{deal.status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}
