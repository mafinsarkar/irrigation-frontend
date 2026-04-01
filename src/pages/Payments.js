// pages/Payments.js
import React, { useState, useEffect, useCallback } from 'react';
import { paymentsAPI, farmersAPI, dashboardAPI, ratesAPI } from '../utils/api';
import { Plus, Trash2, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  farmer_id: '', year: new Date().getFullYear(),
  amount: '', payment_date: today(), notes: '', recorded_by: ''
};

export default function Payments() {
  const [payments,  setPayments]  = useState([]);
  const [farmers,   setFarmers]   = useState([]);
  const [years,     setYears]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filterY,   setFilterY]   = useState('');
  const [filterF,   setFilterF]   = useState('');
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [billing,   setBilling]   = useState(null); // live billing info for selected farmer+year
  const [expanded,  setExpanded]  = useState(null);

  useEffect(() => {
    farmersAPI.getAll().then(r => setFarmers(r.data)).catch(() => {});
    ratesAPI.getYears().then(r => setYears(r.data || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterY) params.year = filterY;
      if (filterF) params.farmer_id = filterF;
      const res = await paymentsAPI.getAll(params);
      setPayments(res.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [filterY, filterF]);

  useEffect(() => { load(); }, [load]);

  // Fetch live billing when farmer+year selected in modal
  useEffect(() => {
    if (form.farmer_id && form.year) {
      dashboardAPI.getSummary({ year: form.year })
        .then(res => {
          const f = res.data?.farmers?.find(f => String(f.farmer_id) === String(form.farmer_id));
          setBilling(f || null);
        })
        .catch(() => setBilling(null));
    } else {
      setBilling(null);
    }
  }, [form.farmer_id, form.year]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal(true); };
  const closeModal = () => { setModal(false); setForm(EMPTY_FORM); setBilling(null); };

  const handleSave = async () => {
    if (!form.farmer_id)  return toast.error('Select a farmer');
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter valid amount');
    if (!form.payment_date) return toast.error('Enter payment date');
    setSaving(true);
    try {
      await paymentsAPI.create(form);
      toast.success('Payment recorded');
      closeModal();
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await paymentsAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  // Group payments by farmer for display
  const grouped = payments.reduce((acc, p) => {
    const key = `${p.farmer_id}_${p.year}`;
    if (!acc[key]) acc[key] = { farmer_name: p.farmer_name, area: p.farmer_area, year: p.year, payments: [], total: 0 };
    acc[key].payments.push(p);
    acc[key].total += parseFloat(p.amount);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments — পেমেন্ট</h1>
          <p className="page-subtitle">Record and track farmer payments</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <select className="filter-select" value={filterY} onChange={e => setFilterY(e.target.value)}>
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="filter-select" value={filterF} onChange={e => setFilterF(e.target.value)}>
          <option value="">All Farmers</option>
          {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono' }}>
          {payments.length} payments
        </span>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : payments.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={40} />
            <h3>No payments recorded</h3>
            <p>Record a payment to start tracking.</p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key} style={{ borderBottom: '1px solid var(--border-light)' }}>
                {/* Group header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer', background: expanded === key ? 'var(--surface-3)' : 'transparent'
                  }}
                  onClick={() => setExpanded(expanded === key ? null : key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700 }}>{group.farmer_name}</span>
                    <span className={`area-pill ${group.area === 'Poschim Para' ? 'area-poschim' : group.area === 'Modhho Para' ? 'area-modhho' : 'area-purba'}`}>
                      {group.area}
                    </span>
                    <span className="badge badge-gray">{group.year}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                      {group.payments.length} payment{group.payments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="mono amount amount-paid" style={{ fontWeight: 700 }}>{fmt(group.total)}</span>
                    {expanded === key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                {/* Payment rows */}
                {expanded === key && (
                  <table style={{ margin: '0 0 8px 0' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 40 }}>Date</th>
                        <th>Amount</th>
                        <th>Notes</th>
                        <th>Recorded By</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.payments.map(p => (
                        <tr key={p.id}>
                          <td style={{ paddingLeft: 40 }} className="mono">{p.payment_date?.split('T')[0] || p.payment_date}</td>
                          <td className="mono amount amount-paid" style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                          <td style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>{p.notes || '—'}</td>
                          <td style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>{p.recorded_by || '—'}</td>
                          <td>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Record Payment</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              {/* Live billing summary */}
              {billing && (
                <div className="info-box" style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: '#000' }}>
                    Current Billing — {form.year}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <span style={{ color: 'var(--win-text-gray)' }}>Total Payable:</span>
                    <span style={{ fontWeight: 700 }}>{fmt(billing.total_payable)}</span>
                    <span style={{ color: 'var(--win-text-gray)' }}>Already Paid:</span>
                    <span style={{ color: 'var(--win-green)', fontWeight: 700 }}>{fmt(billing.total_paid)}</span>
                    <span style={{ color: 'var(--win-text-gray)' }}>Balance Due:</span>
                    <span style={{ color: parseFloat(billing.balance) > 0 ? 'var(--win-red)' : 'var(--win-green)', fontWeight: 700 }}>
                      {fmt(billing.balance)}
                    </span>
                  </div>
                </div>
              )}
              <div className="form-grid">
                <div className="form-group">
                  <label>Farmer *</label>
                  <select value={form.farmer_id} onChange={e => setForm(p => ({ ...p, farmer_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                    {[...new Set([...years, new Date().getFullYear()])].sort((a,b) => b-a)
                      .map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input
                    type="number" min="1" step="1"
                    placeholder="e.g. 1200"
                    value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  placeholder="e.g. Cash, partial payment"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Recorded By</label>
                <input
                  placeholder="Your name"
                  value={form.recorded_by}
                  onChange={e => setForm(p => ({ ...p, recorded_by: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
