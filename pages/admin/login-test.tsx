import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Page loaded - JavaScript is working!');

  const handleLogin = async () => {
    setMessage('Starting login...');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      setMessage(`Result: ${JSON.stringify(result, null, 2)}`);

      if (result?.ok) {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1000);
      }
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>Login Test Page</h1>
      <div style={{ background: '#f0f0f0', padding: '20px', marginBottom: '20px' }}>
        <strong>Status:</strong> {message}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '300px', padding: '8px', fontSize: '16px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '300px', padding: '8px', fontSize: '16px' }}
        />
      </div>

      <button
        onClick={handleLogin}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#c41e3a',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Test Login
      </button>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p>Use: rachel.nead@success.com / Success2025!</p>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
