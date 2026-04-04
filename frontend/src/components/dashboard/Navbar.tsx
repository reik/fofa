import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../contexts/authStore";
import { messageService } from "../../services";
import { Avatar } from "../ui/Avatar";
import { Logo } from "../ui/Logo";

const NAV_LINKS = [
  { to: "/dashboard", label: "Feed", icon: "🏠" },
  { to: "/family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { to: "/playdates", label: "Playdates", icon: "🗓️" },
  { to: "/messages", label: "Messages", icon: "💬" },
  { to: "/community", label: "Community", icon: "🌿" },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: messageService.getUnreadCount,
    refetchInterval: 30_000,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count ?? 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to: string) => location.pathname.startsWith(to);

  // Close dropdown on Escape
  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const MENU_ITEMS = [
    { label: "Profile", icon: "⚙️", action: () => { navigate("/profile"); setMenuOpen(false); } },
    { label: "My Family", icon: "👨‍👩‍👧‍👦", action: () => { navigate("/family"); setMenuOpen(false); } },
    { label: "Sign out", icon: "🚪", action: handleLogout, danger: true },
  ];

  return (
    <>
      {/* ── Top bar ── */}
      <nav aria-label="Main navigation" className="sticky top-0 z-[100] bg-surface border-b-[3px] border-brand shadow-md">
        <div className="max-w-[1100px] mx-auto px-5 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" aria-label="FoFa home" className="flex items-center no-underline">
            <Logo size={38} />
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden md:flex gap-1 items-center" role="list">
            {NAV_LINKS.map((link) => {
              const isMessages = link.to === "/messages";
              const showBadge = isMessages && unreadCount > 0;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  role="listitem"
                  aria-current={isActive(link.to) ? 'page' : undefined}
                  className={[
                    "px-4 py-2 rounded-md font-semibold text-[0.92rem] no-underline transition-all duration-150 flex items-center gap-[6px] relative",
                    isActive(link.to)
                      ? "text-brand-dark bg-brand-light"
                      : "text-muted bg-transparent",
                  ].join(" ")}
                >
                  <span aria-hidden="true">{link.icon}</span>
                  <span>{link.label}</span>
                  {showBadge && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[0.68rem] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Profile */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open profile menu"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-[10px] bg-transparent border-none cursor-pointer px-[10px] py-[6px] rounded-md"
              >
                <Avatar src={user.thumbnail} name={user.name} size={36} />
                {/* Name + location hidden on mobile */}
                <div className="hidden md:block text-left">
                  <div className="font-bold text-[0.9rem] leading-[1.2]">
                    {user.name}
                  </div>
                  <div className="text-[0.75rem] text-muted">
                    {user.city}, {user.state}
                  </div>
                </div>
                <span aria-hidden="true" className="hidden md:inline text-muted text-[0.8rem]">▾</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Profile menu"
                  className="absolute right-0 top-[calc(100%+8px)] bg-surface border-[1.5px] border-border elevated-popover rounded-md shadow-md min-w-[180px] overflow-hidden z-[200]"
                >
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.label}
                      role="menuitem"
                      type="button"
                      onClick={item.action}
                      className={[
                        "w-full px-4 py-3 text-left bg-transparent border-none cursor-pointer text-[0.9rem] font-body font-semibold flex items-center gap-2",
                        item.danger ? "text-red-600" : "text-gray-800",
                      ].join(" ")}
                    >
                      <span aria-hidden="true">{item.icon}</span>
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
      <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t-[1.5px] border-border shadow-[0_-2px_12px_rgba(0,0,0,.08)] flex">
        {NAV_LINKS.map((link) => {
          const isMessages = link.to === "/messages";
          const showBadge = isMessages && unreadCount > 0;
          return (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive(link.to) ? 'page' : undefined}
              aria-label={showBadge ? `${link.label}, ${unreadCount} unread` : link.label}
              className={[
                "flex-1 flex flex-col items-center justify-center gap-[3px] py-[10px] pb-3 no-underline transition-all duration-150 relative",
                isActive(link.to)
                  ? "text-brand-dark bg-brand-light"
                  : "text-muted bg-transparent",
              ].join(" ")}
            >
              <span className="relative inline-flex">
                <span aria-hidden="true" className="text-[1.35rem] leading-none">{link.icon}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-[3px] rounded-full bg-red-500 text-white text-[0.6rem] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[0.68rem] font-bold tracking-[0.01em]">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
