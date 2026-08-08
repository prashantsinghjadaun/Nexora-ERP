import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import type { StockMovement, Product } from '../../types';
import { Plus, Loader2, X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const StockMovementPage: React.FC = () => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [movementForm, setMovementForm] = useState({
    productId: '',
    quantity: 1,
    type: 'IN' as const, // Manual endpoints allow IN only as per business rules
    reason: '',
  });

  const canAddStock = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const fetchMovements = async () => {
    setLoading(true);
    try {
      if (selectedProductId) {
        const res = await apiRequest<StockMovement[]>(`/products/${selectedProductId}/stock-movements`);
        setMovements(res.data);
      } else if (products.length > 0) {
        const res = await apiRequest<StockMovement[]>(`/products/${products[0].id}/stock-movements`);
        setMovements(res.data);
      } else {
        setMovements([]);
      }
    } catch {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiRequest<Product[]>('/products?limit=100');
      setProducts(res.data);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Parse URL query parameter if present
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('productId');
    if (prodId) setSelectedProductId(prodId);
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [selectedProductId]);

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.productId || movementForm.quantity <= 0 || !movementForm.reason.trim()) {
      setModalError('Please fill in product, valid positive quantity, and detailed reason.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      await apiRequest<StockMovement>(`/products/${movementForm.productId}/stock-movements`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: Number(movementForm.quantity),
          type: 'IN',
          reason: movementForm.reason.trim(),
        }),
      });

      setShowModal(false);
      setMovementForm({ productId: '', quantity: 1, type: 'IN', reason: '' });
      fetchMovements();
    } catch (err: unknown) {
      if (err instanceof Error) setModalError(err.message);
      else setModalError('Failed to record stock movement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>Stock Movement Audit Log</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Immutable history of all inventory entries (IN) and challan dispatches (OUT)</p>
        </div>

        {canAddStock && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Manual Stock IN Entry</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Filter Product:
          </label>
          <select
            className="input-field"
            style={{ maxWidth: '320px' }}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">All Catalog Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movement Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product SKU / Name</th>
              <th>Movement Type</th>
              <th>Quantity</th>
              <th>Audit Reason</th>
              <th>Logged By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem', color: '#38bdf8' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Loading stock movements...</span>
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No stock movement history records found.
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div><strong style={{ color: '#f8fafc' }}>{m.product?.name || 'Product'}</strong></div>
                    <code style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{m.product?.sku}</code>
                  </td>
                  <td>
                    {m.type === 'IN' ? (
                      <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowDownRight size={12} />
                        STOCK IN
                      </span>
                    ) : (
                      <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowUpRight size={12} />
                        STOCK OUT
                      </span>
                    )}
                  </td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: m.type === 'IN' ? '#10b981' : '#f43f5e' }}>
                      {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </strong>
                  </td>
                  <td style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>{m.reason}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {m.createdBy?.fullName || 'System User'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Stock Entry Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Record Manual Stock IN</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.75rem', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '6px', color: '#f43f5e', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateMovement}>
              <div className="form-group">
                <label className="form-label">Select Target Product *</label>
                <select
                  className="input-field"
                  required
                  value={movementForm.productId}
                  onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity to Add (IN) *</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  required
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value, 10) || 1 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Supplier PO Reference *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  required
                  placeholder="e.g. Restock shipment received from supplier (PO-8821)"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  <span>Submit Movement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
