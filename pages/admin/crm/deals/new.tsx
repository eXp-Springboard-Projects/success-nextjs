import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/DepartmentLayout';
import { Department } from '../../../../lib/departments';

interface Stage {
  id: string;
  name: string;
  color: string;
  probability: number;
}

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
}

export default function NewDealPage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactId: '',
    companyName: '',
    value: '',
    currency: 'USD',
    stageId: '',
    expectedCloseDate: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchStages();
    fetchContacts();
  }, []);

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/admin/crm/deals/stats');
      const data = await res.json();
      setStages(data.stages || []);
      if (data.stages?.length > 0) {
        setFormData(prev => ({ ...prev, stageId: data.stages[0].id }));
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/admin/crm/contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          contactId: formData.contactId || null,
          companyName: formData.companyName,
          value: parseFloat(formData.value) || 0,
          currency: formData.currency,
          stageId: formData.stageId,
          expectedCloseDate: formData.expectedCloseDate || null,
          source: formData.source,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        const deal = await res.json();
        router.push(`/admin/crm/deals/${deal.id}`);
      } else {
        alert('Failed to create deal');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <DepartmentLayout department={Department.CUSTOMER_SERVICE}>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <a
            href="/admin/crm/deals"
            style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Pipeline
          </a>
        </div>

        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
            Create New Deal
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#374151',
                  }}
                >
                  Deal Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                  }}
                  placeholder="e.g., Enterprise Software License"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: '#374151',
                    }}
                  >
                    Contact
                  </label>
                  <select
                    name="contactId"
                    value={formData.contactId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="">Select a contact...</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name} ({contact.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: '#374151',
                    }}
                  >
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                    placeholder="e.g., Acme Corp"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: '#374151',
                    }}
                  >
                    Deal Value
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: '#374151',
                    }}
                  >
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: '#374151',
                    }}
                  >
                    Stage *
                  </label>
                  <select
                    name="stageId"
                    value={formData.stageId}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
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
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: '#374151',
                    }}
                  >
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    name="expectedCloseDate"
                    value={formData.expectedCloseDate}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#374151',
                  }}
                >
                  Source
                </label>
                <input
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                  }}
                  placeholder="e.g., Website, Referral, Cold Call"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#374151',
                  }}
                >
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  placeholder="Add any additional notes or details about this deal..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Creating...' : 'Create Deal'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/crm/deals')}
                  style={{
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DepartmentLayout>
  );
}
