import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Papa from 'papaparse';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './Contacts.module.css';

interface PreviewRow {
  [key: string]: string;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [allData, setAllData] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setResult(null);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as PreviewRow[];
        const headers = results.meta.fields || [];

        setHeaders(headers);
        setAllData(data);
        setTotalRows(data.length);
        setPreview(data.slice(0, 3));
      },
      error: (error) => {
        alert(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const smartMapField = (header: string): string | null => {
    const lower = header.toLowerCase().replace(/[_\s-]/g, '');

    // Email
    if (lower.includes('email')) return 'email';

    // First name
    if (lower.includes('firstname') || lower.includes('givenname') || lower === 'fname' ||
        (header.toLowerCase().includes('first') && header.toLowerCase().includes('name'))) {
      return 'first_name';
    }

    // Last name
    if (lower.includes('lastname') || lower.includes('surname') || lower.includes('familyname') ||
        lower === 'lname' || (header.toLowerCase().includes('last') && header.toLowerCase().includes('name'))) {
      return 'last_name';
    }

    // Phone
    if (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell') ||
        lower.includes('telephone') || lower === 'tel') {
      return 'phone';
    }

    // Company
    if (lower.includes('company') || lower.includes('organization') || lower.includes('organisation') ||
        lower.includes('business')) {
      return 'company';
    }

    return null;
  };

  const handleImport = async () => {
    if (!allData.length) {
      alert('No data to import');
      return;
    }

    setImporting(true);

    try {
      // Map CSV rows to contact objects
      const contacts = allData.map(row => {
        const contact: any = {};

        headers.forEach(header => {
          const mappedField = smartMapField(header);
          if (mappedField && row[header]) {
            contact[mappedField] = row[header].trim();
          }
        });

        // Ensure we have at least an email
        return contact;
      }).filter(c => c.email); // Only keep contacts with email

      if (contacts.length === 0) {
        alert('No valid contacts found. Please ensure your CSV has an "email" column.');
        setImporting(false);
        return;
      }

      // Import via API
      const res = await fetch('/api/admin/crm/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult({
        imported: data.imported || 0,
        skipped: data.skipped || 0,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Import failed');
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
        {!preview.length && !result && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center' }}>
            <div
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '4rem 2rem',
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
                  padding: '1rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-block',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Choose CSV File
              </label>
              <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                CSV should include an "email" column for deduplication
              </p>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {preview.length > 0 && !result && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Found {totalRows} rows
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Preview (first 3 rows):
            </p>

            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {headers.map((header) => (
                        <td key={header}>{row[header] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
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
                  fontSize: '1rem',
                  cursor: importing ? 'not-allowed' : 'pointer',
                }}
              >
                {importing ? 'Importing...' : 'Import Contacts'}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setHeaders([]);
                  setAllData([]);
                  setTotalRows(0);
                }}
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
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#10b981' }}>
              ✓ Import Complete
            </h2>

            <div style={{ fontSize: '1.125rem', marginBottom: '2rem', color: '#374151' }}>
              Successfully imported <strong>{result.imported}</strong> contacts
              {result.skipped > 0 && (
                <span style={{ color: '#6b7280' }}> ({result.skipped} skipped)</span>
              )}
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
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View Contacts
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setHeaders([]);
                  setAllData([]);
                  setTotalRows(0);
                  setResult(null);
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
