import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import type { Customer, Product, SalesChallan } from '../../types';
import { Users, Package, AlertTriangle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [challanCount, setChallanCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        if (user?.role !== 'WAREHOUSE') {
          const custRes = await apiRequest<Customer[]>('/customers?limit=1').catch(() => null);
          if (custRes?.meta) setCustomerCount(custRes.meta.totalCount);
        }

        const prodRes = await apiRequest<Product[]>('/products?limit=1').catch(() => null);
        if (prodRes?.meta) setProductCount(prodRes.meta.totalCount);

        const lowStockRes = await apiRequest<Product[]>('/products?lowStock=true&limit=1').catch(() => null);
        if (lowStockRes?.meta) setLowStockCount(lowStockRes.meta.totalCount);

        const challanRes = await apiRequest<SalesChallan[]>('/challans?limit=1').catch(() => null);
        if (challanRes?.meta) setChallanCount(challanRes.meta.totalCount);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user?.role]);

  if (!user) return null;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #131b2e 0%, #1c2742 100%)', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={20} style={{ color: '#38bdf8' }} />
              <span className="badge badge-blue">{user.role} SESSION</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
              Welcome back, {user.fullName}!
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem' }}>
              Nexora ERP Operations Portal — Logged in as <strong style={{ color: '#f8fafc' }}>{user.email}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {user.role !== 'WAREHOUSE' && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL CUSTOMERS</span>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#38bdf8' }}>
                <Users size={20} />
              </div>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
              {loading ? '...' : customerCount ?? 0}
            </p>
            <a href="/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#38bdf8', marginTop: '0.5rem', fontWeight: 500 }}>
              <span>View Customers</span>
              <ArrowRight size={14} />
            </a>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CATALOG PRODUCTS</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#6366f1' }}>
              <Package size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
            {loading ? '...' : productCount ?? 0}
          </p>
          <a href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#6366f1', marginTop: '0.5rem', fontWeight: 500 }}>
            <span>Browse Catalog</span>
            <ArrowRight size={14} />
          </a>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>LOW STOCK ALERTS</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#f59e0b' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
            {loading ? '...' : lowStockCount ?? 0}
          </p>
          <a href="/products?lowStock=true" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem', fontWeight: 500 }}>
            <span>Filter Low Stock</span>
            <ArrowRight size={14} />
          </a>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>SALES CHALLANS</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#10b981' }}>
              <FileText size={20} />
            </div>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
            {loading ? '...' : challanCount ?? 0}
          </p>
          <a href="/challans" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 500 }}>
            <span>View Challans</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </div>

      {/* Role Matrix Overview */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>Active Role Matrix ({user.role})</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Your account is configured with role-based access. Below are the operational actions available to you:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#0b1220', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', marginBottom: '0.5rem' }}>Customer CRM</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {user.role === 'WAREHOUSE'
                ? '⛔ Restricted — WAREHOUSE role has no customer access.'
                : user.role === 'ACCOUNTS'
                ? '👁️ Read Only — View customer catalog and follow-up timelines.'
                : '✅ Full Access — Create, edit, and log follow-up notes.'}
            </p>
          </div>

          <div style={{ background: '#0b1220', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#6366f1', marginBottom: '0.5rem' }}>Products & Inventory</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {user.role === 'SALES' || user.role === 'ACCOUNTS'
                ? '👁️ Read Only Catalog — View stock levels and low-stock alerts.'
                : '✅ Catalog & Stock Entry — Manage products and execute manual IN stock movements.'}
            </p>
          </div>

          <div style={{ background: '#0b1220', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#10b981', marginBottom: '0.5rem' }}>Sales Challans</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {user.role === 'WAREHOUSE' || user.role === 'ACCOUNTS'
                ? '👁️ Read Only Challans — Inspect documents and confirmed status.'
                : '⚡ Workflow Control — Create draft challans, execute atomic stock confirmation, and cancel drafts.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
