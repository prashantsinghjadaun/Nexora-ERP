import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/apiClient';
import type { Customer, Product } from '../../types';
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

interface ChallanItemDraft {
  productId: string;
  quantity: number;
}

export const CreateChallanPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Draft state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<ChallanItemDraft[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      setLoadingInitial(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          apiRequest<Customer[]>('/customers?limit=100'),
          apiRequest<Product[]>('/products?limit=100'),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoadingInitial(false);
      }
    };

    initData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof ChallanItemDraft, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const productMap = new Map<string, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  const totalValuation = items.reduce((sum, item) => {
    const prod = productMap.get(item.productId);
    return sum + (prod ? Number(prod.unitPrice) * item.quantity : 0);
  }, 0);

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a target customer.');
      return;
    }
    if (items.length === 0) {
      setError('Challan must contain at least one product item.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest<{ id: string }>('/challans', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
          notes: notes.trim() || undefined,
        }),
      });

      window.location.href = `/challans/${res.data.id}`;
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to create draft sales challan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: '#38bdf8' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading customers and catalog items...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <a href="/challans" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Challans</span>
        </a>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>Create Draft Sales Challan</h1>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#f43f5e', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitDraft}>
        {/* Customer Selection Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>1. Customer Information</h3>
          <div className="form-group">
            <label className="form-label">Select Customer Account *</label>
            <select
              className="input-field"
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.businessName ? `(${c.businessName})` : ''} — {c.mobile}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>2. Challan Items Breakdown</h3>
            <button type="button" onClick={handleAddItem} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={14} />
              <span>Add Item Line</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
              No item lines added yet. Click <strong>Add Item Line</strong> above to build order items.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {items.map((item, idx) => {
                const prod = productMap.get(item.productId);
                const subtotal = prod ? Number(prod.unitPrice) * item.quantity : 0;

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '1rem', alignItems: 'center', background: '#0b1220', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label className="form-label">Product</label>
                      <select
                        className="input-field"
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — ${Number(p.unitPrice).toFixed(2)} [Stock: {p.currentStock}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Subtotal Valuation</label>
                      <div style={{ padding: '0.65rem', color: '#10b981', fontWeight: 600, fontSize: '0.95rem' }}>
                        ${subtotal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', marginTop: '1.25rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes & Summary Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>3. Summary & Delivery Notes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Delivery Notes / Special Instructions</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Optional delivery or packing notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ background: '#0b1220', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>TOTAL QUANTITY</span>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>{totalQuantity} units</p>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>ESTIMATED TOTAL</span>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>${totalValuation.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <a href="/challans" className="btn btn-secondary">
            Cancel
          </a>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            <span>Save Draft Sales Challan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
