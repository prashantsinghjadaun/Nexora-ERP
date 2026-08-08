import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Boxes, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#090d16', padding: '1.5rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', background: '#131b2e', border: '1px solid #23304d', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem' }}>
            <Boxes size={32} style={{ color: '#090d16' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>Nexora ERP</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sign in to access your operations portal</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="user@nexora.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #23304d' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Demo Login Fill
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button onClick={() => setDemoCredentials('admin@nexora.com', 'Admin@123456')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
              ADMIN
            </button>
            <button onClick={() => setDemoCredentials('sales@nexora.com', 'Sales@123456')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
              SALES
            </button>
            <button onClick={() => setDemoCredentials('warehouse@nexora.com', 'Warehouse@123456')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
              WAREHOUSE
            </button>
            <button onClick={() => setDemoCredentials('accounts@nexora.com', 'Accounts@123456')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
              ACCOUNTS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
