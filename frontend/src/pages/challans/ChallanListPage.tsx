import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import type { SalesChallan, PaginationMeta } from '../../types';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, Eye } from 'lucide-react';

export const ChallanListPage: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<SalesChallan[]>('/challans', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      setChallans(res.data);
      if (res.meta) setMeta(res.meta);
    } catch {
      setChallans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [page, search, statusFilter]);

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>Sales Challans Workflow</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create draft orders, manage customer dispatches, and confirm atomic inventory deductions</p>
        </div>

        {canCreate && (
          <a href="/challans/new" className="btn btn-primary">
            <Plus size={18} />
            <span>Create Draft Challan</span>
          </a>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search Challan Number..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses (Draft, Confirmed, Cancelled)</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Challan Number</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total Items Qty</th>
              <th>Total Valuation</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem', color: '#38bdf8' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Loading sales challans...</span>
                </td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No sales challan records found.
                </td>
              </tr>
            ) : (
              challans.map((c) => (
                <tr key={c.id}>
                  <td>
                    <code style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.95rem' }}>{c.challanNumber}</code>
                  </td>
                  <td>
                    <strong style={{ color: '#f8fafc' }}>{c.customer?.name || 'Customer'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{c.customer?.businessName}</div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        c.status === 'CONFIRMED' ? 'badge-green' : c.status === 'DRAFT' ? 'badge-yellow' : 'badge-red'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{c.totalQuantity} units</span>
                  </td>
                  <td>
                    <strong style={{ color: '#10b981' }}>${Number(c.totalAmount).toFixed(2)}</strong>
                  </td>
                  <td style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <a href={`/challans/${c.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}>
                      <Eye size={14} />
                      <span>Inspect</span>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> ({meta.totalCount} total challans)
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>
          <button className="btn btn-secondary" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
