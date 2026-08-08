import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import type { SalesChallan, ApiErrorDetail } from '../../types';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2, User, Calendar, X } from 'lucide-react';

export const ChallanDetailPage: React.FC<{ challanId: string }> = ({ challanId }) => {
  const { user } = useAuth();
  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions loading
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Deficit Error Modal
  const [showDeficitModal, setShowDeficitModal] = useState(false);
  const [deficitDetails, setDeficitDetails] = useState<ApiErrorDetail[]>([]);

  const canModify = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchChallan = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<SalesChallan>(`/challans/${challanId}`);
      setChallan(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to fetch sales challan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (challanId) fetchChallan();
  }, [challanId]);

  const handleConfirm = async () => {
    if (!challan) return;
    if (!window.confirm(`Are you sure you want to CONFIRM Challan #${challan.challanNumber}? This will deduct inventory and log internal OUT stock movements.`)) return;

    setConfirming(true);
    try {
      const res = await apiRequest<SalesChallan>(`/challans/${challanId}/confirm`, {
        method: 'POST',
      });
      setChallan(res.data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'INSUFFICIENT_STOCK') {
        const details = (err as { details?: ApiErrorDetail[] }).details || [];
        setDeficitDetails(details);
        setShowDeficitModal(true);
      } else {
        alert(err instanceof Error ? err.message : 'Confirmation failed');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (!window.confirm(`Are you sure you want to CANCEL Challan #${challan.challanNumber}?`)) return;

    setCancelling(true);
    try {
      const res = await apiRequest<SalesChallan>(`/challans/${challanId}/cancel`, {
        method: 'POST',
      });
      setChallan(res.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: '#38bdf8' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading sales challan detail...</p>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#f43f5e' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{error || 'Sales challan not found'}</p>
        <a href="/challans" className="btn btn-secondary">Back to Challans List</a>
      </div>
    );
  }

  const isDraft = challan.status === 'DRAFT';
  const isConfirmed = challan.status === 'CONFIRMED';

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/challans" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
            <ArrowLeft size={16} />
            <span>Back to Challans</span>
          </a>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Sales Challan #{challan.challanNumber}</span>
              <span className={`badge ${isConfirmed ? 'badge-green' : isDraft ? 'badge-yellow' : 'badge-red'}`}>
                {challan.status}
              </span>
            </h1>
          </div>
        </div>

        {canModify && isDraft && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleCancel} className="btn btn-danger" disabled={cancelling}>
              {cancelling ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
              <span>Cancel Draft</span>
            </button>
            <button onClick={handleConfirm} className="btn btn-primary" disabled={confirming}>
              {confirming ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              <span>Confirm & Deduct Stock</span>
            </button>
          </div>
        )}
      </div>

      {/* Customer & Document Information */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <User size={16} style={{ color: '#38bdf8' }} />
            <span>Customer Details</span>
          </h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{challan.customer?.name}</p>
          <p style={{ color: '#38bdf8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{challan.customer?.businessName || 'Individual'}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>Contact Email: {challan.customer?.email || 'N/A'}</p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Calendar size={16} style={{ color: '#6366f1' }} />
            <span>Document Metadata</span>
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Created On: <strong style={{ color: '#f8fafc' }}>{new Date(challan.createdAt).toLocaleString()}</strong>
          </p>
          {challan.confirmedAt && (
            <p style={{ fontSize: '0.875rem', color: '#10b981', marginBottom: '0.35rem' }}>
              Confirmed On: <strong>{new Date(challan.confirmedAt).toLocaleString()}</strong>
            </p>
          )}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Created By: <strong style={{ color: '#f8fafc' }}>{challan.createdBy?.fullName}</strong> ({challan.createdBy?.role})
          </p>
        </div>
      </div>

      {/* Snapshot Items Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>Snapshot Order Line Items</h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item #</th>
                <th>Snapshot SKU</th>
                <th>Snapshot Product Name</th>
                <th>Unit Price (Locked)</th>
                <th>Ordered Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td><code style={{ color: '#38bdf8' }}>{item.skuSnapshot}</code></td>
                  <td><strong style={{ color: '#f8fafc' }}>{item.productNameSnapshot}</strong></td>
                  <td>${Number(item.unitPriceSnapshot).toFixed(2)}</td>
                  <td><strong>{item.quantity} units</strong></td>
                  <td><strong style={{ color: '#10b981' }}>${Number(item.subtotal).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Banner */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>TOTAL UNITS</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{challan.totalQuantity} units</p>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>TOTAL VALUATION</span>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>${Number(challan.totalAmount).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {challan.notes && (
        <div className="card">
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Delivery / Special Notes</h4>
          <p style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{challan.notes}</p>
        </div>
      )}

      {/* Stock Deficit Warning Modal */}
      {showDeficitModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ borderColor: 'rgba(244,63,94,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Insufficient Stock Deficit</h3>
              </div>
              <button onClick={() => setShowDeficitModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Cannot confirm Challan <strong>#{challan.challanNumber}</strong>. The transaction was completely rolled back because current inventory is insufficient for the following line items:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {deficitDetails.map((def, i) => (
                <div key={i} style={{ background: '#0b1220', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.3)' }}>
                  <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {String(def.productName || 'Product')}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    Requested: <strong style={{ color: '#f43f5e' }}>{String(def.requestedQuantity || '')}</strong> | Available in Stock: <strong style={{ color: '#f59e0b' }}>{String(def.availableQuantity || '')}</strong>
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeficitModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
