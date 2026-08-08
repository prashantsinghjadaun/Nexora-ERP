import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  FileText,
  Boxes,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      label: 'Customers CRM',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS'], // WAREHOUSE excluded by backend RBAC
    },
    {
      label: 'Products Catalog',
      path: '/products',
      icon: Package,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      label: 'Stock Movements',
      path: '/stock-movements',
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'WAREHOUSE', 'ACCOUNTS'], // SALES excluded from direct movements tab
    },
    {
      label: 'Sales Challans',
      path: '/challans',
      icon: FileText,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Boxes size={22} style={{ color: '#090d16' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>Nexora ERP</h1>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', fontWeight: 500 }}>Operations Portal</span>
        </div>
      </div>

      <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
        <p style={{ padding: '0 0.75rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigation
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));

            return (
              <a
                key={item.path}
                href={item.path}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#38bdf8' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#38bdf8' : 'var(--text-subtle)' }} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: '#0b1220' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#38bdf8' }}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName}
            </p>
            <span
              className={`badge ${
                role === 'ADMIN' ? 'badge-red' : role === 'SALES' ? 'badge-blue' : role === 'WAREHOUSE' ? 'badge-yellow' : 'badge-green'
              }`}
              style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
            >
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
