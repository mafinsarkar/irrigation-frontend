// App.js - Root component with navigation and routing
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, Leaf, CreditCard, Settings,
  Menu, X, AlertTriangle, Droplets
} from 'lucide-react';
import './styles/index.css';

// Pages
import Dashboard   from './pages/Dashboard';
import Farmers     from './pages/Farmers';
import LandUsage   from './pages/LandUsage';
import Payments    from './pages/Payments';
import Rates       from './pages/Rates';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      onClick={() => setSidebarOpen(false)}
    >
      <Icon size={18} /> {label}
    </NavLink>
  );

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Tahoma, Arial, sans-serif',
            fontSize: '0.82rem',
            background: '#d4d0c8',
            color: '#000',
            border: '2px solid',
            borderTopColor: '#ffffff',
            borderLeftColor: '#ffffff',
            borderRightColor: '#404040',
            borderBottomColor: '#404040',
            borderRadius: '0',
            padding: '6px 12px',
            boxShadow: '4px 4px 6px rgba(0,0,0,0.4)',
          },
          success: { iconTheme: { primary: '#008000', secondary: '#fff' } },
        }}
      />

      <div className="app-shell">
        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Droplets size={22} color="#85c99a" />
              <div>
                <h1>সেচ বিলিং সিস্টেম</h1>
                <div className="subtitle">Irrigation Billing</div>
              </div>
            </div>
          </div>

          <div className="nav-section">Main Menu</div>
          <NavItem to="/"          icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/farmers"   icon={Users}           label="Farmers (চাষি)" />
          <NavItem to="/land"      icon={Leaf}            label="Land Usage" />
          <NavItem to="/payments"  icon={CreditCard}      label="Payments" />

          <div className="nav-section" style={{ marginTop: 12 }}>Settings</div>
          <NavItem to="/rates"     icon={Settings}        label="Rates / দর" />

          <div className="sidebar-footer">
            Deep Tube Well System<br />
            v1.0.0
          </div>
        </nav>

        {/* Main content */}
        <main className="main-content">
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/farmers"  element={<Farmers />} />
            <Route path="/land"     element={<LandUsage />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/rates"    element={<Rates />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
