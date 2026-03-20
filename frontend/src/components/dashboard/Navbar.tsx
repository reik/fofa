import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../contexts/authStore';
import { Avatar } from '../ui/Avatar';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Feed', icon: '🏠' },
  { to: '/family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/community', label: 'Community', icon: '🌿' },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--c-surface)', borderBottom: '1.5px solid var(--c-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontSize: '1.7rem' }}>🌱</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--c-brand-dark)', fontWeight: 500 }}>
            FoFa
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                fontWeight: 600, fontSize: '0.92rem',
                color: location.pathname.startsWith(link.to) ? 'var(--c-brand)' : 'var(--c-text-muted)',
                background: location.pathname.startsWith(link.to) ? 'var(--c-brand-light)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Profile */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 10px', borderRadius: 'var(--radius-md)',
              }}
            >
              <Avatar src={user.thumbnail} name={user.name} size={36} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{user.city}, {user.state}</div>
              </div>
              <span style={{ color: 'var(--c-text-muted)', fontSize: '0.8rem' }}>▾</span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--c-surface)', border: '1.5px solid var(--c-border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                minWidth: 180, overflow: 'hidden', zIndex: 200,
              }}>
                {[
                  { label: '⚙️  Profile', action: () => { navigate('/profile'); setMenuOpen(false); } },
                  { label: '👨‍👩‍👧‍👦  My Family', action: () => { navigate('/family'); setMenuOpen(false); } },
                  { label: '🚪  Sign out', action: handleLogout, danger: true },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      width: '100%', padding: '12px 16px', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                      color: item.danger ? 'var(--c-danger)' : 'var(--c-text)',
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
