// pages/Farmers.js
import React, { useState, useEffect, useCallback } from 'react';
import { farmersAPI } from '../utils/api';
import { Plus, Pencil, Trash2, Users, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const AREAS = ['Poschim Para', 'Modhho Para', 'Purba Para'];

const EMPTY_FORM = { name: '', mobile: '', area: 'Purba Para' };

const areaClass = (a) => {
  if (a === 'Poschim Para') return 'area-poschim';
  if (a === 'Modhho Para')  return 'area-modhho';
  return 'area-purba';
};

export default function Farmers() {
  const [farmers, setFarmers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [area,    setArea]      = useState('');
  const [modal,   setModal]     = useState(false);
  const [form,    setForm]      = useState(EMPTY_FORM);
  const [editId,  setEditId]    = useState(null);
  const [saving,  setSaving]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await farmersAPI.getAll({ area: area || undefined, search: search || undefined });
      setFarmers(res.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [area, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true); };
  const openEdit   = (f)  => { setForm({ name: f.name, mobile: f.mobile || '', area: f.area }); setEditId(f.id); setModal(true); };
  const closeModal = ()   => { setModal(false); setForm(EMPTY_FORM); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!AREAS.includes(form.area)) return toast.error('Select a valid area');
    setSaving(true);
    try {
      if (editId) {
        await farmersAPI.update(editId, form);
        toast.success('Farmer updated');
      } else {
        await farmersAPI.create(form);
        toast.success('Farmer added');
      }
      closeModal();
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete farmer "${name}"? This cannot be undone.`)) return;
    try {
      await farmersAPI.delete(id);
      toast.success('Farmer deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Farmers — চাষি</h1>
          <p className="page-subtitle">Manage cultivators (payments come from farmer, not owner)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Farmer
        </button>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <input
          className="search-input"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={area} onChange={e => setArea(e.target.value)}>
          <option value="">All Areas</option>
          {AREAS.map(a => <option key={a}>{a}</option>)}
        </select>
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono' }}>
          {farmers.length} farmers
        </span>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            {farmers.length === 0 ? (
              <div className="empty-state">
                <Users size={40} />
                <h3>No farmers found</h3>
                <p>Add farmers to get started.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Area</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers.map((f, i) => (
                    <tr key={f.id}>
                      <td className="mono" style={{ color: 'var(--ink-muted)', width: 40 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{f.name}</td>
                      <td>
                        {f.mobile
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                              <Phone size={13} />{f.mobile}
                            </span>
                          : <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>—</span>
                        }
                      </td>
                      <td><span className={`area-pill ${areaClass(f.area)}`}>{f.area}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(f)} title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(f.id, f.name)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              <h2 className="modal-title">{editId ? 'Edit Farmer' : 'Add Farmer'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Farmer Name *</label>
                <input
                  placeholder="Full name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Area *</label>
                <select value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
                <div className="form-hint">"Others" is treated as Purba Para</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Update' : 'Add Farmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
