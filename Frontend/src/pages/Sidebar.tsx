import { ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Image as ImageIcon,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../components/ui/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../auth/hooks/useAuth';
import { useBusiness } from '../auth/hooks/useBusiness';
import type { Business } from '../auth/store/businessSlice';
import logoIcon from '../components/photos/LumenIQClear.png';

interface SidebarProps {
  children: ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
}

function formatDisplayName(email: string | undefined): string {
  if (!email) return 'Account';
  const local = email.split('@')[0] ?? '';
  const words = local.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Account';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

type ProfileUser = {
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accountPlan?: string;
} | null;

function getUserProfileName(user: ProfileUser): string {
  if (!user) return 'Account';
  const fn = user.firstName?.trim();
  const ln = user.lastName?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
  return formatDisplayName(user.email);
}

function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function SidebarUserProfile({
  user,
  collapsed,
}: {
  user: ProfileUser;
  collapsed: boolean;
}) {
  const displayName = getUserProfileName(user);
  const planLabel = user?.accountPlan ?? ' ';
  const initials = getInitialsFromName(displayName);

  const avatar = (
    <Avatar className="h-10 w-10 shrink-0 border border-slate-700/80">
      {user?.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback className="rounded-full bg-slate-700 text-sm font-semibold text-white font-outfit">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (collapsed) {
    return (
      <div className="relative group w-full flex justify-center px-2 pb-2">
        {avatar}
        <Tooltip label={`${displayName} · ${planLabel}`} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 pb-3">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-white font-outfit">{displayName}</p>
        <p className="text-[12px] text-slate-500 font-outfit">{planLabel}</p>
      </div>
    </div>
  );
}

function NavButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative group w-full">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'relative w-full flex items-center justify-center h-10 rounded-lg transition-all duration-200',
          active
            ? 'text-white rounded-xl bg-slate-800/90'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-blue-500"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        {children}
      </button>
      <Tooltip label={label} />
    </div>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-800 text-[12px] text-white font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none shadow-xl border border-white/[0.08] z-50">
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800" />
    </div>
  );
}

function WorkspaceMenuPanel({
  multiBusiness,
  businesses,
  activeBusiness,
  onSwitch,
  onSettings,
  onLogout,
}: {
  multiBusiness: boolean;
  businesses: Business[];
  activeBusiness: Business;
  onSwitch: (id: string) => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-700/80 bg-slate-900 py-1 shadow-xl">
      {multiBusiness && (
        <>
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-outfit">
            Businesses
          </p>
          {businesses.map((b) => {
            const isCurrent = b.id === activeBusiness.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSwitch(b.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-outfit transition-colors',
                  isCurrent ? 'bg-slate-800/90 text-white' : 'text-slate-200 hover:bg-slate-800',
                )}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
                  style={{ backgroundColor: b.brandColor }}
                >
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate">{b.name}</span>
                {isCurrent && <Check className="h-4 w-4 shrink-0 text-blue-400" strokeWidth={2.5} />}
              </button>
            );
          })}
          <div className="my-1 h-px bg-slate-700/80" />
        </>
      )}
    </div>
  );
}

function ExpandedNavRow({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-outfit transition-colors text-left',
        active
          ? 'bg-slate-800/90 text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500" />
      )}
      <span className={cn('shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]', active ? 'text-white' : 'text-slate-400')}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

export function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const desktopHeaderRef = useRef<HTMLDivElement>(null);
  const mobileWorkspaceRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, switchBusiness } = useBusiness();
  const planLabel = user?.accountPlan ?? '';
  const multiBusiness = businesses.length > 1;
  const workspace = activeBusiness ?? businesses[0];

  const primaryNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: '/app/dashboard' },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-[18px] h-[18px]" />, path: '/app/chat' },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-[18px] h-[18px]" />, path: '/app/calendar' },
    { id: 'photo-storage', label: 'Photos', icon: <ImageIcon className="w-[18px] h-[18px]" />, path: '/app/photo-storage' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setHeaderMenuOpen(false);
    await logout();
    navigate('/');
  };

  const openSettingsFromMenu = () => {
    handleNavClick('/app/settings');
    setHeaderMenuOpen(false);
  };

  const handleSwitchWorkspace = (id: string) => {
    switchBusiness(id);
    setHeaderMenuOpen(false);
  };

  const handleLogoClick = () => {
    window.location.href = '/app/dashboard';
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!headerMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const inside =
        desktopHeaderRef.current?.contains(t) || mobileWorkspaceRef.current?.contains(t);
      if (!inside) setHeaderMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [headerMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) setHeaderMenuOpen(false);
  }, [isMobileMenuOpen]);

  const sidebarShellClass =
    'hidden md:flex flex-col flex-shrink-0 relative z-10 border-r border-slate-800/80 bg-[#0f172a] transition-[width] duration-200 ease-out';


  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className={cn(sidebarShellClass, collapsed ? 'w-[4.5rem]' : 'w-[260px]')}>
        {/* Header */}
        <div className="border-b border-slate-800/80 px-3 py-3" ref={desktopHeaderRef}>
          {collapsed ? (
            <div className="flex justify-center">
              {multiBusiness && workspace ? (
                <div className="relative w-full flex justify-center">
                  <button
                    type="button"
                    onClick={() => setHeaderMenuOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: workspace.brandColor }}
                    title={workspace.name}
                  >
                    {workspace.name.charAt(0).toUpperCase()}
                  </button>
                  {headerMenuOpen && (
                    <WorkspaceMenuPanel
                      multiBusiness={multiBusiness}
                      businesses={businesses}
                      activeBusiness={workspace}
                      onSwitch={handleSwitchWorkspace}
                      onSettings={openSettingsFromMenu}
                      onLogout={handleLogout}
                    />
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 transition-opacity hover:opacity-90 active:scale-95"
                >
                  <img src={logoIcon} alt="LumenIQ" className="h-6 w-6 object-contain" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-800/60"
              >
                {multiBusiness && workspace ? (
                  <>
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: workspace.brandColor }}
                    >
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white font-outfit">{workspace.name}</p>
                      <p className="text-[12px] text-slate-500 font-outfit">Pro Plan</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                      <img src={logoIcon} alt="" className="h-8 w-8 object-contain" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white font-outfit">{businesses[0]?.name ?? 'LumenIQ'}</p>
                      <p className="text-[12px] text-slate-500 font-outfit">{planLabel}</p>
                    </div>
                  </>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-slate-500 transition-transform',
                    headerMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              {headerMenuOpen && workspace && (
                <WorkspaceMenuPanel
                  multiBusiness={multiBusiness}
                  businesses={businesses}
                  activeBusiness={workspace}
                  onSwitch={handleSwitchWorkspace}
                  onSettings={openSettingsFromMenu}
                  onLogout={handleLogout}
                />
              )}
            </div>
          )}
        </div>

        {/* Primary nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
          {primaryNav.map((item) => {
            const active = isActive(item.path);
            return collapsed ? (
              <NavButton
                key={item.id}
                active={active}
                label={item.label}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="[&>svg]:w-6 [&>svg]:h-6">{item.icon}</span>
              </NavButton>
            ) : (
              <ExpandedNavRow
                key={item.id}
                active={active}
                label={item.label}
                icon={item.icon}
                onClick={() => handleNavClick(item.path)}
              />
            );
          })}
        </nav>

        {/* Profile + Account */}
        <div className="border-t border-slate-800/80 px-2 pb-2 pt-1">
        <SidebarUserProfile user={user} collapsed={collapsed} />
          <p className={cn(!collapsed ? 'px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-outfit' : 'hidden')}>
            Account
          </p>
          <ExpandedNavRow
            active={isActive('/app/settings')}
            label="Settings"
            icon={<Settings className="w-[18px] h-[18px]" />}
            onClick={() => handleNavClick('/app/settings')}
          />
          <a
            href="mailto:support@lumeniq.com"
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-outfit transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          >
            <HelpCircle className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">Help & Support</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10 font-outfit"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">Log out</span>
          </button>
        </div>

        {/* Hide / expand */}
        <div className="border-t border-slate-800/80 p-2">
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="relative group flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
            >
              <ChevronsRight className="h-4 w-4" />
              <Tooltip label="Expand sidebar" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200 font-outfit"
            >
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-slate-800/80 bg-[#0f172a] px-4">
        <button type="button" onClick={handleLogoClick} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <img src={logoIcon} alt="LumenIQ" className="h-5 w-5 object-contain" />
          </div>
          <span className="text-[15px] font-outfit tracking-tight text-white">LumenIQ</span>
        </button>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800/80"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Popout Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 flex w-[280px] flex-col border-r border-slate-800/80 bg-[#0f172a]"
            >
              <div className="flex h-14 items-center justify-between border-b border-slate-800/80 px-4">
                <button type="button" onClick={handleLogoClick} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <img src={logoIcon} alt="LumenIQ" className="h-5 w-5 object-contain" />
                  </div>
                  <span className="text-[15px] font-outfit tracking-tight text-white">LumenIQ</span>
                </button>
              </div>

              <div className="border-b border-slate-800/80 px-3 py-3" ref={mobileWorkspaceRef}>
                {multiBusiness && workspace ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setHeaderMenuOpen((v) => !v)}
                      className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-800/60"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: workspace.brandColor }}
                      >
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-white font-outfit">{workspace.name}</p>
                        <p className="text-[12px] text-slate-500 font-outfit">Pro Plan</p>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-slate-500 transition-transform',
                          headerMenuOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    {headerMenuOpen && (
                      <WorkspaceMenuPanel
                        multiBusiness={multiBusiness}
                        businesses={businesses}
                        activeBusiness={workspace}
                        onSwitch={handleSwitchWorkspace}
                        onSettings={openSettingsFromMenu}
                        onLogout={handleLogout}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg px-1 py-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                      <img src={logoIcon} alt="" className="h-6 w-6 object-contain" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white font-outfit">{businesses[0]?.name ?? 'LumenIQ'}</p>
                      <p className="text-[12px] text-slate-500 font-outfit">{planLabel}</p>
                    </div>
                  </div>
                )}
              </div>

              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
                {primaryNav.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <ExpandedNavRow
                      key={item.id}
                      active={active}
                      label={item.label}
                      icon={item.icon}
                      onClick={() => handleNavClick(item.path)}
                    />
                  );
                })}
              </nav>

              <div className="border-t border-slate-800/80 px-2 pb-4 pt-1">
                <SidebarUserProfile user={user} collapsed={false} />
                <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-outfit">
                  Account
                </p>
                <ExpandedNavRow
                  active={isActive('/app/settings')}
                  label="Settings"
                  icon={<Settings className="w-[18px] h-[18px]" />}
                  onClick={() => handleNavClick('/app/settings')}
                />
                <a
                  href="mailto:support@lumeniq.com"
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-outfit transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                >
                  <HelpCircle className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 truncate">Help & Support</span>
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10 font-outfit"
                >
                  <LogOut className="h-[18px] w-[18px] shrink-0" />
                  Log out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:pt-0 pt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="p-5 md:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}