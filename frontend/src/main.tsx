import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, ChartNoAxesColumn, ChevronRight, CircleDollarSign, Globe, Landmark, Layers3, LogOut, Menu, Moon, ReceiptText, Settings, Shield, ShoppingBag, Sun, UserRound, WalletCards } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { api } from './api/client';
import type { ThemePreference } from './api/types';
import type { Page } from './uiTypes';
import { LoginPage } from './pages/LoginPage';
import { MobiAgentSettingsPage } from './pages/MobiAgentSettingsPage';
import { MNOWalletSettingsPage } from './pages/MNOWalletSettingsPage';
import { MNOWalletTransactionsPage } from './pages/MNOWalletTransactionsPage';
import { ExchangeRatePage } from './pages/ExchangeRatePage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChannelManagementPage } from './pages/ChannelManagementPage';
import { TransactionsDeskPage } from './pages/TransactionsDeskPage';
import { ApiDocumentationPage } from './pages/ApiDocumentationPage';
import { MobiAgentShopPage } from './pages/MobiAgentShopPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { initials } from './lib/format';
import './styles.css';
import './theme-overrides.css';

type NavItem = { key: Page; icon: typeof ChartNoAxesColumn; label: string };
type NavGroup = { section: string; items: NavItem[] };

function AppShell() {
  const { session, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    if (!session) return;
    api.settingsMe().then((settings) => {
      setTheme(settings.theme);
    }).catch(() => {});
  }, [session?.userId]);

  const nav: NavGroup[] = [
    { section: 'AGENT OPERATIONS', items: [
      { key: 'dashboard', icon: ChartNoAxesColumn, label: 'Mobi Dashboard' },
      { key: 'transactionsDesk', icon: ReceiptText, label: 'Transactions Desk' },
      { key: 'transactions', icon: ReceiptText, label: 'Mobi Transactions' },
      { key: 'channels', icon: Layers3, label: 'Channel Management' },
      { key: 'accounts', icon: Landmark, label: 'Mobi Account Setting' },
      { key: 'wallets', icon: WalletCards, label: 'Wallets' },
      { key: 'rates', icon: CircleDollarSign, label: 'Exchange Rate' },
    ]},
    { section: 'MICROSERVICE', items: [{ key: 'apiDocs', icon: Globe, label: 'API Documentation' }] },
    { section: 'ACCOUNT', items: [
      { key: 'shop', icon: ShoppingBag, label: 'Mobi Agent Shop' },
      ...(session?.role === 'ADMIN' ? [{ key: 'users' as const, icon: Shield, label: 'User Management' }] : []),
      { key: 'profile', icon: UserRound, label: 'My profile' },
      { key: 'settings', icon: Settings, label: 'Account settings' },
    ]},
  ];

  const pageTitle = useMemo(() => nav.flatMap((group) => group.items).find((item) => item.key === page)?.label ?? 'mobi Agent', [nav, page]);
  const isDark = theme === 'DARK';

  if (!session) return <LoginPage />;

  async function toggleTheme() {
    const next: ThemePreference = isDark ? 'LIGHT' : 'DARK';
    setTheme(next);
    try {
      const current = await api.settingsMe();
      await api.saveSettingsMe({ ...current, theme: next });
    } catch {}
  }

  return (
    <div className="workshopApp">
      <aside className="workshopSidebar">
        <div className="sidebarBrand"><div className="brandIcon">?</div><div><strong>mobi Agent</strong></div></div>
        <div className="sidebarNavScroll">
          {nav.map((group) => (
            <div key={group.section} className="navGroup">
              <div className="navGroupLabel">{group.section}</div>
              <nav>
                {group.items.map(({ key, icon: Icon, label }) => (
                  <button key={key} type="button" className={page === key ? 'navItem navItemActive' : 'navItem'} onClick={() => setPage(key)}>
                    <Icon size={18} /><span>{label}</span>{page === key && <ChevronRight size={16} />}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="sidebarUtility">
          <div className="darkModeRow">
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            <button type="button" className="modeSwitch" aria-label="Toggle theme" onClick={toggleTheme}>
              <span className="modeSwitchThumb">{isDark ? <Moon size={14} /> : <Sun size={14} />}</span>
            </button>
          </div>
          <button type="button" className="logoutButton" onClick={logout}><LogOut size={18} />Logout</button>
        </div>
      </aside>
      <div className="contentShell">
        <header className="contentTopbar">
          <div className="topbarLeft"><button type="button" className="iconButton iconButton-ghost"><Menu size={18} /></button><div className="topbarTitle">{pageTitle}</div></div>
          <div className="topbarRight">
            <div className="topbarMeta topbarMeta-globe"><Globe size={16} /><span>EN</span></div>
            <button type="button" className="iconButton iconButton-ghost"><Bell size={18} /></button>
            <div className="userChip"><div><strong>{session.name}</strong><span>{session.role === 'ADMIN' ? 'Admin' : 'Shop Owner'}</span></div><div className="avatarBubble">{initials(session.name)}</div></div>
          </div>
        </header>
        <main className="workshopMain">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'transactionsDesk' && <TransactionsDeskPage />}
          {page === 'transactions' && <MNOWalletTransactionsPage />}
          {page === 'channels' && <ChannelManagementPage />}
          {page === 'accounts' && <MobiAgentSettingsPage />}
          {page === 'wallets' && <MNOWalletSettingsPage />}
          {page === 'rates' && <ExchangeRatePage />}
          {page === 'apiDocs' && <ApiDocumentationPage />}
          {page === 'shop' && <MobiAgentShopPage />}
          {page === 'users' && session.role === 'ADMIN' && <AdminUsersPage />}
          {page === 'profile' && <ProfilePage />}
          {page === 'settings' && <AccountSettingsPage />}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </AuthProvider>,
);


