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

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <>
      {/* ── Top bar ── */}
      <nav className="sticky top-0 z-[100] bg-surface border-b-[1.5px] border-border shadow-sm">
        <div className="max-w-[1100px] mx-auto px-5 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-[10px] no-underline">
            <span className="text-[1.7rem]">🌱</span>
            <span className="font-display text-[1.4rem] text-brand-dark font-medium">
              FoFa
            </span>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden md:flex gap-1 items-center">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'px-4 py-2 rounded-md font-semibold text-[0.92rem] no-underline transition-all duration-150 flex items-center gap-[6px]',
                  isActive(link.to)
                    ? 'text-brand bg-brand-light'
                    : 'text-muted bg-transparent',
                ].join(' ')}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Profile */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-[10px] bg-transparent border-none cursor-pointer px-[10px] py-[6px] rounded-md"
              >
                <Avatar src={user.thumbnail} name={user.name} size={36} />
                {/* Name + location hidden on mobile */}
                <div className="hidden md:block text-left">
                  <div className="font-bold text-[0.9rem] leading-[1.2]">{user.name}</div>
                  <div className="text-[0.75rem] text-muted">{user.city}, {user.state}</div>
                </div>
                <span className="hidden md:inline text-muted text-[0.8rem]">▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-surface border-[1.5px] border-border rounded-md shadow-md min-w-[180px] overflow-hidden z-[200]">
                  {[
                    { label: '⚙️  Profile', action: () => { navigate('/profile'); setMenuOpen(false); } },
                    { label: '👨‍👩‍👧‍👦  My Family', action: () => { navigate('/family'); setMenuOpen(false); } },
                    { label: '🚪  Sign out', action: handleLogout, danger: true },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={[
                        'w-full px-4 py-3 text-left bg-transparent border-none cursor-pointer text-[0.9rem] font-body font-semibold',
                        item.danger ? 'text-red-600' : 'text-gray-800',
                      ].join(' ')}
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

      {/* ── Mobile bottom tab bar — hidden on desktop ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t-[1.5px] border-border shadow-[0_-2px_12px_rgba(0,0,0,.08)] flex">
        {NAV_LINKS.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-[3px] py-[10px] pb-3 no-underline transition-all duration-150',
              isActive(link.to) ? 'text-brand bg-brand-light' : 'text-muted bg-transparent',
            ].join(' ')}
          >
            <span className="text-[1.35rem] leading-none">{link.icon}</span>
            <span className="text-[0.68rem] font-bold tracking-[0.01em]">{link.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};
