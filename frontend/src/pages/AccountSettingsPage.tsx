import { useEffect, useState } from 'react';
import { Bell, KeyRound, Shield, Store } from 'lucide-react';
import { api } from '../api/client';
import { useTheme } from '../theme/ThemeContext';
import type { ChangePasswordRequest, UserSettings as UserSettingsType } from '../api/types';

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange(next: boolean): void }) {
  return <div className="settingsToggleRow"><div><strong>{label}</strong><span>{description}</span></div><button type="button" className={value ? 'settingsSwitch settingsSwitchActive' : 'settingsSwitch'} onClick={() => onChange(!value)} aria-pressed={value}><span /></button></div>;
}

export function AccountSettingsPage() {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettingsType | null>(null);
  const [password, setPassword] = useState<ChangePasswordRequest>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api.settingsMe().then((data) => {
      setSettings(data);
      setError('');
    }).catch(() => {
      setError('Account settings could not be loaded. Restart the custom backend and sign in again.');
    });
  }, []);
  async function save() { if (!settings) return; const next = await api.saveSettingsMe(settings); setSettings(next); setTheme(next.theme); setMessage('Settings saved.'); }
  async function changePassword() { await api.changePassword(password); setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' }); setMessage('Password updated.'); }
  if (error) return <section className="pageSection"><div className="errorBanner">{error}</div></section>;
  if (!settings) return <section className="pageSection"><div className="surfaceCard">Loading settings...</div></section>;
  return (
    <section className="pageSection settingsPage">
      {message && <p className="noticeBanner">{message}</p>}
      <div className="settingsGrid">
        <section className="surfaceCard"><div className="surfaceHead"><h2><Store size={18} />Shop Settings</h2></div><ToggleRow label="Disable Discount for Debt" description="When enabled, the discount modal is skipped for debt payments." value={settings.disableDiscountForDebt} onChange={(next) => setSettings({ ...settings, disableDiscountForDebt: next })} /></section>
        <section className="surfaceCard"><div className="surfaceHead"><h2><Bell size={18} />Notification Settings</h2></div><div className="settingsStack"><ToggleRow label="Email Notifications" description="Get emails for important stock and transaction updates." value={settings.emailNotifications} onChange={(next) => setSettings({ ...settings, emailNotifications: next })} /><ToggleRow label="Push Notifications" description="Get push notifications on this device." value={settings.pushNotifications} onChange={(next) => setSettings({ ...settings, pushNotifications: next })} /><ToggleRow label="Weekly Summary" description="Receive a weekly summary of operational activity." value={settings.weeklySummary} onChange={(next) => setSettings({ ...settings, weeklySummary: next })} /><label>Theme<select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value as UserSettingsType['theme'] })}><option value="DARK">Dark</option><option value="LIGHT">Light</option></select></label><div className="settingsActionRow"><button className="primaryButton" type="button" onClick={save}>Save Settings</button></div></div></section>
        <section className="surfaceCard"><div className="surfaceHead"><h2><Shield size={18} />Permission Control</h2></div><p className="pageLead">Your role is managed by the system administrator. This screen mirrors the reference permission summary instead of mutating backend role policy from the client.</p><ul className="settingsList"><li>Manage accounts, wallets, exchange rates, and channels</li><li>Access transaction workflows and dashboard summaries</li><li>Administrative role changes remain restricted to User Management</li></ul></section>
        <section className="surfaceCard"><div className="surfaceHead"><h2><KeyRound size={18} />Change Password</h2></div><div className="formGrid"><label>Current Password<input type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label><label>New Password<input type="password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label><label>Confirm New Password<input type="password" value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} /></label><div className="settingsActionRow"><button type="button" className="primaryButton" onClick={changePassword}>Update Password</button></div></div></section>
      </div>
    </section>
  );
}
