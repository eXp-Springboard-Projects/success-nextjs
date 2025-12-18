/**
 * Media Upload Test Page
 * Tests media upload and retrieval functionality
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function TestMedia() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const testFetchMedia = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching media from /api/media...');
      const res = await fetch('/api/media?per_page=10');
      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('Fetched media:', data);
      setMedia(data);
      setError(`✅ Success! Found ${data.length} media items`);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadStatus('Uploading...');
      setError('');

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', file.name);

        console.log('Uploading file:', file.name, file.type, file.size);

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        console.log('Upload response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const result = await res.json();
        console.log('Upload result:', result);
        setUploadStatus(`✅ Uploaded: ${result.filename}`);

        // Refresh media list
        await testFetchMedia();
      } catch (err: any) {
        console.error('Upload error:', err);
        setUploadStatus(`❌ Upload failed: ${err.message}`);
      }
    };

    input.click();
  };

  if (status === 'loading') {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>🔧 Media System Diagnostic</h1>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Session Info:</h3>
        <pre>{JSON.stringify(session.user, null, 2)}</pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={testFetchMedia}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Loading...' : '📥 Test Fetch Media'}
        </button>

        <button
          onClick={testUpload}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          📤 Test Upload
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: error.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${error.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: error.includes('✅') ? '#155724' : '#721c24'
        }}>
          {error}
        </div>
      )}

      {uploadStatus && (
        <div style={{
          marginTop: '10px',
          padding: '15px',
          background: uploadStatus.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${uploadStatus.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: uploadStatus.includes('✅') ? '#155724' : '#721c24'
        }}>
          {uploadStatus}
        </div>
      )}

      {media.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Media Items ({media.length}):</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {media.map((item: any) => (
              <div key={item.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '10px',
                background: 'white'
              }}>
                {item.mimeType?.startsWith('image/') && (
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                )}
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  <div><strong>{item.filename}</strong></div>
                  <div style={{ color: '#666' }}>{item.mimeType}</div>
                  <div style={{ color: '#666' }}>{(item.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>📋 Diagnostic Checklist:</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ Media table exists in database (tested via script)</li>
          <li>✅ Upload directory exists: public/uploads</li>
          <li>✅ Local storage enabled (BLOB_READ_WRITE_TOKEN is placeholder)</li>
          <li>✅ Dependencies installed: sharp, formidable</li>
          <li>❓ API authentication - test with buttons above</li>
          <li>❓ File upload functionality - test with buttons above</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => router.push('/admin/posts/new')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          ← Back to Post Editor
        </button>
      </div>
    </div>
  );
}

export const getServerSideProps = requireAdminAuth;
