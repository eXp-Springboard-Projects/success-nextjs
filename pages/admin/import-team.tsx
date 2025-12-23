import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function ImportTeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === 'loading') {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/import-team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Import Team Members</h1>
      <p>Click the button below to import all 25 team members from the WordPress About Us page.</p>

      <button
        onClick={handleImport}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '20px',
        }}
      >
        {loading ? 'Importing...' : 'Import Team Members'}
      </button>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '5px',
          color: '#c00',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '5px',
          color: '#060',
        }}>
          <strong>Success!</strong>
          <p>{result.message}</p>
          <p>Total imported: {result.count} team members</p>
          <div style={{ marginTop: '15px' }}>
            <a href="/about" style={{ color: '#0070f3' }}>
              View About Us page →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
