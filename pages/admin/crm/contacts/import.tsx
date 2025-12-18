import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Contacts.module.css';

interface ColumnMapping {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  source: string;
  tags: string;
}

interface PreviewContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  source?: string;
  tags?: string[];
}

export default function ImportContactsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    source: '',
    tags: '',
  });
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'merge'>('skip');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewContact[]>([]);
  const [importResults, setImportResults] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length === 0) return;

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const data = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        return values;
      });

      setCsvHeaders(headers);
      setCsvData(data);

      // Auto-map common column names
      const autoMapping: any = {
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        company: '',
        source: '',
        tags: '',
      };

      headers.forEach((header) => {
        const lower = header.toLowerCase();
        if (lower.includes('email')) autoMapping.email = header;
        if (lower.includes('first') && lower.includes('name')) autoMapping.firstName = header;
        if (lower.includes('last') && lower.includes('name')) autoMapping.lastName = header;
        if (lower.includes('phone')) autoMapping.phone = header;
        if (lower.includes('company')) autoMapping.company = header;
        if (lower.includes('source')) autoMapping.source = header;
        if (lower.includes('tag')) autoMapping.tags = header;
      });

      setMapping(autoMapping);
    };

    reader.readAsText(uploadedFile);
  };

  const generatePreview = () => {
    if (!csvHeaders.length || !csvData.length) return;

    const emailIndex = csvHeaders.indexOf(mapping.email);
    const firstNameIndex = mapping.firstName ? csvHeaders.indexOf(mapping.firstName) : -1;
    const lastNameIndex = mapping.lastName ? csvHeaders.indexOf(mapping.lastName) : -1;
    const phoneIndex = mapping.phone ? csvHeaders.indexOf(mapping.phone) : -1;
    const companyIndex = mapping.company ? csvHeaders.indexOf(mapping.company) : -1;
    const sourceIndex = mapping.source ? csvHeaders.indexOf(mapping.source) : -1;
    const tagsIndex = mapping.tags ? csvHeaders.indexOf(mapping.tags) : -1;

    const previewData = csvData.slice(0, 10).map((row) => {
      const contact: PreviewContact = {
        email: row[emailIndex] || '',
      };

      if (firstNameIndex >= 0) contact.firstName = row[firstNameIndex];
      if (lastNameIndex >= 0) contact.lastName = row[lastNameIndex];
      if (phoneIndex >= 0) contact.phone = row[phoneIndex];
      if (companyIndex >= 0) contact.company = row[companyIndex];
      if (sourceIndex >= 0) contact.source = row[sourceIndex];
      if (tagsIndex >= 0) {
        contact.tags = row[tagsIndex]
          .split(';')
          .map((t) => t.trim())
          .filter((t) => t);
      }

      return contact;
    });

    setPreview(previewData);
  };

  const handleImport = async () => {
    if (!csvHeaders.length || !csvData.length || !mapping.email) {
      alert('Please upload a file and map the email column');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const emailIndex = csvHeaders.indexOf(mapping.email);
      const firstNameIndex = mapping.firstName ? csvHeaders.indexOf(mapping.firstName) : -1;
      const lastNameIndex = mapping.lastName ? csvHeaders.indexOf(mapping.lastName) : -1;
      const phoneIndex = mapping.phone ? csvHeaders.indexOf(mapping.phone) : -1;
      const companyIndex = mapping.company ? csvHeaders.indexOf(mapping.company) : -1;
      const sourceIndex = mapping.source ? csvHeaders.indexOf(mapping.source) : -1;
      const tagsIndex = mapping.tags ? csvHeaders.indexOf(mapping.tags) : -1;

      const contacts = csvData.map((row) => ({
        email: row[emailIndex],
        firstName: firstNameIndex >= 0 ? row[firstNameIndex] : undefined,
        lastName: lastNameIndex >= 0 ? row[lastNameIndex] : undefined,
        phone: phoneIndex >= 0 ? row[phoneIndex] : undefined,
        company: companyIndex >= 0 ? row[companyIndex] : undefined,
        source: sourceIndex >= 0 ? row[sourceIndex] : 'csv_import',
        tags:
          tagsIndex >= 0
            ? row[tagsIndex]
                .split(';')
                .map((t: string) => t.trim())
                .filter((t: string) => t)
            : [],
      }));

      const res = await fetch('/api/admin/crm/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          duplicateHandling,
        }),
      });

      const data = await res.json();

      setImportResults({
        total: contacts.length,
        imported: data.imported || 0,
        skipped: data.skipped || 0,
        errors: data.errors || 0,
      });
    } catch (error) {
      alert('Failed to import contacts');
    } finally {
      setImporting(false);
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="Import Contacts"
      description="Import contacts from CSV file"
    >
      <div className={styles.dashboard}>
        <Link href="/admin/crm/contacts" className={styles.backLink}>
          ← Back to Contacts
        </Link>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Import Contacts</h1>
            <p className={styles.pageDescription}>Upload a CSV file to import contacts</p>
          </div>
        </div>

        {/* Upload Section */}
        {!csvHeaders.length && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              Step 1: Upload CSV File
            </h2>
            <div
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '3rem',
                textAlign: 'center',
              }}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
              >
                Choose CSV File
              </label>
              <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Upload a CSV file with contact information
              </p>
            </div>
          </div>
        )}

        {/* Mapping Section */}
        {csvHeaders.length > 0 && !preview.length && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              Step 2: Map Columns
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              File: <strong>{file?.name}</strong> ({csvData.length} rows)
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500 }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={mapping.email}
                  onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500 }}>First Name</label>
                <select
                  value={mapping.firstName}
                  onChange={(e) => setMapping({ ...mapping, firstName: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500 }}>Last Name</label>
                <select
                  value={mapping.lastName}
                  onChange={(e) => setMapping({ ...mapping, lastName: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500 }}>Phone</label>
                <select
                  value={mapping.phone}
                  onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500 }}>Company</label>
                <select
                  value={mapping.company}
                  onChange={(e) => setMapping({ ...mapping, company: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500 }}>Source</label>
                <select
                  value={mapping.source}
                  onChange={(e) => setMapping({ ...mapping, source: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 500 }}>Tags (semicolon separated)</label>
                <select
                  value={mapping.tags}
                  onChange={(e) => setMapping({ ...mapping, tags: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Duplicate Handling
              </h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    value="skip"
                    checked={duplicateHandling === 'skip'}
                    onChange={(e) => setDuplicateHandling(e.target.value as any)}
                  />
                  Skip duplicates
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    value="update"
                    checked={duplicateHandling === 'update'}
                    onChange={(e) => setDuplicateHandling(e.target.value as any)}
                  />
                  Update existing
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    value="merge"
                    checked={duplicateHandling === 'merge'}
                    onChange={(e) => setDuplicateHandling(e.target.value as any)}
                  />
                  Merge data
                </label>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={generatePreview}
                disabled={!mapping.email}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !mapping.email ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !mapping.email ? 'not-allowed' : 'pointer',
                }}
              >
                Preview Import
              </button>
              <button
                onClick={() => {
                  setCsvHeaders([]);
                  setCsvData([]);
                  setFile(null);
                  setPreview([]);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {preview.length > 0 && !importResults && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              Step 3: Preview & Import
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Showing first 10 rows. Total: {csvData.length} contacts
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Source</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((contact, idx) => (
                    <tr key={idx}>
                      <td>{contact.email}</td>
                      <td>{contact.firstName || '-'}</td>
                      <td>{contact.lastName || '-'}</td>
                      <td>{contact.phone || '-'}</td>
                      <td>{contact.company || '-'}</td>
                      <td>{contact.source || 'csv_import'}</td>
                      <td>{contact.tags?.join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleImport}
                disabled={importing}
                style={{
                  padding: '0.75rem 2rem',
                  background: importing ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: importing ? 'not-allowed' : 'pointer',
                }}
              >
                {importing ? 'Importing...' : `Import ${csvData.length} Contacts`}
              </button>
              <button
                onClick={() => setPreview([])}
                disabled={importing}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: importing ? 'not-allowed' : 'pointer',
                }}
              >
                Back to Mapping
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {importResults && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#10b981' }}>
              ✓ Import Complete
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                  {importResults.total}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>TOTAL</div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                  {importResults.imported}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>IMPORTED</div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                  {importResults.skipped}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>SKIPPED</div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                  {importResults.errors}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>ERRORS</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => router.push('/admin/crm/contacts')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                View Contacts
              </button>
              <button
                onClick={() => {
                  setCsvHeaders([]);
                  setCsvData([]);
                  setFile(null);
                  setPreview([]);
                  setImportResults(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
