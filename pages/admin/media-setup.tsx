import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from './media/AdminMedia.module.css';

export default function MediaSetup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tableStatus, setTableStatus] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      checkTableStatus();
    }
  }, [session]);

  const checkTableStatus = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/media/setup-table', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setTableStatus(data);
      } else {
        setError(data.message || data.error);
      }
    } catch (err: any) {
      setError('Failed to check table status');
    } finally {
      setLoading(false);
    }
  };

  const copySQL = () => {
    if (tableStatus?.sql) {
      navigator.clipboard.writeText(tableStatus.sql);
      alert('SQL copied to clipboard!');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <h1>Media Library Setup</h1>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {tableStatus && (
          <>
            {tableStatus.tableExists ? (
              <div style={{
                padding: '2rem',
                background: '#efe',
                border: '1px solid #cfc',
                borderRadius: '8px',
                marginBottom: '2rem',
              }}>
                <h2 style={{ marginTop: 0, color: '#060' }}>✅ Media Table is Ready!</h2>
                <p>The media table exists and is ready to use.</p>
                <p><strong>Total media items:</strong> {tableStatus.itemCount}</p>
                <button
                  onClick={() => router.push('/admin/media')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#060',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  Go to Media Library
                </button>
              </div>
            ) : (
              <div style={{
                padding: '2rem',
                background: '#fef5e7',
                border: '1px solid #f9e79f',
                borderRadius: '8px',
                marginBottom: '2rem',
              }}>
                <h2 style={{ marginTop: 0, color: '#7d6608' }}>⚠️ Media Table Not Found</h2>
                <p>{tableStatus.message}</p>

                <h3>Setup Instructions:</h3>
                <ol style={{ lineHeight: 1.8 }}>
                  <li>Copy the SQL below</li>
                  <li>Go to <a href="https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql" target="_blank" rel="noopener noreferrer">Supabase SQL Editor</a></li>
                  <li>Paste and run the SQL</li>
                  <li>Come back here and refresh the page</li>
                </ol>

                <div style={{
                  background: '#2d2d2d',
                  padding: '1rem',
                  borderRadius: '8px',
                  position: 'relative',
                  marginTop: '1rem',
                }}>
                  <button
                    onClick={copySQL}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      padding: '0.5rem 1rem',
                      background: '#4a5568',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    📋 Copy SQL
                  </button>

                  <pre style={{
                    color: '#f8f8f2',
                    margin: 0,
                    overflow: 'auto',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    paddingRight: '120px',
                  }}>
                    {tableStatus.sql}
                  </pre>
                </div>

                <button
                  onClick={checkTableStatus}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3182ce',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginTop: '1.5rem',
                  }}
                >
                  🔄 Check Again
                </button>
              </div>
            )}
          </>
        )}

        <div style={{
          padding: '1.5rem',
          background: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginTop: 0 }}>About Media Library</h3>
          <p>The media library allows staff to:</p>
          <ul>
            <li>Upload and manage images, videos, and audio files</li>
            <li>Search and filter media by name and type</li>
            <li>Copy URLs for use in articles and pages</li>
            <li>Export images as PDFs</li>
            <li>Delete unwanted media files</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
