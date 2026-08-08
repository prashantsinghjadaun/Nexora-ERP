import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={36} style={{ margin: '0 auto 1rem', color: '#38bdf8' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    window.location.href = '/login';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#f8fafc' }}>
        <ShieldAlert size={56} style={{ color: '#f43f5e', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
          Your role (<strong style={{ color: '#38bdf8' }}>{user.role}</strong>) does not have permission to view this module.
        </p>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '6px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
