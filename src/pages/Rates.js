// pages/Rates.js
import React, { useState, useEffect } from 'react';
import { ratesAPI } from '../utils/api';
import { Save, Settings, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const SEASONS = ['Borsha', 'Boro'];
const currentYear = new Date().getFullYear();

export default function Rates() {
  const [rates,   setRates]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ year: currentYear, season: 'Borsha', rate_per_bigha: '' });
  const [saving,  setSaving]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ratesAPI.getAll();
      setRates(res.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.year) return toast.error('Year required');
    if (!form.rate_per_bigha || parseFloat(form.rate_per_bigha) <= 0) return toast.error('Enter valid rate');
    setSaving(true);
    try {
      await ratesAPI.set(form);
      toast.success(`Rate saved: ${form.season} ${form.year} = ₹${form.rate_per_bigha}/bigha`);
      load();
      setForm(p => ({ ...p, rate_per_bigha: '' }));
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  // Group by year
  const byYear = rates.reduce((acc, r) => {
    if (!acc[r.year]) acc[r.year] = {};
    acc[r.year][r.season] = r.rate_per_bigha;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rates — সেচ দর</h1>
          <p className="page-subtitle">Set water usage rate per bigha, per season, per year</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, alignItems: 'start' }}>

        {/* Set Rate Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Settings size={16} style={{ display: 'inline', marginRight: 8 }} />Set / Update Rate</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Year *</label>
              <input
                type="number"
                min="2020" max="2040"
                value={form.year}
                onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label>Season *</label>
              <select value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))}>
                {SEASONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Rate per Bigha (₹) *</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 1200"
                value={form.rate_per_bigha}
                onChange={e => setForm(p => ({ ...p, rate_per_bigha: e.target.value }))}
              />
              <div className="form-hint">
                This will be used for all land entries of this season+year
              </div>
            </div>

            {/* Preview */}
            {form.rate_per_bigha > 0 && (
              <div style={{
                background: 'var(--green-50)', border: '1px solid var(--green-200)',
                borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 16,
                fontSize: '0.82rem', fontFamily: 'IBM Plex Mono', color: 'var(--green-800)'
              }}>
                <Info size={13} style={{ display: 'inline', marginRight: 6 }} />
                10 Katha (0.5 bigha) = ₹{(0.5 * parseFloat(form.rate_per_bigha)).toLocaleString('en-IN')}<br />
                20 Katha (1 bigha)   = ₹{(1   * parseFloat(form.rate_per_bigha)).toLocaleString('en-IN')}<br />
                40 Katha (2 bigha)   = ₹{(2   * parseFloat(form.rate_per_bigha)).toLocaleString('en-IN')}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Rate'}
            </button>
          </div>
        </div>

        {/* Rates Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Rates</h2>
          </div>
          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              {Object.keys(byYear).length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <p>No rates set yet.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Borsha (₹/bigha)</th>
                      <th>Boro (₹/bigha)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(byYear).sort(([a],[b]) => b-a).map(([yr, seasons]) => (
                      <tr key={yr}>
                        <td className="mono" style={{ fontWeight: 700 }}>{yr}</td>
                        <td className="mono">
                          {seasons['Borsha']
                            ? <span style={{ color: 'var(--green-700)', fontWeight: 600 }}>₹{parseFloat(seasons['Borsha']).toLocaleString('en-IN')}</span>
                            : <span style={{ color: 'var(--red-600)', fontSize: '0.8rem' }}>Not set</span>
                          }
                        </td>
                        <td className="mono">
                          {seasons['Boro']
                            ? <span style={{ color: 'var(--amber-700)', fontWeight: 600 }}>₹{parseFloat(seasons['Boro']).toLocaleString('en-IN')}</span>
                            : <span style={{ color: 'var(--red-600)', fontSize: '0.8rem' }}>Not set</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="card" style={{ marginTop: 24, background: 'var(--surface-3)', border: '1px solid var(--border-light)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Info size={18} style={{ color: 'var(--green-600)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--ink-soft)' }}>How billing works:</strong><br />
            Cost = (Katha ÷ 20) × Rate per Bigha<br />
            Total Payable = Borsha Cost + Boro Cost + Previous Year Due<br />
            Balance = Total Payable − Total Paid<br /><br />
            <strong style={{ color: 'var(--ink-soft)' }}>Seasons:</strong> Borsha = Rainy season irrigation · Boro = Dry season irrigation
          </div>
        </div>
      </div>
    </div>
  );
}
