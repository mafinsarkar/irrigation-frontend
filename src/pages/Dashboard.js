// pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, ratesAPI } from '../utils/api';
import { Download, AlertTriangle, TrendingUp, Users, IndianRupee, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

const AREAS = ['', 'Poschim Para', 'Modhho Para', 'Purba Para'];

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

export default function Dashboard() {
  const [year, setYear]           = useState(new Date().getFullYear());
  const [area, setArea]           = useState('');
  const [years, setYears]         = useState([]);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('all'); // 'all' | 'defaulters'

  // Load available years
  useEffect(() => {
    ratesAPI.getYears().then(res => {
      setYears(res.data || []);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getSummary({ year, area: area || undefined });
      setData(res.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [year, area]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    try {
      const res = await dashboardAPI.getExport({ year, area: area || undefined });
      const rows = res.data;
      if (!rows.length) return toast.error('No data to export');

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `irrigation_billing_${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const stats    = data?.stats || {};
  const farmers  = data?.farmers || [];
  const filtered = tab === 'defaulters' ? farmers.filter(f => parseFloat(f.balance) > 0) : farmers;

  const areaClass = (a) => {
    if (a === 'Poschim Para') return 'area-poschim';
    if (a === 'Modhho Para')  return 'area-modhho';
    return 'area-purba';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Yearly billing overview — বার্ষিক হিসাব</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="filter-select" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
            {!years.includes(year) && <option value={year}>{year}</option>}
          </select>
          <select className="filter-select" value={area} onChange={e => setArea(e.target.value)}>
            <option value="">All Areas</option>
            {AREAS.slice(1).map(a => <option key={a}>{a}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-label">Total Farmers</div>
          <div className="stat-value">{stats.totalFarmers || 0}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Total Payable</div>
          <div className="stat-value amber" style={{ fontSize: '1.3rem' }}>{fmt(stats.totalPayable)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Collected</div>
          <div className="stat-value green" style={{ fontSize: '1.3rem' }}>{fmt(stats.totalPaid)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Outstanding Due</div>
          <div className="stat-value red" style={{ fontSize: '1.3rem' }}>{fmt(stats.totalBalance)}</div>
        </div>
        <div className="stat-card ink">
          <div className="stat-label">Defaulters</div>
          <div className="stat-value">{stats.defaulterCount || 0}</div>
        </div>
      </div>

      {/* Farmer Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Farmer-wise Billing — {year}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('all')}
            >
              <Users size={14} /> All
            </button>
            <button
              className={`btn btn-sm ${tab === 'defaulters' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setTab('defaulters')}
            >
              <AlertTriangle size={14} /> Defaulters
            </button>
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <TrendingUp size={40} />
                <h3>No data yet</h3>
                <p>Add land usage entries for {year} to see billing summary.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Area</th>
                    <th>Borsha (K)</th>
                    <th>Boro (K)</th>
                    <th>Borsha Cost</th>
                    <th>Boro Cost</th>
                    <th>Prev Due</th>
                    <th>Total Payable</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => {
                    const bal = parseFloat(f.balance || 0);
                    return (
                      <tr key={f.farmer_id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{f.farmer_name}</div>
                          {f.mobile && <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{f.mobile}</div>}
                        </td>
                        <td><span className={`area-pill ${areaClass(f.area)}`}>{f.area}</span></td>
                        <td className="mono">{parseFloat(f.total_borsha_katha || 0).toFixed(1)}</td>
                        <td className="mono">{parseFloat(f.total_boro_katha   || 0).toFixed(1)}</td>
                        <td className="mono amount">{fmt(f.borsha_cost)}</td>
                        <td className="mono amount">{fmt(f.boro_cost)}</td>
                        <td className="mono" style={{ color: f.previous_due > 0 ? 'var(--red-600)' : 'var(--ink-muted)' }}>
                          {fmt(f.previous_due)}
                        </td>
                        <td className="mono amount amount-payable" style={{ fontWeight: 700 }}>{fmt(f.total_payable)}</td>
                        <td className="mono amount amount-paid">{fmt(f.total_paid)}</td>
                        <td className="mono amount" style={{ fontWeight: 700, color: bal > 0 ? 'var(--red-600)' : bal < 0 ? 'var(--green-700)' : 'var(--ink-muted)' }}>
                          {fmt(Math.abs(bal))} {bal < 0 ? '(adv)' : ''}
                        </td>
                        <td>
                          {bal <= 0
                            ? <span className="badge badge-green">✓ Paid</span>
                            : <span className="badge badge-red">⚠ Due</span>
                          }
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
    </div>
  );
}
