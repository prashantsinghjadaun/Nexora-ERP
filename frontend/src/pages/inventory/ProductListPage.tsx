import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import type { Product, PaginationMeta } from '../../types';
import { Search, Plus, AlertTriangle, ChevronLeft, ChevronRight, X, Loader2, Edit, ArrowLeftRight } from 'lucide-react';

export const ProductListPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [createData, setCreateData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    location: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<Product[]>('/products', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          category: category || undefined,
          lowStock: lowStock ? true : undefined,
        },
      });
      setProducts(res.data);
      if (res.meta) setMeta(res.meta);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, category, lowStock]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.name || !createData.sku || !createData.category || !createData.location) {
      setModalError('Please fill in all required product fields.');
      return;
    }

    setCreateLoading(true);
    setModalError(null);

    try {
      await apiRequest<Product>('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: createData.name.trim(),
          sku: createData.sku.toUpperCase().trim(),
          category: createData.category.trim(),
          unitPrice: Number(createData.unitPrice),
          currentStock: Number(createData.currentStock),
          minStockAlert: Number(createData.minStockAlert),
          location: createData.location.trim(),
        }),
      });

      setShowCreateModal(false);
      setCreateData({ name: '', sku: '', category: '', unitPrice: 0, currentStock: 0, minStockAlert: 10, location: '' });
      fetchProducts();
    } catch (err: unknown) {
      if (err instanceof Error) setModalError(err.message);
      else setModalError('Failed to create product');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    setEditLoading(true);
    try {
      // Notice: currentStock is strictly server-controlled and omitted from PUT
      await apiRequest<Product>(`/products/${editProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editProduct.name.trim(),
          sku: editProduct.sku.toUpperCase().trim(),
          category: editProduct.category.trim(),
          unitPrice: Number(editProduct.unitPrice),
          minStockAlert: Number(editProduct.minStockAlert),
          location: editProduct.location.trim(),
        }),
      });

      setShowEditModal(false);
      fetchProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>Products Catalog & Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track item availability, pricing, locations, and low-stock alerts</p>
        </div>

        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search SKU, name, category..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <input
            type="text"
            className="input-field"
            placeholder="Filter Category"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
              style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
            />
            <span style={{ fontSize: '0.875rem', color: lowStock ? '#f59e0b' : 'var(--text-main)', fontWeight: lowStock ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
              Low Stock Alert Only
            </span>
          </label>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Current Stock</th>
              <th>Alert Level</th>
              <th>Warehouse Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem', color: '#38bdf8' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Loading product catalog...</span>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No product entries found.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLowStock = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id}>
                    <td>
                      <code style={{ color: '#38bdf8', fontWeight: 600 }}>{p.sku}</code>
                    </td>
                    <td>
                      <strong style={{ color: '#f8fafc' }}>{p.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-gray">{p.category}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>${Number(p.unitPrice).toFixed(2)}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: isLowStock ? '#f59e0b' : '#f8fafc' }}>
                          {p.currentStock}
                        </span>
                        {isLowStock && (
                          <span className="badge badge-yellow" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            LOW STOCK
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>&le; {p.minStockAlert}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.location}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canCreate && (
                          <button onClick={() => { setEditProduct(p); setShowEditModal(true); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.775rem' }}>
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                        )}
                        <a href={`/stock-movements?productId=${p.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.775rem', color: '#38bdf8' }}>
                          <ArrowLeftRight size={14} />
                          <span>Logs</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> ({meta.totalCount} total products)
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

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Add New Product</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.75rem', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '6px', color: '#f43f5e', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. STEEL-BEAM-10"
                    value={createData.sku}
                    onChange={(e) => setCreateData({ ...createData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={createData.category}
                    onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    required
                    value={createData.unitPrice}
                    onChange={(e) => setCreateData({ ...createData, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    required
                    value={createData.currentStock}
                    onChange={(e) => setCreateData({ ...createData, currentStock: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Stock Alert Level *</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    required
                    value={createData.minStockAlert}
                    onChange={(e) => setCreateData({ ...createData, minStockAlert: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Warehouse Location *</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Warehouse A - Rack 04"
                  value={createData.location}
                  onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editProduct && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Edit Catalog Metadata</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.6rem 0.8rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
              🔒 <strong>Inventory Protection Rule:</strong> Stock quantity (<code>{editProduct.currentStock}</code>) is server-controlled and cannot be edited directly via metadata. Stock updates require Stock Movements or Challan Confirmations.
            </p>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editProduct.sku}
                    onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={editProduct.unitPrice}
                    onChange={(e) => setEditProduct({ ...editProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Stock Alert Level</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editProduct.minStockAlert}
                    onChange={(e) => setEditProduct({ ...editProduct, minStockAlert: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse Location</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editProduct.location}
                    onChange={(e) => setEditProduct({ ...editProduct, location: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                  <span>Update Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
