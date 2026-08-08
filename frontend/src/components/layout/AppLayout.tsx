import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, User as UserIcon, Shield } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  title: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, currentPath, title }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar currentPath={currentPath} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-secondary"
              title="Toggle Navigation Sidebar"
              style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={20} />
            </button>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>{title}</h2>
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0b1220', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <Shield size={14} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role:</span>
                <strong style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{user.role}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserIcon size={16} style={{ color: 'var(--text-subtle)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>{user.email}</span>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </header>

        <main className="page-container">{children}</main>
      </div>
    </div>
  );
};
