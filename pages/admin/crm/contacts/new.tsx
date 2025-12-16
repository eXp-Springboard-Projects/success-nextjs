import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Contacts.module.css';

export default function NewContactPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    source: 'manual',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const contact = await res.json();
        router.push(`/admin/crm/contacts/${contact.id}`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create contact');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="Add Contact"
      description="Create a new contact"
    >
      <div className={styles.dashboard}>
        <Link href="/admin/crm/contacts" className={styles.backLink}>
          ← Back to Contacts
        </Link>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Add Contact</h1>
            <p className={styles.pageDescription}>Create a new contact in your CRM</p>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    htmlFor="firstName"
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="company"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="source"
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Source
                </label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="import">CSV Import</option>
                  <option value="web_form">Web Form</option>
                  <option value="email">Email</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={saving || !formData.email}
                  className={styles.primaryButton}
                  style={{
                    opacity: saving || !formData.email ? 0.5 : 1,
                    cursor: saving || !formData.email ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Create Contact'}
                </button>
                <Link href="/admin/crm/contacts" className={styles.secondaryButton}>
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
