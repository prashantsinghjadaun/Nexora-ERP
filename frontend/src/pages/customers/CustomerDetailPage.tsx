import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import type { Customer, FollowUp } from '../../types';
import { ArrowLeft, Calendar, MessageSquare, Edit, Plus, Loader2, X } from 'lucide-react';

interface CustomerDetailResponse extends Customer {
  followUps?: FollowUp[];
}

export const CustomerDetailPage: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const canModify = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<CustomerDetailResponse>(`/customers/${customerId}`);
      setCustomer(res.data);
      setEditData(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to fetch customer detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomerDetail();
  }, [customerId]);

  const handleLogFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNotes.trim()) return;

    setSubmittingFollowUp(true);
    try {
      await apiRequest(`/customers/${customerId}/follow-ups`, {
        method: 'POST',
        body: JSON.stringify({
          notes: followUpNotes.trim(),
          followUpDate: new Date().toISOString(),
          nextFollowUpDate: nextDate ? new Date(nextDate).toISOString() : undefined,
        }),
      });

      setShowFollowUpModal(false);
      setFollowUpNotes('');
      setNextDate('');
      fetchCustomerDetail();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to log follow-up');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await apiRequest(`/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editData.name,
          mobile: editData.mobile,
          email: editData.email || undefined,
          businessName: editData.businessName || undefined,
          gstNumber: editData.gstNumber || undefined,
          type: editData.type,
          status: editData.status,
          address: editData.address || undefined,
          notes: editData.notes || undefined,
        }),
      });

      setShowEditModal(false);
      fetchCustomerDetail();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: '#38bdf8' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading customer details...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#f43f5e' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{error || 'Customer not found'}</p>
        <a href="/customers" className="btn btn-secondary">Back to Customers</a>
      </div>
    );
  }

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <a href="/customers" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </a>

        {canModify && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowEditModal(true)} className="btn btn-secondary">
              <Edit size={16} />
              <span>Edit Account</span>
            </button>
            <button onClick={() => setShowFollowUpModal(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Log Follow-Up</span>
            </button>
          </div>
        )}
      </div>

      {/* Customer Information Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-gray" style={{ marginBottom: '0.5rem' }}>{customer.type}</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>{customer.name}</h2>
              <p style={{ color: '#38bdf8', fontWeight: 500, fontSize: '0.95rem' }}>{customer.businessName || 'Individual Account'}</p>
            </div>
            <span className={`badge ${customer.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{customer.status}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <div><strong style={{ color: 'var(--text-subtle)' }}>Mobile:</strong> <span style={{ color: '#f8fafc' }}>{customer.mobile}</span></div>
            <div><strong style={{ color: 'var(--text-subtle)' }}>Email:</strong> <span style={{ color: '#f8fafc' }}>{customer.email || 'N/A'}</span></div>
            <div><strong style={{ color: 'var(--text-subtle)' }}>GST Number:</strong> <span style={{ color: '#f8fafc' }}>{customer.gstNumber || 'N/A'}</span></div>
            <div><strong style={{ color: 'var(--text-subtle)' }}>Address:</strong> <span style={{ color: '#f8fafc' }}>{customer.address || 'N/A'}</span></div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: '#38bdf8' }} />
            <span>Follow-Up Schedule</span>
          </h3>

          <div style={{ background: '#0b1220', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
              NEXT FOLLOW-UP DATE
            </p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: customer.nextFollowUpDate ? '#38bdf8' : 'var(--text-muted)' }}>
              {customer.nextFollowUpDate ? new Date(customer.nextFollowUpDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No Follow-up Scheduled'}
            </p>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <strong>Notes:</strong> {customer.notes || 'No general account notes recorded.'}
          </p>
        </div>
      </div>

      {/* Follow-up Timeline */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} style={{ color: '#10b981' }} />
          <span>Follow-Up History Timeline</span>
        </h3>

        {!customer.followUps || customer.followUps.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No historical follow-up entries logged yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {customer.followUps.map((f) => (
              <div key={f.id} style={{ background: '#0b1220', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    Logged by <strong>{f.createdBy?.fullName || 'User'}</strong> on {new Date(f.createdAt).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                    Scheduled: {new Date(f.followUpDate).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{f.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Follow-Up Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Log Customer Follow-Up</h3>
              <button onClick={() => setShowFollowUpModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogFollowUp}>
              <div className="form-group">
                <label className="form-label">Follow-Up Notes *</label>
                <textarea
                  className="input-field"
                  rows={4}
                  required
                  placeholder="Record customer discussion, requirements, or status updates..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Next Follow-Up Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowFollowUpModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingFollowUp}>
                  {submittingFollowUp ? <Loader2 className="animate-spin" size={16} /> : null}
                  <span>Save Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Edit Customer Account</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={editData.mobile || ''}
                    onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editData.businessName || ''}
                    onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select
                    className="input-field"
                    value={editData.type || 'RETAIL'}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="input-field"
                    value={editData.status || 'ACTIVE'}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                  >
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingEdit}>
                  {submittingEdit ? <Loader2 className="animate-spin" size={16} /> : null}
                  <span>Update Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
