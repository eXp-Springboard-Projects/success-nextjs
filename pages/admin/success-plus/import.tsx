import { useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './SuccessPlus.module.css';

export default function ImportMembers() {
  const [data, setData] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/success-plus/import-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      setResult({
        imported: 0,
        skipped: 0,
        errors: ['Failed to import members'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Import SUCCESS+ Members"
      description="Import members from tab-separated data"
    >
      <div className={styles.dashboard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Paste Member Data</h2>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Paste the tab-separated data from your export. Each row should contain:
            Record ID, First Name, Last Name, Email, Phone, etc.
          </p>

          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Paste member data here..."
            rows={15}
            style={{
              width: '100%',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          />

          <button
            onClick={handleImport}
            disabled={importing || !data.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: importing ? '#ccc' : '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: importing || !data.trim() ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {importing ? 'Importing...' : 'Import Members'}
          </button>

          {result && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <h3 style={{ marginBottom: '1rem' }}>Import Results</h3>
              <p>✅ Imported: {result.imported}</p>
              <p>⏭️ Skipped (already exist): {result.skipped}</p>
              {result.errors.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'red', fontWeight: 'bold' }}>❌ Errors: {result.errors.length}</p>
                  <ul style={{ marginTop: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
                    {result.errors.map((error, i) => (
                      <li key={i} style={{ color: 'red', fontSize: '14px' }}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
