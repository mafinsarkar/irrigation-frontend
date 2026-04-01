// pages/LandUsage.js
import React, { useState, useEffect, useCallback } from 'react';
import { landAPI, farmersAPI, ratesAPI } from '../utils/api';
import { Plus, Pencil, Trash2, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

const SEASONS = ['Borsha', 'Boro'];
const EMPTY_FORM = {
  farmer_id: '', owner_name: '', season: 'Borsha',
  year: new Date().getFullYear(), katha: '', notes: ''
};

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

export default function LandUsage() {
  const [records,  setRecords]  = useState([]);
  const [farmers,  setFarmers]  = useState([]);
  const [rates,    setRates]    = useState({});
  const [years,    setYears]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filterY,  setFilterY]  = useState('');
  const [filterF,  setFilterF]  = useState('');
  const [filterS,  setFilterS]  = useState('');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  // Derived: katha → bigha for form preview
  const bighaPreview = form.katha ? (parseFloat(form.katha) / 20).toFixed(3) : null;
  const costPreview  = bighaPreview && rates[`${form.year}_${form.season}`]
    ? (parseFloat(bighaPreview) * rates[`${form.year}_${form.season}`]).toFixed(0)
    : null;

  useEffect(() => {
    farmersAPI.getAll().then(r => setFarmers(r.data)).catch(() => {});
    ratesAPI.getYears().then(r => setYears(r.data || [])).catch(() => {});
    ratesAPI.getAll().then(r => {
      const map = {};
      r.data.forEach(rt => { map[`${rt.year}_${rt.season}`] = parseFloat(rt.rate_per_bigha); });
      setRates(map);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterY) params.year = filterY;
      if (filterF) params.farmer_id = filterF;
      if (filterS) params.season = filterS;
      const res = await landAPI.getAll(params);
      setRecords(res.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [filterY, filterF, filterS]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true); };
  const openEdit   = (r)  => {
    setForm({
      farmer_id: r.farmer_id, owner_name: r.owner_name,
      season: r.season, year: r.year, katha: r.katha, notes: r.notes || ''
    });
    setEditId(r.id);
    setModal(true);
  };
  const closeModal = () => { setModal(false); setForm(EMPTY_FORM); setEditId(null); };

  const handleSave = async () => {
    if (!form.farmer_id)    return toast.error('Select a farmer');
    if (!form.owner_name.trim()) return toast.error('Owner name required');
    if (!form.katha || parseFloat(form.katha) < 0.5) return toast.error('Katha must be ≥ 0.5');
    setSaving(true);
    try {
      if (editId) {
        await landAPI.update(editId, form);
        toast.success('Record updated');
      } else {
        await landAPI.create(form);
        toast.success('Land usage added');
      }
      closeModal();
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this land usage entry?')) return;
    try {
      await landAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Land Usage — জমির হিসাব</h1>
          <p className="page-subtitle">Record which farmer cultivated how much land (1 Bigha = 20 Katha)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Entry
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
        <select className="filter-select" value={filterS} onChange={e => setFilterS(e.target.value)}>
          <option value="">Both Seasons</option>
          {SEASONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono' }}>
          {records.length} entries
        </span>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            {records.length === 0 ? (
              <div className="empty-state">
                <Leaf size={40} />
                <h3>No land usage records</h3>
                <p>Add entries to start tracking usage and billing.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Area</th>
                    <th>Owner</th>
                    <th>Season</th>
                    <th>Year</th>
                    <th>Katha</th>
                    <th>Bigha</th>
                    <th>Rate/Bigha</th>
                    <th>Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const rate = rates[`${r.year}_${r.season}`] || 0;
                    const cost = parseFloat(r.bigha) * rate;
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.farmer_name}</td>
                        <td>
                          <span className={`area-pill ${r.farmer_area === 'Poschim Para' ? 'area-poschim' : r.farmer_area === 'Modhho Para' ? 'area-modhho' : 'area-purba'}`}>
                            {r.farmer_area}
                          </span>
                        </td>
                        <td>{r.owner_name}</td>
                        <td>
                          <span className={`badge ${r.season === 'Borsha' ? 'badge-green' : 'badge-amber'}`}>
                            {r.season}
                          </span>
                        </td>
                        <td className="mono">{r.year}</td>
                        <td className="mono">{parseFloat(r.katha).toFixed(1)}</td>
                        <td className="mono">{parseFloat(r.bigha).toFixed(3)}</td>
                        <td className="mono">{rate ? fmt(rate) : <span style={{ color: 'var(--red-600)', fontSize: '0.8rem' }}>No rate set</span>}</td>
                        <td className="mono amount" style={{ fontWeight: 600 }}>{rate ? fmt(cost) : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(r)}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(r.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Edit Land Entry' : 'Add Land Usage'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Farmer (Cultivator) *</label>
                <select
                  value={form.farmer_id}
                  onChange={e => setForm(p => ({ ...p, farmer_id: e.target.value }))}
                >
                  <option value="">— Select Farmer —</option>
                  {farmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.area})</option>)}
                </select>
                <div className="form-hint">Select the cultivator (who pays the bill)</div>
              </div>
              <div className="form-group">
                <label>Land Owner Name *</label>
                <input
                  placeholder="Owner's name"
                  value={form.owner_name}
                  onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))}
                />
                <div className="form-hint">Whose land is being cultivated</div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Season *</label>
                  <select value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))}>
                    {SEASONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                    {[...new Set([...years, new Date().getFullYear()])].sort((a,b) => b-a).map(y =>
                      <option key={y} value={y}>{y}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>
                  Katha *
                  {bighaPreview && (
                    <span className="calc-chip">= {bighaPreview} bigha</span>
                  )}
                  {costPreview && (
                    <span className="calc-chip" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
                      ≈ ₹{parseInt(costPreview).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g. 10 or 10.5"
                  value={form.katha}
                  onChange={e => setForm(p => ({ ...p, katha: e.target.value }))}
                />
                <div className="form-hint">1 Bigha = 20 Katha. Fractions like 10.5 allowed.</div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Update' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
